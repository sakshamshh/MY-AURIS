/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  motion, 
  AnimatePresence
} from 'motion/react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Settings, 
  LogOut, 
  Hexagon, 
  Users, 
  Video, 
  Radar, 
  Flame, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  Camera, 
  Layers, 
  Move, 
  RotateCw, 
  Maximize2, 
  FileUp, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  Lock, 
  User, 
  FileText,
  RefreshCw,
  Eye,
  ChevronRight,
  Database,
  AlertTriangle,
  Globe,
  LayoutGrid
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

// --- CONFIGURATION ---
const IS_DEV = window.location.hostname === 'localhost';
const API_BASE = IS_DEV ? 'http://localhost:3000/api-proxy' : '/api-proxy';
const ADMIN_KEY = 'dcd62cb40e5fa0870d73c79fbd521d05';

// --- TYPES ---
type Tab = 'mission' | 'dashboard' | 'mapping' | 'calibration' | 'report' | 'training' | 'management';

interface Store {
  store_id: string;
  store_name: string;
  status: 'online' | 'offline';
  cameras_count: number;
  last_blob: string;
  calibrated: boolean;
  plan: 'retail' | 'factory';
}

interface Track {
  track_id: string;
  x_meters: number;
  y_meters: number;
  floor: string;
  camera_id: string;
  last_seen: string;
  warning?: boolean;
}

// --- COMPONENTS ---

// 1. UI PRIMITIVES
const GlassCard = ({ children, className = '', glow = false, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`glass rounded-2xl relative overflow-hidden backdrop-blur-xl border border-auris-border bg-auris-card ${glow ? 'shadow-[0_0_20px_rgba(0,255,255,0.1)]' : ''} ${onClick ? 'cursor-pointer hover:bg-white/[0.04] transition-colors' : ''} ${className}`}
  >
    <div className="scanline" />
    {children}
  </div>
);

