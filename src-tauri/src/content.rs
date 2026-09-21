use std::{fs, path::{Path,PathBuf}, sync::Mutex, collections::HashMap, time::{UNIX_EPOCH,Duration,Instant}, process::{Command,Stdio}};
use serde::{Serialize,Deserialize};
use sha2::{Sha256,Digest};
use base64::Engine;
use tauri::Manager;
#[derive(Default)] pub struct Library { pub assets:Mutex<HashMap<String,PathBuf>>, pub gate:Mutex<()> }
#[derive(Serialize,Deserialize,Clone)] #[serde(rename_all="camelCase")]
pub struct Deck { id:String,name:String,kind:String,modified:u64,version:String,asset:String,pages:Vec<Page>,cached:bool }
#[derive(Serialize,Deserialize,Clone)] #[serde(rename_all="camelCase")]
pub struct Page { number:usize,width:f64,height:f64,hidden:bool,asset:String }
#[derive(Serialize,Default)] #[serde(rename_all="camelCase")]
pub struct Scan { path:String,status:String,decks:Vec<Deck>,messages:Vec<String> }
fn digest(bytes:&[u8])->String { format!("{:x}",Sha256::digest(bytes)) }
fn storage()->Result<PathBuf,String> { let exe=std::env::current_exe().map_err(|e|e.to_string())?; let p=exe.parent().ok_or("EXE path")?.join("content-data"); fs::create_dir_all(&p).map_err(|e|e.to_string())?;super::check_path(&p)?; Ok(p) }
fn folder(value:&str)->Result<PathBuf,String>{
 let p=PathBuf::from(value.trim());
 if value.starts_with("\\\\") || !p.is_absolute() || p.components().any(|c|matches!(c,std::path::Component::ParentDir)) || p.parent().is_none() {return Err("请选择本机真实目录；不接受网络路径、磁盘根目录或上级路径跳转".into())}
 super::check_path(&p)?; if !p.is_dir(){return Err("内容文件夹不存在或不是目录".into())} Ok(p)
}
#[tauri::command] pub fn content_directory()->Result<String,String>{ Ok(fs::read_to_string(storage()?.join("directory.txt")).unwrap_or_default()) }
#[tauri::command] pub async fn browse_content_directory()->Result<Option<String>,String>{tauri::async_runtime::spawn_blocking(||{let p=rfd::FileDialog::new().set_title("选择内容文件夹（仅直接文件）").pick_folder();p.map(|p|folder(&p.to_string_lossy()).map(|p|p.to_string_lossy().into_owned())).transpose()}).await.map_err(|e|e.to_string())?}
#[tauri::command] pub fn save_content_directory(path:String)->Result<(),String>{let p=folder(&path)?;fs::read_dir(&p).map_err(|_|"无法读取目录")?;fs::write(storage()?.join("directory.txt"),p.to_string_lossy().as_bytes()).map_err(|e|e.to_string())}
#[tauri::command] pub fn content_asset(token:String,state:tauri::State<Library>)->Result<String,String>{let p=state.assets.lock().map_err(|_|"资源锁失败")?.get(&token).cloned().ok_or("资源身份已失效，请刷新")?;super::check_path(&p)?;let m=fs::metadata(&p).map_err(|e|e.to_string())?;if m.len()>64*1024*1024{return Err("资源超过64MiB".into())}Ok(base64::engine::general_purpose::STANDARD.encode(fs::read(&p).map_err(|e|e.to_string())?))}
const CACHE_LIMIT:u64=1024*1024*1024;
fn cache_bytes(path:&Path,depth:usize)->Result<u64,String>{
 if depth>2{return Err("缓存目录层级异常".into())}super::check_path(path)?;let mut size=0;
 for entry in fs::read_dir(path).map_err(|e|e.to_string())? {let p=entry.map_err(|e|e.to_string())?.path();super::check_path(&p)?;let m=fs::metadata(&p).map_err(|e|e.to_string())?;size+=if m.is_dir(){cache_bytes(&p,depth+1)?}else{m.len()};}Ok(size)
}
fn discard_partial(cache:&Path)->Result<(),String>{
 super::check_path(cache)?;for entry in fs::read_dir(cache).map_err(|e|e.to_string())?{let p=entry.map_err(|e|e.to_string())?.path();super::check_path(&p)?;let name=p.file_name().unwrap_or_default().to_string_lossy();if p.is_file()&&(name.ends_with(".png")||name=="pages.json"||name=="complete.json"){fs::remove_file(p).map_err(|e|e.to_string())?;}}Ok(())
}
fn convert(source:&Path,cache:&Path)->Result<Vec<Page>,String>{
 let remaining=CACHE_LIMIT.saturating_sub(cache_bytes(cache.parent().ok_or("cache root")?,0)?).saturating_sub(1024*1024);
 if remaining<1024*1024{return Err("全缓存1GiB预算已满；请减少内容后刷新".into())}
 let script=storage()?.join("export-pptx.ps1");fs::write(&script,include_str!("export-pptx.ps1")).map_err(|e|e.to_string())?;
 let log=fs::File::create(cache.join("export.log")).map_err(|e|e.to_string())?;
 let source_code=include_str!("export-pptx.ps1");
 let body=source_code.split_once('\n').ok_or("export script invalid")?.1;
 let code=format!("$Source=$env:CONTENT_SOURCE;$Output=$env:CONTENT_OUTPUT;$CacheBudget=[long]$env:CONTENT_BUDGET;\n{}",body);
 let encoded=base64::engine::general_purpose::STANDARD.encode(code.encode_utf16().flat_map(|c|c.to_le_bytes()).collect::<Vec<_>>());
 let mut cmd=Command::new("powershell.exe"); cmd.args(["-NoProfile","-NonInteractive","-EncodedCommand"]).arg(encoded).env("CONTENT_BUDGET",remaining.to_string()).env("CONTENT_SOURCE",source).env("CONTENT_OUTPUT",cache).stdout(Stdio::from(log.try_clone().map_err(|e|e.to_string())?)).stderr(Stdio::from(log));
 #[cfg(windows)] {use std::os::windows::process::CommandExt;cmd.creation_flags(0x08000000);}
 let mut child=cmd.spawn().map_err(|e|e.to_string())?;let start=Instant::now();
 loop {if let Some(status)=child.try_wait().map_err(|e|e.to_string())? {if !status.success(){return Err(fs::read_to_string(cache.join("error.txt")).unwrap_or_else(|_|"PowerPoint转换失败；查看独立缓存export.log".into()))}break;}if start.elapsed()>Duration::from_secs(90){let _=child.kill();let _=child.wait();return Err("PowerPoint转换超时，已停止导出助手；未关闭用户PowerPoint，若隔离实例仍有交互窗口须人工检查。无结果入库。".into())} std::thread::sleep(Duration::from_millis(100));}
 serde_json::from_slice(&fs::read(cache.join("pages.json")).map_err(|e|e.to_string())?).map_err(|e|e.to_string())
}
fn scan_blocking(path:String,state:&Library)->Result<Scan,String>{
 let _guard=state.gate.try_lock().map_err(|_|"扫描进行中，请稍后")?;
 if path.trim().is_empty(){return Ok(Scan{status:"UNSET".into(),..Default::default()})}
 let root=folder(&path)?;let cache_root=storage()?.join("cache");fs::create_dir_all(&cache_root).map_err(|e|e.to_string())?;super::check_path(&cache_root)?;
 let mut result=Scan{path:path.clone(),status:"EMPTY".into(),..Default::default()};let mut assets=HashMap::new();let mut total=0u64;let mut active=std::collections::HashSet::new();let mut attempts=0;
 let mut entries=fs::read_dir(&root).map_err(|_|"内容目录不可读")?.take(1001).collect::<Result<Vec<_>,_>>().map_err(|e|e.to_string())?;if entries.len()>1000{entries.truncate(1000);result.messages.push("直接目录项超过1000，仅检查前1000项".into());}entries.sort_by_key(|e|e.file_name());
 for entry in entries {let p=entry.path();let name=entry.file_name().to_string_lossy().into_owned();
  if let Err(e)=super::check_path(&p){result.messages.push(format!("{name}: {e}"));continue} if !p.is_file(){continue}
  let kind=p.extension().unwrap_or_default().to_string_lossy().to_lowercase();if kind!="pdf"&&kind!="pptx"{result.messages.push(format!("{name}: 不支持此扩展名"));continue}
  if attempts>=200 {result.messages.push("扫描尝试上限200（包括失败文件），余项未加载".into());break}attempts+=1;
  let outcome=(||->Result<Deck,String>{let m=fs::metadata(&p).map_err(|e|e.to_string())?;total+=m.len();if m.len()>64*1024*1024||total>256*1024*1024{return Err("单文件64MiB/总源文件256MiB预算超限".into())}
   let bytes=fs::read(&p).map_err(|e|e.to_string())?;let version=digest(&bytes);let id=digest(p.to_string_lossy().to_lowercase().as_bytes());let key=format!("{id}-{version}");active.insert(key.clone());let cache=cache_root.join(&key);fs::create_dir_all(&cache).map_err(|e|e.to_string())?;super::check_path(&cache)?;
   let modified=m.modified().ok().and_then(|t|t.duration_since(UNIX_EPOCH).ok()).map(|d|d.as_millis() as u64).unwrap_or(0);
   let mut d=Deck{id,name:name.clone(),kind:kind.clone(),modified,version,asset:String::new(),pages:vec![],cached:false};
   if kind=="pdf"{if !bytes.starts_with(b"%PDF-"){return Err("PDF头无效".into())} let dest=cache.join("source.pdf");d.cached=dest.exists()&&fs::read(&dest).map(|v|digest(&v)==d.version).unwrap_or(false);if !d.cached{if cache_bytes(&cache_root,0)?.saturating_add(bytes.len() as u64)>CACHE_LIMIT{return Err("全缓存1GiB预算已满".into())}fs::write(&dest,bytes).map_err(|e|e.to_string())?}d.asset=key.clone();assets.insert(key,dest);}
   else {let manifest=cache.join("pages.json");let ready=cache.join("complete.json");d.cached=ready.exists();let pages=if d.cached {let hashes:HashMap<String,String>=serde_json::from_slice(&fs::read(&ready).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;for(file,hash)in hashes{if Path::new(&file).components().count()!=1||file.contains('\\')||file.contains('/'){return Err("缓存清单路径异常".into())}let f=cache.join(file);super::check_path(&f)?;if digest(&fs::read(f).map_err(|e|e.to_string())?)!=hash{return Err("缓存指纹不符；拒绝复用".into())}}serde_json::from_slice(&fs::read(&manifest).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?}else{match convert(&p,&cache){Ok(pages)=>pages,Err(e)=>{discard_partial(&cache)?;return Err(e)}}};d.pages=pages;
    if d.pages.is_empty()||d.pages.len()>300{return Err("页数必须在1至300内".into())}let mut hashes=HashMap::new();hashes.insert("pages.json".into(),digest(&fs::read(&manifest).map_err(|e|e.to_string())?));
    for page in &mut d.pages {let filename=format!("page-{}.png",page.number);let f=cache.join(&filename);super::check_path(&f)?;hashes.insert(filename,digest(&fs::read(&f).map_err(|e|e.to_string())?));page.asset=format!("{key}/{}",page.number);assets.insert(page.asset.clone(),f);}
    if digest(&fs::read(&p).map_err(|e|e.to_string())?)!=d.version{return Err("导出期间源文件发生变化，请刷新".into())}fs::write(ready,serde_json::to_vec(&hashes).unwrap()).map_err(|e|e.to_string())?;
   } if cache_bytes(&cache_root,0)?>CACHE_LIMIT{discard_partial(&cache)?;return Err("全缓存1GiB预算已满，本次结果未入库".into())}Ok(d)})();
  match outcome{Ok(d)=>result.decks.push(d),Err(e)=>result.messages.push(format!("{name}: FAILED — {e}"))}
 }
 // Only remove obsolete cache directories owned by this app, never content files.
 for entry in fs::read_dir(&cache_root).map_err(|e|e.to_string())?.flatten(){let p=entry.path();let key=entry.file_name().to_string_lossy().into_owned();if key.len()==129&&key.bytes().all(|b|b.is_ascii_hexdigit()||b==b'-')&&!active.contains(&key)&&super::check_path(&p).is_ok(){let _=fs::remove_dir_all(p);}}
 result.decks.sort_by(|a,b|b.modified.cmp(&a.modified).then(a.name.cmp(&b.name)));result.status=if result.decks.is_empty(){if result.messages.is_empty(){"EMPTY"}else{"NO_USABLE_FILES"}}else{"LOADED"}.into();*state.assets.lock().map_err(|_|"资源锁失败")?=assets;Ok(result)
}
#[tauri::command] pub async fn scan_content(path:String,state:tauri::State<'_,Library>)->Result<Scan,String>{scan_blocking(path,&state)}

#[tauri::command] pub fn close_content_window(app:tauri::AppHandle)->Result<(),String>{app.get_webview_window("main").ok_or("主窗口不存在")?.close().map_err(|e|e.to_string())}
