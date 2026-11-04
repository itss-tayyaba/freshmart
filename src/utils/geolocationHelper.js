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
 * Strips government administrative suffixes (City Tehsil, Saddar Tehsil, Tehsil, District, Division)
 * to return clean, natural Pakistani city and locality names.
 */
export function cleanAdministrativeName(val) {
  if (!val || typeof val !== 'string') return '';
  return val
    .replace(/\s*(City Tehsil|Saddar Tehsil|Tehsil|District|Division|Subdistrict|Sub-District|Cantonment|Cantt)\b/gi, '')
    .replace(/,\s*Pakistan\b/gi, '')
    .trim();
}

/**
 * Reverse geocodes latitude & longitude into an exact, clean, human-readable address
 * using OpenStreetMap Nominatim with strict de-duplication and Pakistani geographic intelligence.
 * Never outputs repetitive administrative tokens like "Faisalabad Saddar Tehsil, Muradabad, Muradabad".
 */
export async function reverseGeocodeAddress(lat, lng) {
  const nearest = findNearestCity(lat, lng);
  const nearestCityRaw = nearest?.city?.city ? nearest.city.city.split(',')[0].trim() : 'Faisalabad';
  const cleanBaseCity = cleanAdministrativeName(nearestCityRaw) || 'Faisalabad';

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

        // Specific landmark / point of interest
        const landmark =
          addr.amenity ||
          addr.tourism ||
          addr.building ||
          addr.shop ||
          addr.commercial ||
          addr.office ||
          addr.leisure ||
          '';

        // Specific street or road
        const road =
          addr.road ||
          addr.street ||
          addr.pedestrian ||
          addr.footway ||
          addr.path ||
          addr.highway ||
          '';
        const houseNum = addr.house_number || '';
        let streetPart = '';
        if (houseNum && road) streetPart = `${houseNum}, ${road}`;
        else if (road) streetPart = road;

        // Neighborhood / Locality / Suburb / Village
        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.village ||
          addr.hamlet ||
          addr.subdivision ||
          addr.quarter ||
          addr.locality ||
          '';

        // City resolution (clean out any "Tehsil" or "District" strings)
        const cityCandidate = addr.city || addr.town || addr.municipality || cleanBaseCity;
        const resolvedCity = cleanAdministrativeName(cityCandidate) || cleanBaseCity;

        // Collect and de-duplicate parts
        const parts = [];
        const seen = new Set();

        const addPart = (rawVal) => {
          if (!rawVal) return;
          const cleaned = cleanAdministrativeName(rawVal);
          if (!cleaned) return;
          const lower = cleaned.toLowerCase();

          if (lower === 'pakistan' || /^\d{5}$/.test(cleaned)) return;

          // Check for exact match or full substring match
          for (const s of seen) {
            if (s === lower || s.includes(lower) || lower.includes(s)) {
              return;
            }
          }

          seen.add(lower);
          parts.push(cleaned);
        };

        addPart(landmark);
        addPart(streetPart);
        addPart(locality);

        // Always append the clean city name if not already in parts
        if (!parts.some((p) => p.toLowerCase().includes(resolvedCity.toLowerCase()))) {
          parts.push(resolvedCity);
        }

        if (parts.length > 0) {
          const areaName = cleanAdministrativeName(locality || landmark || streetPart) || resolvedCity;
          return {
            formatted: parts.join(', '),
            area: areaName,
            city: `${resolvedCity}, Pakistan`,
            state: addr.state || nearest.city.province || 'Punjab',
            coords: { lat, lng }
          };
        }
      }

      // If data.address didn't yield clean parts, parse display_name
      if (data && data.display_name) {
        const rawTokens = data.display_name
          .split(',')
          .map((s) => cleanAdministrativeName(s.trim()))
          .filter(
            (s) =>
              s &&
              s.toLowerCase() !== 'pakistan' &&
              !/^\d{4,6}$/.test(s) &&
              !/division|district|tehsil/i.test(s)
          );

        const uniqueTokens = [];
        const tokenSeen = new Set();
        for (const t of rawTokens) {
          const tLower = t.toLowerCase();
          let duplicate = false;
          for (const s of tokenSeen) {
            if (s === tLower || s.includes(tLower) || tLower.includes(s)) {
              duplicate = true;
              break;
            }
          }
          if (!duplicate) {
            tokenSeen.add(tLower);
            uniqueTokens.push(t);
          }
        }

        if (uniqueTokens.length > 0) {
          if (!uniqueTokens.some((t) => t.toLowerCase().includes(cleanBaseCity.toLowerCase()))) {
            uniqueTokens.push(cleanBaseCity);
          }
          return {
            formatted: uniqueTokens.slice(0, 4).join(', '),
            area: uniqueTokens[0] || 'Local Area',
            city: `${cleanBaseCity}, Pakistan`,
            state: nearest.city.province || 'Punjab',
            coords: { lat, lng }
          };
        }
      }
    }
  } catch (e) {
    // Network fallback
  }

  // Fallback to local Pakistani neighborhood data by distance
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
      formatted: `${closestNeigh.name}, ${cleanBaseCity}`,
      area: closestNeigh.name,
      city: `${cleanBaseCity}, Pakistan`,
      state: nearest.city.province || 'Punjab',
      coords: { lat, lng }
    };
  } else if (closestNeigh && minD <= 8) {
    return {
      formatted: `Near ${closestNeigh.name}, ${cleanBaseCity}`,
      area: closestNeigh.name,
      city: `${cleanBaseCity}, Pakistan`,
      state: nearest.city.province || 'Punjab',
      coords: { lat, lng }
    };
  } else {
    return {
      formatted: `${cleanBaseCity} Hub (~${nearest.distanceKm.toFixed(1)} km from ${cleanBaseCity} Center)`,
      area: `${cleanBaseCity} Area`,
      city: `${cleanBaseCity}, Pakistan`,
      state: nearest.city.province || 'Punjab',
      coords: { lat, lng }
    };
  }
}
