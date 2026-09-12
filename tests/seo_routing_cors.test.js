import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseRouteFromUrl, getSeoMetadata } from '../src/utils/routeUtils.js';
import { isOriginAllowed } from '../server/config/corsOptions.js';

const MOCK_PRODUCTS = [
  { id: '1', customId: 'fresh-apples-1kg', name: 'Fresh Apples 1kg', price: 240, category: 'Fruits' },
  { id: '2', customId: 'organic-milk-1l', name: 'Organic Milk 1L', price: 260, category: 'Dairy' },
  { id: '3', customId: 'brown-bread', name: 'Whole Wheat Bread', price: 150, category: 'Bakery' },
];

describe('Client-Side Routing & Shareable URL Parser', () => {
  const withMockLocation = (urlObj, fn) => {
    const originalWindow = global.window;
    global.window = {
      location: {
        pathname: urlObj.pathname || '/',
        hash: urlObj.hash || '',
        search: urlObj.search || ''
      }
    };
    try {
      fn();
    } finally {
      global.window = originalWindow;
    }
  };

  it('parses home root route correctly', () => {
    withMockLocation({ pathname: '/' }, () => {
      const route = parseRouteFromUrl(MOCK_PRODUCTS);
      assert.equal(route.page, 'home');
    });
  });

  it('parses /shop route and extracts category query param', () => {
    withMockLocation({ pathname: '/shop', search: '?category=Fruits' }, () => {
      const route = parseRouteFromUrl(MOCK_PRODUCTS);
      assert.equal(route.page, 'shop');
      assert.equal(route.category, 'Fruits');
    });
  });

  it('parses /product/:id route and resolves matched product from catalog', () => {
    withMockLocation({ pathname: '/product/fresh-apples-1kg' }, () => {
      const route = parseRouteFromUrl(MOCK_PRODUCTS);
      assert.equal(route.page, 'product-detail');
      assert.ok(route.product);
      assert.equal(route.product.name, 'Fresh Apples 1kg');
      assert.equal(route.product.price, 240);
    });
  });

  it('parses /product?id=2 query parameter route and resolves product', () => {
    withMockLocation({ pathname: '/product', search: '?id=2' }, () => {
      const route = parseRouteFromUrl(MOCK_PRODUCTS);
      assert.equal(route.page, 'product-detail');
      assert.ok(route.product);
      assert.equal(route.product.customId, 'organic-milk-1l');
    });
  });

  it('parses operational dashboards and static pages (/admin, /vendor, /deals, /recipes, /delivery, /checkout, /customer-portal)', () => {
    const testCases = [
      { pathname: '/admin', expected: 'admin' },
      { pathname: '/vendor', expected: 'vendor' },
      { pathname: '/deals', expected: 'deals' },
      { pathname: '/recipes', expected: 'recipes' },
      { pathname: '/delivery', expected: 'delivery' },
      { pathname: '/checkout', expected: 'checkout' },
      { pathname: '/customer-portal', expected: 'customer-portal' }
    ];

    for (const { pathname, expected } of testCases) {
      withMockLocation({ pathname }, () => {
        const route = parseRouteFromUrl(MOCK_PRODUCTS);
        assert.equal(route.page, expected, `Failed for route: ${pathname}`);
      });
    }
  });
});

describe('Dynamic SEO & Document Metadata', () => {
  it('generates dynamic product title and meta description', () => {
    const prod = { name: 'Fresh Apples 1kg', price: 240 };
    const meta = getSeoMetadata('product-detail', prod);
    assert.equal(meta.title, 'Fresh Apples 1kg (Rs. 240) | FreshMart');
    assert.match(meta.description, /Rs\. 240/);
  });

  it('generates category-specific shop titles', () => {
    const meta = getSeoMetadata('shop', null, 'Organic Vegetables');
    assert.equal(meta.title, 'Organic Vegetables - FreshMart Online Grocery');
  });

  it('generates default title for home page', () => {
    const meta = getSeoMetadata('home');
    assert.match(meta.title, /FreshMart/);
  });
});

describe('Production CORS Policy & Origin Whitelist', () => {
  it('allows production Vercel frontend domain', () => {
    assert.equal(isOriginAllowed('https://grocery-fawn-five.vercel.app'), true);
  });

  it('allows local development origins on Vite and Express ports', () => {
    assert.equal(isOriginAllowed('http://localhost:5173'), true);
    assert.equal(isOriginAllowed('http://localhost:3000'), true);
    assert.equal(isOriginAllowed('http://127.0.0.1:5173'), true);
  });

  it('allows Vercel preview deployment subdomains (*.vercel.app)', () => {
    assert.equal(isOriginAllowed('https://grocery-preview-git-feature.vercel.app'), true);
    assert.equal(isOriginAllowed('https://freshmart-stage.vercel.app'), true);
  });

  it('allows non-browser requests (null/undefined origin like curl, mobile apps, same-origin)', () => {
    assert.equal(isOriginAllowed(null), true);
    assert.equal(isOriginAllowed(undefined), true);
    assert.equal(isOriginAllowed(''), true);
  });

  it('blocks unauthorized and malicious third-party origins', () => {
    assert.equal(isOriginAllowed('https://malicious-site.com'), false);
    assert.equal(isOriginAllowed('https://phishing-freshmart.net'), false);
    assert.equal(isOriginAllowed('http://evil-tracker.org'), false);
  });
});
