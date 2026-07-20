/**
 * routing.js
 * Fetches real road routes and ETAs using the free OSRM demo server.
 * No API key required.
 *
 * ⚠️  For production use, self-host OSRM or switch to a paid provider
 *     (Mapbox Directions, HERE Routing) to avoid rate limits.
 *
 * OSRM Demo server: https://router.project-osrm.org
 */

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/**
 * Fetch a GeoJSON LineString geometry for a road route between two points.
 *
 * @param {[number, number]} from  - [lng, lat] start
 * @param {[number, number]} to    - [lng, lat] end
 * @returns {Promise<Object | null>} GeoJSON geometry (type: "LineString") or null
 *
 * @example
 * const geojson = await fetchRouteGeometry([72.877, 19.076], [72.895, 19.091]);
 * map.addSource("route", { type: "geojson", data: geojson });
 */
export async function fetchRouteGeometry(from, to) {
  try {
    const url = `${OSRM_BASE}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();

    if (data.code === "Ok" && data.routes && data.routes[0]) {
      return data.routes[0].geometry; // GeoJSON LineString
    }

    return null;
  } catch (err) {
    console.warn("[Feasto Routing] fetchRouteGeometry failed:", err.message);
    return null;
  }
}

/**
 * Fetch ETA (in minutes) and distance (in km) between two points via OSRM.
 *
 * @param {[number, number]} from  - [lng, lat] start
 * @param {[number, number]} to    - [lng, lat] end
 * @returns {Promise<{ etaMinutes: number, distanceKm: number } | null>}
 *
 * @example
 * const info = await fetchETA(riderCoords, customerCoords);
 * // => { etaMinutes: 12, distanceKm: 4.7 }
 */
export async function fetchETA(from, to) {
  try {
    const url = `${OSRM_BASE}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=false`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();

    if (data.code === "Ok" && data.routes && data.routes[0]) {
      const { duration, distance } = data.routes[0];
      return {
        etaMinutes: Math.ceil(duration / 60),      // seconds → minutes
        distanceKm: Math.round(distance / 100) / 10, // metres → km (1 decimal)
      };
    }

    return null;
  } catch (err) {
    console.warn("[Feasto Routing] fetchETA failed:", err.message);
    return null;
  }
}

/**
 * Fetch both geometry AND eta in a single parallel call.
 * Convenience wrapper used by DeliveryMap.
 *
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @returns {Promise<{ geometry: Object | null, eta: { etaMinutes, distanceKm } | null }>}
 */
export async function fetchRouteWithETA(from, to) {
  const [geometry, eta] = await Promise.all([
    fetchRouteGeometry(from, to),
    fetchETA(from, to),
  ]);
  return { geometry, eta };
}
