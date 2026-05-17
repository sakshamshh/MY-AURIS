import React, { useState, useEffect, useCallback } from 'react';
import { FloorMap } from './FloorMap.jsx';

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8000'
  : 'https://auris.skymlabs.com';


// ── helpers ──────────────────────────────────────────────────────────────────
async function api(path, { method='GET', storeId, password, adminKey, body, qs={} } = {}) {
  const url = new URL(path, API);
  Object.entries(qs).forEach(([k,v]) => url.searchParams.set(k,v));
  const r = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type':'application/json',
      ...(storeId   && {'X-Store-ID': storeId}),
      ...(password  && {'X-Password': password}),
      ...(adminKey  && {'X-Admin-Key': adminKey}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(d.detail || r.statusText);
  return d;
}

const SAMPLE = {
  floor_id:'factory_floor_1', name:'Main Production Floor',
  source:'smartphone_2d_scan', confidence:0.88,
  boundary:[{x_m:0,y_m:0},{x_m:20,y_m:0},{x_m:20,y_m:12},{x_m:0,y_m:12}],
  walls:[
    {start:{x_m:0,y_m:0},end:{x_m:20,y_m:0},label:'front'},
    {start:{x_m:20,y_m:0},end:{x_m:20,y_m:12},label:'right'},
    {start:{x_m:20,y_m:12},end:{x_m:0,y_m:12},label:'back'},
    {start:{x_m:0,y_m:12},end:{x_m:0,y_m:0},label:'left'},
  ],
  openings:[{start:{x_m:3,y_m:0},end:{x_m:5,y_m:0},label:'Main Entrance',kind:'door'}],
  obstacles:[
    [{x_m:6,y_m:3},{x_m:10,y_m:3},{x_m:10,y_m:7},{x_m:6,y_m:7}],
    [{x_m:13,y_m:8},{x_m:18,y_m:8},{x_m:18,y_m:11},{x_m:13,y_m:11}],
  ],
};

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('hq');
  const [auth, setAuth] = useState({
    storeId: localStorage.getItem('a_sid') || 'demo_store',
    password: localStorage.getItem('a_pw') || 'demo_password',
    adminKey: localStorage.getItem('a_ak') || '',
  });
  const [factories, setFactories] = useState([]);
  const [activeFactory, setActiveFactory] = useState(null);
  const [floors, setFloors] = useState([]);
  const [activeFloor, setActiveFloor] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [livePos, setLivePos] = useState([]);
  const [heat, setHeat] = useState([]);
  const [scanText, setScanText] = useState(JSON.stringify(SAMPLE,null,2));
  const [msg, setMsg] = useState('Select a factory to begin.');
  const [pinDraft, setPinDraft] = useState(null); // camera being placed

  const creds = { storeId: auth.storeId, password: auth.password };

  // persist auth
  useEffect(() => {
    localStorage.setItem('a_sid', auth.storeId);
    localStorage.setItem('a_pw', auth.password);
    localStorage.setItem('a_ak', auth.adminKey);
  }, [auth]);

  // load floors when factory selected
  useEffect(() => {
    if (!activeFactory) return;
    setAuth(a => ({...a, storeId: activeFactory.store_id}));
    api('/api/spatial/floors', { storeId: activeFactory.store_id, password: auth.password })
      .then(d => { setFloors(d.floors||[]); if (d.floors?.length) setActiveFloor(d.floors[0]); })
      .catch(()=>{});
  }, [activeFactory]);

  // load cameras when floor selected
  useEffect(() => {
    if (!activeFloor) return;
    api('/api/cameras/list', { ...creds, qs:{ floor_id: activeFloor.floor_id } })
      .then(d => setCameras(d.cameras||[]))
      .catch(()=>{});
  }, [activeFloor, auth.storeId]);

  // live refresh
  useEffect(() => {
    if (tab !== 'live' || !activeFloor) return;
    const fid = activeFloor.floor_id;
    const load = () => {
      api('/api/spatial/live',    { ...creds, qs:{floor_id:fid} }).then(d=>setLivePos(d.positions||[])).catch(()=>{});
      api('/api/spatial/heatmap', { ...creds, qs:{floor_id:fid} }).then(d=>setHeat(d.cells||[])).catch(()=>{});
    };
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [tab, activeFloor, auth.storeId]);

  // ── Camera pin placement ──
  function handleMapPin(pos) {
    setPinDraft({ x_m: pos.x_m, y_m: pos.y_m,
      camera_id:`cam${cameras.length+1}`, name:`Camera ${cameras.length+1}`,
      floor_id: activeFloor?.floor_id||'floor_0', heading_deg:0, fov_deg:80 });
  }

  async function savePin() {
    if (!pinDraft) return;
    await api('/api/cameras/pin', { method:'POST', ...creds, body: pinDraft });
    setCameras(c => [...c.filter(x=>x.camera_id!==pinDraft.camera_id), pinDraft]);
    setPinDraft(null);
    setMsg(`Camera ${pinDraft.name} pinned.`);
  }

  async function deleteCamera(cid) {
    await api(`/api/cameras/${cid}`, { method:'DELETE', ...creds });
    setCameras(c => c.filter(x=>x.camera_id!==cid));
  }

  async function uploadFloor() {
    try {
      const scan = JSON.parse(scanText);
      const d = await api('/api/mapping/floorplan', { method:'POST', ...creds, body:scan });
      setMsg(`Floor plan "${d.floorplan.floor_id}" saved.`);
      const fd = await api('/api/spatial/floors', creds);
      setFloors(fd.floors||[]);
      setActiveFloor(fd.floors?.find(f=>f.floor_id===scan.floor_id)||fd.floors?.[0]||null);
    } catch(e) { setMsg(`Error: ${e.message}`); }
  }

  const activePlanPreview = (() => {
    try {
      const s = JSON.parse(scanText);
      if (!s?.boundary?.length) return null;
      const minX=Math.min(...s.boundary.map(p=>p.x_m)), minY=Math.min(...s.boundary.map(p=>p.y_m));
      const maxX=Math.max(...s.boundary.map(p=>p.x_m)), maxY=Math.max(...s.boundary.map(p=>p.y_m));
      const sh = p=>({x_m:+(p.x_m-minX).toFixed(3),y_m:+(p.y_m-minY).toFixed(3),label:p.label});
      const ss = seg=>({...seg,start:sh(seg.start),end:sh(seg.end)});
      return { floor_id:s.floor_id, bounds_m:{width:+(maxX-minX).toFixed(2),height:+(maxY-minY).toFixed(2)},
        geometry:{ boundary:s.boundary.map(sh), walls:(s.walls||[]).map(ss),
          openings:(s.openings||[]).map(ss), obstacles:(s.obstacles||[]).map(p=>p.map(sh)) }};
    } catch { return null; }
  })();

  return (
    <div style={S.shell}>
      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.brand}><span style={S.logo}>Auris</span><span style={S.logoSub}>HQ</span></div>
        <nav style={S.nav}>
          {[['hq','🏭','Factory HQ'],['map','🗺','Floor Maps'],['cameras','📷','Cameras'],['live','⚡','Live Floor'],['training','🧠','Training']].map(([id,ic,lb])=>(
            <button key={id} style={{...S.navBtn,...(tab===id?S.navBtnA:{})}} onClick={()=>setTab(id)}>
              <span style={S.navIc}>{ic}</span><span>{lb}</span>
            </button>
          ))}
        </nav>
        {/* Factory list */}
        <div style={S.factoryList}>
          <div style={S.factoryListHd}>Factories</div>
          {factories.map(f=>(
            <button key={f.store_id} style={{...S.factoryBtn,...(activeFactory?.store_id===f.store_id?S.factoryBtnA:{})}}
              onClick={()=>setActiveFactory(f)}>
              <span>{f.name||f.store_id}</span>
            </button>
          ))}
          {factories.length===0 && <div style={S.dim}>No factories yet</div>}
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={S.main}>
        <header style={S.topbar}>
          <div>
            <h2 style={S.topTitle}>{tab==='hq'?'Factory HQ':tab==='map'?'Floor Maps':tab==='cameras'?'Camera Management':tab==='live'?'Live Spatial View':'Self-Training'}</h2>
            <p style={S.topMsg}>{msg}</p>
          </div>
          <div style={S.authRow}>
            <input style={S.inp} placeholder="Store ID" value={auth.storeId} onChange={e=>setAuth(a=>({...a,storeId:e.target.value}))} />
            <input style={S.inp} type="password" placeholder="Password" value={auth.password} onChange={e=>setAuth(a=>({...a,password:e.target.value}))} />
          </div>
        </header>

        <div style={S.content}>

          {/* ── HQ Tab ── */}
          {tab==='hq' && (
            <div style={S.grid2}>
              <div style={S.card}>
                <h3 style={S.cardH}>Provision New Factory</h3>
                <FactoryForm onCreated={f=>setFactories(prev=>[...prev,f])} creds={auth} />
              </div>
              <div style={S.card}>
                <h3 style={S.cardH}>Active Deployments</h3>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {factories.map(f=>(
                    <div key={f.store_id} style={S.factoryRow}>
                      <div>
                        <div style={{fontWeight:600,fontSize:14}}>{f.name||f.store_id}</div>
                        <div style={{color:'#555',fontSize:12,fontFamily:'monospace'}}>{f.store_id}</div>
                      </div>
                      <div style={{display:'flex',gap:6}}>
                        <button style={S.btnSm} onClick={()=>{setActiveFactory(f);setTab('map');}}>Open</button>
                      </div>
                    </div>
                  ))}
                  {factories.length===0 && <div style={S.dim}>Provision a factory above to get started.</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── Map Tab ── */}
          {tab==='map' && (
            <div style={S.grid2}>
              <div style={S.card}>
                <h3 style={S.cardH}>Upload 2D Floor Scan</h3>
                <p style={S.hint}>Export JSON from Polycam / Magicplan, or paste below.</p>
                <FloorSelector floors={floors} active={activeFloor} onChange={setActiveFloor} />
                <textarea style={S.ta} value={scanText} onChange={e=>setScanText(e.target.value)} spellCheck={false} />
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button style={S.btn} onClick={()=>setScanText(JSON.stringify(SAMPLE,null,2))}>Load Sample</button>
                  <button style={{...S.btn,...S.btnPrimary}} onClick={uploadFloor}>Upload Floor Plan</button>
                </div>
              </div>
              <div style={S.card}>
                <h3 style={S.cardH}>Preview</h3>
                <div style={{height:400}}>
                  <FloorMap floorPlan={activePlanPreview} cameras={[]} mode="view" />
                </div>
              </div>
            </div>
          )}

          {/* ── Cameras Tab ── */}
          {tab==='cameras' && (
            <div style={S.grid2}>
              <div style={S.card}>
                <h3 style={S.cardH}>Floor Map — Click to Pin Camera</h3>
                <FloorSelector floors={floors} active={activeFloor} onChange={setActiveFloor} />
                <div style={{height:420,marginTop:12}}>
                  <FloorMap floorPlan={activeFloor} cameras={cameras} mode="edit" onCameraPin={handleMapPin} />
                </div>
              </div>
              <div style={S.card}>
                <h3 style={S.cardH}>Camera Registry</h3>
                {pinDraft && (
                  <div style={S.pinDraft}>
                    <div style={{fontWeight:600,marginBottom:8}}>📍 New Camera at ({pinDraft.x_m}m, {pinDraft.y_m}m)</div>
                    <input style={S.inp} placeholder="Camera ID (e.g. cam1)" value={pinDraft.camera_id}
                      onChange={e=>setPinDraft(d=>({...d,camera_id:e.target.value}))} />
                    <input style={S.inp} placeholder="Display name" value={pinDraft.name}
                      onChange={e=>setPinDraft(d=>({...d,name:e.target.value}))} />
                    <input style={S.inp} placeholder="RTSP URL (optional)" value={pinDraft.rtsp_url||''}
                      onChange={e=>setPinDraft(d=>({...d,rtsp_url:e.target.value}))} />
                    <div style={{display:'flex',gap:8}}>
                      <input style={{...S.inp,width:80}} type="number" placeholder="Heading°" value={pinDraft.heading_deg}
                        onChange={e=>setPinDraft(d=>({...d,heading_deg:+e.target.value}))} />
                      <input style={{...S.inp,width:80}} type="number" placeholder="FOV°" value={pinDraft.fov_deg}
                        onChange={e=>setPinDraft(d=>({...d,fov_deg:+e.target.value}))} />
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button style={{...S.btn,...S.btnPrimary}} onClick={savePin}>Save Camera</button>
                      <button style={S.btn} onClick={()=>setPinDraft(null)}>Cancel</button>
                    </div>
                  </div>
                )}
                <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:12}}>
                  {cameras.map((cam,i)=>(
                    <div key={cam.camera_id} style={S.camRow}>
                      <div style={{...S.camDot,background:['#0a84ff','#30d158','#ffd60a','#ff453a','#bf5af2'][i%5]}} />
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:13}}>{cam.name||cam.camera_id}</div>
                        <div style={{color:'#555',fontSize:11}}>{cam.camera_id} · ({cam.x_m}m, {cam.y_m}m) · {cam.heading_deg}° · FOV {cam.fov_deg}°</div>
                      </div>
                      <button style={{...S.btnSm,color:'#ff453a'}} onClick={()=>deleteCamera(cam.camera_id)}>✕</button>
                    </div>
                  ))}
                  {cameras.length===0 && <div style={S.dim}>No cameras pinned. Click "+ Pin Camera" on the map.</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── Live Tab ── */}
          {tab==='live' && (
            <div style={{...S.card,height:'calc(100vh - 180px)',display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <h3 style={S.cardH}>Live Spatial Floor</h3>
                <FloorSelector floors={floors} active={activeFloor} onChange={setActiveFloor} />
                <div style={{marginLeft:'auto',color:'#30d158',fontSize:12}}>● Live · 3s refresh</div>
              </div>
              <div style={{flex:1}}>
                <FloorMap floorPlan={activeFloor} cameras={cameras} positions={livePos} heatCells={heat} mode="view" />
              </div>
              <div style={{display:'flex',gap:16,fontSize:12,color:'#555'}}>
                <span>👤 {livePos.length} people tracked</span>
                <span>📷 {cameras.length} cameras</span>
              </div>
            </div>
          )}

          {/* ── Training Tab ── */}
          {tab==='training' && <TrainingPanel creds={creds} />}

        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FloorSelector({ floors, active, onChange }) {
  if (!floors.length) return null;
  return (
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
      {floors.map(f=>(
        <button key={f.floor_id}
          style={{...S.chip,...(active?.floor_id===f.floor_id?S.chipA:{})}}
          onClick={()=>onChange(f)}>
          {f.floor_id}
        </button>
      ))}
    </div>
  );
}

function FactoryForm({ onCreated, creds }) {
  const [name,setName]=useState(''); const [sid,setSid]=useState(''); const [pw,setPw]=useState('');
  const [saving,setSaving]=useState(false);
  async function create() {
    setSaving(true);
    try {
      const d = await api('/api/admin/stores', { method:'POST', adminKey:creds.adminKey,
        body:{ store_id:sid, name, password:pw } });
      onCreated({ store_id:sid, name });
      setName(''); setSid(''); setPw('');
    } catch(e) { alert(e.message); }
    setSaving(false);
  }
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <input style={S.inp} placeholder="Factory Name (e.g. Sharma Electronics)" value={name} onChange={e=>setName(e.target.value)} />
      <input style={S.inp} placeholder="Store ID (e.g. sharma_karolbagh)" value={sid} onChange={e=>setSid(e.target.value)} />
      <input style={S.inp} type="password" placeholder="Access Password" value={pw} onChange={e=>setPw(e.target.value)} />
      <input style={S.inp} placeholder="Admin Key" value={creds.adminKey||''} readOnly />
      <button style={{...S.btn,...S.btnPrimary}} disabled={saving||!sid||!pw} onClick={create}>
        {saving?'Creating...':'Create Factory'}
      </button>
    </div>
  );
}

function TrainingPanel({ creds }) {
  const [stats,setStats]=useState(null);
  const [cases,setCases]=useState([]);
  useEffect(()=>{
    api('/api/training/stats',creds).then(setStats).catch(()=>{});
    api('/api/training/hard-cases',creds).then(d=>setCases(d.cases||[])).catch(()=>{});
  },[]);
  async function review(id,action) {
    await api('/api/training/review',{method:'POST',...creds,body:{case_id:id,action}});
    setCases(c=>c.filter(x=>x._id!==id));
  }
  return (
    <div style={S.grid2}>
      <div style={S.card}>
        <h3 style={S.cardH}>Training Stats</h3>
        {stats && (
          <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
            <Stat label="Hard Cases" value={stats.hard_cases} />
            <Stat label="Pending Review" value={stats.hard_cases_pending} />
            <Stat label="Pseudo Labels" value={stats.pseudo_labels} />
          </div>
        )}
        <button style={{...S.btn,...S.btnPrimary}} onClick={()=>api('/api/training/export-yolo',{method:'POST',...creds}).then(d=>alert(JSON.stringify(d,null,2))).catch(e=>alert(e.message))}>
          Export YOLO Dataset
        </button>
      </div>
      <div style={S.card}>
        <h3 style={S.cardH}>Hard Case Review</h3>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {cases.map(c=>(
            <div key={c._id} style={S.caseRow}>
              <div>
                <div style={{fontSize:12}}>{c.camera_id} · conf {(c.confidence*100).toFixed(0)}%</div>
                <div style={{fontSize:11,color:'#555'}}>{c.created_at?.slice(0,16)}</div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button style={{...S.btnSm,color:'#30d158'}} onClick={()=>review(c._id,'approve')}>✓</button>
                <button style={{...S.btnSm,color:'#ff453a'}} onClick={()=>review(c._id,'reject')}>✕</button>
              </div>
            </div>
          ))}
          {cases.length===0 && <div style={S.dim}>No pending hard cases.</div>}
        </div>
      </div>
    </div>
  );
}

function Stat({label,value}) {
  return <div style={{textAlign:'center'}}><div style={{fontSize:28,fontWeight:700,color:'#0a84ff'}}>{value}</div><div style={{fontSize:12,color:'#555'}}>{label}</div></div>;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  shell:   {display:'flex',height:'100vh',background:'#0a0a0f',color:'#e0e0f0',fontFamily:'Inter,sans-serif'},
  sidebar: {width:220,background:'#111118',borderRight:'1px solid #1e1e2e',display:'flex',flexDirection:'column',flexShrink:0},
  brand:   {padding:'28px 20px 16px',borderBottom:'1px solid #1e1e2e'},
  logo:    {fontSize:24,fontWeight:800,letterSpacing:-1,color:'#f0f0f5'},
  logoSub: {fontSize:11,color:'#f5a623',letterSpacing:2,marginLeft:4,fontWeight:700},
  nav:     {padding:'12px 10px',display:'flex',flexDirection:'column',gap:2},
  navBtn:  {display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,color:'#666',fontSize:13,fontWeight:500,textAlign:'left',cursor:'pointer',border:'none',background:'none'},
  navBtnA: {background:'rgba(255,255,255,0.06)',color:'#f0f0f5'},
  navIc:   {fontSize:16,width:20,textAlign:'center'},
  factoryList:{padding:'16px 10px',flex:1,borderTop:'1px solid #1e1e2e',overflowY:'auto'},
  factoryListHd:{fontSize:10,fontWeight:700,color:'#444',letterSpacing:1.5,textTransform:'uppercase',marginBottom:8,paddingLeft:8},
  factoryBtn:  {width:'100%',padding:'8px 12px',borderRadius:8,color:'#888',fontSize:12,textAlign:'left',cursor:'pointer',border:'none',background:'none'},
  factoryBtnA: {background:'rgba(10,132,255,0.15)',color:'#0a84ff'},
  main:    {flex:1,display:'flex',flexDirection:'column',overflow:'hidden'},
  topbar:  {padding:'20px 32px',borderBottom:'1px solid #1e1e2e',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0},
  topTitle:{fontSize:22,fontWeight:700,letterSpacing:-0.5},
  topMsg:  {fontSize:12,color:'#555',marginTop:2},
  authRow: {display:'flex',gap:8},
  content: {flex:1,overflowY:'auto',padding:'24px 32px'},
  grid2:   {display:'grid',gridTemplateColumns:'1fr 1fr',gap:20},
  card:    {background:'#111118',border:'1px solid #1e1e2e',borderRadius:16,padding:24},
  cardH:   {fontSize:15,fontWeight:700,marginBottom:12,color:'#f0f0f5'},
  hint:    {fontSize:12,color:'#555',marginBottom:12},
  ta:      {width:'100%',height:200,background:'#0a0a0f',border:'1px solid #1e1e2e',borderRadius:8,padding:12,color:'#ccc',fontSize:11,fontFamily:'monospace',resize:'vertical'},
  inp:     {width:'100%',padding:'9px 12px',background:'#0d0d14',border:'1px solid #1e1e2e',borderRadius:8,color:'#e0e0f0',fontSize:13,outline:'none',boxSizing:'border-box'},
  btn:     {padding:'9px 16px',borderRadius:8,background:'rgba(255,255,255,0.06)',color:'#ccc',fontSize:13,cursor:'pointer',border:'1px solid #1e1e2e',fontFamily:'Inter,sans-serif'},
  btnPrimary:{background:'#0a84ff',color:'#fff',border:'none'},
  btnSm:   {padding:'5px 10px',borderRadius:6,background:'rgba(255,255,255,0.05)',color:'#888',fontSize:12,cursor:'pointer',border:'1px solid #1e1e2e',fontFamily:'Inter,sans-serif'},
  chip:    {padding:'4px 12px',borderRadius:20,background:'rgba(255,255,255,0.05)',color:'#888',fontSize:12,cursor:'pointer',border:'1px solid #1e1e2e',fontFamily:'Inter,sans-serif'},
  chipA:   {background:'rgba(10,132,255,0.2)',color:'#0a84ff',borderColor:'#0a84ff'},
  dim:     {color:'#444',fontSize:13,textAlign:'center',padding:'20px 0'},
  factoryRow:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px',background:'#0d0d14',borderRadius:10,border:'1px solid #1a1a28'},
  camRow:  {display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'#0d0d14',borderRadius:8,border:'1px solid #1a1a28'},
  camDot:  {width:10,height:10,borderRadius:'50%',flexShrink:0},
  pinDraft:{background:'rgba(10,132,255,0.08)',border:'1px solid rgba(10,132,255,0.2)',borderRadius:10,padding:12,marginBottom:12,display:'flex',flexDirection:'column',gap:8},
  caseRow: {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:'#0d0d14',borderRadius:8,border:'1px solid #1a1a28'},
};
