import {records,columnFiles,selectable} from './data';
type Remembered={pageId:string;version:string};
let saved:any={};try{saved=(JSON.parse(localStorage.getItem('rhine-page-memory')??'{}')??{});}catch{}
export const pageMemory={enabled:saved.enabled===true,entries:(saved.entries&&typeof saved.entries==='object'?saved.entries:{}) as Record<string,Remembered>};
export function savePageMemory(){try{const entries=Object.fromEntries(Object.entries(pageMemory.entries).slice(-200));pageMemory.entries=entries;localStorage.setItem('rhine-page-memory',JSON.stringify(pageMemory));}catch{}}
export function rememberPage(index:number){const p=records[index]?.page;if(!pageMemory.enabled||!p)return;pageMemory.entries[p.deckId]={pageId:p.pageId,version:p.version};savePageMemory();}
export function returningPage(lane:number){const files=columnFiles(lane).filter(selectable),first=files[0];if(first===undefined)return -1;const p=records[first].page!,entry=pageMemory.entries[p.deckId];if(!pageMemory.enabled||!entry)return first;return files.find(i=>records[i].page?.pageId===entry.pageId&&records[i].page?.version===entry.version)??first;}
