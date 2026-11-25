import mongoose from 'mongoose'

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('⚠️  MONGO_URI is not set; MongoDB is not configured')
    return { configured: false, connected: false, error: 'MONGO_URI is not set' }
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 15000),
    })
    console.log('✅ MongoDB Connected successfully')
    return { configured: true, connected: true, error: null }
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`)
    return { configured: true, connected: false, error: error.message }
  }
}

export const getDatabaseStatus = () => ({
  configured: Boolean(process.env.MONGO_URI),
  connected: mongoose.connection.readyState === 1,
  state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
})