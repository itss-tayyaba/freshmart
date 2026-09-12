import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAKISTAN_CITIES,
  calculateDistanceKm,
  findNearestCity
} from '../src/data/pakistanLocations.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Pakistan Cities & Dark Store Hub Coordinates Registry', async (t) => {
  await t.test('contains all 5 major Pakistani delivery cities', () => {
    const cityNames = PAKISTAN_CITIES.map((c) => c.city);
    assert.ok(cityNames.some((c) => c.includes('Lahore')));
    assert.ok(cityNames.some((c) => c.includes('Karachi')));
    assert.ok(cityNames.some((c) => c.includes('Islamabad')));
    assert.ok(cityNames.some((c) => c.includes('Rawalpindi')));
    assert.ok(cityNames.some((c) => c.includes('Faisalabad')));
    assert.strictEqual(PAKISTAN_CITIES.length, 5);
  });

  await t.test('has valid numeric GPS coordinates for all Dark Store hubs', () => {
    PAKISTAN_CITIES.forEach((city) => {
      assert.ok(typeof city.hubCoords.lat === 'number');
      assert.ok(typeof city.hubCoords.lng === 'number');
      assert.ok(city.hubCoords.lat > 23 && city.hubCoords.lat < 37, `${city.city} lat out of bounds`);
      assert.ok(city.hubCoords.lng > 60 && city.hubCoords.lng < 78, `${city.city} lng out of bounds`);
      assert.ok(city.hubName.length > 0);
      assert.ok(city.hubAddress.length > 0);
    });
  });

  await t.test('has exact neighborhood coordinates defined for each city', () => {
    const lahore = PAKISTAN_CITIES.find((c) => c.id === 'lahore');
    assert.ok(lahore.neighborhoods.some((n) => n.name === 'Johar Town'));
    assert.ok(lahore.neighborhoods.some((n) => n.name === 'Gulberg'));
    assert.ok(lahore.neighborhoods.some((n) => n.name === 'DHA Lahore'));

    const karachi = PAKISTAN_CITIES.find((c) => c.id === 'karachi');
    assert.ok(karachi.neighborhoods.some((n) => n.name === 'Clifton'));
    assert.ok(karachi.neighborhoods.some((n) => n.name === 'Defense (DHA)'));
    assert.ok(karachi.neighborhoods.some((n) => n.name === 'Gulshan-e-Iqbal'));
  });
});

test('GPS Distance Calculations & Nearest City Resolution', async (t) => {
  await t.test('accurately calculates Haversine distance between two coordinates', () => {
    // Distance between Gulberg Lahore (31.5204, 74.3587) and Johar Town (31.4697, 74.2728) ~ 9.9 km
    const dist = calculateDistanceKm(31.5204, 74.3587, 31.4697, 74.2728);
    assert.ok(dist >= 9 && dist <= 11, `Expected ~9.9km, got ${dist}`);
  });

  await t.test('resolves nearest city accurately based on GPS latitude and longitude', () => {
    // Test Karachi coordinate
    const resKhi = findNearestCity(24.8607, 67.0011);
    assert.strictEqual(resKhi.city.id, 'karachi');

    // Test Islamabad coordinate
    const resIsb = findNearestCity(33.7294, 73.0931);
    assert.strictEqual(resIsb.city.id, 'islamabad');

    // Test Faisalabad coordinate
    const resFsd = findNearestCity(31.4187, 73.0791);
    assert.strictEqual(resFsd.city.id, 'faisalabad');
  });
});

test('Authentic UI Verification: No Inauthentic VIP Gold Medals & No Hardcoded Riders', async (t) => {
  await t.test('ProfileSettingsView does not contain inauthentic VIP Gold Member string', () => {
    const profileFile = fs.readFileSync(
      path.join(__dirname, '../src/components/CustomerPortal/views/ProfileSettingsView.jsx'),
      'utf8'
    );
    assert.strictEqual(profileFile.includes('VIP Gold Member'), false);
    assert.ok(profileFile.includes('Verified Account'));
  });

  await t.test('CustomerPortal does not contain raw VIP badge next to user profile', () => {
    const portalFile = fs.readFileSync(
      path.join(__dirname, '../src/components/CustomerPortal/CustomerPortal.jsx'),
      'utf8'
    );
    assert.strictEqual(portalFile.includes('>VIP</span>'), false);
    assert.ok(portalFile.includes('Verified'));
  });

  await t.test('pakistanLocations registry contains 0 hardcoded defaultRider entries', () => {
    PAKISTAN_CITIES.forEach((city) => {
      assert.strictEqual(city.defaultRider, undefined, `City ${city.city} must not have hardcoded defaultRider`);
    });
  });

  await t.test('StoreContext default riders list starts empty for Admin control', () => {
    const contextFile = fs.readFileSync(
      path.join(__dirname, '../src/context/StoreContext.jsx'),
      'utf8'
    );
    assert.ok(contextFile.includes('const defaultRidersList = [];'));
  });
});
