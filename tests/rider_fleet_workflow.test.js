import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Admin Fleet & Pickup Staff Management Workflow', () => {
  // Simulating Admin-controlled Rider creation workflow
  const adminCreateRider = (ridersList, riderData) => {
    const newRider = {
      id: `RDR-${Math.floor(100 + Math.random() * 900)}`,
      name: riderData.name,
      phone: riderData.phone,
      username: riderData.username || riderData.phone,
      password: riderData.password || 'rider123',
      zone: riderData.zone || 'Gulberg',
      status: 'On-Duty'
    };
    return [...ridersList, newRider];
  };

  const attemptRiderLogin = (ridersList, identifier, password) => {
    const clean = identifier.replace(/[^0-9a-zA-Z_]/g, '').toLowerCase();
    const found = ridersList.find(
      (r) =>
        r.username.toLowerCase() === clean ||
        r.phone.replace(/[^0-9]/g, '') === clean ||
        r.id.toLowerCase() === clean
    );
    if (!found) return { success: false, error: 'Rider not found' };
    if (found.password !== password) return { success: false, error: 'Invalid password' };
    return { success: true, rider: found };
  };

  // Simulating Admin-controlled Pickup Staff creation workflow
  const adminCreatePickupStaff = (staffList, staffData) => {
    const newStaff = {
      id: `STF-${Math.floor(100 + Math.random() * 900)}`,
      name: staffData.name,
      phone: staffData.phone,
      username: staffData.username || staffData.phone,
      password: staffData.password || 'staff123',
      branchId: staffData.branchId || 'branch_001',
      status: 'Active'
    };
    return [...staffList, newStaff];
  };

  it('allows Admin to create rider and assign a secure login password', () => {
    let riders = [];
    riders = adminCreateRider(riders, {
      name: 'Usman Tariq',
      phone: '0300-9876543',
      username: 'usman_rider',
      password: 'assignedpass2026',
      zone: 'DHA Phase 5'
    });

    assert.equal(riders.length, 1);
    assert.equal(riders[0].name, 'Usman Tariq');
    assert.equal(riders[0].password, 'assignedpass2026');
  });

  it('allows Rider to log in using their Admin-assigned phone/username and password', () => {
    const riders = [
      { id: 'RDR-101', name: 'Rider Ali', phone: '0301-1234567', username: 'rider', password: 'rider123' },
      { id: 'RDR-102', name: 'Usman Tariq', phone: '0300-9876543', username: 'usman_rider', password: 'assignedpass2026' }
    ];

    // Login via phone
    const login1 = attemptRiderLogin(riders, '0300-9876543', 'assignedpass2026');
    assert.equal(login1.success, true);
    assert.equal(login1.rider.name, 'Usman Tariq');

    // Login via username
    const login2 = attemptRiderLogin(riders, 'usman_rider', 'assignedpass2026');
    assert.equal(login2.success, true);

    // Wrong password rejected
    const badLogin = attemptRiderLogin(riders, 'usman_rider', 'wrongpass');
    assert.equal(badLogin.success, false);
  });

  it('allows Admin to create branch-dedicated pickup staff', () => {
    let staff = [];
    staff = adminCreatePickupStaff(staff, {
      name: 'Bilal Ahmad',
      phone: '0312-3456789',
      username: 'bilal_staff',
      password: 'packingpass123',
      branchId: 'branch_chasevalue_dground'
    });

    assert.equal(staff.length, 1);
    assert.equal(staff[0].name, 'Bilal Ahmad');
    assert.equal(staff[0].branchId, 'branch_chasevalue_dground');
  });

  it('clears session, user state, and resets route when rider logs out', () => {
    let session = {
      isLoggedIn: true,
      role: 'rider',
      user: { id: 'RDR-101', name: 'Ahmad Khan', role: 'rider' },
      currentPage: 'delivery-portal'
    };

    const adminLogout = () => {
      session.isLoggedIn = false;
      session.role = null;
      session.user = null;
      session.currentPage = 'home';
    };

    adminLogout();

    assert.equal(session.isLoggedIn, false);
    assert.equal(session.role, null);
    assert.equal(session.user, null);
    assert.equal(session.currentPage, 'home');
  });
});
