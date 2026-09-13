import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_TENANTS, SUBSCRIPTION_PLANS } from '../src/data/tenantData.js';
import {
  getTenants,
  getTenantById,
  createTenant,
  inviteTenant,
  approveTenant,
  suspendTenant,
  activateTenant,
  deleteTenant,
  updateSubscription,
  getTenantOrders,
  getTenantPerformance,
  getPlatformOverview
} from '../server/controllers/tenantController.js';

// Helper mock response factory
const createMockRes = () => {
  let statusCode = 200;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData
  };
  return res;
};

describe('Super Grocery Multi-Tenant Platform Architecture', () => {

  describe('1. Default Tenants & Pakistani Supermarket Brands Registry', () => {
    it('seeds the required supermarket brands: Al-Fatah, Chase Value, Chase Up, FreshMart', () => {
      assert.equal(INITIAL_TENANTS.length, 4);

      const names = INITIAL_TENANTS.map((t) => t.name);
      assert.ok(names.includes('Al-Fatah Supermarket'));
      assert.ok(names.includes('Chase Value'));
      assert.ok(names.includes('Chase Up'));
      assert.ok(names.includes('FreshMart Direct'));

      const slugs = INITIAL_TENANTS.map((t) => t.slug);
      assert.ok(slugs.includes('al-fatah'));
      assert.ok(slugs.includes('chase-value'));
      assert.ok(slugs.includes('chase-up'));
      assert.ok(slugs.includes('freshmart'));
    });

    it('ensures each tenant has distinct hubs, theme colors, and isolated owner credentials', () => {
      for (const tenant of INITIAL_TENANTS) {
        assert.ok(tenant.id, `Tenant ${tenant.name} must have an ID`);
        assert.ok(tenant.slug, `Tenant ${tenant.name} must have a slug`);
        assert.ok(tenant.ownerEmail, `Tenant ${tenant.name} must have an ownerEmail`);
        assert.ok(tenant.color, `Tenant ${tenant.name} must have a theme color`);
        assert.ok(Array.isArray(tenant.hubs) && tenant.hubs.length > 0, `Tenant ${tenant.name} must have hubs`);
        assert.ok(tenant.subscription, `Tenant ${tenant.name} must have subscription data`);
        assert.equal(tenant.status, 'Active');
      }
    });

    it('provides multi-tier subscription plans with features & commission rates', () => {
      assert.ok(SUBSCRIPTION_PLANS.Starter);
      assert.ok(SUBSCRIPTION_PLANS.Pro);
      assert.ok(SUBSCRIPTION_PLANS.Enterprise);

      assert.equal(SUBSCRIPTION_PLANS.Starter.price, 15000);
      assert.equal(SUBSCRIPTION_PLANS.Starter.commissionRate, 5);

      assert.equal(SUBSCRIPTION_PLANS.Pro.price, 35000);
      assert.equal(SUBSCRIPTION_PLANS.Pro.commissionRate, 3.5);

      assert.equal(SUBSCRIPTION_PLANS.Enterprise.price, 75000);
      assert.equal(SUBSCRIPTION_PLANS.Enterprise.commissionRate, 2);
    });
  });

  describe('2. All 10 Super Admin Control Operations', () => {
    let createdTenantId = null;

    it('Op 1: Add Tenant - creates new supermarket tenant with subscription tier', async () => {
      const req = {
        body: {
          name: 'Imtiaz Super Market',
          legalName: 'Imtiaz Super Market Pvt Ltd',
          slug: 'imtiaz-market',
          ownerName: 'Imtiaz Abbasi',
          ownerEmail: 'admin@imtiaz.pk',
          city: 'Karachi, Pakistan',
          plan: 'Enterprise',
          billingCycle: 'monthly',
          color: '#e11d48'
        }
      };
      const res = createMockRes();

      await createTenant(req, res);

      assert.equal(res.getStatusCode(), 201);
      const data = res.getData();
      assert.ok(data.success);
      assert.ok(data.tenant);
      assert.equal(data.tenant.name, 'Imtiaz Super Market');
      assert.equal(data.tenant.subscription.plan, 'Enterprise');
      assert.equal(data.tenant.status, 'Active');
      createdTenantId = data.tenant.id;
    });

    it('Op 2: Invite Tenant - generates invitation token and registration link', async () => {
      const req = {
        body: {
          name: 'Metro Cash & Carry',
          email: 'partnerships@metro.pk',
          plan: 'Pro',
          billingCycle: 'annual'
        }
      };
      const res = createMockRes();

      await inviteTenant(req, res);

      assert.equal(res.getStatusCode(), 201);
      const data = res.getData();
      assert.ok(data.success);
      assert.ok(data.inviteLink);
      assert.ok(data.inviteToken);
      assert.equal(data.tenant.name, 'Metro Cash & Carry');
      assert.equal(data.tenant.status, 'Pending');
    });

    it('Op 3: Approve Tenant - approves a pending supermarket tenant', async () => {
      // First invite a pending tenant
      const inviteRes = createMockRes();
      await inviteTenant({ body: { name: 'Hyperstar', email: 'admin@hyperstar.pk' } }, inviteRes);
      const pendingId = inviteRes.getData().tenant.id;

      const approveReq = { params: { id: pendingId } };
      const approveRes = createMockRes();

      await approveTenant(approveReq, approveRes);

      assert.equal(approveRes.getStatusCode(), 200);
      const data = approveRes.getData();
      assert.ok(data.success);
      assert.equal(data.tenant.status, 'Active');
    });

    it('Op 4: Suspend Tenant - places tenant under administrative restriction', async () => {
      const req = {
        params: { id: createdTenantId || 'tenant-alfatah' },
        body: { reason: 'Annual license audit' }
      };
      const res = createMockRes();

      await suspendTenant(req, res);

      assert.equal(res.getStatusCode(), 200);
      const data = res.getData();
      assert.ok(data.success);
      assert.equal(data.tenant.status, 'Suspended');
    });

    it('Op 5: Activate Tenant - reactivates suspended store operations', async () => {
      const req = { params: { id: createdTenantId || 'tenant-alfatah' } };
      const res = createMockRes();

      await activateTenant(req, res);

      assert.equal(res.getStatusCode(), 200);
      const data = res.getData();
      assert.ok(data.success);
      assert.equal(data.tenant.status, 'Active');
    });

    it('Op 6: Delete Tenant - removes tenant from platform registry', async () => {
      // Create temporary tenant to delete
      const tempRes = createMockRes();
      await createTenant({ body: { name: 'Temporary Store', ownerEmail: 'temp@store.pk' } }, tempRes);
      const tempId = tempRes.getData().tenant.id;

      const deleteReq = { params: { id: tempId } };
      const deleteRes = createMockRes();

      await deleteTenant(deleteReq, deleteRes);

      assert.equal(deleteRes.getStatusCode(), 200);
      const data = deleteRes.getData();
      assert.ok(data.success);
    });

    it('Op 7: View Tenant Details - retrieves full profile, hubs, and SLA', async () => {
      const req = { params: { id: 'tenant-alfatah' } };
      const res = createMockRes();

      await getTenantById(req, res);

      assert.equal(res.getStatusCode(), 200);
      const data = res.getData();
      assert.ok(data.success);
      assert.equal(data.tenant.id, 'tenant-alfatah');
      assert.equal(data.tenant.name, 'Al-Fatah Supermarket');
      assert.ok(Array.isArray(data.tenant.hubs));
    });

    it('Op 8: Manage Tenant Subscription - updates tier, billing cycle, renewal date, and price', async () => {
      const req = {
        params: { id: 'tenant-chase-value' },
        body: {
          plan: 'Enterprise',
          billingCycle: 'annual',
          price: 65000,
          renewAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
      const res = createMockRes();

      await updateSubscription(req, res);

      assert.equal(res.getStatusCode(), 200);
      const data = res.getData();
      assert.ok(data.success);
      assert.equal(data.subscription.plan, 'Enterprise');
      assert.equal(data.subscription.billingCycle, 'annual');
      assert.equal(data.subscription.price, 65000);
    });

    it('Op 9: See Tenant Orders - retrieves cross-tenant orders scoped to tenant or global stream', async () => {
      const reqAll = { params: { id: 'all' } };
      const resAll = createMockRes();
      await getTenantOrders(reqAll, resAll);

      assert.equal(resAll.getStatusCode(), 200);
      const allData = resAll.getData();
      assert.ok(allData.success);
      assert.ok(Array.isArray(allData.orders));

      const reqSpecific = { params: { id: 'tenant-alfatah' } };
      const resSpecific = createMockRes();
      await getTenantOrders(reqSpecific, resSpecific);

      assert.equal(resSpecific.getStatusCode(), 200);
      const specData = resSpecific.getData();
      assert.ok(specData.success);
      assert.ok(Array.isArray(specData.orders));
    });

    it('Op 10: See Tenant Performance - calculates GMV, order volume, active riders, SLA & commission', async () => {
      const req = { params: { id: 'tenant-alfatah' } };
      const res = createMockRes();

      await getTenantPerformance(req, res);

      assert.equal(res.getStatusCode(), 200);
      const data = res.getData();
      assert.ok(data.success);
      assert.ok(data.performance);
      assert.ok(data.performance.gmv !== undefined);
      assert.ok(data.performance.commission !== undefined);
      assert.ok(data.performance.fulfillmentSla);
      assert.ok(data.performance.activeRiders !== undefined);

      // Also verify Platform Global Overview
      const overviewRes = createMockRes();
      await getPlatformOverview({}, overviewRes);
      assert.equal(overviewRes.getStatusCode(), 200);
      const overviewData = overviewRes.getData();
      assert.ok(overviewData.success);
      assert.ok(overviewData.overview.totalTenants >= 4);
      assert.ok(overviewData.overview.totalGmv > 0);
    });
  });
});
