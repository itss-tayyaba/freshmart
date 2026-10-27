import { findNearestCity, calculateDistanceKm, PAKISTAN_CITIES } from '../data/pakistanLocations.js';

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
      (err) => {
        // If permission was denied/blocked by user, don't re-prompt
        if (err && err.code === 1) {
          clearTimeout(timer);
          if (onProgress) onProgress('Browser location blocked by user.');
          finish(null);
          return;
        }

        // Otherwise try with fallback settings
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
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 60000 }
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
 * Reverse geocodes latitude & longitude into an exact readable address using OpenStreetMap Nominatim
 * with comprehensive Pakistani administrative hierarchy resolution (street, village, tehsil, city, district)
 * and intelligent local fallback (never outputs just 'Pakistan').
 */
export async function reverseGeocodeAddress(lat, lng) {
  const nearest = findNearestCity(lat, lng);
  const nearestCityName = nearest?.city?.city ? nearest.city.city.split(',')[0].trim() : 'Faisalabad';

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'FreshMartApp/1.0'
      }
    });
    clearTimeout(id);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street =
          addr.road ||
          addr.street ||
          addr.pedestrian ||
          addr.footway ||
          addr.path ||
          addr.highway ||
          addr.amenity ||
          addr.shop ||
          '';
        const houseNum = addr.house_number || addr.building || '';
        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.village ||
          addr.hamlet ||
          addr.locality ||
          addr.subdivision ||
          addr.quarter ||
          addr.commercial ||
          addr.industrial ||
          '';
        const tehsil = addr.subdistrict || addr.city_district || addr.county || '';
        const cityCandidate = addr.city || addr.town || addr.municipality || addr.district || nearestCityName;
        const cleanCity = cityCandidate.toLowerCase().includes('pakistan')
          ? cityCandidate.replace(/,\s*Pakistan/i, '').trim()
          : cityCandidate;

        const parts = [];
        if (houseNum && street) parts.push(`${houseNum}, ${street}`);
        else if (street) parts.push(street);

        if (locality && !parts.some((p) => p.toLowerCase() === locality.toLowerCase())) {
          parts.push(locality);
        }
        if (
          tehsil &&
          !parts.some((p) => p.toLowerCase().includes(tehsil.toLowerCase())) &&
          !tehsil.toLowerCase().includes(cleanCity.toLowerCase())
        ) {
          parts.push(tehsil);
        }
        if (cleanCity && !parts.some((p) => p.toLowerCase().includes(cleanCity.toLowerCase()))) {
          parts.push(cleanCity);
        }

        // Filter out any naked 'Pakistan'
        const cleanParts = parts.filter((p) => p.trim().toLowerCase() !== 'pakistan');

        if (cleanParts.length > 0) {
          return {
            formatted: `${cleanParts.join(', ')}, ${cleanCity}`,
            area: locality || street || tehsil || 'Local Area',
            city: `${cleanCity}, Pakistan`,
            state: addr.state || nearest.city.province || 'Punjab'
          };
        }
      }

      // If address object didn't yield clean parts, try cleaning data.display_name
      if (data && data.display_name) {
        const nameParts = data.display_name
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.toLowerCase() !== 'pakistan' && !/^\d{4,6}$/.test(s));
        if (nameParts.length > 0) {
          return {
            formatted: nameParts.slice(0, 3).join(', '),
            area: nameParts[0] || 'Local Area',
            city: `${nearestCityName}, Pakistan`,
            state: nearest.city.province || 'Punjab'
          };
        }
      }
    }
  } catch (e) {
    // Ignore reverse geocode network failures and proceed to local geographic resolution
  }

  // Fallback to local Pakistan geography & distance resolution (never outputs just 'Pakistan')
  let closestNeigh = null;
  let minD = Infinity;
  for (const n of nearest.city.neighborhoods || []) {
    const d = calculateDistanceKm(lat, lng, n.coords.lat, n.coords.lng);
    if (d < minD) {
      minD = d;
      closestNeigh = n;
    }
  }

  if (closestNeigh && minD <= 2.5) {
    return {
      formatted: closestNeigh.defaultAddress || `${closestNeigh.name}, ${nearestCityName}`,
      area: closestNeigh.name,
      city: `${nearestCityName}, Pakistan`,
      state: nearest.city.province || 'Punjab'
    };
  } else if (closestNeigh && minD <= 8) {
    return {
      formatted: `Near ${closestNeigh.name}, ${nearestCityName}`,
      area: closestNeigh.name,
      city: `${nearestCityName}, Pakistan`,
      state: nearest.city.province || 'Punjab'
    };
  } else {
    return {
      formatted: `${nearestCityName} Outskirts (~${nearest.distanceKm.toFixed(1)} km from ${nearestCityName} Center)`,
      area: `${nearestCityName} Outskirts`,
      city: `${nearestCityName}, Pakistan`,
      state: nearest.city.province || 'Punjab'
    };
  }
}
