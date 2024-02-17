import express from 'express'
import { adminDashboardRouter } from './admin/route'

export const dashboardRouter = express.Router()

dashboardRouter.use('/admin', adminDashboardRouter)
