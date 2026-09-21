export type TimingGroup = 'archive'|'preview'|'wide'|'presentation'|'page'|'surface';
export const timingGroups:TimingGroup[]=['archive','preview','wide','presentation','page','surface'];
export type TimingConfig={preset:'quick'|'fast'|'custom';global:number;groups:Record<TimingGroup,number>;damping:number};
const bounded=(v:unknown,def:number,min=.5,max=2)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):def;
export function recommended(preset:'quick'|'fast'='quick'):TimingConfig{return{preset,global:preset==='fast'?1.55:1.25,groups:{archive:1,preview:1,wide:1,presentation:1,page:1,surface:1},damping:1};}
export function normalizeTiming(input:Partial<TimingConfig>={}):TimingConfig{const t=recommended(input.preset==='fast'?'fast':'quick');t.global=bounded(input.global,t.global);for(const k of timingGroups)t.groups[k]=bounded(input.groups?.[k],1);t.damping=bounded(input.damping,1,.75,1.3);if(input.preset==='custom')t.preset='custom';return t;}
let stored:Partial<TimingConfig>={};try{stored=(JSON.parse(localStorage.getItem('rhine-motion-timing')??'{}')??{});}catch{}
export const motionTiming=normalizeTiming(stored);
export function interactionRate(group:TimingGroup){return motionTiming.global*motionTiming.groups[group];}
export function duration(ms:number,group:TimingGroup='surface'){return ms/interactionRate(group);}
export function saveTiming(){try{localStorage.setItem('rhine-motion-timing',JSON.stringify(motionTiming));}catch{}document.documentElement.style.setProperty('--surface-duration',duration(300)+'ms');document.documentElement.style.setProperty('--surface-rate',String(interactionRate('surface')));}
export function useSpeed(preset:'quick'|'fast'){Object.assign(motionTiming,recommended(preset));saveTiming();}
saveTiming();
