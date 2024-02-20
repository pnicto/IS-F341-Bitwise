import express from 'express'
import { createAccount, validateNewUser } from './admin.handler'

export const adminRouter = express.Router()

adminRouter.post('/create', validateNewUser, createAccount)
