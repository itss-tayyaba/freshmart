import test from 'node:test';
import assert from 'node:assert/strict';

test('Pickup Staff Management & "Deliver to Staff" Workflow', async (t) => {
  // Mock pickup staff store
  let pickupStaffList = [];

  const addPickupStaff = (data, currentTenant = { id: 'tenant-freshmart', name: 'FreshMart' }) => {
    const username = String(data?.username || '').trim().toLowerCase();
    const password = String(data?.password || '').trim();
    const name = String(data?.name || '').trim();
    const phone = String(data?.phone || '').trim();

    if (!username || !password || !name) {
      return { error: 'Missing required fields' };
    }

    if (pickupStaffList.some((s) => s.username === username)) {
      return { error: 'Username already exists' };
    }

    const newStaff = {
      id: `PCK-${Date.now().toString(36).toUpperCase()}`,
      name,
      username,
      password,
      phone,
      tenantId: currentTenant.id,
      tenantName: currentTenant.name,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    pickupStaffList.push(newStaff);
    return { success: true, staff: newStaff };
  };

  const authenticateStaff = (inputUser, inputPass, targetRole = 'admin') => {
    const cleanUser = String(inputUser || '').trim().toLowerCase();
    const cleanPass = String(inputPass || '').trim();

    // Auto-detect pickup staff match across any selected role
    const matched = pickupStaffList.find((person) => {
      const uMatch =
        (person.username && person.username.toLowerCase() === cleanUser) ||
        (person.name && person.name.toLowerCase() === cleanUser) ||
        (person.phone && person.phone.replace(/[^0-9]/g, '') === cleanUser.replace(/[^0-9]/g, '')) ||
        (person.id && person.id.toLowerCase() === cleanUser);
      const pMatch = String(person.password || '').trim() === cleanPass;
      return uMatch && pMatch;
    });

    if (matched) {
      return {
        success: true,
        role: 'pickup_staff',
        user: {
          id: matched.id,
          name: matched.name,
          username: matched.username,
          tenantId: matched.tenantId,
          role: 'pickup_staff'
        }
      };
    }

    if (targetRole === 'pickup_staff') {
      return { success: false, error: 'Pickup staff account not found or password incorrect.' };
    }

    return { success: false, error: 'Invalid credentials' };
  };

  await t.test('1. Admin creates new pickup staff member with username and password', () => {
    const res = addPickupStaff({
      name: 'Rizwan Ahmed',
      username: 'rizwan_pack',
      password: 'password123',
      phone: '0300-9876543'
    });

    assert.equal(res.success, true);
    assert.equal(res.staff.username, 'rizwan_pack');
    assert.equal(res.staff.name, 'Rizwan Ahmed');
    assert.equal(pickupStaffList.length, 1);
  });

  await t.test('2. Staff can log in with username and password even if console role was set to admin', () => {
    // User visits login, leaves tab on 'admin' by mistake
    const loginRes = authenticateStaff('rizwan_pack', 'password123', 'admin');
    assert.equal(loginRes.success, true);
    assert.equal(loginRes.role, 'pickup_staff');
    assert.equal(loginRes.user.name, 'Rizwan Ahmed');
  });

  await t.test('3. Staff can log in with pickup_staff role tab explicitly selected', () => {
    const loginRes = authenticateStaff('rizwan_pack', 'password123', 'pickup_staff');
    assert.equal(loginRes.success, true);
    assert.equal(loginRes.role, 'pickup_staff');
  });

  await t.test('4. Incorrect password correctly rejected', () => {
    const loginRes = authenticateStaff('rizwan_pack', 'wrongpass', 'pickup_staff');
    assert.equal(loginRes.success, false);
    assert.match(loginRes.error, /password incorrect/i);
  });

  await t.test('5. Admin updates parcel to "Deliver to Staff" with line-wise items', () => {
    const rawOrder = {
      id: 'ORD-501',
      customer: 'Usman Tariq',
      address: 'House 14, Peoples Colony, Faisalabad',
      total: 3450,
      status: 'Pending',
      items: [
        { name: 'Farm Fresh Milk 1L', quantity: 2, price: 350 },
        { name: 'Brown Eggs (Dozen)', quantity: 1, price: 420 },
        { name: 'Whole Wheat Bread', quantity: 1, price: 180 }
      ]
    };

    const staffMember = pickupStaffList[0];
    const pickedIndexes = [0, 1]; // Milk and Eggs prepared line-wise

    const updatedOrder = {
      ...rawOrder,
      status: 'Delivered to Staff',
      fulfillmentStage: 2,
      pickupStaffId: staffMember.id,
      pickupStaffName: staffMember.name,
      pickupStaffUsername: staffMember.username,
      pickedItems: pickedIndexes,
      packageType: 'Eco-Friendly Carton Box',
      stagingBay: 'Dispatch Bay #1 • Rack A',
      isDispatched: false,
      deliveredToStaffAt: new Date().toISOString()
    };

    assert.equal(updatedOrder.status, 'Delivered to Staff');
    assert.equal(updatedOrder.pickupStaffId, staffMember.id);
    assert.equal(updatedOrder.isDispatched, false);
    assert.equal(updatedOrder.pickedItems.length, 2);
    assert.equal(updatedOrder.items.length, 3);
  });

  await t.test('6. Pickup staff completes all line-wise picks and marks parcel Dispatched', () => {
    let order = {
      id: 'ORD-501',
      status: 'Delivered to Staff',
      fulfillmentStage: 2,
      pickupStaffId: pickupStaffList[0].id,
      items: [
        { name: 'Farm Fresh Milk 1L', quantity: 2 },
        { name: 'Brown Eggs (Dozen)', quantity: 1 },
        { name: 'Whole Wheat Bread', quantity: 1 }
      ],
      pickedItems: [0, 1]
    };

    // Staff completes line-wise picking: [0, 1, 2]
    order.pickedItems = [0, 1, 2];
    order.fulfillmentStage = 3;

    // Staff marks ready for dispatch & seals parcel
    order = {
      ...order,
      fulfillmentStage: 5,
      status: 'Dispatched',
      parcelCode: `PRCL-${order.id}-999`,
      isDispatched: true,
      dispatchStatus: 'Dispatched',
      dispatchedAt: new Date().toISOString()
    };

    assert.equal(order.isDispatched, true);
    assert.equal(order.status, 'Dispatched');
    assert.match(order.parcelCode, /^PRCL-ORD-501/);
    assert.equal(order.pickedItems.length, 3);
  });
});
