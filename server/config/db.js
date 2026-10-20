import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';

// Fix Windows Node.js DNS resolution for MongoDB Atlas SRV connection strings
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

dotenv.config();

let dbLive = false;
let isConnecting = null;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export const isDbOnline = () => {
  if (process.env.NODE_ENV === 'test') return false;
  return dbLive && mongoose.connection && mongoose.connection.readyState === 1;
};

export const getDbStatus = () => {
  const readyState = mongoose.connection ? mongoose.connection.readyState : 0;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return {
    online: isDbOnline(),
    state: states[readyState] || 'unknown',
    readyState,
    host: mongoose.connection?.host || null,
    port: mongoose.connection?.port || null,
    dbName: mongoose.connection?.name || null,
    modelsLoaded: Object.keys(mongoose.models || {})
  };
};

const DEFAULT_ATLAS_URI =
  'mongodb+srv://hamzatabi654_db_user:fG8Ie2r7NgwE2DNN@cluster0.xhltzke.mongodb.net/freshmart?retryWrites=true&w=majority';

// Register connection state listeners for high resilience
mongoose.connection.on('connected', () => {
  dbLive = true;
  retryCount = 0;
  console.log(`✅ MongoDB Connection Established [${mongoose.connection.host}/${mongoose.connection.name}]`);
});

mongoose.connection.on('error', (err) => {
  console.warn('⚠️ MongoDB runtime error:', err.message);
  dbLive = false;
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected.');
  dbLive = false;
});

mongoose.connection.on('reconnected', () => {
  dbLive = true;
  console.log('🔄 MongoDB automatically reconnected.');
});

export const connectDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    dbLive = false;
    return false;
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    dbLive = true;
    return true;
  }

  if (isConnecting) {
    return await isConnecting;
  }

  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || DEFAULT_ATLAS_URI;

  if (!mongoURI || mongoURI === 'none') {
    dbLive = false;
    console.log('ℹ️ Running in memory data store (set MONGO_URI in .env to connect to live MongoDB).');
    return false;
  }

  isConnecting = (async () => {
    while (retryCount < MAX_RETRIES) {
      try {
        const conn = await mongoose.connect(mongoURI, {
          serverSelectionTimeoutMS: 8000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          heartbeatFrequencyMS: 10000,
          maxPoolSize: 20,
          minPoolSize: 2,
          retryWrites: true,
          retryReads: true
        });
        dbLive = true;
        retryCount = 0;
        console.log(`✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
        return true;
      } catch (error) {
        retryCount++;
        dbLive = false;
        console.warn(
          `⚠️ MongoDB Connection Attempt ${retryCount}/${MAX_RETRIES} Failed: ${error.message}`
        );
        if (retryCount < MAX_RETRIES) {
          console.log(`⏳ Retrying database connection in ${RETRY_DELAY_MS}ms...`);
          await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
        }
      }
    }

    dbLive = false;
    console.warn('⚠️ MongoDB connection could not be established after maximum retries. Switched to high-resilience in-memory store.');
    return false;
  })().finally(() => {
    isConnecting = null;
  });

  return await isConnecting;
};

export const disconnectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    dbLive = false;
  }
};
