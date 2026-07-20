/**
 * geocode.js
 * Converts a Feasto address object → [lng, lat] coordinates
 * using the free Nominatim / OpenStreetMap geocoding API.
 *
 * No API key required.
 * Rate limit: 1 request/second (fine for a single TrackOrder call).
 */

/**
 * Geocode a Feasto address object to [longitude, latitude].
 *
 * @param {Object} addressObj  - The `order.address` object from MongoDB
 * @param {string} [country]   - Country hint (default: "India")
 * @returns {Promise<[number, number] | null>} - [lng, lat] or null on failure
 *
 * @example
 * const coords = await geocodeAddress(order.address);
 * // => [72.8777, 19.0760]
 */
export async function geocodeAddress(addressObj, country = "India") {
  try {
    const parts = [
      addressObj.street,
      addressObj.city,
      addressObj.state,
      addressObj.pincode,
      country,
    ].filter(Boolean);

    if (parts.length === 0) return null;

    const query = parts.join(", ");
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1&addressdetails=0`;

    const res = await fetch(url, {
      headers: {
        // Nominatim requires a descriptive User-Agent — use your app name
        "User-Agent": "Feasto-FoodDelivery/1.0 (contact@feasto.app)",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (data && data.length > 0) {
      return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    }

    // Fallback: try with just city + state if full address fails
    if (addressObj.city && addressObj.state) {
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        `${addressObj.city}, ${addressObj.state}, ${country}`
      )}&format=json&limit=1`;

      const fallbackRes = await fetch(fallbackUrl, {
        headers: { "User-Agent": "Feasto-FoodDelivery/1.0" },
      });

      const fallbackData = await fallbackRes.json();
      if (fallbackData && fallbackData.length > 0) {
        return [parseFloat(fallbackData[0].lon), parseFloat(fallbackData[0].lat)];
      }
    }

    return null;
  } catch (err) {
    console.warn("[Feasto Geocode] Failed to geocode address:", err.message);
    return null;
  }
}

/**
 * Calculate the straight-line (Haversine) distance between two [lng, lat] points.
 * Useful as a fallback when OSRM is unavailable.
 *
 * @param {[number, number]} from - [lng, lat]
 * @param {[number, number]} to   - [lng, lat]
 * @returns {number} Distance in kilometres
 */
export function haversineDistanceKm(from, to) {
  const R = 6371; // Earth radius in km
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(to[1] - from[1]);
  const dLon = toRad(to[0] - from[0]);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from[1])) *
      Math.cos(toRad(to[1])) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
