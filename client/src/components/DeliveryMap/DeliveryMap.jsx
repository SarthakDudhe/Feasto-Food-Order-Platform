import React, { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./DeliveryMap.css";
import { fetchRouteWithETA } from "../../utils/routing";

// ─── Feasto Kitchen — Bandra West, Mumbai (hardcoded) ────────────────────────
const RESTAURANT = {
  coords: [72.8296, 19.0544], // Hill Road, Bandra West [lng, lat]
  name:   "Feasto Kitchen, Bandra",
};

// Fallback if user denies location — Andheri West (~7 km, ~18-22 min)
const FALLBACK = {
  coords: [72.8347, 19.1136],
  label:  "Andheri West, Mumbai (Demo)",
};

// ─── Animated dash frames for remaining-route segment ────────────────────────
const DASH_SEQ = [
  [0,4,3],[0.5,4,2.5],[1,4,2],[1.5,4,1.5],[2,4,1],[2.5,4,0.5],
  [3,4,0],[0,0.5,3,3.5],[0,1,3,3],[0,1.5,3,2.5],[0,2,3,2],
  [0,2.5,3,1.5],[0,3,3,1],[0,3.5,3,0.5],[0,4,3,0],
];

// ─── Map layer helpers ────────────────────────────────────────────────────────
function safeRemove(map, id) {
  if (map.getLayer(id))   map.removeLayer(id);
  if (map.getSource(id))  map.removeSource(id);
}

function drawSolid(map, id, geojson) {
  safeRemove(map, id + "-glow");
  safeRemove(map, id);
  map.addSource(id, { type: "geojson", data: geojson });
  map.addLayer({ id: id+"-glow", type:"line", source:id,
    layout:{"line-join":"round","line-cap":"round"},
    paint:{"line-color":"#ff5a3d","line-width":14,"line-opacity":0.14,"line-blur":8},
  });
  map.addLayer({ id, type:"line", source:id,
    layout:{"line-join":"round","line-cap":"round"},
    paint:{"line-color":"#ff5a3d","line-width":5,"line-opacity":0.95},
  });
}

function drawDashed(map, id, geojson) {
  safeRemove(map, id+"-bg");
  safeRemove(map, id);
  map.addSource(id, { type:"geojson", data:geojson });
  map.addLayer({ id:id+"-bg", type:"line", source:id,
    layout:{"line-join":"round","line-cap":"round"},
    paint:{"line-color":"#c8b4ab","line-width":5,"line-opacity":0.3},
  });
  map.addLayer({ id, type:"line", source:id,
    layout:{"line-join":"round","line-cap":"round"},
    paint:{"line-color":"#ff5a3d","line-width":4,"line-opacity":0.85,"line-dasharray":DASH_SEQ[0]},
  });
}

// ─── Marker element ───────────────────────────────────────────────────────────
function mkMarker(emoji, label, cls) {
  const el = document.createElement("div");
  el.className = `dm-marker dm-marker--${cls}`;
  el.innerHTML = `
    <div class="dm-marker__bubble"><span class="dm-marker__emoji">${emoji}</span></div>
    <div class="dm-marker__label">${label}</div>`;
  return el;
}

// ─── Geolocation (retries without highAccuracy on failure) ───────────────────
function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const attempt = (hq) =>
      navigator.geolocation.getCurrentPosition(
        (p) => resolve([p.coords.longitude, p.coords.latitude]),
        (e) => (e.code === 1 || !hq) ? resolve(null) : attempt(false),
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: hq }
      );
    attempt(true);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DeliveryMap({ order, statusIndex }) {
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const rafRef       = useRef(null);
  const dashIdx      = useRef(0);

  const [mapReady,   setMapReady]   = useState(false);
  const [phase,      setPhase]      = useState("idle"); // idle|requesting|loading|done
  const [routeInfo,  setRouteInfo]  = useState(null);
  const [locData,    setLocData]    = useState(null);

  // ―― Extract STABLE PRIMITIVES from order ――――――――――――――――――――――――――――――――
  // Using primitives (not the order object) in the dep array prevents the effect
  // from re-running on every server poll that returns a new object reference.
  const orderId    = order._id;
  const riderLat   = order.riderLat  ?? null;
  const riderLng   = order.riderLng  ?? null;
  const riderName  = order.riderName ?? "";

  // ── Dash animation ──────────────────────────────────────────────────────────
  const animateDash = useCallback((map, layerId) => {
    if (!map || !map.getLayer(layerId)) return;
    const tick = (ts) => {
      const i = Math.floor(ts / 60) % DASH_SEQ.length;
      if (i !== dashIdx.current) {
        dashIdx.current = i;
        try { map.setPaintProperty(layerId, "line-dasharray", DASH_SEQ[i]); }
        catch (_) { /* map may have been removed */ }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Mount map once, centered on Bandra kitchen ─────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    const map = new maplibregl.Map({
      container:        mapContainer.current,
      style:            "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center:           RESTAURANT.coords,
      zoom:             14,
      minZoom:          12,
      maxZoom:          18,
      attributionControl: false,
      pitchWithRotate:  false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact:true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass:false }), "top-right");
    map.on("load", () => { mapRef.current = map; setMapReady(true); });
    return () => {
      cancelAnimationFrame(rafRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── "Share Location" handler ────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    setPhase("requesting");
    const coords = await getLocation();
    // Set atomically — draw effect reads both coords + isFallback from one object
    setLocData({ coords: coords ?? FALLBACK.coords, isFallback: !coords });
    setPhase("loading");
  }, []);

  const handleDemo = useCallback(() => {
    setLocData({ coords: FALLBACK.coords, isFallback: true });
    setPhase("loading");
  }, []);

  // ── Draw routes when we have locData ───────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !locData || !mapRef.current) return;
    const map = mapRef.current;

    // Cancel previous animation and clear old markers on each re-run
    cancelAnimationFrame(rafRef.current);
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    setRouteInfo(null);

    const { coords: custCoords, isFallback } = locData;

    // Rider point: use admin-set GPS primitives, else simulate 42% along route
    const riderPt = (riderLat && riderLng)
      ? [riderLng, riderLat]
      : [
          RESTAURANT.coords[0] + (custCoords[0] - RESTAURANT.coords[0]) * 0.42,
          RESTAURANT.coords[1] + (custCoords[1] - RESTAURANT.coords[1]) * 0.42,
        ];

    const draw = async () => {
      const restCoords = RESTAURANT.coords;

      // Place markers
      const m1 = new maplibregl.Marker({ element: mkMarker("🍴", RESTAURANT.name, "restaurant"), anchor:"bottom" })
        .setLngLat(restCoords).addTo(map);
      const m2 = new maplibregl.Marker({ element: mkMarker("🛵", riderName || "Your Rider", "rider"), anchor:"bottom" })
        .setLngLat(riderPt).addTo(map);
      const m3 = new maplibregl.Marker({ element: mkMarker("📍", isFallback ? "Demo Location" : "Your Location", "customer"), anchor:"bottom" })
        .setLngLat(custCoords).addTo(map);
      markersRef.current = [m1, m2, m3];

      // Fetch routes
      const [seg1, seg2] = await Promise.all([
        fetchRouteWithETA(restCoords, riderPt),
        fetchRouteWithETA(riderPt, custCoords),
      ]);

      if (!mapRef.current) return; // unmounted during async

      if (seg1.geometry) drawSolid(map, "seg-done", seg1.geometry);
      if (seg2.geometry) {
        drawDashed(map, "seg-left", seg2.geometry);
        animateDash(map, "seg-left");
      }
      if (seg2.eta) setRouteInfo({ ...seg2.eta, isFallback });

      // Fit all 3 pins at street level
      const b = new maplibregl.LngLatBounds();
      [restCoords, riderPt, custCoords].forEach((c) => b.extend(c));
      map.fitBounds(b, {
        padding:  { top:70, bottom:130, left:60, right:60 },
        minZoom:  13,
        maxZoom:  16,
        duration: 1400,
        easing:   (t) => t * (2 - t),
      });

      setPhase("done");
    };

    draw();
  }, [mapReady, locData, riderLat, riderLng, riderName, orderId, animateDash]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dm-wrapper">

      {/* Location permission prompt */}
      {phase === "idle" && (
        <div className="dm-location-prompt">
          <div className="dm-prompt-icon">📍</div>
          <h4>See Your Delivery Route</h4>
          <p>Share your location to view the live route from <strong>Feasto Kitchen, Bandra</strong> to your door.</p>
          <button className="dm-share-btn" onClick={handleShare}>
            <span>📡</span> Share My Location
          </button>
          <button className="dm-demo-btn" onClick={handleDemo}>
            Use Demo Location instead
          </button>
        </div>
      )}

      {/* Requesting / loading overlay */}
      {(phase === "requesting" || phase === "loading") && (
        <div className="dm-overlay">
          <div className="dm-spinner" />
          <span>
            {phase === "requesting"
              ? "Waiting for location permission…"
              : "Plotting delivery route from Bandra…"}
          </span>
        </div>
      )}

      {/* Map canvas — always mounted so MapLibre can attach */}
      <div
        ref={mapContainer}
        className="dm-map"
        style={{ visibility: phase === "idle" ? "hidden" : "visible" }}
      />

      {/* Info panel */}
      {routeInfo && phase === "done" && (
        <div className="dm-info-panel">
          {statusIndex >= 3 ? (
            <div className="dm-info-delivered">
              <span className="dm-info-delivered__icon">✅</span>
              <div>
                <p className="dm-info-delivered__title">Order Delivered!</p>
                <p className="dm-info-delivered__sub">Enjoy your meal 🎉</p>
              </div>
            </div>
          ) : (
            <>
              <div className="dm-info-chip dm-info-chip--eta">
                <span className="dm-info-chip__icon">⏱️</span>
                <div>
                  <p className="dm-info-chip__value">~{routeInfo.etaMinutes} min</p>
                  <p className="dm-info-chip__label">Estimated arrival</p>
                </div>
              </div>
              <div className="dm-info-divider" />
              <div className="dm-info-chip dm-info-chip--dist">
                <span className="dm-info-chip__icon">📍</span>
                <div>
                  <p className="dm-info-chip__value">{routeInfo.distanceKm} km</p>
                  <p className="dm-info-chip__label">Distance remaining</p>
                </div>
              </div>
              <div className="dm-info-divider" />
              <div className="dm-info-live">
                <span className="dm-info-live__dot" />
                <span className="dm-info-live__text">LIVE</span>
              </div>
            </>
          )}

          <div className="dm-info-legend">
            {routeInfo.isFallback && (
              <span className="dm-info-fallback">📌 {FALLBACK.label}</span>
            )}
            <span className="dm-legend-dot dm-legend-dot--done" />
            <span>Completed</span>
            <span className="dm-legend-dot dm-legend-dot--remaining" />
            <span>Remaining</span>
          </div>
        </div>
      )}
    </div>
  );
}
