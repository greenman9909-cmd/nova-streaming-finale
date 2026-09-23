const ANILIST = 'https://graphql.anilist.co'

export type Anime = {
  id:number
  title:{romaji?:string|null;english?:string|null;native?:string|null}
  coverImage:{extraLarge?:string|null;large?:string|null;color?:string|null}
  bannerImage?:string|null
  description?:string|null
  averageScore?:number|null
  seasonYear?:number|null
  season?:string|null
  episodes?:number|null
  duration?:number|null
  format?:string|null
  status?:string|null
  genres?:string[]|null
  trailer?:{id?:string|null;site?:string|null;thumbnail?:string|null}|null
  nextAiringEpisode?:{episode:number;airingAt:number}|null
}
const CORE = `
id
title { romaji english native }
coverImage { extraLarge large color }
bannerImage
description
averageScore
seasonYear
season
episodes
duration
format
status
genres
trailer { id site thumbnail }
nextAiringEpisode { episode airingAt }
`

async function gql<T>(query:string, variables:Record<string,unknown>={}, signal?:AbortSignal):Promise<T>{
  const r = await fetch(ANILIST,{
    method:'POST',
    headers:{'content-type':'application/json',accept:'application/json'},
    body:JSON.stringify({query,variables}),
    signal
  })
  if(r.status===429) throw new Error('AniList is rate limiting requests. Try again shortly.')
  if(!r.ok) throw new Error(`AniList request failed (${r.status})`)
  const json=await r.json()
  if(json.errors?.length) throw new Error(json.errors[0]?.message||'AniList returned an error')
  return json.data as T
}
export const titleOf=(a?:Anime|null)=>a?.title.english||a?.title.romaji||a?.title.native||'Untitled'
export const clean=(s?:string|null)=>(s||'').replace(/<br\s*\/?>(\s*)/gi,' ').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim()

export async function getHome(signal?:AbortSignal){
  const d=new Date(),m=d.getUTCMonth()+1
  const season=m<=3?'WINTER':m<=6?'SPRING':m<=9?'SUMMER':'FALL'
  const year=d.getUTCFullYear()
  const q=`query Home($season:MediaSeason,$year:Int){
    trending:Page(page:1,perPage:14){media(type:ANIME,sort:TRENDING_DESC,isAdult:false){${CORE}}}
    popular:Page(page:1,perPage:14){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){${CORE}}}
    seasonal:Page(page:1,perPage:14){media(type:ANIME,season:$season,seasonYear:$year,sort:POPULARITY_DESC,isAdult:false){${CORE}}}
    romance:Page(page:1,perPage:14){media(type:ANIME,genre:"Romance",sort:TRENDING_DESC,isAdult:false){${CORE}}}
    movies:Page(page:1,perPage:14){media(type:ANIME,format:MOVIE,sort:TRENDING_DESC,isAdult:false){${CORE}}}
    latest:Page(page:1,perPage:14){media(type:ANIME,status:RELEASING,sort:UPDATED_AT_DESC,isAdult:false){${CORE}}}
  }`
  return gql<Record<string,{media:Anime[]}>>(q,{season,year},signal)
}

export async function browseAnime(o:{page?:number;search?:string;genre?:string;sort?:string},signal?:AbortSignal){
  const q=`query Browse($page:Int,$search:String,$genre:String,$sort:[MediaSort]){
    Page(page:$page,perPage:24){
      pageInfo{currentPage hasNextPage total}
      media(type:ANIME,search:$search,genre:$genre,sort:$sort,isAdult:false){${CORE}}
    }
  }`
  return gql<{Page:{pageInfo:{currentPage:number;hasNextPage:boolean;total:number};media:Anime[]}}>(q,{
    page:o.page||1,search:o.search||undefined,genre:o.genre||undefined,sort:[o.sort||'TRENDING_DESC']
  },signal)
}

export async function getAnime(id:number,signal?:AbortSignal){
  const q=`query Anime($id:Int){
    Media(id:$id,type:ANIME){
      ${CORE}
      recommendations(perPage:12){nodes{rating mediaRecommendation{${CORE}}}}
      characters(perPage:12,sort:[ROLE,RELEVANCE,ID]){nodes{id name{full} image{large}}}
    }
  }`
  return gql<{Media:Anime&{
    recommendations?:{nodes:Array<{rating:number;mediaRecommendation:Anime|null}>}
    characters?:{nodes:Array<{id:number;name:{full:string};image:{large:string}}>}
  }}>(q,{id},signal)
}

export type PlaybackSource={
  url:string
  kind:'hls'|'mp4'|'embed'
  server:string
  audio:'sub'|'dub'
  subtitles:Array<{url:string;label:string;language?:string}>
  demo?:boolean
}
const DEMO='https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
const BASE=(import.meta.env.VITE_PLAYBACK_API_BASE as string|undefined)?.replace(/\/$/,'')
function normalize(x:any,a:'sub'|'dub'):PlaybackSource|null{
  const s=x?.source||x?.sources?.find?.((v:any)=>v?.url)||x?.data?.sources?.find?.((v:any)=>v?.url)||x?.data||x
  const url=s?.url||s?.file||s?.src
  if(typeof url!=='string'||!url.startsWith('https://')) return null
  const kind: PlaybackSource['kind'] = /\.m3u8($|\?)/i.test(url) ? 'hls' : /\.mp4($|\?)/i.test(url) ? 'mp4' : 'embed'
  const tracks=x?.subtitles||x?.tracks||x?.data?.tracks||[]
  return {url,kind,server:s?.server||x?.provider||'resolver',audio:a,subtitles:Array.isArray(tracks)?tracks.filter((t:any)=>t?.url||t?.file).map((t:any)=>({url:t.url||t.file,label:t.label||t.lang||'Subtitle',language:t.language||t.lang})):[]}
}
export async function resolvePlayback(id:number,episode:number,audio:'sub'|'dub',signal?:AbortSignal):Promise<PlaybackSource>{
  if(BASE){
    const r=await fetch(`${BASE}/watch/${id}/${audio}/${episode}`,{signal,headers:{accept:'application/json'}})
    if(r.ok){const n=normalize(await r.json(),audio);if(n)return n}
  }
  return {url:DEMO,kind:'hls',server:'legal-test-stream',audio,subtitles:[],demo:true}
}