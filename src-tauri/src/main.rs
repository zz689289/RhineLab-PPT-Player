#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod content;
use base64::Engine;
use serde::Serialize;
use std::{fs, path::{Path, PathBuf}, time::UNIX_EPOCH};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SelectedFile { name: String, relative: String, modified: u64, data: String }

fn check_path(path: &Path) -> Result<(), String> {
    for part in path.ancestors() {
        let m = fs::symlink_metadata(part).map_err(|_| "无法读取所选路径".to_string())?;
        #[cfg(windows)]
        { use std::os::windows::fs::MetadataExt;
          if m.file_attributes() & 0x400 != 0 { return Err("不接受符号链接、目录联接或其他重解析点；请选择真实资源目录".into()); }
        }
        if m.file_type().is_symlink() { return Err("不接受符号链接".into()); }
    }
    Ok(())
}
fn gather(path: &Path, base: &Path, depth: usize, out: &mut Vec<(PathBuf,String)>) -> Result<(),String> {
    if depth > 8 { return Err("目录层级超过8层".into()); }
    check_path(path)?;
    if path.is_dir() {
        for entry in fs::read_dir(path).map_err(|_| "无法读取目录")? {
            gather(&entry.map_err(|_| "目录项无效")?.path(),base,depth+1,out)?;
        }
    } else if path.is_file() {
        if out.len() >= 200 { return Err("单次最多选择200个资源".into()); }
        let relative=path.strip_prefix(base).map_err(|_| "资源路径越界")?.to_string_lossy().replace('\\',"/");
        out.push((path.to_path_buf(),relative));
    }
    Ok(())
}
fn choose_blocking(directory: bool) -> Result<Vec<SelectedFile>,String> {
    let mut paths=Vec::new();
    if directory {
        if let Some(folder)=rfd::FileDialog::new().set_title("选择 Archive Player 内容目录").pick_folder() {
            let base=folder.parent().ok_or("不接受磁盘根目录")?;
            gather(&folder,base,0,&mut paths)?;
            if paths.is_empty(){return Err("所选目录为空".into());}
        } else {return Ok(Vec::new());}
    } else {
        if let Some(files)=rfd::FileDialog::new().set_title("选择 PDF 文档").add_filter("PDF 文档", &["pdf"]).pick_files() {
            for p in files { check_path(&p)?; let name=p.file_name().ok_or("文件名无效")?.to_string_lossy().into_owned();paths.push((p,name)); }
        } else {return Ok(Vec::new());}
    }
    if paths.len()>200{return Err("单次最多200个资源".into());}
    let mut total=0u64;let mut result=Vec::new();
    for (p,relative) in paths {
        check_path(&p)?;
        let canonical=fs::canonicalize(&p).map_err(|_| "资源无法解析")?;
        let m=fs::metadata(&canonical).map_err(|_| "资源无法读取")?;
        total+=m.len();if m.len()>64*1024*1024 || total>256*1024*1024 {return Err("单资源64MiB或单次256MiB预算超限".into());}
        let data=fs::read(&canonical).map_err(|_| "资源读取失败")?;
        if data.len()>64*1024*1024{return Err("资源读取期间超限".into());}
        let modified=m.modified().ok().and_then(|t|t.duration_since(UNIX_EPOCH).ok()).map(|t|t.as_millis() as u64).unwrap_or(0);
        result.push(SelectedFile{name:p.file_name().unwrap().to_string_lossy().into_owned(),relative,modified,data:base64::engine::general_purpose::STANDARD.encode(data)});
    }
    Ok(result)
}
#[tauri::command]
async fn choose_input(directory: bool) -> Result<Vec<SelectedFile>, String> {
    tauri::async_runtime::spawn_blocking(move || choose_blocking(directory)).await.map_err(|_| "文件选择任务失败".to_string())?
}
#[tauri::command]
fn windows_username() -> Result<String,String> {
    #[cfg(windows)] {
        #[link(name="advapi32")]
        extern "system" { fn GetUserNameW(buffer:*mut u16,length:*mut u32)->i32; }
        let mut buffer=[0u16;257];let mut length=buffer.len() as u32;
        let ok=unsafe{GetUserNameW(buffer.as_mut_ptr(),&mut length)};
        if ok==0 || length<2 || length as usize>buffer.len(){return Err("无法读取系统用户名".into());}
        String::from_utf16(&buffer[..length as usize-1]).map_err(|_|"无法读取系统用户名".into())
    }
    #[cfg(not(windows))] {Err("Windows identity unavailable".into())}
}
fn main() {
    tauri::Builder::default()
        .manage(content::Library::default())
        .invoke_handler(tauri::generate_handler![windows_username,choose_input,content::content_directory,content::save_content_directory,content::browse_content_directory,content::scan_content,content::content_asset,content::close_content_window])
        .setup(|app| {
            let exe=std::env::current_exe()?;
            let data=std::env::var_os("WEBVIEW2_USER_DATA_FOLDER").map(PathBuf::from).unwrap_or_else(||exe.parent().unwrap().join("data"));
            fs::create_dir_all(&data)?;
            tauri::WebviewWindowBuilder::new(app,"main",tauri::WebviewUrl::App("index.html".into()))
                .title("PLAYER-PRESENTATION-001-R1 · 连续预览与设置").inner_size(1600.0,900.0).min_inner_size(960.0,640.0)
                .data_directory(data).build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Archive Player startup failed");
}

