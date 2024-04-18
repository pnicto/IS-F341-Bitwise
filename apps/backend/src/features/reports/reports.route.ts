import { Role } from '@prisma/client'
import express from 'express'
import { authorize } from '../../middleware/authorize'
import { getVendorReport, validateVendorReport } from './reports.handler'

export const reportRouter = express.Router()

reportRouter.get(
	'/vendor',
	authorize(Role.VENDOR),
	validateVendorReport,
	getVendorReport,
)
