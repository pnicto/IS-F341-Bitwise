import express from 'express'
import { createAccount, validateNewUser } from './handler'

export const adminDashboardRouter = express.Router()
adminDashboardRouter.post('/create', validateNewUser, createAccount)
