import mongoose from 'mongoose'
import { config } from '../config/env.js'

export async function connectDB(): Promise<void> {
  try {
    // Task 3.9: Optimized connection pooling settings
    await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10, // Default is 100, reducing for development
      minPoolSize: 5, // Maintain minimum connections
      maxIdleTimeMS: 45000, // Connection idle timeout (45 seconds)
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
      waitQueueTimeoutMS: 10000, // Time to wait for connection from pool
      family: 4, // Use IPv4
    })
    console.log('✅ MongoDB connected:', config.mongodbUri)
    console.log('📊 Connection pool configured: min=5, max=10, timeout=45s')
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    process.exit(1)
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect()
  console.log('Disconnected from MongoDB')
}
