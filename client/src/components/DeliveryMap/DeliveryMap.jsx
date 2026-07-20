import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./DeliveryMap.css";

// ---------------------------------------------------------------------------
// Static "Feasto Kitchen" coordinates (Mumbai – update to your restaurant's real location)
const RESTAURANT_COORDS = [72.8777, 19.0760]; // [lng, lat]

// ---------------------------------------------------------------------------
// Helper: Geocode an address string → [lng, lat] via Nominatim (free, no key)
async function geocodeAddress(addressObj) {
  try {
    const parts = [
      addressObj.street,
      addressObj.city,
      addressObj.state,
      addressObj.pincode,
      "India",
    ]
      .filter(Boolean)
      .join(", ");

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      parts
    )}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Feasto-FoodDelivery/1.0" },
    });
    const data = await res.json();

    if (data && data[0]) {
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: Fetch road route from OSRM (free, no key needed)
async function fetchRoute(from, to) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      return data.routes[0].geometry; // GeoJSON LineString
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helper: Create an HTML marker element
function createMarkerEl(emoji, label, colorClass) {
  const el = document.createElement("div");
  el.className = `dm-marker dm-marker--${colorClass}`;
  el.innerHTML = `
    <div class="dm-marker__bubble">
      <span class="dm-marker__emoji">${emoji}</span>
    </div>
    <div class="dm-marker__label">${label}</div>
    <div class="dm-marker__pin"></div>
  `;
  return el;
}

// ---------------------------------------------------------------------------
// Helper: Draw or update a route layer on the map
function drawRoute(map, id, geojson, color, opacity = 0.85) {
  // Remove old source/layer if they exist
  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(id)) map.removeSource(id);

  map.addSource(id, { type: "geojson", data: geojson });
  map.addLayer({
    id,
    type: "line",
    source: id,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": color,
      "line-width": 5,
      "line-opacity": opacity,
      "line-dasharray": [0, 0],
    },
  });
}

// ---------------------------------------------------------------------------
export default function DeliveryMap({ order, statusIndex }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const [mapReady, setMapReady] = useState(false);
  const [geocodeState, setGeocodeState] = useState("idle"); // idle | loading | done | error
  const [eta, setEta] = useState(null);

  // Rider coords come from the order (set by admin) or fall back to midpoint
  const riderCoords =
    order.riderLat && order.riderLng
      ? [order.riderLng, order.riderLat]
      : null;

  // -------------------------------------------------------------------------
  // 1. Mount the MapLibre map once
  useEffect(() => {
    if (mapRef.current) return; // already initialised

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", // free, no key
      center: RESTAURANT_COORDS,
      zoom: 13,
      attributionControl: false,
    });

    // Compact attribution
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    // Zoom controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------------------
  // 2. Once map is ready + order is loaded, geocode & draw everything
  useEffect(() => {
    if (!mapReady || !order || !mapRef.current) return;
    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const run = async () => {
      setGeocodeState("loading");

      // --- Geocode customer address ---
      const customerCoords = await geocodeAddress(order.address);

      if (!customerCoords) {
        setGeocodeState("error");
        // Still show restaurant marker even if geocoding fails
        const rEl = createMarkerEl("🍴", "Feasto Kitchen", "restaurant");
        const rm = new maplibregl.Marker({ element: rEl })
          .setLngLat(RESTAURANT_COORDS)
          .addTo(map);
        markersRef.current.push(rm);
        return;
      }

      setGeocodeState("done");

      // --- Determine effective rider position ---
      const effectiveRiderCoords =
        riderCoords ||
        [
          (RESTAURANT_COORDS[0] + customerCoords[0]) / 2,
          (RESTAURANT_COORDS[1] + customerCoords[1]) / 2,
        ];

      // --- Place markers ---
      const restaurantEl = createMarkerEl("🍴", "Feasto Kitchen", "restaurant");
      const riderEl = createMarkerEl("🛵", order.riderName || "Rider", "rider");
      const customerEl = createMarkerEl("🏠", "Your Location", "customer");

      const rm = new maplibregl.Marker({ element: restaurantEl, anchor: "bottom" })
        .setLngLat(RESTAURANT_COORDS)
        .addTo(map);

      const riderM = new maplibregl.Marker({ element: riderEl, anchor: "bottom" })
        .setLngLat(effectiveRiderCoords)
        .addTo(map);

      const cm = new maplibregl.Marker({ element: customerEl, anchor: "bottom" })
        .setLngLat(customerCoords)
        .addTo(map);

      markersRef.current = [rm, riderM, cm];

      // --- Fetch & draw route segments ---
      const [seg1, seg2] = await Promise.all([
        fetchRoute(RESTAURANT_COORDS, effectiveRiderCoords),
        fetchRoute(effectiveRiderCoords, customerCoords),
      ]);

      if (seg1) {
        drawRoute(map, "route-seg1", seg1, "#ff5a3d", 0.9); // Feasto orange – completed leg
      }
      if (seg2) {
        drawRoute(map, "route-seg2", seg2, "#efdcd3", 0.75); // muted – upcoming leg
      }

      // --- Estimate ETA based on second segment distance ---
      if (seg2 && seg2.coordinates && seg2.coordinates.length > 1) {
        // very rough: 30 km/h average delivery speed
        try {
          const etaRes = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${effectiveRiderCoords[0]},${effectiveRiderCoords[1]};${customerCoords[0]},${customerCoords[1]}?overview=false`
          );
          const etaData = await etaRes.json();
          if (etaData.routes && etaData.routes[0]) {
            const seconds = etaData.routes[0].duration;
            const mins = Math.ceil(seconds / 60);
            setEta(mins);
          }
        } catch {
          // ETA is non-critical, ignore
        }
      }

      // --- Fit map to show all three points ---
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(RESTAURANT_COORDS);
      bounds.extend(effectiveRiderCoords);
      bounds.extend(customerCoords);
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1200 });
    };

    run();
  }, [mapReady, order, riderCoords]);

  // -------------------------------------------------------------------------
  return (
    <div className="dm-wrapper">
      {/* Map status overlay */}
      {geocodeState === "loading" && (
        <div className="dm-overlay">
          <div className="dm-spinner" />
          <span>Locating addresses…</span>
        </div>
      )}
      {geocodeState === "error" && (
        <div className="dm-overlay dm-overlay--warn">
          <span>⚠️ Could not geocode delivery address</span>
        </div>
      )}

      {/* ETA badge */}
      {eta && statusIndex < 3 && (
        <div className="dm-eta-badge">
          🛵 ~{eta} min away
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} className="dm-map" />
    </div>
  );
}
