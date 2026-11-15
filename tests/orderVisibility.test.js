import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pickupStaffCanSee, riderCanSee, riderPhase, canRiderStartDelivery,
  dispatchToAssignedRider, checkPointInBranchRegion, pointInPolygon
} from '../server/utils/orderVisibility.js';

const staff = { id: 'STF-1', role: 'pickup_staff', tenantId: 'tenant-a', branchId: 'b1' };
const rider = { id: 'RDR-7', role: 'rider', tenantId: 'tenant-a', branchId: 'b1' };
const base = { id: 'O1', tenantId: 'tenant-a', branchId: 'b1', status: 'Confirmed' };

test('pickup staff do NOT see an order before admin assigns it', () => {
  assert.equal(pickupStaffCanSee(base, staff), false);
  assert.equal(pickupStaffCanSee({ ...base, pickupStaffId: '' }, staff), false);
  assert.equal(pickupStaffCanSee({ ...base, pickupStaffId: null }, staff), false);
});
test('pickup staff see it once assigned to them, and not when assigned to someone else', () => {
  assert.equal(pickupStaffCanSee({ ...base, pickupStaffId: 'stf-1' }, staff), true);
  assert.equal(pickupStaffCanSee({ ...base, pickupStaffId: 'STF-2' }, staff), false);
});
test('pickup staff cannot see other stores or branches', () => {
  assert.equal(pickupStaffCanSee({ ...base, pickupStaffId: 'STF-1', tenantId: 'tenant-b' }, staff), false);
  assert.equal(pickupStaffCanSee({ ...base, pickupStaffId: 'STF-1', branchId: 'b2' }, staff), false);
});

test('rider sees nothing until a rider is assigned', () => {
  assert.equal(riderCanSee(base, rider), false);
});
test('rider sees an assigned order while it is still preparing', () => {
  const o = { ...base, status: 'Preparing', assignedRider: { id: 'RDR-7' } };
  assert.equal(riderCanSee(o, rider), true);
  assert.equal(riderPhase(o), 'preparing');
  assert.equal(canRiderStartDelivery(o), false);
});
test('rider matching is by id only, never by similar name', () => {
  const o = { ...base, assignedRider: { id: 'RDR-9', name: 'Ali Khan' } };
  assert.equal(riderCanSee(o, { ...rider, name: 'Ali' }), false);
});
test('dispatch: staff marks Ready -> assigned rider gets Out for Delivery', () => {
  const o = { ...base, status: 'Preparing', assignedRider: { id: 'RDR-7' } };
  assert.equal(dispatchToAssignedRider(o), true);
  assert.equal(o.status, 'Out for Delivery');
  assert.equal(riderPhase(o), 'dispatched');
  assert.equal(canRiderStartDelivery(o), true);
  assert.match(o.deliveryOtp, /^\d{4}$/);
});
test('Ready with no rider yet only marks it ready, no dispatch', () => {
  const o = { ...base, status: 'Prepared' };
  assert.equal(dispatchToAssignedRider(o), false);
  assert.equal(o.isDispatchedByStaff, true);
  assert.equal(o.status, 'Prepared');
});
test('delivered orders are hidden from the rider unless history is requested', () => {
  const o = { ...base, status: 'Delivered', assignedRider: { id: 'RDR-7' } };
  assert.equal(riderCanSee(o, rider), false);
  assert.equal(riderCanSee(o, rider, { history: true }), true);
});

const square = [[31.40, 73.05], [31.40, 73.10], [31.44, 73.10], [31.44, 73.05]];
test('point in polygon', () => {
  assert.equal(pointInPolygon(31.42, 73.07, square), true);
  assert.equal(pointInPolygon(31.50, 73.07, square), false);
});
test('rider area must be inside the drawn polygon', () => {
  const b = { deliveryPolygon: square, deliveryRadiusKm: 50, latitude: 31.42, longitude: 73.07 };
  assert.equal(checkPointInBranchRegion(b, 31.42, 73.07).ok, true);
  const out = checkPointInBranchRegion(b, 31.50, 73.07);
  assert.equal(out.ok, false);
  assert.equal(out.mode, 'polygon'); // polygon wins over the radius
});
test('without a polygon the store radius is used; without both it is rejected', () => {
  const r = { latitude: 31.42, longitude: 73.07, deliveryRadiusKm: 3 };
  assert.equal(checkPointInBranchRegion(r, 31.43, 73.07).ok, true);
  assert.equal(checkPointInBranchRegion(r, 31.60, 73.07).ok, false);
  assert.equal(checkPointInBranchRegion({ latitude: 31.42, longitude: 73.07 }, 31.42, 73.07).ok, false);
  assert.equal(checkPointInBranchRegion(r, undefined, undefined).ok, false);
  assert.equal(checkPointInBranchRegion(null, 31.4, 73.0).ok, false);
});
