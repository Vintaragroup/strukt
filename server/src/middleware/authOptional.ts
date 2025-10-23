import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

export interface AuthRequest extends Request {
  user?: { sub: string; email?: string }
}

export function authOptional(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { sub: string; email?: string }
    req.user = decoded
  } catch (error) {
    console.warn('Invalid token:', error)
    // Continue as guest
  }
  next()
}
