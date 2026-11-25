import '../config/env.js'
import mongoose from 'mongoose'
import User from '../models/User.js'
import { bootstrapAdmin } from '../services/authService.js'

const required = ['INITIAL_ADMIN_NAME', 'INITIAL_ADMIN_EMAIL', 'INITIAL_ADMIN_PASSWORD']

try {
  const missing = required.filter((key) => !process.env[key])
  if (missing.length) throw new Error(`Missing bootstrap environment variables: ${missing.join(', ')}`)
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 })
  if (await User.exists({ role: 'ADMIN' })) throw new Error('An administrator already exists; bootstrap refused')
  const profile = await bootstrapAdmin({
    fullName: process.env.INITIAL_ADMIN_NAME,
    email: process.env.INITIAL_ADMIN_EMAIL,
    phone: process.env.INITIAL_ADMIN_PHONE,
    password: process.env.INITIAL_ADMIN_PASSWORD,
  })
  console.log(`Administrator created: ${profile.email}`)
} catch (error) {
  console.error(`Administrator bootstrap failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect().catch(() => {})
}
