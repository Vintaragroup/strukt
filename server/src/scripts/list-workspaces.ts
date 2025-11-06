#!/usr/bin/env tsx

import mongoose from 'mongoose'
import { config } from 'dotenv'

const envCandidate = new URL('../.env', import.meta.url)
const distAwareCandidate = new URL('../../.env', import.meta.url)

const primary = config({ path: envCandidate })
if (primary.error) {
  config({ path: distAwareCandidate })
}

const redact = (uri: string) =>
  uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@]+):([^@]+)@/i, (_match, prefix, user) => `${prefix}${user}:******@`)

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI
  if (!uri) {
    console.error('No MongoDB URI found in environment variables.')
    process.exit(1)
  }

  const { default: Workspace } = await import('../models/Workspace.js')

  console.log(`Connecting to ${redact(uri)}`)
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })

  const docs = await Workspace.find({}, { name: 1 }).sort({ updatedAt: -1 }).limit(10).lean()
  console.log(`Found ${docs.length} workspaces:`)
  for (const doc of docs) {
    console.log(`- ${doc._id.toString()} :: ${doc.name}`)
  }

  await mongoose.disconnect()
  console.log('Disconnected.')
}

main().catch((error) => {
  console.error('Failed to list workspaces:', error)
  process.exit(1)
})
