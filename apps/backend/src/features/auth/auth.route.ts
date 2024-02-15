import express from 'express'
import { createAccount } from './auth.handler'

export const authRouter = express.Router()
authRouter.post('/create', createAccount)
