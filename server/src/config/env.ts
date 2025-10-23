import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '5050', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whiteboard',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  openaiApiKey: process.env.OPENAI_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
}

export const isDev = config.nodeEnv === 'development'
