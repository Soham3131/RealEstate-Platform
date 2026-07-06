import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Expand, Minimize, Compass, ExternalLink, Images, ChevronLeft, ChevronRight } from 'lucide-react';
import { BACKEND_URL } from '../../apiConfig';

const resolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_URL}${url}`;
  return url;
};

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Equirectangular panorama pool — CC0 Poly Haven interior HDRIs (tonemapped JPG)
const PH_JPG = (slug) => `https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/${slug}.jpg`;

const PANORAMAS = {
  residential: [
    { key: 'wooden_lounge', name: 'Wooden Lounge', url: PH_JPG('wooden_lounge') },
    { key: 'comfy_cafe', name: 'Living Room', url: PH_JPG('comfy_cafe') },
    { key: 'lythwood_lounge', name: 'Formal Lounge', url: PH_JPG('lythwood_lounge') },
    { key: 'brown_photostudio_06', name: 'Warm Suite', url: PH_JPG('brown_photostudio_06') },
    { key: 'brown_photostudio_03', name: 'Master Suite', url: PH_JPG('brown_photostudio_03') },
    { key: 'brown_photostudio_04', name: 'Bedroom', url: PH_JPG('brown_photostudio_04') },
    { key: 'brown_photostudio_05', name: 'Guest Room', url: PH_JPG('brown_photostudio_05') },
    { key: 'entrance_hall', name: 'Entrance Hall', url: PH_JPG('entrance_hall') },
    { key: 'old_hall', name: 'Foyer', url: PH_JPG('old_hall') },
    { key: 'christmas_photo_studio_01', name: 'Family Room', url: PH_JPG('christmas_photo_studio_01') },
    { key: 'christmas_photo_studio_02', name: 'Study', url: PH_JPG('christmas_photo_studio_02') },
    { key: 'christmas_photo_studio_03', name: 'Reading Nook', url: PH_JPG('christmas_photo_studio_03') },
    { key: 'christmas_photo_studio_05', name: 'Sitting Room', url: PH_JPG('christmas_photo_studio_05') },
  ],
  studio: [
    { key: 'studio_small_03', name: 'Compact Loft', url: PH_JPG('studio_small_03') },
    { key: 'small_empty_room_1', name: 'Minimal Suite', url: PH_JPG('small_empty_room_1') },
    { key: 'brown_photostudio_01', name: 'Warm Studio', url: PH_JPG('brown_photostudio_01') },
    { key: 'brown_photostudio_02', name: 'Sunlit Hall', url: PH_JPG('brown_photostudio_02') },
    { key: 'empty_play_room', name: 'Open Space', url: PH_JPG('empty_play_room') },
    { key: 'studio_country_hall', name: 'Hall View', url: PH_JPG('studio_country_hall') },
    { key: 'cyclorama_hard_light', name: 'Studio Loft', url: PH_JPG('cyclorama_hard_light') },
    { key: 'entrance_hall', name: 'Entrance', url: PH_JPG('entrance_hall') },
  ],
  commercial: [
    { key: 'autoshop_01', name: 'Workspace Floor', url: PH_JPG('autoshop_01') },
    { key: 'abandoned_factory_canteen_01', name: 'Open Hall', url: PH_JPG('abandoned_factory_canteen_01') },
    { key: 'vintage_measuring_lab', name: 'Lab Space', url: PH_JPG('vintage_measuring_lab') },
    { key: 'pretville_cinema', name: 'Showcase Hall', url: PH_JPG('pretville_cinema') },
    { key: 'hospital_room', name: 'Reception', url: PH_JPG('hospital_room') },
    { key: 'empty_warehouse_01', name: 'Warehouse', url: PH_JPG('empty_warehouse_01') },
    { key: 'abandoned_parking', name: 'Parking Bay', url: PH_JPG('abandoned_parking') },
    { key: 'concrete_tunnel', name: 'Corridor', url: PH_JPG('concrete_tunnel') },
    { key: 'surgery', name: 'Service Area', url: PH_JPG('surgery') },
    { key: 'dresden_station_night', name: 'Concourse', url: PH_JPG('dresden_station_night') },
  ],
};

// Fallback panorama, guaranteed CORS-friendly
const FALLBACK_PANORAMA = {
  key: 'threejs-park',
  name: 'Outdoor',
  url: 'https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg',
};

const IFRAME_HOSTS = /(my\.matterport\.com|kuula\.co|momento360\.com|360cities\.net|theta360\.com|roundme\.com|klapty\.com|panoraven\.com|marzipano\.net)/i;
const isIframeUrl = (url) => Boolean(url) && IFRAME_HOSTS.test(url);

function selectPanoramas(property) {
  // 1. Admin-uploaded panoramas — use ALL of them, unlimited
  const uploaded = Array.isArray(property?.tour360Images) && property.tour360Images.length > 0
    ? property.tour360Images
    : Array.isArray(property?.threeDModelImages) ? property.threeDModelImages : [];
  if (uploaded.length > 0) {
    const names = Array.isArray(property?.tour360RoomNames) ? property.tour360RoomNames : [];
    return uploaded
      .map((url, i) => ({
        key: `uploaded-${i}`,
        name: names[i] || `Scene ${i + 1}`,
        url: resolveUrl(url),
      }))
      .filter((x) => x.url);
  }

  // 2. Single explicit photosphere URL
  const explicitUrl = property?.panoramaUrl;
  if (explicitUrl && !isIframeUrl(explicitUrl)) {
    return [{ key: 'custom', name: property?.title || 'Main View', url: resolveUrl(explicitUrl) }];
  }

  // 3. Structured room list
  if (Array.isArray(property?.tour360Rooms) && property.tour360Rooms.length > 0) {
    return property.tour360Rooms.map((r, i) => ({
      key: `custom-${i}`,
      name: r?.name || `Scene ${i + 1}`,
      url: resolveUrl(r?.url),
    })).filter((x) => x.url);
  }

  // 4. Seeded fallback pool — return the full pool so every property has many rooms
  const type = String(property?.propertyType || '').toLowerCase();
  const isCommercial = /(shop|retail|office|store|commercial|showroom|plot|land)/.test(type);
  const isStudio = /studio/.test(type);
  const pool = isCommercial ? PANORAMAS.commercial : isStudio ? PANORAMAS.studio : PANORAMAS.residential;
  const id = property?._id || property?.id || 'default';
  const seed = hashString(String(id));
  const start = seed % pool.length;
  const picks = [];
  for (let i = 0; i < pool.length; i += 1) {
    picks.push(pool[(start + i) % pool.length]);
  }
  return picks;
}

function configureTexture(tex) {
  Object.assign(tex, {
    colorSpace: THREE.SRGBColorSpace,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    needsUpdate: true,
  });
  return tex;
}

function useEquirectTexture(url) {
  const [state, setState] = useState({ texture: null, error: null, url: null });

  useEffect(() => {
    if (!url) return undefined;
    let disposed = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (disposed) {
          tex.dispose?.();
          return;
        }
        configureTexture(tex);
        setState({ texture: tex, error: null, url });
      },
      undefined,
      (err) => {
        if (disposed) return;
        setState({ texture: null, error: err || new Error('load failed'), url });
      },
    );
    return () => {
      disposed = true;
    };
  }, [url]);

  return state;
}

function PanoramaSphere({ url, fallbackUrl, onReady }) {
  const primary = useEquirectTexture(url);
  const secondary = useEquirectTexture(primary.error && fallbackUrl ? fallbackUrl : '');
  const tex = primary.texture || secondary.texture;
  const resolvedUrl = primary.texture ? primary.url : (secondary.texture ? secondary.url : null);

  useEffect(() => {
    if (tex && resolvedUrl) onReady?.(resolvedUrl);
  }, [tex, resolvedUrl, onReady]);

  if (!tex) return null;

  return (
    <mesh>
      <sphereGeometry args={[50, 64, 48]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}

function FloorHotspot({ position, onClick }) {
  const ringRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 2.6) * 0.12;
      ringRef.current.scale.set(s, s, s);
    }
  });

  const handleOver = (e) => {
    e.stopPropagation();
    setHovered(true);
  };
  const handleOut = (e) => {
    e.stopPropagation();
    setHovered(false);
  };
  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <group position={position}>
      <mesh
        ref={ringRef}
        rotation-x={-Math.PI / 2}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <ringGeometry args={[0.4, 0.58, 48]} />
        <meshBasicMaterial
          color={hovered ? '#fde68a' : '#ffffff'}
          transparent
          opacity={hovered ? 0.95 : 0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.18, 0.3, 36]} />
        <meshBasicMaterial
          color={hovered ? '#fde68a' : '#ffffff'}
          transparent
          opacity={hovered ? 0.85 : 0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.08, 24]} />
        <meshBasicMaterial
          color={hovered ? '#fde68a' : '#ffffff'}
          transparent
          opacity={hovered ? 0.95 : 0.7}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

function PanoramaControls({ autoRotate }) {
  const { camera, gl } = useThree();
  const state = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    lon: 180,
    lat: 0,
    targetLon: 180,
    targetLat: 0,
    lastMove: 0,
  });

  useEffect(() => {
    camera.position.set(0, 0, 0);
    state.current.lastMove = performance.now();
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;

    const onDown = (e) => {
      state.current.dragging = true;
      state.current.lastX = e.clientX;
      state.current.lastY = e.clientY;
      state.current.lastMove = performance.now();
      try { el.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
    };
    const onMove = (e) => {
      if (!state.current.dragging) return;
      const dx = e.clientX - state.current.lastX;
      const dy = e.clientY - state.current.lastY;
      state.current.lastX = e.clientX;
      state.current.lastY = e.clientY;
      state.current.lastMove = performance.now();
      state.current.targetLon += dx * 2.4;
      state.current.targetLat = THREE.MathUtils.clamp(state.current.targetLat - dy * 2.4, -85, 85);
    };
    const onUp = (e) => {
      if (!state.current.dragging) return;
      state.current.dragging = false;
      try { el.releasePointerCapture?.(e.pointerId); } catch { /* noop */ }
    };
    const onWheel = (e) => {
      e.preventDefault();
      const zoomSensitivity = 0.075;
      const nextFov = THREE.MathUtils.clamp(camera.fov + e.deltaY * zoomSensitivity, 25, 105);
      Object.assign(camera, { fov: nextFov });
      camera.updateProjectionMatrix();
      state.current.lastMove = performance.now();
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const s = state.current;
    if (autoRotate && !s.dragging && performance.now() - s.lastMove > 3000) {
      s.targetLon += delta * 4;
    }
    s.lon += (s.targetLon - s.lon) * 0.55;
    s.lat += (s.targetLat - s.lat) * 0.55;

    const phi = THREE.MathUtils.degToRad(90 - s.lat);
    const theta = THREE.MathUtils.degToRad(s.lon);
    const target = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * 10,
      Math.cos(phi) * 10,
      Math.sin(phi) * Math.sin(theta) * 10,
    );
    camera.lookAt(target);
  });

  return null;
}

function LoadingOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '14px 22px', borderRadius: 16, background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(71,85,105,0.7)', color: '#e2e8f0' }}>
        <div style={{ width: 28, height: 28, border: '3px solid rgba(148,163,184,0.25)', borderTopColor: '#f59e0b', borderRadius: 9999, animation: 'mc-spin 0.9s linear infinite' }} />
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: '#cbd5e1' }}>LOADING 360° SCENE</p>
      </div>
    </div>
  );
}

function PanoramaCanvas({ url, autoRotate, onReady, onNext, onPrev, showHotspots }) {
  return (
    <Canvas
      camera={{ fov: 75, position: [0, 0, 0.01], near: 0.01, far: 1000 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ cursor: 'grab' }}
    >
      <color attach="background" args={['#070b16']} />
      <PanoramaSphere url={url} fallbackUrl={FALLBACK_PANORAMA.url} onReady={onReady} />
      {showHotspots && (
        <>
          {/* Placed on the floor at the left/right edges of the default view (camera faces -X).
              Camera "right" direction is -Z, camera "left" is +Z. Hotspots sit toward the room corners. */}
          <FloorHotspot position={[-5, -2.4, -3.2]} onClick={onNext} />
          <FloorHotspot position={[-5, -2.4, 3.2]} onClick={onPrev} />
        </>
      )}
      <PanoramaControls autoRotate={autoRotate} />
    </Canvas>
  );
}

export default function Property3DViewer({ modelPath = '', property = null, style = {} }) {
  const wrapperRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const resolvedModel = useMemo(() => resolveUrl(modelPath), [modelPath]);
  const customTourUrl = property?.tour360Url ? resolveUrl(property.tour360Url) : '';
  const embedUrl = isIframeUrl(customTourUrl)
    ? customTourUrl
    : isIframeUrl(resolvedModel)
      ? resolvedModel
      : '';

  const panoramas = useMemo(() => selectPanoramas(property), [property]);
  const active = panoramas[activeIndex] || panoramas[0] || FALLBACK_PANORAMA;
  const [loadedUrl, setLoadedUrl] = useState(null);
  const ready = loadedUrl === active.url;
  const cyclePanorama = (delta) => {
    const n = panoramas.length;
    if (n <= 1) return;
    setActiveIndex((prev) => (prev + delta + n) % n);
  };

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await wrapperRef.current.requestFullscreen();
  };

  const iconBtn = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    border: '1px solid rgba(71,85,105,0.7)',
    background: 'rgba(15,23,42,0.72)',
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 700,
    color: '#f1f5f9',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  };

  const pillBtn = (selected) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9999,
    border: `1px solid ${selected ? 'rgba(245,158,11,0.6)' : 'rgba(71,85,105,0.7)'}`,
    background: selected ? 'rgba(245,158,11,0.18)' : 'rgba(15,23,42,0.72)',
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.06em',
    color: selected ? '#fde68a' : '#e2e8f0',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    whiteSpace: 'nowrap',
  });

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        height: 500,
        overflow: 'hidden',
        borderRadius: 16,
        border: '1px solid rgba(51,65,85,0.7)',
        background: '#070b16',
        boxShadow: '0 30px 80px rgba(2,6,23,0.65)',
        ...style,
      }}
    >
      <style>{`@keyframes mc-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ pointerEvents: 'none', position: 'absolute', inset: '0 0 auto 0', height: 96, zIndex: 20, background: 'linear-gradient(to bottom, rgba(2,6,23,0.72), rgba(2,6,23,0))' }} />

      <div style={{ position: 'absolute', left: 14, top: 14, zIndex: 30, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 9999, border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.12)', color: '#fde68a', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>
        <Compass size={13} /> 360° Virtual Tour
      </div>

      <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8 }}>
        {embedUrl && (
          <a href={embedUrl} target="_blank" rel="noreferrer" style={{ ...iconBtn, textDecoration: 'none' }}>
            <ExternalLink size={14} /> Open
          </a>
        )}
        <button type="button" onClick={toggleFullscreen} style={iconBtn} aria-label="Toggle fullscreen">
          {isFullscreen ? <Minimize size={14} /> : <Expand size={14} />}
        </button>
      </div>

      {embedUrl ? (
        <iframe
          src={embedUrl}
          title="360 Virtual Tour"
          allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
          allowFullScreen
          style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
        />
      ) : (
        <>
          <PanoramaCanvas
            url={active.url}
            autoRotate
            onReady={(u) => setLoadedUrl(u)}
            onNext={() => cyclePanorama(1)}
            onPrev={() => cyclePanorama(-1)}
            showHotspots={panoramas.length > 1}
          />
          {!ready && <LoadingOverlay />}

          {panoramas.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => cyclePanorama(-1)}
                aria-label="Previous scene"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 30,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: 'rgba(15,23,42,0.72)',
                  color: '#f1f5f9',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 12px 28px rgba(2,6,23,0.45)',
                }}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() => cyclePanorama(1)}
                aria-label="Next scene"
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 30,
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: 'rgba(15,23,42,0.72)',
                  color: '#f1f5f9',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 12px 28px rgba(2,6,23,0.45)',
                }}
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <div style={{ position: 'absolute', left: 14, bottom: 14, right: 14, zIndex: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ padding: '8px 12px', borderRadius: 9999, background: 'rgba(15,23,42,0.76)', border: '1px solid rgba(148,163,184,0.2)', color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>Drag to look around</span>
              <span style={{ padding: '8px 12px', borderRadius: 9999, background: 'rgba(15,23,42,0.76)', border: '1px solid rgba(148,163,184,0.2)', color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>Scroll to zoom</span>
              {panoramas.length > 1 && (
                <button
                  type="button"
                  onClick={() => cyclePanorama(1)}
                  style={{ padding: '8px 12px', borderRadius: 9999, background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.5)', color: '#fde68a', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Next scene <ChevronRight size={14} />
                </button>
              )}
            </div>

            {panoramas.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 9999, background: 'rgba(7,11,22,0.65)', border: '1px solid rgba(148,163,184,0.18)', backdropFilter: 'blur(8px)', overflowX: 'auto', maxWidth: '100%' }}>
                <Images size={14} color="#fde68a" style={{ flexShrink: 0 }} />
                {panoramas.map((pano, i) => (
                  <button
                    key={pano.key}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    style={pillBtn(i === activeIndex)}
                  >
                    {pano.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
