import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';

// Fix Windows Node.js DNS resolution for MongoDB Atlas SRV connection strings
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config();

let dbLive = false;
let isConnecting = null;

export const isDbOnline = () => {
  return dbLive && mongoose.connection && mongoose.connection.readyState === 1;
};

const DEFAULT_ATLAS_URI = 'mongodb+srv://hamzatabi654_db_user:fG8Ie2r7NgwE2DNN@cluster0.xhltzke.mongodb.net/freshmart?retryWrites=true&w=majority';

// Register connection state listeners
mongoose.connection.on('connected', () => {
  dbLive = true;
});
mongoose.connection.on('error', (err) => {
  console.warn('⚠️ MongoDB runtime error:', err.message);
  dbLive = false;
});
mongoose.connection.on('disconnected', () => {
  dbLive = false;
});

export const connectDB = async () => {
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
    try {
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10
      });
      dbLive = true;
      console.log(`✅ MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
      return true;
    } catch (error) {
      dbLive = false;
      console.warn(`⚠️ MongoDB Connection Error (${error.message}). Switched to memory store.`);
      return false;
    } finally {
      isConnecting = null;
    }
  })();

  return await isConnecting;
};
