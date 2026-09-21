export interface PageIdentity { deckId:string; pageId:string; number:number; total:number; width:number; height:number; version:string; kind:string; asset:string; hidden:boolean; state:"loading"|"ready"|"failed"; error?:string }
export interface ArchiveRecord { id:string; title:string; en:string; department:string; category:string; date:string; lead:string; clearance:string; abstract:string; findings:string[]; source:string; page?:PageIdentity }
export const emptyRecord:ArchiveRecord={id:"X-000",title:"请在设置中指定内容文件夹",en:"CONTENT DIRECTORY",department:"—",category:"未设置内容",date:"—",lead:"—",clearance:"NO CONTENT",abstract:"未提供简介",findings:[],source:""};
export const records:ArchiveRecord[]=[emptyRecord];
export const archiveColumns:string[]=["","",emptyRecord.category];
export const categories=["全部档案"];
export function installRecords(next:ArchiveRecord[]){records.splice(0,records.length,...(next.length?next:[emptyRecord]));archiveColumns.splice(0,archiveColumns.length,"","",...new Set(records.map(r=>r.category)));categories.splice(1,categories.length,...archiveColumns.slice(2));}
export function columnFiles(lane:number){return records.flatMap((r,i)=>r.category===archiveColumns[lane]?[i]:[]);}
export function fileLocation(index:number){const r=records[index]??emptyRecord;const lane=Math.max(2,archiveColumns.indexOf(r.category));const row=12+Math.max(0,columnFiles(lane).indexOf(index));return {lane,row,slot:lane*32+row};}
export function fileAtSlot(slot:number){return columnFiles(Math.floor(slot/32))[slot%32-12]??-1;}
export function selectable(index:number){return Boolean(records[index]?.page);}