const MetricCard = ({ label, value, unit, trend, icon, cyan = false }: any) => (
  <GlassCard className="p-4 min-w-[160px]">
    <div className="flex items-center gap-2 mb-2">
      {icon || <TrendingUp className={`w-3 h-3 ${cyan ? 'text-auris-cyan' : 'text-white/30'}`} />}
      <span className="text-[9px] uppercase tracking-widest text-white/40">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-display font-light ${cyan ? 'text-auris-cyan' : 'text-white'}`}>{value}</span>
      <span className="text-[9px] font-mono opacity-40">{unit}</span>
    </div>
    {trend && (
      <div className={`mt-1 text-[9px] font-mono ${trend.startsWith('+') ? 'text-auris-cyan' : 'text-auris-orange'}`}>
        {trend} SINCE LAST EPOCH
      </div>
    )}
  </GlassCard>
);

// 2. TAB: MISSION CONTROL
const MissionControlTab = ({ onSelectStore }: { onSelectStore: (id: string) => void }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({ tracks: 142, cameras: 84, alerts: 3 });

  useEffect(() => {
    // Polling global state
    const fetchStores = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/stores`);
        const data = await res.json();
        if (Array.isArray(data)) setStores(data);
        else setStores([
          { store_id: 'S001', store_name: 'Factory North-West', status: 'online', cameras_count: 8, last_blob: '2s ago', calibrated: true, plan: 'factory' },
          { store_id: 'S002', store_name: 'Retail Plaza X', status: 'online', cameras_count: 14, last_blob: '4h ago', calibrated: false, plan: 'retail' },
          { store_id: 'S003', store_name: 'Logistics Hub B', status: 'online', cameras_count: 22, last_blob: 'now', calibrated: true, plan: 'factory' },
          { store_id: 'S004', store_name: 'Downtown Flagship', status: 'offline', cameras_count: 6, last_blob: '1d ago', calibrated: true, plan: 'retail' },
        ]);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };
    fetchStores();
    const interval = setInterval(fetchStores, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.4em] font-mono text-auris-cyan">AURIS GLOBAL OVERWATCH</h2>
          <h1 className="text-4xl font-display font-light mt-2 tracking-tight uppercase">Mission Control</h1>
        </div>
        <div className="flex gap-6">
          <MetricCard label="Total Live Presence" value={globalStats.tracks} unit="PEOPLE" icon={<Users className="w-3 h-3 text-auris-cyan" />} cyan />
          <MetricCard label="Active Nodes" value={globalStats.cameras} unit="DEVICES" icon={<Camera className="w-3 h-3" />} />
          <MetricCard label="System Health" value="OPTIMAL" unit="" trend="NOMINAL" icon={<Activity className="w-3 h-3" />} />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {stores.map(store => (
          <GlassCard 
            key={store.store_id} 
            className="p-6 group relative"
            glow={store.status === 'online'}
            onClick={() => onSelectStore(store.store_id)}
          >
            <div className="flex justify-between items-start mb-6">
               <div className={`p-3 rounded-xl border ${store.status === 'online' ? 'bg-auris-cyan/10 border-auris-cyan/30 text-auris-cyan' : 'bg-white/5 border-white/10 text-white/20'}`}>
                 {store.plan === 'factory' ? <LayoutGrid className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
               </div>
               <div className="flex flex-col items-end">
                  <div className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded ${store.status === 'online' ? 'bg-auris-cyan text-black' : 'bg-white/10 text-white/40'}`}>
                    {store.status.toUpperCase()}
                  </div>
                  <div className="text-[9px] font-mono text-white/20 mt-1 uppercase">{store.store_id}</div>
               </div>
            </div>

            <h3 className="text-lg font-display mb-2 group-hover:text-auris-cyan transition-colors">{store.store_name}</h3>
            
            <div className="space-y-3 mt-6">
               <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-white/30">LATEST TELEMETRY</span>
                  <span className="text-white/60">{store.last_blob}</span>
               </div>
               <div className="w-full h-px bg-white/5" />
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Live Tracks</div>
                    <div className="text-xl font-display text-white/90">
                      {store.status === 'online' ? Math.floor(Math.random() * 40) : 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] text-white/20 uppercase tracking-widest mb-1">Nodes</div>
                    <div className="text-xl font-display text-white/90">{store.cameras_count}</div>
                  </div>
               </div>
            </div>

            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
               <ChevronRight className="w-5 h-5 text-auris-cyan" />
            </div>

            {store.status === 'online' && (
              <div className="mt-6 h-12 relative rounded-lg border border-white/5 overflow-hidden bg-black/40">
                 {/* Mini Map Placeholder pulse */}
                 <div className="absolute inset-0 opacity-20">
                    <svg width="100%" height="100%" className="text-auris-cyan">
                       <path d="M0 20 Q 50 10 100 40 T 200 20" fill="none" stroke="currentColor" strokeWidth="1" />
                       <circle cx="40" cy="15" r="2" fill="currentColor" />
                       <circle cx="120" cy="25" r="2" fill="currentColor" />
                    </svg>
                 </div>
                 <div className="absolute inset-x-0 bottom-0 py-1 bg-auris-cyan/10 text-[7px] text-center uppercase tracking-[0.3em] text-auris-cyan font-bold">
                    Real-time Link Established
                 </div>
              </div>
            )}
          </GlassCard>
        ))}

        <div className="flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl min-h-[300px] hover:border-auris-cyan/20 transition-all cursor-pointer group">
           <div className="text-center">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:border-auris-cyan/40 group-hover:text-auris-cyan transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-white/20">Add Client Node</p>
           </div>
        </div>
      </div>
    </div>
  );
};

// 3. TAB: DASHBOARD (GTA MINIMAP)
const DashboardTab = ({ storeId }: { storeId: string }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [viewMode, setViewMode] = useState<'live' | 'thermal'>('live');
  const [activeFloor, setActiveFloor] = useState('floor_0');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/spatial/live?floor_id=${activeFloor}`, {
          headers: { 'X-Store-ID': storeId }
        });
        const data = await res.json();
        if (Array.isArray(data)) setTracks(data);
        else throw new Error("Invalid format");
      } catch (e) {
        // Fallback for demo
        setTracks([
          { track_id: '1024', x_meters: 5 + Math.random(), y_meters: 4 + Math.random(), floor: 'floor_0', camera_id: 'C01', last_seen: 'now' },
          { track_id: '0982', x_meters: 15 + Math.random(), y_meters: 8 + Math.random(), floor: 'floor_0', camera_id: 'C02', last_seen: 'now' },
          { track_id: '1105', x_meters: 10 + Math.random(), y_meters: 12 + Math.random(), floor: 'floor_0', camera_id: 'C03', last_seen: 'now', warning: true },
        ]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeFloor, storeId]);

  return (
    <div className="flex h-full animate-in fade-in duration-700">
      {/* Left: Telemetry */}
      <aside className="w-80 border-r border-white/5 flex flex-col bg-black/20 backdrop-blur-md">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-mono text-auris-cyan mb-6 flex items-center gap-2">
            <Activity className="w-3 h-3" /> System Telemetry
          </h2>
          <div className="grid grid-cols-2 gap-3">
             <div className="p-3 glass rounded-lg bg-auris-cyan/5 border-auris-cyan/20">
                <div className="text-[10px] text-white/40 uppercase mb-1">Live Tracks</div>
                <div className="text-xl font-display text-auris-cyan">{tracks.length}</div>
             </div>
             <div className="p-3 glass rounded-lg bg-auris-purple/5 border-auris-purple/20">
                <div className="text-[10px] text-white/40 uppercase mb-1">Status</div>
                <div className="text-xs font-mono text-auris-purple">NOMINAL</div>
             </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {tracks.map(t => (
            <div key={t.track_id} className={`p-3 glass rounded-lg border-white/5 hover:border-auris-cyan/30 transition-colors ${t.warning ? 'bg-auris-orange/5 border-auris-orange/20' : ''}`}>
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className={t.warning ? 'text-auris-orange' : 'text-auris-cyan'}>TRACK #{t.track_id}</span>
                <span className="opacity-30">{t.last_seen}</span>
              </div>
              <div className="text-[11px] text-white/70">Position: {t.x_meters.toFixed(2)}m, {t.y_meters.toFixed(2)}m</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Center: GTA Map */}
      <main className="flex-1 relative bg-[radial-gradient(circle_at_center,_#1a1b1e_0%,_#0a0a0a_100%)]">
        {/* Floor Switcher */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 p-1 glass rounded-full">
          {['Floor 0', 'Floor 1', 'Roof'].map(f => (
            <button 
              key={f}
              onClick={() => setActiveFloor(f.toLowerCase().replace(' ', '_'))}
              className={`px-6 py-2 rounded-full text-[10px] uppercase font-display tracking-widest transition-all ${activeFloor === f.toLowerCase().replace(' ', '_') ? 'bg-auris-cyan text-black' : 'text-white/40 hover:text-white/60'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Mode Toggle */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex p-1 glass rounded-full">
            <button onClick={() => setViewMode('live')} className={`px-4 py-2 rounded-full text-[9px] uppercase tracking-widest transition-all ${viewMode === 'live' ? 'bg-auris-cyan text-black' : 'text-white/40'}`}>LIVE MAP</button>
            <button onClick={() => setViewMode('thermal')} className={`px-4 py-2 rounded-full text-[9px] uppercase tracking-widest transition-all ${viewMode === 'thermal' ? 'bg-auris-purple text-white' : 'text-white/40'}`}>THERMAL</button>
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative w-full h-full glass rounded-3xl overflow-hidden border-white/10">
            {/* Radar Sweep */}
            {viewMode === 'live' && (
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 pointer-events-none opacity-10 z-10"
                 style={{ background: 'conic-gradient(from 0deg at 50% 50%, white, transparent 30%)' }}
               />
            )}

            <svg viewBox="0 0 1000 800" className={`w-full h-full transition-all duration-1000 ${viewMode === 'thermal' ? 'blur-lg brightness-110' : ''}`}>
              {/* Floor Plan Render */}
              <rect x="100" y="100" width="800" height="600" fill="hsl(240,10%,6%)" stroke="rgba(0,255,255,0.2)" strokeWidth="2" />
              <path d="M100 400 L400 400 M600 100 L600 500" stroke="white" strokeWidth="2" opacity="0.3" />
              
              {/* Camera Cones */}
              <g className="text-auris-purple/20">
                <path d="M100 100 L250 100 A 150 150 0 0 1 100 250 Z" fill="currentColor" />
                <path d="M900 700 L750 700 A 150 150 0 0 1 900 550 Z" fill="currentColor" />
              </g>

              {/* Tracks */}
              {tracks.map(t => (
                <g key={t.track_id} transform={`translate(${t.x_meters * 40}, ${t.y_meters * 40})`}>
                   <motion.circle 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      r="20" fill={t.warning ? "hsl(30, 100%, 50%)" : "hsl(180, 100%, 50%)"} 
                   />
                   <circle r="6" fill={t.warning ? "hsl(30, 100%, 50%)" : "hsl(180, 100%, 50%)"} className={`shadow-[0_0_15px_${t.warning ? 'hsl(30,100%,50%)' : 'hsl(180,100%,50%)'}]`} />
                   <text y="-12" textAnchor="middle" fill="white" fontSize="9" className="font-mono uppercase opacity-50">#{t.track_id}</text>
                </g>
              ))}

              {/* Thermal Heatmap Overlay */}
              {viewMode === 'thermal' && (
                <g opacity="0.6">
                   <radialGradient id="h1" cx="300" cy="400" r="200">
                     <stop offset="0%" stopColor="hsl(30, 100%, 50%)" />
                     <stop offset="100%" stopColor="transparent" />
                   </radialGradient>
                   <circle cx="300" cy="400" r="200" fill="url(#h1)" />
                </g>
              )}
            </svg>
          </div>
        </div>
      </main>

      {/* Right: Metrics */}
      <aside className="w-80 border-l border-white/5 p-6 flex flex-col gap-6 bg-black/20 backdrop-blur-md">
         <h2 className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/40 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-auris-cyan" /> Perspective Analysis
         </h2>
         <MetricCard label="Current Occupancy" value={tracks.length} unit="PERSONS" trend="+12%" cyan />
         <MetricCard label="Avg Dwell Time" value="14.5" unit="MINUTES" trend="-2%" />
         <MetricCard label="Security Confidence" value="98.2" unit="PERCENT" />
         
         <div className="mt-auto glass p-4 rounded-xl border-orange-500/20 bg-orange-500/5">
            <h3 className="text-[10px] text-orange-500 font-bold uppercase flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3 h-3" /> Recent Alerts
            </h3>
            <div className="space-y-2">
              <div className="text-[11px] text-white/60">14:22 - Camera offline in Sector G</div>
              <div className="text-[11px] text-white/60">12:10 - Anomalous dwell in Lobby</div>
            </div>
         </div>
      </aside>
    </div>
  );
};

// 3. TAB: MAPPING
const MappingTab = () => {
  const [layers, setLayers] = useState<any[]>([]);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setLayers(prev => [...prev, {
          id: Date.now(),
          name: file.name,
          type: file.type,
          data: reader.result,
          x: 0, y: 0, scale: 1, rotate: 0
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop } as any);

  const updateLayer = (id: number, delta: any) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...delta } : l));
  };

  return (
    <div className="flex h-full gap-6 p-6 overflow-hidden">
      <aside className="w-80 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar">
        <GlassCard className="p-6">
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 transition-all text-center cursor-pointer ${isDragActive ? 'border-auris-cyan bg-auris-cyan/5' : 'border-white/10 hover:border-auris-cyan/30'}`}>
            <input {...getInputProps()} />
            <FileUp className="w-8 h-8 text-auris-cyan mx-auto mb-4" />
            <p className="text-[10px] uppercase tracking-widest text-white/40">Upload LiDAR / SVG / DXF</p>
          </div>
        </GlassCard>

        {layers.map((layer, i) => (
          <GlassCard key={layer.id} className={`p-4 cursor-pointer transition-all ${activeLayer === i ? 'ring-1 ring-auris-cyan' : ''}`} onClick={() => setActiveLayer(i)}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-mono truncate max-w-[150px]">{layer.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setLayers(prev => prev.filter(l => l.id !== layer.id)) }} className="text-white/20 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-4">
               <TransformSlider label="Offset X" value={layer.x} min={-500} max={500} onChange={(v: number) => updateLayer(layer.id, { x: v })} />
               <TransformSlider label="Offset Y" value={layer.y} min={-500} max={500} onChange={(v: number) => updateLayer(layer.id, { y: v })} />
               <TransformSlider label="Scale" value={layer.scale} min={0.1} max={5} step={0.01} onChange={(v: number) => updateLayer(layer.id, { scale: v })} />
               <TransformSlider label="Rotate" value={layer.rotate} min={0} max={360} onChange={(v: number) => updateLayer(layer.id, { rotate: v })} />
            </div>
          </GlassCard>
        ))}
        
        <button className="relative overflow-hidden px-6 py-4 rounded font-display font-medium bg-gradient-to-r from-blue-600 to-auris-purple uppercase tracking-[0.2em] text-[10px] mt-auto">
           Commit Stitched Map
        </button>
      </aside>

      <main className="flex-1 glass rounded-3xl relative overflow-hidden bg-[hsl(240,10%,3%)]">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="flex items-center justify-center h-full">
          {layers.length === 0 ? (
            <div className="text-center text-white/20">
              <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-xs uppercase tracking-widest">No mapping layers active</p>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
               {layers.map((layer, i) => (
                 <motion.div 
                   key={layer.id}
                   animate={{ x: layer.x, y: layer.y, scale: layer.scale, rotate: layer.rotate }}
                   className={`absolute w-3/4 h-3/4 flex items-center justify-center pointer-events-none ${activeLayer === i ? 'opacity-100' : 'opacity-30'}`}
                 >
                   {typeof layer.data === 'string' && layer.data.startsWith('data:image') ? (
                     <img src={layer.data} className="max-w-full max-h-full border border-auris-cyan/30 shadow-[0_0_20px_rgba(0,255,255,0.1)]" draggable={false} />
                   ) : (
                     <div className="w-full h-full glass border-auris-cyan/40 p-12 flex items-center justify-center font-mono text-[10px]">
                        [LEGACY DATA RENDER]
                     </div>
                   )}
                 </motion.div>
               ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function TransformSlider({ label, value, ...props }: any) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] uppercase tracking-tighter text-white/40 font-mono">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input type="range" className="w-full h-1 bg-white/10 rounded-full appearance-none accent-auris-cyan cursor-pointer" value={value} onChange={e => props.onChange(Number(e.target.value))} {...props} />
    </div>
  );
}

// 4. TAB: CALIBRATION
const CalibrationTab = () => {
    const [points, setPoints] = useState<any[]>([]);
    const [imgUrl] = useState('https://picsum.photos/seed/calibrate/1200/800');
    
    const handleCanvasClick = (e: React.MouseEvent) => {
      if (points.length >= 4) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      setPoints([...points, { px, py, xm: 0, ym: 0 }]);
    };

    return (
        <div className="flex h-full p-6 gap-6">
            <aside className="w-96 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
                <GlassCard className="p-6">
                    <h3 className="text-xs uppercase tracking-widest text-auris-cyan mb-6">Homography Solver</h3>
                    <p className="text-[10px] text-white/40 mb-6 italic">Click 4 points on the floor to establish real-world scale.</p>
                    
                    <div className="space-y-4">
                        {points.map((p, i) => (
                            <div key={i} className="p-3 glass rounded-lg border-white/5 grid grid-cols-2 gap-3">
                                <div className="col-span-2 text-[9px] font-mono text-auris-cyan uppercase">Reference Pt #{i+1}</div>
                                <div className="space-y-1">
                                    <label className="text-[8px] uppercase opacity-40">World X (m)</label>
                                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs" 
                                           onChange={e => setPoints(pts => pts.map((pt, idx) => idx === i ? {...pt, xm: Number(e.target.value)} : pt))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] uppercase opacity-40">World Y (m)</label>
                                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs" 
                                           onChange={e => setPoints(pts => pts.map((pt, idx) => idx === i ? {...pt, ym: Number(e.target.value)} : pt))} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button disabled={points.length < 4} className="relative overflow-hidden px-6 py-4 rounded font-display bg-gradient-to-r from-blue-600 to-auris-purple uppercase tracking-[0.2em] text-[10px] mt-8 disabled:opacity-30">
                        Compute Homography 3x3
                    </button>
                    <button onClick={() => setPoints([])} className="w-full text-[9px] uppercase tracking-widest text-white/20 mt-4 hover:text-white/40">Clear Calibration</button>
                </GlassCard>

                <div className="space-y-2">
                    <h4 className="text-[9px] uppercase tracking-widest text-white/40 ml-2">Camera Registry</h4>
                    <GlassCard className="p-4 space-y-2">
                        {[1,2,3].map(id => (
                            <div key={id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <Camera className="w-4 h-4 text-white/20" />
                                    <span className="text-xs font-mono">CAM_{id.toString().padStart(3,'0')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     <div className={`w-1.5 h-1.5 rounded-full ${id === 1 ? 'bg-auris-cyan' : 'bg-white/10'}`} />
                                     <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-auris-cyan" />
                                </div>
                            </div>
                        ))}
                    </GlassCard>
                </div>
            </aside>

            <main className="flex-1 relative glass rounded-3xl overflow-hidden cursor-crosshair group shadow-2xl" onClick={handleCanvasClick}>
                <img src={imgUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" draggable={false} referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                
                {points.map((p, i) => (
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        key={i} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none" 
                        style={{ left: `${p.px}%`, top: `${p.py}%` }}
                    >
                        <div className="w-4 h-4 rounded-full bg-auris-cyan shadow-[0_0_15px_hsl(180,100%,50%)] border border-white" />
                        <div className="mt-2 text-[9px] font-mono bg-black/80 px-2 py-1 rounded text-auris-cyan border border-auris-cyan/30">
                            COORD_{i+1}: {p.xm}m, {p.ym}m
                        </div>
                    </motion.div>
                ))}

                <div className="absolute bottom-6 left-6 flex items-center gap-4">
                    <div className="glass px-4 py-2 rounded-full text-[10px] font-mono text-white/50 border-white/5">
                        RESOL: 3840x2160
                    </div>
                </div>
            </main>
        </div>
    );
};

// 5. TAB: TRAINING
const TrainingTab = () => {
  const [cases] = useState<any[]>([
    { id: 1, img: 'https://picsum.photos/seed/case1/400/400', label: 'PERSON', conf: '0.68' },
    { id: 2, img: 'https://picsum.photos/seed/case2/400/400', label: 'FORKLIFT', conf: '0.42' },
    { id: 3, img: 'https://picsum.photos/seed/case3/400/400', label: 'PALLET', conf: '0.55' },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const resolve = () => {
    if (currentIndex < cases.length - 1) setCurrentIndex(v => v + 1);
  };

  const currentCase = cases[currentIndex];

  return (
    <div className="h-full p-12 flex flex-col items-center max-w-4xl mx-auto">
       <header className="w-full flex justify-between items-center mb-12">
          <div className="flex gap-12">
             <div className="space-y-1">
                <div className="text-[10px] uppercase text-white/40 tracking-widest">Hard Cases</div>
                <div className="text-2xl font-display text-white">1,832</div>
             </div>
             <div className="space-y-1">
                <div className="text-[10px] uppercase text-auris-purple tracking-widest">Model Version</div>
                <div className="text-2xl font-display text-auris-purple">AURIS-V4.2</div>
             </div>
          </div>
          <button className="glass px-6 py-3 rounded-xl border-auris-cyan/30 text-auris-cyan text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 hover:bg-auris-cyan/10 transition-all">
             <Database className="w-4 h-4" /> Export YOLO Dataset
          </button>
       </header>

       <div className="w-full flex-1 flex flex-col items-center gap-8">
          <div className="relative w-full max-w-2xl aspect-square glass rounded-3xl overflow-hidden border-white/10 group">
             <AnimatePresence mode="wait">
                <motion.img 
                  key={currentCase.id}
                  initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                  src={currentCase.img} className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
             </AnimatePresence>
             <div className="absolute top-6 left-6 glass px-4 py-2 rounded-lg border-auris-cyan/30 text-[10px] font-mono text-auris-cyan">
                PREDICTION: {currentCase.label} | {(Number(currentCase.conf) * 100).toFixed(1)}%
             </div>
          </div>

          <div className="flex gap-8 w-full max-w-2xl">
              <button onClick={() => resolve()} className="flex-1 py-6 glass rounded-2xl border-red-500/30 text-red-500 uppercase tracking-[0.3em] font-display text-xs hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 group">
                 <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> Reject Label
              </button>
              <button onClick={() => resolve()} className="flex-1 py-6 glass rounded-2xl border-auris-cyan/30 text-auris-cyan uppercase tracking-[0.3em] font-display text-xs hover:bg-auris-cyan/10 transition-all flex items-center justify-center gap-2 group">
                 <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" /> Approve Label
              </button>
          </div>
          
          <div className="w-full max-w-2xl h-1 bg-white/5 rounded-full overflow-hidden">
             <motion.div animate={{ width: `${(currentIndex / cases.length) * 100}%` }} className="h-full bg-auris-cyan" />
          </div>
          <div className="text-[10px] font-mono text-white/30 tracking-widest">{currentIndex + 1} / {cases.length} REVIEWED</div>
       </div>
    </div>
  );
};

// 6. TAB: AI REPORT
const ReportTab = () => {
  const [loading, setLoading] = useState(false);
  const reportData = {
    summary: "Store traffic increased by 14% compared to the previous week, driven primarily by the high-occupancy window between 17:00 and 19:00. Factory Floor 2 showed 3 anomalies in person-machinery distance protocols.",
    peakHours: "17:30 - 18:45 (Main Lobby)",
    zoneInsights: [
      { name: "Zone A (Machine Shop)", stat: "98% Efficiency", color: "cyan" },
      { name: "Zone B (Storage)", stat: "24% Crowding Peak", color: "purple" },
      { name: "Zone C (Loading)", stat: "4.2m Avg Stay", color: "orange" },
    ]
  };

  const handlePrint = () => window.print();

  return (
    <div className="h-full p-12 max-w-5xl mx-auto overflow-y-auto custom-scrollbar print:p-0">
       <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-[10px] uppercase tracking-[0.4em] font-mono text-auris-cyan">AURIS EXECUTIVE SYNOPSIS</h1>
            <h2 className="text-3xl font-display font-light mt-2 tracking-tight uppercase">Daily Spatial Intelligence</h2>
          </div>
          <div className="flex gap-3 print:hidden">
            <button className="glass p-3 rounded-xl border-white/5 hover:bg-white/5" onClick={() => setLoading(true)}>
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="relative overflow-hidden px-6 py-3 rounded font-display bg-gradient-to-r from-blue-600 to-auris-purple uppercase tracking-widest text-[10px]" onClick={handlePrint}>
               Export Intelligence PDF
            </button>
          </div>
       </header>

       <div className="grid grid-cols-3 gap-6">
          <GlassCard className="col-span-2 p-8" glow>
             <h3 className="text-xs font-display font-bold uppercase tracking-widest text-auris-cyan mb-6 flex items-center gap-2">
               <FileText className="w-4 h-4" /> Tactical Summary
             </h3>
             <p className="text-lg leading-relaxed text-white/80 font-display font-light border-l-2 border-auris-cyan pl-8">
                {reportData.summary}
             </p>
             <div className="mt-12 pt-8 border-t border-white/5 flex gap-12">
                <div className="space-y-1">
                  <div className="text-[9px] uppercase text-white/30">Peak Correlation</div>
                  <div className="text-xl font-mono text-auris-cyan">{reportData.peakHours}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] uppercase text-white/30">Generated For</div>
                  <div className="text-xl font-mono">MAY 17, 2026</div>
                </div>
             </div>
          </GlassCard>

          <div className="space-y-6">
             {reportData.zoneInsights.map(z => (
               <GlassCard key={z.name} className="p-6">
                  <div className="text-[9px] uppercase tracking-widest text-white/30 mb-2">{z.name}</div>
                  <div className={`text-xl font-display ${z.color === 'cyan' ? 'text-auris-cyan' : z.color === 'purple' ? 'text-auris-purple' : 'text-auris-orange'}`}>
                    {z.stat}
                  </div>
               </GlassCard>
             ))}
          </div>
       </div>

       <div className="mt-12 grid grid-cols-2 gap-6">
          <GlassCard className="p-8">
             <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-6 font-bold">Spatial Density Heatmap (Daily Avg)</h3>
             <div className="aspect-video glass rounded-xl overflow-hidden relative">
                <img src="https://picsum.photos/seed/heatmap/800/450" className="w-full h-full object-cover blur-sm opacity-50" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-red-900/40 to-yellow-900/40 mix-blend-overlay" />
             </div>
          </GlassCard>
          <GlassCard className="p-8">
             <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-6 font-bold">Action Items</h3>
             <div className="space-y-4">
                <p className="text-[11px] text-white/60 flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-auris-cyan mt-1.5" />
                  Calibrate Lobby Camera 4 - observed drift in homography matrix.
                </p>
                <p className="text-[11px] text-white/60 flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-auris-cyan mt-1.5" />
                  Review Zone B person-count threshold; proximity alerts triggered 4x.
                </p>
             </div>
          </GlassCard>
       </div>
    </div>
  );
};

// 7. TAB: MANAGEMENT
const ManagementTab = () => {
    const [stores] = useState<Store[]>([
        { store_id: 'S001', store_name: 'Factory North-West', status: 'online', cameras_count: 8, last_blob: '2s ago', calibrated: true, plan: 'factory' },
        { store_id: 'S002', store_name: 'Retail Plaza X', status: 'offline', cameras_count: 14, last_blob: '4h ago', calibrated: false, plan: 'retail' },
    ]);

    return (
        <div className="h-full p-12 max-w-6xl mx-auto overflow-y-auto custom-scrollbar">
            <header className="flex justify-between items-center mb-12">
                <div>
                   <h2 className="text-[10px] uppercase tracking-[0.4em] font-mono text-auris-cyan">ADMINISTRATION ENGINE</h2>
                   <h1 className="text-3xl font-display font-light mt-2 uppercase tracking-tight">System Registry</h1>
                </div>
                <button className="relative overflow-hidden px-6 py-3 rounded font-display bg-gradient-to-r from-blue-600 to-auris-purple text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Provision New Environment
                </button>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {stores.map(s => (
                    <GlassCard key={s.store_id} className="p-6 flex items-center justify-between hover:bg-white/[0.03] transition-colors border-auris-border">
                        <div className="flex items-center gap-8">
                            <div className={`p-4 rounded-2xl ${s.status === 'online' ? 'bg-auris-cyan/10 text-auris-cyan border-auris-cyan/30' : 'bg-white/5 text-white/20 border-white/10'} border`}>
                                <Hexagon className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="text-[10px] font-mono text-white/40 uppercase mb-1">{s.store_id} • {s.plan.toUpperCase()}</div>
                                <h3 className="text-xl font-display font-medium">{s.store_name}</h3>
                                <div className="flex gap-4 mt-2">
                                    <span className="text-[9px] uppercase tracking-widest text-white/40 flex items-center gap-1.5"><Camera className="w-3 h-3" /> {s.cameras_count} Nodes</span>
                                    <span className={`text-[9px] uppercase tracking-widest flex items-center gap-1.5 ${s.calibrated ? 'text-auris-cyan' : 'text-orange-500'}`}>
                                        <ShieldCheck className="w-3 h-3" /> {s.calibrated ? 'Calibrated' : 'Sync Required'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="text-right">
                                <div className="text-[9px] uppercase text-white/30 mb-1">Status</div>
                                <div className={`text-xs font-mono font-bold ${s.status === 'online' ? 'text-auris-cyan' : 'text-white/20'}`}>
                                    {s.status === 'online' ? '● LINK STEADY' : '○ DISCONNECTED'}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-3 glass rounded-xl border-auris-border hover:border-auris-cyan/30 transition-all">
                                    <Eye className="w-4 h-4 text-white/40" />
                                </button>
                                <button className="p-3 glass rounded-xl border-auris-border hover:border-red-500/30 transition-all group">
                                    <Trash2 className="w-4 h-4 text-white/20 group-hover:text-red-500" />
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};

// --- MAIN LOGIN ---
const Login = ({ onLogin }: { onLogin: (s: string) => void }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-auris-bg">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="hsl(180, 100%, 50%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md p-10 glass rounded-3xl">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 4, repeat: Infinity }} className="absolute inset-x-0 inset-y-0 bg-auris-cyan rounded-full blur-2xl" />
            <div className="relative p-5 bg-black border border-auris-cyan/30 rounded-2xl">
              <Hexagon className="w-10 h-10 text-auris-cyan" />
            </div>
          </div>
          <h1 className="text-[10px] tracking-[0.6em] font-mono text-auris-cyan/50 uppercase">AURIS BY SKYM LABS</h1>
          <h2 className="text-2xl font-display font-medium mt-3 tracking-tight">AUTHORIZED ACCESS</h2>
        </div>

        <div className="space-y-6">
           <div className="space-y-1">
             <label className="text-[9px] uppercase tracking-widest text-white/40 ml-1">Personnel Identifier</label>
             <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input placeholder="SKM_NODE_01" className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-auris-cyan/50 transition-all font-mono" />
             </div>
           </div>
           <div className="space-y-1">
             <label className="text-[9px] uppercase tracking-widest text-white/40 ml-1">Quantum Encryption</label>
             <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-auris-cyan/50 transition-all" />
             </div>
           </div>
           <button onClick={() => onLogin('S001')} className="relative overflow-hidden px-6 py-5 rounded font-display bg-gradient-to-r from-blue-600 to-auris-purple w-full text-[11px] uppercase tracking-[0.3em] mt-2">
              Sync Intelligence Core
           </button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-3 text-[9px] font-mono text-white/20 uppercase tracking-widest">
           <div className="w-2 h-2 rounded-full bg-auris-cyan animate-pulse" />
           Security Protocol 85-B Active
        </div>
      </motion.div>
    </div>
  );
};

// --- CORE APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('mission');
  const [storeId, setStoreId] = useState<string | null>(null);

  const handleSelectStore = (id: string) => {
    setStoreId(id);
    setActiveTab('dashboard');
  };

  if (!storeId && activeTab !== 'mission') {
    // If not logged in and not in mission control (which effectively acts as store selector here if not provided), show login
    // BUT user said "This is the HQ portal", so Mission Control is likely the default for Admin.
    // If we have a storeId, we show that store's dashboard.
  }

  // If no storeId, we can either show Login or Mission Control. 
  // Let's stick to the user's flow: Login sets storeId.
  // BUT the user wants a "Mission Control" tab. 
  // I'll make Mission Control available to select stores.

  if (!storeId) return <Login onLogin={(id) => { setStoreId(id); setActiveTab('mission'); }} />;

  return (
    <div className="flex h-screen bg-auris-bg text-white overflow-hidden selection:bg-auris-cyan/30">
      {/* Sidebar Nav */}
      <nav className="w-20 border-r border-white/5 flex flex-col items-center py-8 bg-black/40 backdrop-blur-3xl z-40">
        <div className="p-3 bg-auris-cyan/10 rounded-2xl border border-auris-cyan/30 mb-12 shadow-[0_0_15px_rgba(0,255,255,0.15)] cursor-pointer">
          <Hexagon className="w-7 h-7 text-auris-cyan" />
        </div>

        <div className="flex flex-1 flex-col gap-6">
           <NavButton active={activeTab === 'mission'} onClick={() => setActiveTab('mission')} icon={<Globe />} label="Overwatch" />
           <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
           <NavButton active={activeTab === 'mapping'} onClick={() => setActiveTab('mapping')} icon={<Layers />} label="Mapping" />
           <NavButton active={activeTab === 'calibration'} onClick={() => setActiveTab('calibration')} icon={<RotateCw />} label="Calibration" />
           <NavButton active={activeTab === 'report'} onClick={() => setActiveTab('report')} icon={<FileText />} label="Intelligence" />
           <NavButton active={activeTab === 'training'} onClick={() => setActiveTab('training')} icon={<Cpu />} label="Training" />
           <NavButton active={activeTab === 'management'} onClick={() => setActiveTab('management')} icon={<Settings />} label="Registry" />
        </div>

        <div className="mt-auto flex flex-col gap-6">
           <NavButton active={false} onClick={() => setStoreId(null)} icon={<LogOut />} label="Logout" />
        </div>
      </nav>

      {/* Viewport */}
      <main className="flex-1 overflow-hidden relative font-sans">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {activeTab === 'mission' && <MissionControlTab onSelectStore={handleSelectStore} />}
            {activeTab === 'dashboard' && <DashboardTab storeId={storeId} />}
            {activeTab === 'mapping' && <MappingTab />}
            {activeTab === 'calibration' && <CalibrationTab />}
            {activeTab === 'report' && <ReportTab />}
            {activeTab === 'training' && <TrainingTab />}
            {activeTab === 'management' && <ManagementTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`group relative p-4 rounded-2xl transition-all duration-300 ${active ? 'bg-auris-cyan/10 text-auris-cyan border border-auris-cyan/20' : 'text-white/20 hover:text-white/60 hover:bg-white/5'}`}
    >
      {React.cloneElement(icon, { className: "w-5 h-5" })}
      <div className="absolute left-full ml-6 px-3 py-2 bg-auris-card backdrop-blur-xl border border-white/10 rounded-xl text-[10px] uppercase font-mono tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap shadow-2xl">
         {label}
      </div>
      {active && (
        <motion.div layoutId="nav-glow" className="absolute inset-0 bg-auris-cyan/15 blur-xl rounded-2xl -z-10" />
      )}
    </button>
  );
}
