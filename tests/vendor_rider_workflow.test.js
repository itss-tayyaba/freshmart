import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Vendor Application Approval & Rider Fleet Password Workflow', () => {
  // Simulating the vendor application workflow
  const registerVendor = (vendorsList, formData) => {
    const newVendor = {
      id: `VND-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      status: 'Pending', // Applications start pending
      category: formData.category || 'Fresh Fruits & Farm Vegetables'
    };
    return [...vendorsList, newVendor];
  };

  const approveVendor = (vendorsList, vendorId) => {
    return vendorsList.map((v) => (v.id === vendorId ? { ...v, status: 'Approved' } : v));
  };

  const attemptVendorLogin = (vendorsList, email, password) => {
    const found = vendorsList.find((v) => v.email === email.toLowerCase().trim());
    if (!found) return { success: false, error: 'Vendor not found' };
    if (found.status === 'Pending') {
      return { success: false, error: 'Your vendor application is pending Admin approval. Please wait for store admin approval.' };
    }
    if (found.status === 'Rejected') {
      return { success: false, error: 'This vendor account was rejected by the administration.' };
    }
    if (found.password !== password) {
      return { success: false, error: 'Invalid password' };
    }
    return { success: true, vendor: found };
  };

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

  it('sets newly submitted vendor applications to Pending status', () => {
    let vendors = [];
    vendors = registerVendor(vendors, {
      name: 'Organic Green Farms',
      email: 'greenfarms@gmail.com',
      password: 'mypassword123'
    });

    assert.equal(vendors.length, 1);
    assert.equal(vendors[0].status, 'Pending');
    assert.equal(vendors[0].name, 'Organic Green Farms');
  });

  it('rejects login for vendor applications that are still Pending approval', () => {
    let vendors = [
      { id: 'VND-200', name: 'Fresh Fruits Hub', email: 'fruits@fresh.pk', password: 'secret123', status: 'Pending' }
    ];

    const result = attemptVendorLogin(vendors, 'fruits@fresh.pk', 'secret123');
    assert.equal(result.success, false);
    assert.match(result.error, /pending Admin approval/i);
  });

  it('allows vendor login immediately once Admin marks status as Approved', () => {
    let vendors = [
      { id: 'VND-200', name: 'Fresh Fruits Hub', email: 'fruits@fresh.pk', password: 'secret123', status: 'Pending' }
    ];

    // Admin approves vendor
    vendors = approveVendor(vendors, 'VND-200');
    assert.equal(vendors[0].status, 'Approved');

    // Vendor attempts login with their registered password
    const result = attemptVendorLogin(vendors, 'fruits@fresh.pk', 'secret123');
    assert.equal(result.success, true);
    assert.equal(result.vendor.name, 'Fresh Fruits Hub');
  });

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
});
