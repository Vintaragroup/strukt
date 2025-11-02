import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { connectDB } from './db/connection.js'
import { config } from './config/env.js'
import { authOptional } from './middleware/authOptional.js'
import workspacesRouter from './routes/workspaces.js'
import workspacesContextRouter from './routes/workspaces-context.js'
import persistenceRouter from './routes/persistence.js'
import retryRouter from './routes/retry.js'
import aiRouter from './routes/ai.js'
import prdRouter from './routes/prd.js'
import generationRouter from './routes/generation.js'
import wizardRouter from './routes/wizard.js'
import suggestionsRouter from './routes/suggestions.js'
import feedbackRouter from './routes/feedback.js'
import cardsRouter from './routes/cards.js'
import integrationsRouter from './routes/integrations.js'
import kbRouter from './routes/kb.js'

const app: Express = express()

// Middleware
app.use(helmet())
app.use(morgan('combined'))
app.use(cors())
app.use(compression()) // Task 3.9: Enable gzip compression for responses
app.use(express.json({ limit: '10mb' }))

// Auth middleware
app.use(authOptional)

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/workspaces', workspacesRouter)
app.use('/api/workspaces', workspacesContextRouter)
app.use('/api/workspaces', persistenceRouter)
app.use('/api/generation', retryRouter)
app.use('/api/ai', aiRouter)
app.use('/api/prd-templates', prdRouter)
app.use('/api/generation', generationRouter)
app.use('/api/wizard', wizardRouter)
app.use('/api/suggestions', suggestionsRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/cards', cardsRouter)
app.use('/api/integrations', integrationsRouter)
app.use('/api/kb', kbRouter)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' })
})

// Error handler
app.use((err: any, req: Request, res: Response) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' })
})

// Start server
async function start() {
  try {
    await connectDB()
    app.listen(config.port, () => {
      console.log(`✅ Server running on http://localhost:${config.port}`)
      console.log(`📊 Environment: ${config.nodeEnv}`)
      console.log(`🔑 OpenAI API: ${config.openaiApiKey ? 'configured' : 'not configured (using heuristics)'}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()

export default app
