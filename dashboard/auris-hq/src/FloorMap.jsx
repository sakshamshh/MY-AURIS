import React, { useState, useCallback } from 'react';

const CAM_COLORS = ['#0a84ff','#30d158','#ffd60a','#ff453a','#bf5af2','#ff9f0a','#64d2ff'];

export function FloorMap({ floorPlan, cameras = [], positions = [], heatCells = [], mode = 'view', onCameraPin }) {
  const [hoveredCam, setHoveredCam] = useState(null);
  const [pinMode, setPinMode] = useState(false);

  if (!floorPlan) {
    return (
      <div style={S.empty}>
        <span style={{fontSize:32}}>🏭</span>
        <p>No floor plan uploaded yet</p>
        <p style={{fontSize:12,color:'#555'}}>Upload a 2D room scan to get started</p>
      </div>
    );
  }

  const geo = floorPlan.geometry || {};
  const bounds = floorPlan.bounds_m || { width: 10, height: 10 };
  const W = bounds.width, H = bounds.height;

  function handleMapClick(e) {
    if (!pinMode || !onCameraPin) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x_m = ((e.clientX - rect.left) / rect.width) * W;
    const y_m = ((e.clientY - rect.top) / rect.height) * H;
    onCameraPin({ x_m: parseFloat(x_m.toFixed(2)), y_m: parseFloat(y_m.toFixed(2)) });
    setPinMode(false);
  }

  return (
    <div style={S.mapWrap}>
      {mode === 'edit' && (
        <div style={S.mapToolbar}>
          <button
            style={{...S.toolBtn, ...(pinMode ? S.toolBtnActive : {})}}
            onClick={() => setPinMode(p => !p)}
          >
            {pinMode ? '📍 Click map to place camera' : '+ Pin Camera'}
          </button>
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ ...S.svg, cursor: pinMode ? 'crosshair' : 'default' }}
        onClick={handleMapClick}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect width={W} height={H} fill="#0d0d14" />

        {/* Heatmap */}
        {heatCells.map((c, i) => (
          <circle key={`h${i}`}
            cx={(c.gx + 0.5) * (W / 10)} cy={(c.gy + 0.5) * (H / 10)}
            r={Math.max(W, H) * 0.06}
            fill={c.count > 80 ? '#ff453a' : c.count > 40 ? '#ffd60a' : '#0a84ff'}
            opacity={0.18}
          />
        ))}

        {/* Floor boundary */}
        {(geo.boundary || []).length >= 3 && (
          <polygon
            points={(geo.boundary || []).map(p => `${p.x_m},${p.y_m}`).join(' ')}
            fill="#16161f" stroke="#2a2a3a" strokeWidth="0.04"
          />
        )}

        {/* Obstacles */}
        {(geo.obstacles || []).map((poly, i) => (
          <polygon key={`obs${i}`}
            points={poly.map(p => `${p.x_m},${p.y_m}`).join(' ')}
            fill="rgba(255,69,58,0.1)" stroke="#ff453a" strokeWidth="0.03"
          />
        ))}

        {/* Walls */}
        {(geo.walls || []).map((w, i) => (
          <line key={`w${i}`}
            x1={w.start.x_m} y1={w.start.y_m} x2={w.end.x_m} y2={w.end.y_m}
            stroke="#e0e0f0" strokeWidth="0.07" strokeLinecap="round"
          />
        ))}

        {/* Openings / Doors */}
        {(geo.openings || []).map((o, i) => (
          <line key={`op${i}`}
            x1={o.start.x_m} y1={o.start.y_m} x2={o.end.x_m} y2={o.end.y_m}
            stroke="#0a84ff" strokeWidth="0.12" strokeLinecap="round"
          />
        ))}

        {/* Camera pins */}
        {cameras.map((cam, i) => {
          const col = CAM_COLORS[i % CAM_COLORS.length];
          const isHov = hoveredCam === cam.camera_id;
          const r = W * 0.025;
          const rad = (cam.heading_deg || 0) * Math.PI / 180;
          const fov = (cam.fov_deg || 80) * Math.PI / 180;
          const dist = W * 0.18;
          const l1x = cam.x_m + dist * Math.sin(rad - fov/2);
          const l1y = cam.y_m - dist * Math.cos(rad - fov/2);
          const l2x = cam.x_m + dist * Math.sin(rad + fov/2);
          const l2y = cam.y_m - dist * Math.cos(rad + fov/2);
          return (
            <g key={cam.camera_id}
              onMouseEnter={() => setHoveredCam(cam.camera_id)}
              onMouseLeave={() => setHoveredCam(null)}
              style={{cursor:'pointer'}}
            >
              {/* FOV cone */}
              <path
                d={`M ${cam.x_m},${cam.y_m} L ${l1x},${l1y} A ${dist},${dist} 0 0,1 ${l2x},${l2y} Z`}
                fill={col} opacity={isHov ? 0.2 : 0.08}
              />
              {/* Camera dot */}
              <circle cx={cam.x_m} cy={cam.y_m} r={r * 1.6} fill={col} opacity={0.15} />
              <circle cx={cam.x_m} cy={cam.y_m} r={r} fill={col} />
              {/* Label */}
              {isHov && (
                <text x={cam.x_m + r * 1.4} y={cam.y_m - r * 0.5}
                  fontSize={W * 0.028} fill="#fff" fontWeight="600"
                >
                  {cam.name || cam.camera_id}
                </text>
              )}
            </g>
          );
        })}

        {/* Live person dots */}
        {positions.map((p, i) => (
          <g key={p.track_id || i}>
            <circle cx={p.x_m} cy={p.y_m} r={W*0.025} fill="#30d158" opacity={0.2} />
            <circle cx={p.x_m} cy={p.y_m} r={W*0.012} fill="#30d158" />
          </g>
        ))}

        {/* Scale bar */}
        <line x1={W*0.04} y1={H*0.96} x2={W*0.14} y2={H*0.96} stroke="#555" strokeWidth="0.03" />
        <text x={W*0.04} y={H*0.94} fontSize={W*0.022} fill="#555">
          {(W * 0.1).toFixed(1)}m
        </text>
      </svg>

      {/* Camera legend */}
      {cameras.length > 0 && (
        <div style={S.legend}>
          {cameras.map((cam, i) => (
            <div key={cam.camera_id} style={S.legendItem}>
              <div style={{...S.legendDot, background: CAM_COLORS[i % CAM_COLORS.length]}} />
              <span>{cam.name || cam.camera_id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  mapWrap: { position:'relative', background:'#0d0d14', borderRadius:16, overflow:'hidden', flex:1 },
  svg: { width:'100%', height:'100%', display:'block' },
  empty: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:360, gap:8, color:'#555' },
  mapToolbar: { position:'absolute', top:12, left:12, zIndex:10, display:'flex', gap:8 },
  toolBtn: { padding:'6px 14px', borderRadius:8, background:'rgba(255,255,255,0.08)', color:'#ccc', fontSize:13, border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer' },
  toolBtnActive: { background:'rgba(10,132,255,0.25)', color:'#0a84ff', borderColor:'#0a84ff' },
  legend: { position:'absolute', bottom:12, right:12, display:'flex', flexWrap:'wrap', gap:6, justifyContent:'flex-end' },
  legendItem: { display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,0.5)', padding:'4px 8px', borderRadius:6, fontSize:11, color:'#ccc' },
  legendDot: { width:8, height:8, borderRadius:'50%' },
};
