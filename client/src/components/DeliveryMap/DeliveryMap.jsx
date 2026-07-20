import React, { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./DeliveryMap.css";
import { fetchRouteWithETA } from "../../utils/routing";

// ─────────────────────────────────────────────────────────────────────────────
// 🍴 Feasto Kitchen — Bandra West, Mumbai (hardcoded, real location)
// Coordinates: Hill Road, Bandra West — a prime Mumbai food hub
const RESTAURANT = {
  coords: [72.8296, 19.0544], // [lng, lat]
  name: "Feasto Kitchen, Bandra",
};

// Fallback delivery location if user denies geolocation
// Andheri West — ~7km from Bandra, ~18-22 min delivery
const MUMBAI_FALLBACK = {
  coords: [72.8347, 19.1136],
  label: "Andheri West, Mumbai (Demo)",
};

// ─────────────────────────────────────────────────────────────────────────────
// Animated dash sequence for remaining route
const DASH_SEQUENCE = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
  [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5],
  [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2],
  [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5], [0, 4, 3, 0],
];

// ─────────────────────────────────────────────────────────────────────────────
function safeRemoveLayer(map, id) {
  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(id)) map.removeSource(id);
}

function drawCompletedRoute(map, id, geojson) {
  safeRemoveLayer(map, id + "-glow");
  safeRemoveLayer(map, id);
  map.addSource(id, { type: "geojson", data: geojson });
  map.addLayer({
    id: id + "-glow", type: "line", source: id,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#ff5a3d", "line-width": 14, "line-opacity": 0.15, "line-blur": 8 },
  });
  map.addLayer({
    id, type: "line", source: id,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#ff5a3d", "line-width": 5, "line-opacity": 0.95 },
  });
}

function drawRemainingRoute(map, id, geojson) {
  safeRemoveLayer(map, id + "-bg");
  safeRemoveLayer(map, id);
  map.addSource(id, { type: "geojson", data: geojson });
  map.addLayer({
    id: id + "-bg", type: "line", source: id,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#c8b4ab", "line-width": 5, "line-opacity": 0.3 },
  });
  map.addLayer({
    id, type: "line", source: id,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#ff5a3d", "line-width": 4,
      "line-opacity": 0.85, "line-dasharray": DASH_SEQUENCE[0],
    },
  });
}

