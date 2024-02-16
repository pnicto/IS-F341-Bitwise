import express from 'express'
import { login } from './handler'

export const authRouter = express.Router()

authRouter.post('/login', login)
