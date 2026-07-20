import React, { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./DeliveryMap.css";
import { geocodeAddress } from "../../utils/geocode";
import { fetchRouteWithETA } from "../../utils/routing";

// ─── Offsets to simulate restaurant + rider near customer's city ─────────────
// Restaurant is placed ~2.2km NW of delivery address (always local)
const RESTAURANT_OFFSET = { lng: -0.012, lat: 0.010 }; // ~1.3km W, ~1.1km N
// If admin hasn't set rider GPS, rider is placed 40% along restaurant→customer path
const RIDER_RATIO = 0.42;


// ─── Animated dash sequence for the "remaining route" segment ────────────────
const DASH_SEQUENCE = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
  [0, 4, 3, 0],
];

// ─── Helper: remove a map layer+source safely ────────────────────────────────
function safeRemoveLayer(map, id) {
  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(id)) map.removeSource(id);
}

// ─── Helper: draw a solid glowing route (completed leg) ─────────────────────
function drawCompletedRoute(map, id, geojson) {
  safeRemoveLayer(map, id + "-glow");
  safeRemoveLayer(map, id);

  map.addSource(id, { type: "geojson", data: geojson });

  // Glow layer underneath
  map.addLayer({
    id: id + "-glow",
    type: "line",
    source: id,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#ff5a3d",
      "line-width": 12,
      "line-opacity": 0.18,
      "line-blur": 6,
    },
  });

  // Solid route on top
  map.addLayer({
    id,
    type: "line",
    source: id,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#ff5a3d",
      "line-width": 5,
      "line-opacity": 0.95,
    },
  });
}

// ─── Helper: draw an animated dashed route (remaining leg) ───────────────────
function drawRemainingRoute(map, id, geojson) {
  safeRemoveLayer(map, id + "-bg");
  safeRemoveLayer(map, id);

  map.addSource(id, { type: "geojson", data: geojson });

  // Dim background track
  map.addLayer({
    id: id + "-bg",
    type: "line",
    source: id,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#c8b4ab",
      "line-width": 5,
      "line-opacity": 0.35,
    },
  });

  // Animated dashed overlay
  map.addLayer({
    id,
    type: "line",
    source: id,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#ff5a3d",
      "line-width": 4,
      "line-opacity": 0.85,
      "line-dasharray": DASH_SEQUENCE[0],
    },
  });
}

// ─── Helper: build a custom HTML marker ─────────────────────────────────────
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

