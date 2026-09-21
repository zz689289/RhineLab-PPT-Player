import {invoke,isTauri} from '@tauri-apps/api/core';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {type ArchiveRecord,type PageIdentity} from './data';
pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
export interface NativeDeck {id:string;name:string;kind:string;modified:number;version:string;asset:string;cached:boolean;pages:{number:number;width:number;height:number;hidden:boolean;asset:string}[]}
export interface ScanResult {path:string;status:string;decks:NativeDeck[];messages:string[]}
function bytes(value:string){return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
export const native=isTauri();
export const directoryApi={close:()=>invoke('close_content_window'),get:()=>invoke<string>('content_directory'),save:(path:string)=>invoke('save_content_directory',{path}),browse:()=>invoke<string|null>('browse_content_directory')};
export class ContentLibrary {
 docs=new Map<string,pdfjs.PDFDocumentProxy>();
 private active=0;
 private waiters:{resolve:()=>void;reject:(e:Error)=>void;current:()=>boolean}[]=[];
 private async acquire(current:()=>boolean){
  this.waiters=this.waiters.filter(w=>{if(w.current())return true;w.reject(Error("STALE"));return false;});
  if(!current())throw Error("STALE");
  if(this.active<2){this.active++;return;}
  if(this.waiters.length>=512)throw Error("页面任务队列预算超限，请刷新");
  await new Promise<void>((resolve,reject)=>this.waiters.push({resolve,reject,current}));
 }
 private release(){let next=this.waiters.shift();while(next&&!next.current()){next.reject(Error("STALE"));next=this.waiters.shift();}if(next)next.resolve();else this.active--;}
 private dead=false;
 async scan(path:string){
  const result=await invoke<ScanResult>('scan_content',{path});const list:ArchiveRecord[]=[];
  for(const deck of result.decks){try{
   if(deck.kind==='pdf'){
    const raw=bytes(await invoke<string>('content_asset',{token:deck.asset}));
    const task=pdfjs.getDocument({data:raw,isEvalSupported:false,useSystemFonts:true,stopAtErrors:true,cMapUrl:'./pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'./pdfjs/standard_fonts/',wasmUrl:'./pdfjs/wasm/'});
    task.onPassword=()=>{void task.destroy();};
    const doc=await task.promise;if(doc.numPages<1||doc.numPages>300){await doc.destroy();throw Error('PDF页数必须在1至300内');}
    this.docs.set(deck.id,doc);deck.pages=[];
    for(let n=1;n<=doc.numPages;n++){const p=await doc.getPage(n);const v=p.getViewport({scale:1});deck.pages.push({number:n,width:v.width,height:v.height,hidden:false,asset:deck.asset});p.cleanup();}
   }
   for(const page of deck.pages){list.push({id:`X-${String(page.number).padStart(3,'0')}`,title:deck.name,en:`PAGE ${page.number} / ${deck.pages.length}`,category:deck.name,department:deck.kind.toUpperCase(),date:new Date(deck.modified).toLocaleString(),lead:`第 ${page.number} 页 / 共 ${deck.pages.length} 页`,clearance:page.hidden?'HIDDEN SLIDE · 已包含':'STATIC PAGE',abstract:'未提供简介',findings:[`源格式：${deck.kind.toUpperCase()}`,`时间来源：原${deck.kind.toUpperCase()}文件修改时间`,`隐藏页策略：包含，保持原页序${page.hidden?'；本页为隐藏页':''}`],source:'',page:{deckId:deck.id,pageId:`${deck.id}/p${page.number}`,number:page.number,total:deck.pages.length,width:page.width,height:page.height,version:deck.version,kind:deck.kind,asset:page.asset,hidden:page.hidden,state:'loading'}});}
  }catch(e){result.messages.push(`${deck.name}: FAILED — ${String(e)}`);}}
  if(!list.length&&result.decks.length)result.status='NO_USABLE_FILES';
  return {result,list};
 }
 async render(page:PageIdentity,high:boolean,current:()=>boolean):Promise<HTMLCanvasElement>{
  await this.acquire(()=>!this.dead&&current());
  try{
   if(this.dead||!current())throw Error('STALE');
   const size=high?1800:384;const scale=size/Math.max(page.width,page.height);const canvas=document.createElement('canvas');canvas.width=Math.ceil(page.width*scale);canvas.height=Math.ceil(page.height*scale);
   if(page.kind==='pdf'){const doc=this.docs.get(page.deckId);if(!doc)throw Error('PDF身份已失效');const p=await doc.getPage(page.number);if(!current())throw Error('STALE');await p.render({canvas,viewport:p.getViewport({scale})}).promise;p.cleanup();}
   else {const image=new Image();image.src=`data:image/png;base64,${await invoke<string>('content_asset',{token:page.asset})}`;await image.decode();if(!current())throw Error('STALE');canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);image.src='';}
   if(!current())throw Error('STALE');page.state='ready';return canvas;
  }finally{this.release();}
 }
 async dispose(){this.dead=true;for(const doc of this.docs.values())await doc.destroy();this.docs.clear();}
}
export let contentLibrary=new ContentLibrary();
export function replaceLibrary(next:ContentLibrary){const previous=contentLibrary;contentLibrary=next;void previous.dispose();}
