import express from 'express'
import { createAccount } from './handler'

export const adminDashboardRouter = express.Router()
adminDashboardRouter.post('/create', createAccount)
