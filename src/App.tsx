import { FormEvent,useEffect,useMemo,useRef,useState } from 'react'
import { Navigate,NavLink,Link,Route,Routes,useLocation,useParams } from 'react-router-dom'
import { useQuery,useQueryClient } from '@tanstack/react-query'
import { motion,useReducedMotion } from 'framer-motion'
import Hls from 'hls.js'
import { Anime,browseAnime,clean,getAnime,getHome,resolvePlayback,titleOf,type PlaybackSource } from './api'
import { getSettings,listLibrary,localProgress,removeAnime,saveAnime,saveProgress,saveSettings,supabase,supabaseConfigured,type Settings } from './store'

function AuthDialog({open,onClose,onAuth}:{open:boolean;onClose:()=>void;onAuth:(x:string|null)=>void}){
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[mode,setMode]=useState<'signin'|'signup'>('signin')
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('')
  if(!open)return null
  async function submit(e:FormEvent){
    e.preventDefault()
    if(!supabase)return setMessage('Supabase is not configured in this deployment.')
    setBusy(true);setMessage('')
    const result=mode==='signin'?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}})
    setBusy(false)
    if(result.error)return setMessage(result.error.message)
    onAuth(result.data.user?.email||email)
    setMessage(mode==='signup'&&!result.data.session?'Check your email to confirm your account.':'Signed in.')
    if(result.data.session)setTimeout(onClose,450)
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="auth-panel" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}>×</button><div className="eyebrow">Your Yoru</div>
    <h2>{mode==='signin'?'Welcome back':'Create your account'}</h2><p className="muted">Sync your library, progress and playback preferences without changing the cinematic interface.</p>
    {!supabaseConfigured&&<p className="notice">Supabase environment variables are missing.</p>}
    <form className="auth-form" onSubmit={submit}>
      <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Password<input type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {message&&<p className="notice">{message}</p>}
      <button className="primary-button" disabled={busy}>{busy?'Working…':mode==='signin'?'Sign in':'Create account'}</button>
    </form>
    <button className="text-button" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('')}}>{mode==='signin'?'Need an account? Sign up':'Already have an account? Sign in'}</button>
    <button className="text-button danger" onClick={async()=>{await supabase?.auth.signOut();onAuth(null);onClose()}}>Sign out</button>
  </section></div>
}
function Nav(){
  const loc=useLocation(),[open,setOpen]=useState(false),[email,setEmail]=useState<string|null>(null)
  useEffect(()=>{
    let live=true
    supabase?.auth.getUser().then(({data})=>{if(live)setEmail(data.user?.email||null)}).catch(()=>{})
    const sub=supabase?.auth.onAuthStateChange((_e,s)=>{if(live)setEmail(s?.user?.email||null)})
    return()=>{live=false;sub?.data.subscription.unsubscribe()}
  },[])
  const links:[string,string][]=[['/','Home'],['/anime','Browse'],['/search','Search'],['/library','Library']]
  return <><header className="global-nav" data-path={loc.pathname}><div className="nav-pill main-pill">
    <NavLink className="brand-mark" to="/">夜</NavLink><nav>{links.map(([to,label])=><NavLink key={to} to={to} className={({isActive})=>`nav-link ${isActive?'active':''}`}>{label}</NavLink>)}</nav>
  </div><div className="nav-pill account-pill"><NavLink className="round-nav" to="/settings">⚙</NavLink><button className="account-button" onClick={()=>setOpen(true)}>{email?email[0].toUpperCase():'◉'}</button></div></header>
  <AuthDialog open={open} onClose={()=>setOpen(false)} onAuth={setEmail}/></>
}
function AnimeCard({anime}:{anime:Anime}){
  const image=anime.coverImage.extraLarge||anime.coverImage.large||''
  return <Link className="anime-card" to={`/anime/${anime.id}`}><div className="poster">{image?<img src={image} alt="" loading="lazy"/>:<div className="fallback">夜</div>}<div className="poster-shade"/>
    <div className="poster-meta">{anime.averageScore&&<span className="score">★ {anime.averageScore}</span>}{anime.format&&<span>{anime.format.replaceAll('_',' ')}</span>}</div>
  </div><div className="card-copy"><strong>{titleOf(anime)}</strong><span>{anime.seasonYear||'—'}{anime.episodes?` · ${anime.episodes} eps`:''}</span></div></Link>
}
function Shelf({title,items}:{title:string;items:Anime[]}){
  if(!items.length)return null
  return <section className="shelf"><div className="shelf-head"><h2>{title}</h2><span>{items.length} titles</span></div><div className="shelf-track">{items.map(a=><AnimeCard key={a.id} anime={a}/>)}</div></section>
}
function Hero({anime}:{anime:Anime}){
  const reduced=useReducedMotion(),backdrop=anime.bannerImage||anime.coverImage.extraLarge||anime.coverImage.large||''
  const ep=anime.nextAiringEpisode?.episode?Math.max(1,anime.nextAiringEpisode.episode-1):1
  return <section className="hero"><div className="hero-art" style={{backgroundImage:`url(${backdrop})`}}/><div className="hero-vignette"/>
    <motion.div className="hero-copy" initial={reduced?false:{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.72,ease:[.16,1,.3,1]}}>
      <div className="eyebrow">Featured tonight</div><h1>{titleOf(anime)}</h1>
      <div className="chips">{anime.averageScore&&<span className="chip score">★ {anime.averageScore}</span>}{anime.seasonYear&&<span className="chip">{anime.seasonYear}</span>}{anime.format&&<span className="chip">{anime.format.replaceAll('_',' ')}</span>}{anime.episodes&&<span className="chip">{anime.episodes} episodes</span>}</div>
      <p>{clean(anime.description).slice(0,320)}</p><div className="actions"><Link className="play-button" to={`/watch/${anime.id}/${ep}`}>▶ <span>Play</span></Link><Link className="circle-button" to={`/anime/${anime.id}`}>＋</Link></div>
    </motion.div><div className="hero-index">01</div>
  </section>
}
function Home(){
  const q=useQuery({queryKey:['home'],queryFn:({signal})=>getHome(signal)})
  if(q.isLoading)return <State hero text="Building tonight's lineup…"/>
  if(!q.data||q.error)return <State hero title="Catalogue unavailable" text={q.error instanceof Error?q.error.message:'Try again shortly.'}/>
  const h=q.data.trending.media.find(x=>x.bannerImage)||q.data.trending.media[0]
  return <main><Hero anime={h}/><div className="home-rows"><Shelf title="Trending now" items={q.data.trending.media}/><Shelf title="Popular this season" items={q.data.seasonal.media}/><Shelf title="New releases" items={q.data.latest.media}/><Shelf title="Romance" items={q.data.romance.media}/><Shelf title="Anime movies" items={q.data.movies.media}/><Shelf title="All-time popular" items={q.data.popular.media}/></div></main>
}
const genres=['','Action','Adventure','Comedy','Drama','Fantasy','Romance','Sci-Fi','Slice of Life','Sports','Supernatural']
function Browse({searchOnly=false}:{searchOnly?:boolean}){
  const [search,setSearch]=useState(''),[debounced,setDebounced]=useState(''),[genre,setGenre]=useState(''),[sort,setSort]=useState('TRENDING_DESC'),[page,setPage]=useState(1)
  useEffect(()=>{const t=window.setTimeout(()=>setDebounced(search.trim()),500);return()=>clearTimeout(t)},[search])
  const q=useQuery({queryKey:['browse',page,debounced,genre,sort],queryFn:({signal})=>browseAnime({page,search:debounced,genre,sort},signal)})
  return <main className="catalog"><header className="catalog-head"><div className="eyebrow">{searchOnly?'Find your next watch':'Explore'}</div><h1>{searchOnly?'Search':'Anime catalogue'}</h1><p>Live AniList metadata shaped into Yoru's cinematic browsing system.</p>
    <div className="filters"><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search anime…" autoFocus={searchOnly}/>{!searchOnly&&<select value={genre} onChange={e=>{setGenre(e.target.value);setPage(1)}}>{genres.map(g=><option key={g} value={g}>{g||'All genres'}</option>)}</select>}{!searchOnly&&<select value={sort} onChange={e=>setSort(e.target.value)}><option value="TRENDING_DESC">Trending</option><option value="POPULARITY_DESC">Popular</option><option value="SCORE_DESC">Top rated</option><option value="START_DATE_DESC">Newest</option></select>}</div>
  </header>{q.isLoading?<State text="Searching the catalogue…"/>:q.error?<State title="Search failed" text={q.error instanceof Error?q.error.message:'Unknown error'}/>:q.data?.Page.media.length?<><div className="grid">{q.data.Page.media.map(a=><AnimeCard key={a.id} anime={a}/>)}</div><div className="pagination"><button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</button><span>Page {page}</span><button disabled={!q.data.Page.pageInfo.hasNextPage} onClick={()=>setPage(p=>p+1)}>Next</button></div></>:<State title="No titles found" text="Try a broader search or another genre."/>}</main>
}
function Detail(){
  const id=Number(useParams().id),q=useQuery({queryKey:['anime',id],queryFn:({signal})=>getAnime(id,signal),enabled:Number.isFinite(id)}),[saved,setSaved]=useState(false)
  if(q.isLoading)return <State hero/>
  if(!q.data?.Media||q.error)return <State hero title="Anime unavailable"/>
  const a=q.data.Media,recs=(a.recommendations?.nodes.map(n=>n.mediaRecommendation).filter(Boolean)||[]) as Anime[]
  return <main><section className="detail-hero"><div className="detail-art" style={{backgroundImage:`url(${a.bannerImage||a.coverImage.extraLarge})`}}/><div className="detail-gradient"/><div className="detail-content">
    <img className="detail-poster" src={a.coverImage.extraLarge||a.coverImage.large||''} alt=""/><div className="detail-copy"><div className="eyebrow">{a.status?.replaceAll('_',' ')}</div><h1>{titleOf(a)}</h1><div className="chips">{a.averageScore&&<span className="chip score">★ {a.averageScore}</span>}{a.seasonYear&&<span className="chip">{a.seasonYear}</span>}{a.format&&<span className="chip">{a.format.replaceAll('_',' ')}</span>}{a.episodes&&<span className="chip">{a.episodes} episodes</span>}</div><p>{clean(a.description)}</p><div className="actions"><Link className="play-button" to={`/watch/${a.id}/1`}>▶ Start watching</Link><button className="circle-button" onClick={async()=>{await saveAnime(a);setSaved(true)}}>{saved?'✓':'＋'}</button></div></div>
  </div></section><section className="detail-body"><div className="facts"><div><span>Genres</span><strong>{a.genres?.join(' · ')||'—'}</strong></div><div><span>Duration</span><strong>{a.duration?`${a.duration} min`:'—'}</strong></div><div><span>Season</span><strong>{[a.season,a.seasonYear].filter(Boolean).join(' ')||'—'}</strong></div></div>
  {a.characters?.nodes?.length?<section><div className="shelf-head"><h2>Characters</h2></div><div className="characters">{a.characters.nodes.map(c=><figure key={c.id}><img src={c.image.large} alt=""/><figcaption>{c.name.full}</figcaption></figure>)}</div></section>:null}
  {recs.length?<section><div className="shelf-head"><h2>You may also like</h2></div><div className="grid small-grid">{recs.slice(0,8).map(x=><AnimeCard key={x.id} anime={x}/>)}</div></section>:null}</section></main>
}
function Video({source,startAt,onProgress}:{source:PlaybackSource;startAt:number;onProgress:(a:number,b:number)=>void}){
  const ref=useRef<HTMLVideoElement>(null),[error,setError]=useState('')
  useEffect(()=>{
    const v=ref.current;if(!v)return
    let h:Hls|null=null
    const loaded=()=>{if(startAt>0&&Number.isFinite(v.duration))v.currentTime=Math.min(startAt,Math.max(0,v.duration-2))}
    const tick=()=>onProgress(v.currentTime,Number.isFinite(v.duration)?v.duration:0)
    v.addEventListener('loadedmetadata',loaded);v.addEventListener('timeupdate',tick)
    if(source.kind==='hls'){if(v.canPlayType('application/vnd.apple.mpegurl'))v.src=source.url;else if(Hls.isSupported()){h=new Hls();h.loadSource(source.url);h.attachMedia(v);h.on(Hls.Events.ERROR,(_e,d)=>{if(d.fatal)setError('Playback source became unavailable.')})}else setError('HLS is not supported in this browser.')}
    else if(source.kind==='mp4')v.src=source.url
    else setError('Embed playback is disabled until an explicit sandbox allow-list is configured.')
    return()=>{v.removeEventListener('loadedmetadata',loaded);v.removeEventListener('timeupdate',tick);h?.destroy();v.removeAttribute('src');v.load()}
  },[source.url,source.kind,startAt])
  return <div className="video-shell"><video ref={ref} controls playsInline preload="metadata"/>{error&&<div className="player-error">{error}</div>}{source.demo&&<div className="demo-tag">LEGAL TEST STREAM · RESOLVER NOT CONFIGURED</div>}</div>
}
function Watch(){
  const p=useParams(),id=Number(p.anilistId),ep=Math.max(1,Number(p.episode)||1),[audio,setAudio]=useState<'sub'|'dub'>('sub'),last=useRef(0)
  const aq=useQuery({queryKey:['anime',id],queryFn:({signal})=>getAnime(id,signal),enabled:Number.isFinite(id)})
  const sq=useQuery({queryKey:['playback',id,ep,audio],queryFn:({signal})=>resolvePlayback(id,ep,audio,signal),enabled:Number.isFinite(id)})
  const stored=useMemo(()=>localProgress(id,ep,audio),[id,ep,audio]),a=aq.data?.Media,max=Math.min(a?.episodes||Math.max(ep+4,12),60)
  const progress=(pos:number,dur:number)=>{const now=Date.now();if(now-last.current<8000)return;last.current=now;saveProgress({anilistId:id,episode:ep,audioMode:audio,positionSeconds:pos,durationSeconds:dur}).catch(()=>{})}
  return <main className="watch"><div className="watch-head"><Link className="back" to={a?`/anime/${id}`:'/'}>←</Link><div><div className="eyebrow">Now playing</div><h1>{a?titleOf(a):'Loading…'} <small>Episode {ep}</small></h1></div><div className="audio"><button className={audio==='sub'?'active':''} onClick={()=>setAudio('sub')}>SUB</button><button className={audio==='dub'?'active':''} onClick={()=>setAudio('dub')}>DUB</button></div></div>
    <div className="watch-layout"><div>{sq.isLoading?<div className="player-state">Resolving playback…</div>:sq.error||!sq.data?<div className="player-state">No playback source is available.</div>:<Video source={sq.data} startAt={stored?.positionSeconds||0} onProgress={progress}/>}
    {sq.data?.demo&&<p className="player-note">This deployment intentionally uses a legal public HLS test stream until an authorized Yoru-compatible playback resolver is configured. Catalogue metadata and player persistence are live.</p>}</div>
    <aside className="episodes"><header><strong>Episodes</strong><span>{max}</span></header><div>{Array.from({length:max},(_,i)=>i+1).map(n=><Link key={n} className={n===ep?'active':''} to={`/watch/${id}/${n}`}><b>{String(n).padStart(2,'0')}</b><small>{n===ep?'Playing':'Episode'}</small></Link>)}</div></aside></div>
  </main>
}
function Library(){
  const qc=useQueryClient(),q=useQuery({queryKey:['library'],queryFn:listLibrary})
  return <main className="catalog"><header className="catalog-head"><div className="eyebrow">Your space</div><h1>Library</h1><p>Local-first when signed out, Supabase-backed when signed in.</p></header>{q.isLoading?<State/>:q.data?.length?<div className="library">{q.data.map(x=><article key={x.anilistId}><Link to={`/anime/${x.anilistId}`}><img src={x.imageUrl||''} alt=""/><div><strong>{x.title}</strong><span>{x.status}</span></div></Link><button onClick={async()=>{await removeAnime(x.anilistId);qc.invalidateQueries({queryKey:['library']})}}>Remove</button></article>)}</div>:<State title="Your library is quiet" text="Save a title from any anime detail page and it will appear here."/>}</main>
}
function SettingsPage(){
  const [s,setS]=useState<Settings>({preferredAudio:'sub',subtitleLanguage:'English',autoplay:true,reducedMotion:false}),[saved,setSaved]=useState(false)
  useEffect(()=>{getSettings().then(setS)},[])
  const set=<K extends keyof Settings>(k:K,v:Settings[K])=>{setSaved(false);setS(x=>({...x,[k]:v}))}
  return <main className="catalog"><header className="catalog-head"><div className="eyebrow">Tune Yoru</div><h1>Settings</h1><p>Playback and accessibility controls remixed into the same visual language.</p></header><section className="settings">
    <Row title="Preferred audio" text="Choose the default playback mode."><div className="seg"><button className={s.preferredAudio==='sub'?'active':''} onClick={()=>set('preferredAudio','sub')}>Sub</button><button className={s.preferredAudio==='dub'?'active':''} onClick={()=>set('preferredAudio','dub')}>Dub</button></div></Row>
    <Row title="Autoplay" text="Continue into the next episode when possible."><button className={`toggle ${s.autoplay?'on':''}`} onClick={()=>set('autoplay',!s.autoplay)}><span/></button></Row>
    <Row title="Reduced motion" text="Reduce cinematic transitions and hover motion."><button className={`toggle ${s.reducedMotion?'on':''}`} onClick={()=>set('reducedMotion',!s.reducedMotion)}><span/></button></Row>
    <Row title="Subtitle language" text="Preferred track when a source exposes subtitles."><select value={s.subtitleLanguage} onChange={e=>set('subtitleLanguage',e.target.value)}><option>English</option><option>Spanish</option><option>French</option><option>German</option></select></Row>
    <button className="primary-button save" onClick={async()=>{await saveSettings(s);setSaved(true)}}>{saved?'Saved':'Save settings'}</button>
  </section></main>
}
function Row({title,text,children}:{title:string;text:string;children:React.ReactNode}){return <div className="setting-row"><div><strong>{title}</strong><span>{text}</span></div>{children}</div>}
function State({title,text,hero=false}:{title?:string;text?:string;hero?:boolean}){return <div className={`state ${hero?'hero-state':''}`}><div className="spinner"/>{title&&<h2>{title}</h2>}{text&&<p>{text}</p>}</div>}
export default function App(){return <div><Nav/><Routes><Route path="/" element={<Home/>}/><Route path="/anime" element={<Browse/>}/><Route path="/search" element={<Browse searchOnly/>}/><Route path="/genres" element={<Browse/>}/><Route path="/latest" element={<Browse/>}/><Route path="/anime/:id" element={<Detail/>}/><Route path="/watch/:anilistId/:episode" element={<Watch/>}/><Route path="/library" element={<Library/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></div>}