/**
 * FreshMart Pakistan City & GPS Delivery Hub Registry
 * Exact coordinates for Dark Store Hubs, Neighborhoods, and Distance Telemetry
 */

export const PAKISTAN_CITIES = [
  {
    id: 'lahore',
    city: 'Lahore, Pakistan',
    province: 'Punjab',
    hubName: 'FreshMart SuperHub #1 (Gulberg III)',
    hubAddress: 'Plot 42-B, Main Boulevard, Gulberg III, Lahore',
    hubCoords: { lat: 31.5150, lng: 74.3450 },
    neighborhoods: [
      {
        id: 'lhr-johar',
        name: 'Johar Town',
        area: 'Johar Town Phase 1 & 2 / Expo Center',
        coords: { lat: 31.4697, lng: 74.2728 },
        defaultAddress: 'House 142, Block G-3, M.A. Johar Town, Lahore',
        postalCode: '54700'
      },
      {
        id: 'lhr-gulberg',
        name: 'Gulberg',
        area: 'Gulberg II, III & MM Alam Road',
        coords: { lat: 31.5204, lng: 74.3587 },
        defaultAddress: 'Suite 302, MM Alam Road, Gulberg III, Lahore',
        postalCode: '54660'
      },
      {
        id: 'lhr-dha',
        name: 'DHA Lahore',
        area: 'DHA Phase 5 & 6 Commercial Broadway',
        coords: { lat: 31.4826, lng: 74.4074 },
        defaultAddress: 'Sector C, Phase 5 DHA, Lahore Cantt',
        postalCode: '54792'
      }
    ],
    defaultRider: {
      name: 'Ali Khan',
      phone: '+92 300 9876543',
      vehicle: 'Honda CG-125 (LEA-4892)',
      rating: 4.9,
      deliveriesCount: 1420
    }
  },
  {
    id: 'karachi',
    city: 'Karachi, Pakistan',
    province: 'Sindh',
    hubName: 'FreshMart Express Hub #2 (Clifton)',
    hubAddress: 'Block 4, Marine Promenade, Clifton, Karachi',
    hubCoords: { lat: 24.8190, lng: 67.0320 },
    neighborhoods: [
      {
        id: 'khi-clifton',
        name: 'Clifton',
        area: 'Clifton Block 2, 4 & 5 / Sea View',
        coords: { lat: 24.8270, lng: 67.0251 },
        defaultAddress: 'Apartment 4B, Ocean View, Block 4 Clifton, Karachi',
        postalCode: '75600'
      },
      {
        id: 'khi-dha',
        name: 'Defense (DHA)',
        area: 'DHA Phase 6 & Phase 8 Khayaban-e-Ittehad',
        coords: { lat: 24.8010, lng: 67.0680 },
        defaultAddress: 'Bungalow 78, Khayaban-e-Sehar, Phase 6 DHA, Karachi',
        postalCode: '75500'
      },
      {
        id: 'khi-gulshan',
        name: 'Gulshan-e-Iqbal',
        area: 'Gulshan Block 6 & 13D / University Rd',
        coords: { lat: 24.9180, lng: 67.0971 },
        defaultAddress: 'House 22, Block 13-D, Gulshan-e-Iqbal, Karachi',
        postalCode: '75300'
      }
    ],
    defaultRider: {
      name: 'Bilal Ahmed',
      phone: '+92 321 4455667',
      vehicle: 'Yamaha YBR-125 (KHI-9120)',
      rating: 4.95,
      deliveriesCount: 1890
    }
  },
  {
    id: 'islamabad',
    city: 'Islamabad, Pakistan',
    province: 'Federal Capital',
    hubName: 'FreshMart Capital Hub #3 (Blue Area)',
    hubAddress: 'Jinnah Avenue, Blue Area Sector F-6/G-6, Islamabad',
    hubCoords: { lat: 33.7120, lng: 73.0680 },
    neighborhoods: [
      {
        id: 'isb-f7',
        name: 'Sector F-7',
        area: 'F-7 Markaz (Jinnah Super) / F-7/2',
        coords: { lat: 33.7215, lng: 73.0565 },
        defaultAddress: 'House 18, Street 44, Sector F-7/1, Islamabad',
        postalCode: '44000'
      },
      {
        id: 'isb-bluearea',
        name: 'Blue Area',
        area: 'Blue Area Commercial Hub / G-7',
        coords: { lat: 33.7100, lng: 73.0650 },
        defaultAddress: 'Executive Tower, Blue Area, Islamabad',
        postalCode: '44010'
      },
      {
        id: 'isb-g11',
        name: 'Sector G-11',
        area: 'G-11 Markaz / Ibn-e-Sina Road',
        coords: { lat: 33.6680, lng: 72.9980 },
        defaultAddress: 'Flat 12, G-11/3, Islamabad',
        postalCode: '44080'
      }
    ],
    defaultRider: {
      name: 'Usman Tariq',
      phone: '+92 333 7788990',
      vehicle: 'Suzuki GD-110S (ICT-3041)',
      rating: 5.0,
      deliveriesCount: 960
    }
  },
  {
    id: 'rawalpindi',
    city: 'Rawalpindi, Pakistan',
    province: 'Punjab',
    hubName: 'FreshMart Pindi Hub #4 (Saddar Cantt)',
    hubAddress: 'Bank Road, Saddar Cantt, Rawalpindi',
    hubCoords: { lat: 33.5990, lng: 73.0510 },
    neighborhoods: [
      {
        id: 'rwp-saddar',
        name: 'Saddar Cantt',
        area: 'Saddar / Mall Road / Haider Road',
        coords: { lat: 33.5970, lng: 73.0540 },
        defaultAddress: 'House 55, Adamjee Road, Saddar, Rawalpindi',
        postalCode: '46000'
      },
      {
        id: 'rwp-bahria',
        name: 'Bahria Town',
        area: 'Bahria Town Phase 4 & Phase 7',
        coords: { lat: 33.5280, lng: 73.1120 },
        defaultAddress: 'Villa 110, Sector B, Bahria Town Phase 4, Rawalpindi',
        postalCode: '46220'
      }
    ],
    defaultRider: {
      name: 'Hamza Farooq',
      phone: '+92 345 1122334',
      vehicle: 'Honda Pridor (RWP-6082)',
      rating: 4.88,
      deliveriesCount: 1150
    }
  },
  {
    id: 'faisalabad',
    city: 'Faisalabad, Pakistan',
    province: 'Punjab',
    hubName: 'FreshMart Lyallpur Hub #5 (D-Ground)',
    hubAddress: 'D-Ground Commercial Center, Peoples Colony 1, Faisalabad',
    hubCoords: { lat: 31.4125, lng: 73.0995 },
    neighborhoods: [
      {
        id: 'fsd-dground',
        name: 'D Ground',
        area: 'D Ground Market / Batala Colony',
        coords: { lat: 31.4110, lng: 73.0980 },
        defaultAddress: 'House 88, Main D-Ground, Peoples Colony 1, Faisalabad',
        postalCode: '38000'
      },
      {
        id: 'fsd-peoples',
        name: 'Peoples Colony',
        area: 'Peoples Colony No. 1 & 2 / Chenab Club',
        coords: { lat: 31.4050, lng: 73.1090 },
        defaultAddress: 'Street 4, Peoples Colony No. 2, Faisalabad',
        postalCode: '38040'
      }
    ],
    defaultRider: {
      name: 'Zubair Raza',
      phone: '+92 301 5566778',
      vehicle: 'United 125 (FSD-2204)',
      rating: 4.92,
      deliveriesCount: 820
    }
  }
];

/**
 * Calculates Great-Circle distance in km using the Haversine formula
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

/**
 * Finds the nearest Pakistani city based on latitude and longitude coordinates
 */
export const findNearestCity = (lat, lng) => {
  let nearestCity = PAKISTAN_CITIES[0];
  let minDistance = Infinity;

  for (const city of PAKISTAN_CITIES) {
    const dist = calculateDistanceKm(lat, lng, city.hubCoords.lat, city.hubCoords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = city;
    }
  }

  return { city: nearestCity, distanceKm: minDistance };
};
