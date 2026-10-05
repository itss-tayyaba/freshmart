import { findNearestCity, calculateDistanceKm, PAKISTAN_CITIES } from '../data/pakistanLocations';

/**
 * Robust Multi-Stage Geolocation Detector
 * 1. Attempts Browser Geolocation (with fast timeout and low-accuracy Wi-Fi fallback)
 * 2. If blocked or timed out, automatically falls back to IP network geolocation
 * 3. Reverse geocodes coordinates to street and neighborhood using OpenStreetMap Nominatim
 */
export async function detectUserLocation(options = {}) {
  const { onProgress } = options;

  if (onProgress) onProgress('Requesting GPS coordinates...');

  // Step 1: Try browser geolocation
  const browserCoords = await getBrowserCoordinates({
    onProgress,
    timeoutMs: 6000
  });

  let lat, lng, source;

  if (browserCoords) {
    lat = browserCoords.latitude;
    lng = browserCoords.longitude;
    source = 'browser_gps';
  } else {
    // Step 2: Fallback to IP Network Geolocation
    if (onProgress) onProgress('Connecting to network location provider...');
    const ipCoords = await getIPCoordinates();
    if (ipCoords) {
      lat = ipCoords.latitude;
      lng = ipCoords.longitude;
      source = 'ip_network';
    } else {
      // Default fallback: Flagship hub in Faisalabad
      lat = 31.4125;
      lng = 73.0995;
      source = 'default';
    }
  }

  // Step 3: Match nearest Pakistani city hub
  if (onProgress) onProgress('Finding nearest delivery hub...');
  const { city: nearestCityObj, distanceKm } = findNearestCity(lat, lng);

  // Find closest neighborhood in that city
  let closestNeighborhood = nearestCityObj.neighborhoods[0];
  let minDist = Infinity;
  for (const n of nearestCityObj.neighborhoods) {
    const d = calculateDistanceKm(lat, lng, n.coords.lat, n.coords.lng);
    if (d < minDist) {
      minDist = d;
      closestNeighborhood = n;
    }
  }

  // Step 4: Reverse geocode to exact street address via OpenStreetMap Nominatim
  if (onProgress) onProgress('Resolving street address & area...');
  const reverseAddress = await reverseGeocodeAddress(lat, lng);

  const finalAddress =
    reverseAddress?.formatted ||
    `${closestNeighborhood.defaultAddress} (Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)})`;

  const finalArea =
    reverseAddress?.area ||
    closestNeighborhood.area ||
    closestNeighborhood.name;

  const finalCity = reverseAddress?.city || nearestCityObj.city;

  return {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    coords: {
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5))
    },
    city: finalCity,
    matchedCityId: nearestCityObj.id,
    hubName: nearestCityObj.hubName,
    neighborhood: closestNeighborhood.name,
    area: finalArea,
    address: finalAddress,
    distanceToHubKm: distanceKm,
    source,
    label: source === 'browser_gps' ? 'Exact GPS Location' : 'Current Location'
  };
}

/**
 * Attempts browser navigator.geolocation with graceful timeouts and fallbacks
 */
function getBrowserCoordinates({ onProgress, timeoutMs = 6000 } = {}) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    let isResolved = false;
    const finish = (result) => {
      if (!isResolved) {
        isResolved = true;
        resolve(result);
      }
    };

    // Safety timeout in case browser hangs on permission prompt or GPS search
    const timer = setTimeout(() => {
      if (onProgress) onProgress('Browser GPS timed out, trying network...');
      finish(null);
    }, timeoutMs);

    // Try with enableHighAccuracy: false first for fast Wi-Fi / desktop triangulation
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        finish(pos.coords);
      },
      () => {
        // High accuracy failed or standard retry: try once more with default settings
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timer);
            finish(pos.coords);
          },
          () => {
            clearTimeout(timer);
            finish(null);
          },
          { enableHighAccuracy: true, timeout: 3000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
    );
  });
}

/**
 * Free IP-based network geolocation fallback (no user permission required)
 */
async function getIPCoordinates() {
  const endpoints = [
    {
      url: 'https://ipwho.is/',
      parse: (data) =>
        data && data.success && data.latitude && data.longitude
          ? { latitude: data.latitude, longitude: data.longitude, city: data.city }
          : null
    },
    {
      url: 'https://ipapi.co/json/',
      parse: (data) =>
        data && data.latitude && data.longitude
          ? { latitude: data.latitude, longitude: data.longitude, city: data.city }
          : null
    },
    {
      url: 'https://freeipapi.com/api/json',
      parse: (data) =>
        data && data.latitude && data.longitude
          ? { latitude: data.latitude, longitude: data.longitude, city: data.cityName }
          : null
    }
  ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(ep.url, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const json = await res.json();
        const parsed = ep.parse(json);
        if (parsed) return parsed;
      }
    } catch (e) {
      // Continue to next endpoint
    }
  }

  return null;
}

/**
 * Reverse geocodes latitude & longitude into a readable address using OpenStreetMap Nominatim
 */
export async function reverseGeocodeAddress(lat, lng) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en'
      }
    });
    clearTimeout(id);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.street || addr.pedestrian || addr.footway || '';
        const houseNum = addr.house_number || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.subdivision || '';
        const city = addr.city || addr.town || addr.municipality || addr.county || 'Pakistan';
        const state = addr.state || '';

        const parts = [];
        if (houseNum && street) parts.push(`${houseNum}, ${street}`);
        else if (street) parts.push(street);

        if (suburb) parts.push(suburb);
        if (city) parts.push(city);

        const formatted = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 3).join(',');

        return {
          formatted: formatted || data.display_name,
          area: suburb || street || 'Local Area',
          city: city.includes('Pakistan') ? city : `${city}, Pakistan`,
          state
        };
      }
    }
  } catch (e) {
    // Ignore reverse geocode failures
  }

  return null;
}
