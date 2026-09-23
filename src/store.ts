import { createClient } from '@supabase/supabase-js'
import type { Anime } from './api'
import { titleOf } from './api'

const url=(import.meta.env.VITE_SUPABASE_URL as string|undefined)||'https://jlzxyqlhdnrluocudlxn.supabase.co'
const key=(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined)||'sb_publishable_1gv9foHZ3V6K3nnaSwbFjQ_Vlw7RyUA'
export const supabaseConfigured=Boolean(url&&key)
export const supabase=supabaseConfigured?createClient(url!,key!,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null

export type LibraryEntry={anilistId:number;title:string;imageUrl?:string|null;status:'watching'|'planned'|'completed'|'paused'|'dropped';updatedAt?:string}
export type ProgressEntry={anilistId:number;episode:number;audioMode:'sub'|'dub';positionSeconds:number;durationSeconds:number;updatedAt?:string}
export type Settings={preferredAudio:'sub'|'dub';subtitleLanguage:string;autoplay:boolean;reducedMotion:boolean}
const LIB='yoru:library',PROG='yoru:progress',SET='yoru:settings'
const read=<T,>(k:string,f:T):T=>{try{return JSON.parse(localStorage.getItem(k)||'')as T}catch{return f}}
const write=(k:string,v:unknown)=>localStorage.setItem(k,JSON.stringify(v))
async function uid(){return (await supabase?.auth.getUser())?.data.user?.id||null}

export async function listLibrary():Promise<LibraryEntry[]>{
  const u=await uid()
  if(supabase&&u){
    const {data,error}=await supabase.from('yoru_library').select('anilist_id,title,image_url,status,updated_at').order('updated_at',{ascending:false})
    if(!error&&data)return data.map((x:any)=>({anilistId:x.anilist_id,title:x.title,imageUrl:x.image_url,status:x.status,updatedAt:x.updated_at}))
  }
  return read<LibraryEntry[]>(LIB,[])
}
export async function saveAnime(a:Anime,status:LibraryEntry['status']='watching'){
  const e:LibraryEntry={anilistId:a.id,title:titleOf(a),imageUrl:a.coverImage.extraLarge||a.coverImage.large,status,updatedAt:new Date().toISOString()}
  const u=await uid()
  if(supabase&&u){
    const {error}=await supabase.from('yoru_library').upsert({user_id:u,anilist_id:e.anilistId,title:e.title,image_url:e.imageUrl,status:e.status,updated_at:e.updatedAt},{onConflict:'user_id,anilist_id'})
    if(!error)return e
  }
  write(LIB,[e,...read<LibraryEntry[]>(LIB,[]).filter(x=>x.anilistId!==e.anilistId)])
  return e
}
export async function removeAnime(id:number){
  const u=await uid()
  if(supabase&&u)await supabase.from('yoru_library').delete().eq('user_id',u).eq('anilist_id',id)
  write(LIB,read<LibraryEntry[]>(LIB,[]).filter(x=>x.anilistId!==id))
}
export function localProgress(id:number,ep:number,a:'sub'|'dub'){
  return read<ProgressEntry[]>(PROG,[]).find(x=>x.anilistId===id&&x.episode===ep&&x.audioMode===a)
}
export async function saveProgress(e:ProgressEntry){
  const next={...e,updatedAt:new Date().toISOString()}
  const u=await uid()
  if(supabase&&u)await supabase.from('yoru_progress').upsert({
    user_id:u,anilist_id:e.anilistId,episode:e.episode,audio_mode:e.audioMode,
    position_seconds:e.positionSeconds,duration_seconds:e.durationSeconds,updated_at:next.updatedAt
  },{onConflict:'user_id,anilist_id,episode,audio_mode'})
  const all=read<ProgressEntry[]>(PROG,[])
  write(PROG,[next,...all.filter(x=>!(x.anilistId===e.anilistId&&x.episode===e.episode&&x.audioMode===e.audioMode))].slice(0,100))
}
export async function getSettings():Promise<Settings>{
  const fallback=read<Settings>(SET,{preferredAudio:'sub',subtitleLanguage:'English',autoplay:true,reducedMotion:false})
  const u=await uid()
  if(supabase&&u){
    const {data}=await supabase.from('yoru_settings').select('preferred_audio,subtitle_language,autoplay,reduced_motion').maybeSingle()
    if(data)return{preferredAudio:data.preferred_audio,subtitleLanguage:data.subtitle_language,autoplay:data.autoplay,reducedMotion:data.reduced_motion}
  }
  return fallback
}
export async function saveSettings(s:Settings){
  write(SET,s)
  const u=await uid()
  if(supabase&&u)await supabase.from('yoru_settings').upsert({
    user_id:u,preferred_audio:s.preferredAudio,subtitle_language:s.subtitleLanguage,autoplay:s.autoplay,reduced_motion:s.reducedMotion,updated_at:new Date().toISOString()
  },{onConflict:'user_id'})
}