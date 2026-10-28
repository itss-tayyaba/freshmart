const DEFAULT_ALLOWED_ORIGINS = [
  'https://grocery-fawn-five.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000'
];

export const isOriginAllowed = (origin) => {
  // Allow requests with no origin (like mobile apps, curl, postman, same-origin)
  if (!origin) return true;

  const envOrigins = [
    ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim()) : []),
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : [])
  ];

  const allAllowed = [...DEFAULT_ALLOWED_ORIGINS, ...envOrigins];

  // Direct exact match
  if (allAllowed.includes(origin)) return true;

  // Allow verified freshmart and grocery *.vercel.app preview and production deployments
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith('.vercel.app')) {
      if (
        host === 'freshmart-eosin-iota.vercel.app' ||
        host === 'grocery-fawn-five.vercel.app' ||
        host.startsWith('freshmart-') ||
        host.startsWith('grocery-')
      ) {
        return true;
      }
      return false;
    }
  } catch (e) {
    return false;
  }

  return false;
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: Origin '${origin}' is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400
};