// ─── Component ───────────────────────────────────────────────────────────────
export default function DeliveryMap({ order, statusIndex }) {
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const animFrameRef = useRef(null);
  const dashStepRef  = useRef(0);

  const [mapReady, setMapReady]         = useState(false);
  const [geocodeState, setGeocodeState] = useState("idle");
  const [routeInfo, setRouteInfo]       = useState(null); // { etaMinutes, distanceKm }

  const riderCoords =
    order.riderLat && order.riderLng
      ? [order.riderLng, order.riderLat]
      : null;

  // ── Animate remaining-leg dashes ──────────────────────────────────────────
  const startDashAnimation = useCallback((map, layerId) => {
    if (!map || !map.getLayer(layerId)) return;

    function step(timestamp) {
      const newStep = Math.floor(timestamp / 60) % DASH_SEQUENCE.length;
      if (newStep !== dashStepRef.current) {
        dashStepRef.current = newStep;
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, "line-dasharray", DASH_SEQUENCE[newStep]);
        }
      }
      animFrameRef.current = requestAnimationFrame(step);
    }

    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // ── Mount MapLibre once ───────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      // CARTO Voyager – detailed street labels, perfect for delivery tracking
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [78.9629, 20.5937], // safe default — fitBounds overrides this after geocoding
      zoom: 15,       // Street level by default
      minZoom: 13,    // Never zoom out past neighbourhood level
      maxZoom: 18,    // Never go closer than building level
      attributionControl: false,
      pitchWithRotate: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

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

  // ── Draw routes + markers once map + order are ready ─────────────────────
  useEffect(() => {
    if (!mapReady || !order || !mapRef.current) return;
    const map = mapRef.current;

    // Stop any previous animation
    cancelAnimationFrame(animFrameRef.current);

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const run = async () => {
      setGeocodeState("loading");
      setRouteInfo(null);

      // 1. Geocode customer address — this is our anchor point
      const customerCoords = await geocodeAddress(order.address);

      if (!customerCoords) {
        setGeocodeState("error");
        return;
      }

      setGeocodeState("done");

      // 2. Derive restaurant coords relative to customer (always same city/area)
      const restaurantCoords = [
        customerCoords[0] + RESTAURANT_OFFSET.lng,
        customerCoords[1] + RESTAURANT_OFFSET.lat,
      ];

      // 3. Rider: use admin-set GPS if available, otherwise simulate along route
      const effectiveRider = riderCoords ?? [
        restaurantCoords[0] + (customerCoords[0] - restaurantCoords[0]) * RIDER_RATIO,
        restaurantCoords[1] + (customerCoords[1] - restaurantCoords[1]) * RIDER_RATIO,
      ];


      // ── Markers ─────────────────────────────────────────────────────────
      const rM = new maplibregl.Marker({ element: createMarkerEl("🍴", "Feasto Kitchen", "restaurant"), anchor: "bottom" })
        .setLngLat(restaurantCoords).addTo(map);
      const riM = new maplibregl.Marker({ element: createMarkerEl("🛵", order.riderName || "Rider", "rider"), anchor: "bottom" })
        .setLngLat(effectiveRider).addTo(map);
      const cM = new maplibregl.Marker({ element: createMarkerEl("🏠", "Your Home", "customer"), anchor: "bottom" })
        .setLngLat(customerCoords).addTo(map);

      markersRef.current = [rM, riM, cM];

      // ── Fetch both route segments in parallel ────────────────────────────
      const [completedResult, remainingResult] = await Promise.all([
        fetchRouteWithETA(restaurantCoords, effectiveRider),
        fetchRouteWithETA(effectiveRider, customerCoords),
      ]);


      // Completed leg – solid orange (restaurant → rider)
      if (completedResult.geometry) {
        drawCompletedRoute(map, "seg-completed", completedResult.geometry);
      }

      // Remaining leg – animated dashed (rider → customer)
      if (remainingResult.geometry) {
        drawRemainingRoute(map, "seg-remaining", remainingResult.geometry);
        startDashAnimation(map, "seg-remaining");
      }

      // ── ETA + distance info panel ────────────────────────────────────────
      if (remainingResult.eta) {
        setRouteInfo(remainingResult.eta);
      }

      // ── Fit camera — all 3 pins are local so this stays at street level ──
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(restaurantCoords);
      bounds.extend(effectiveRider);
      bounds.extend(customerCoords);
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 130, left: 60, right: 60 },
        minZoom: 14,   // street level minimum
        maxZoom: 16,
        duration: 1400,
        easing: (t) => t * (2 - t),
      });
    };

    run();
  }, [mapReady, order, riderCoords, startDashAnimation]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="dm-wrapper">

      {/* Loading overlay */}
      {geocodeState === "loading" && (
        <div className="dm-overlay">
          <div className="dm-spinner" />
          <span>Plotting your delivery route…</span>
        </div>
      )}

      {/* Geocode error */}
      {geocodeState === "error" && (
        <div className="dm-overlay dm-overlay--warn">
          <span>⚠️ Could not locate delivery address</span>
        </div>
      )}

      {/* Map canvas */}
      <div ref={mapContainer} className="dm-map" />

      {/* ── Premium route info panel (bottom of map) ─────────────────────── */}
      {routeInfo && geocodeState === "done" && (
        <div className="dm-info-panel">

          {/* Delivered state */}
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
              {/* ETA chip */}
              <div className="dm-info-chip dm-info-chip--eta">
                <span className="dm-info-chip__icon">⏱️</span>
                <div>
                  <p className="dm-info-chip__value">~{routeInfo.etaMinutes} min</p>
                  <p className="dm-info-chip__label">Estimated arrival</p>
                </div>
              </div>

              <div className="dm-info-divider" />

              {/* Distance chip */}
              <div className="dm-info-chip dm-info-chip--dist">
                <span className="dm-info-chip__icon">📍</span>
                <div>
                  <p className="dm-info-chip__value">{routeInfo.distanceKm} km</p>
                  <p className="dm-info-chip__label">Distance remaining</p>
                </div>
              </div>

              <div className="dm-info-divider" />

              {/* Live badge */}
              <div className="dm-info-live">
                <span className="dm-info-live__dot" />
                <span className="dm-info-live__text">LIVE</span>
              </div>
            </>
          )}

          {/* Route legend */}
          <div className="dm-info-legend">
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