function createMarkerEl(emoji, label, cls) {
  const el = document.createElement("div");
  el.className = `dm-marker dm-marker--${cls}`;
  el.innerHTML = `
    <div class="dm-marker__bubble">
      <span class="dm-marker__emoji">${emoji}</span>
    </div>
    <div class="dm-marker__label">${label}</div>
  `;
  return el;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get browser geolocation → returns Promise<[lng, lat] | null>
function getBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      ()    => resolve(null),
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DeliveryMap({ order, statusIndex }) {
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const animFrameRef = useRef(null);
  const dashStepRef  = useRef(0);

  const [mapReady, setMapReady]           = useState(false);
  const [locState, setLocState]           = useState("idle"); // idle | requesting | loading | done | denied | error
  const [routeInfo, setRouteInfo]         = useState(null);
  const [customerCoords, setCustomerCoords] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const riderCoords =
    order.riderLat && order.riderLng ? [order.riderLng, order.riderLat] : null;

  // ── Animate dashes ─────────────────────────────────────────────────────────
  const startDashAnimation = useCallback((map, layerId) => {
    if (!map || !map.getLayer(layerId)) return;
    function step(ts) {
      const idx = Math.floor(ts / 60) % DASH_SEQUENCE.length;
      if (idx !== dashStepRef.current) {
        dashStepRef.current = idx;
        if (map.getLayer(layerId)) map.setPaintProperty(layerId, "line-dasharray", DASH_SEQUENCE[idx]);
      }
      animFrameRef.current = requestAnimationFrame(step);
    }
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // ── Mount MapLibre, centered on Bandra Kitchen ────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: RESTAURANT.coords,   // Start centered on the restaurant
      zoom: 14,
      minZoom: 12,
      maxZoom: 18,
      attributionControl: false,
      pitchWithRotate: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Handle "Share Location" button click ──────────────────────────────────
  const handleShareLocation = useCallback(async () => {
    setLocState("requesting");
    const coords = await getBrowserLocation();

    if (coords) {
      setCustomerCoords(coords);
      setUsingFallback(false);
      setLocState("loading");
    } else {
      // Browser denied or unavailable → use Andheri West fallback
      setCustomerCoords(MUMBAI_FALLBACK.coords);
      setUsingFallback(true);
      setLocState("loading");
    }
  }, []);

  // ── Draw map when we have customerCoords ─────────────────────────────────
  useEffect(() => {
    if (!mapReady || !customerCoords || !mapRef.current) return;
    const map = mapRef.current;

    cancelAnimationFrame(animFrameRef.current);
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    setRouteInfo(null);

    const draw = async () => {
      const restaurantCoords = RESTAURANT.coords;

      // Rider: admin GPS if set, else 42% along restaurant→customer
      const effectiveRider = riderCoords ?? [
        restaurantCoords[0] + (customerCoords[0] - restaurantCoords[0]) * 0.42,
        restaurantCoords[1] + (customerCoords[1] - restaurantCoords[1]) * 0.42,
      ];

      // ── Markers ─────────────────────────────────────────────────────────
      const rM = new maplibregl.Marker({ element: createMarkerEl("🍴", RESTAURANT.name, "restaurant"), anchor: "bottom" })
        .setLngLat(restaurantCoords).addTo(map);
      const riM = new maplibregl.Marker({ element: createMarkerEl("🛵", order.riderName || "Your Rider", "rider"), anchor: "bottom" })
        .setLngLat(effectiveRider).addTo(map);
      const cM = new maplibregl.Marker({ element: createMarkerEl("📍", usingFallback ? "Demo Location" : "Your Location", "customer"), anchor: "bottom" })
        .setLngLat(customerCoords).addTo(map);

      markersRef.current = [rM, riM, cM];

      // ── Routes ──────────────────────────────────────────────────────────
      const [seg1, seg2] = await Promise.all([
        fetchRouteWithETA(restaurantCoords, effectiveRider),
        fetchRouteWithETA(effectiveRider, customerCoords),
      ]);

      if (seg1.geometry) drawCompletedRoute(map, "seg-completed", seg1.geometry);
      if (seg2.geometry) {
        drawRemainingRoute(map, "seg-remaining", seg2.geometry);
        startDashAnimation(map, "seg-remaining");
      }
      if (seg2.eta) setRouteInfo(seg2.eta);

      // ── Fit to all 3 pins at street level ───────────────────────────────
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(restaurantCoords);
      bounds.extend(effectiveRider);
      bounds.extend(customerCoords);
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 130, left: 60, right: 60 },
        minZoom: 13,
        maxZoom: 16,
        duration: 1400,
        easing: (t) => t * (2 - t),
      });

      setLocState("done");
    };

    draw();
  }, [mapReady, customerCoords, riderCoords, usingFallback, order, startDashAnimation]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dm-wrapper">

      {/* ── "Share Location" prompt screen ──────────────────────────────── */}
      {locState === "idle" && (
        <div className="dm-location-prompt">
          <div className="dm-prompt-icon">📍</div>
          <h4>See Your Delivery Route</h4>
          <p>Share your location to see the live route from <strong>Feasto Kitchen, Bandra</strong> to you.</p>
          <button className="dm-share-btn" onClick={handleShareLocation}>
            <span>📡</span> Share My Location
          </button>
          <button className="dm-demo-btn" onClick={() => {
            setCustomerCoords(MUMBAI_FALLBACK.coords);
            setUsingFallback(true);
            setLocState("loading");
          }}>
            Use Demo Location instead
          </button>
        </div>
      )}

      {/* Requesting permission */}
      {locState === "requesting" && (
        <div className="dm-overlay">
          <div className="dm-spinner" />
          <span>Waiting for location permission…</span>
        </div>
      )}

      {/* Loading routes */}
      {locState === "loading" && (
        <div className="dm-overlay">
          <div className="dm-spinner" />
          <span>Plotting delivery route from Bandra…</span>
        </div>
      )}

      {/* Map canvas — always rendered so MapLibre can mount */}
      <div
        ref={mapContainer}
        className="dm-map"
        style={{ visibility: locState === "idle" ? "hidden" : "visible" }}
      />

      {/* ── Info panel ──────────────────────────────────────────────────── */}
      {routeInfo && locState === "done" && (
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
            {usingFallback && (
              <span className="dm-info-fallback">📌 Demo: {MUMBAI_FALLBACK.label}</span>
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
