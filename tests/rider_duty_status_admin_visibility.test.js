import test from 'node:test';
import assert from 'node:assert/strict';
import { canAssignRiderToOrder } from '../src/utils/orderScope.js';

test('Rider Duty Status & Admin Real-Time Visibility Suite', async (t) => {
  const sampleOrder = {
    id: '#ORD-101',
    orderId: '#ORD-101',
    tenantId: 'tenant-freshmart',
    branchId: 'branch_um_fsd',
    status: 'Pending',
    totalAmount: 1200
  };

  const onDutyRider = {
    id: 'RDR-001',
    name: 'Babar Azam',
    username: 'babar_rider',
    phone: '+92 300 1112233',
    tenantId: 'tenant-freshmart',
    status: 'On-Duty',
    isOnline: true,
    activeOrders: 1
  };

  const offDutyRider = {
    id: 'RDR-002',
    name: 'Shaheen Afridi',
    username: 'shaheen_rider',
    phone: '+92 300 4445566',
    tenantId: 'tenant-freshmart',
    status: 'Off-Duty',
    isOnline: false,
    activeOrders: 0
  };

  await t.test('canAssignRiderToOrder allows dispatch for an On-Duty rider', () => {
    const result = canAssignRiderToOrder(onDutyRider, sampleOrder);
    assert.equal(result.allowed, true, 'On-duty rider should be eligible for assignment');
  });

  await t.test('canAssignRiderToOrder strictly blocks dispatch for an Off-Duty rider', () => {
    const result = canAssignRiderToOrder(offDutyRider, sampleOrder);
    assert.equal(result.allowed, false, 'Off-duty rider must not be eligible for assignment');
    assert.match(result.reason, /Offline \(Off-Duty\)/i, 'Error reason should indicate off-duty status');
  });

  await t.test('Admin Fleet KPI counts accurately separate On-Duty vs Off-Duty riders', () => {
    const fleet = [
      { id: '1', name: 'Rider 1', status: 'On-Duty', isOnline: true },
      { id: '2', name: 'Rider 2', status: 'Off-Duty', isOnline: false },
      { id: '3', name: 'Rider 3', status: 'Active', isOnline: true },
      { id: '4', name: 'Rider 4', status: 'Offline', isOnline: false },
      { id: '5', name: 'Rider 5', status: 'Busy', isOnline: true }
    ];

    const onDutyCount = fleet.filter((r) => {
      const s = String(r.status || '').toLowerCase();
      return (s === 'on-duty' || s === 'active' || s === 'busy') && r.isOnline !== false;
    }).length;

    const offDutyCount = fleet.filter((r) => {
      const s = String(r.status || '').toLowerCase();
      return s === 'off-duty' || s === 'offline' || s === 'inactive' || r.isOnline === false;
    }).length;

    assert.equal(onDutyCount, 3, 'Should count 3 on-duty/active couriers');
    assert.equal(offDutyCount, 2, 'Should count 2 off-duty/offline couriers');
    assert.equal(onDutyCount + offDutyCount, fleet.length);
  });

  await t.test('Admin Fleet Status Filter separates couriers into All, On-Duty, and Off-Duty tabs', () => {
    const fleet = [
      { id: 'r1', name: 'Hamza', status: 'On-Duty', isOnline: true },
      { id: 'r2', name: 'Ali', status: 'Off-Duty', isOnline: false }
    ];

    const filterFleet = (tab) => fleet.filter((r) => {
      const rStatusLower = String(r.status || '').toLowerCase();
      const isOffDuty = rStatusLower === 'off-duty' || rStatusLower === 'offline' || rStatusLower === 'inactive' || r.isOnline === false;
      const isOnDuty = !isOffDuty;

      if (tab === 'On-Duty' && !isOnDuty) return false;
      if (tab === 'Off-Duty' && !isOffDuty) return false;
      return true;
    });

    assert.equal(filterFleet('All').length, 2, 'All tab includes everyone');
    assert.equal(filterFleet('On-Duty').length, 1, 'On-Duty tab includes only Hamza');
    assert.equal(filterFleet('On-Duty')[0].name, 'Hamza');
    assert.equal(filterFleet('Off-Duty').length, 1, 'Off-Duty tab includes only Ali');
    assert.equal(filterFleet('Off-Duty')[0].name, 'Ali');
  });

  await t.test('Duty change event payload structure informs Admin with name and Off-Duty status', () => {
    const rider = { id: 'r-10', name: 'Tariq', username: 'tariq_10' };
    const nextStatus = 'Off-Duty';
    const isOnline = false;

    const eventPayload = {
      id: rider.id,
      name: rider.name || rider.username,
      status: nextStatus,
      isOnline,
      timestamp: Date.now()
    };

    assert.equal(eventPayload.status, 'Off-Duty');
    assert.equal(eventPayload.isOnline, false);
    assert.equal(eventPayload.name, 'Tariq');

    // Admin toast message format check
    const isOffDuty = eventPayload.status === 'Off-Duty' || eventPayload.isOnline === false;
    const toastTitle = 'Rider Duty Alert 🛵';
    const toastMessage = `Rider ${eventPayload.name} has marked their status as ${isOffDuty ? 'OFF-DUTY 🔴' : 'ON-DUTY 🟢'}.`;

    assert.equal(toastTitle, 'Rider Duty Alert 🛵');
    assert.match(toastMessage, /Tariq has marked their status as OFF-DUTY 🔴/);
  });
});
