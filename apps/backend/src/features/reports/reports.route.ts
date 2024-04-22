import { Role } from '@prisma/client'
import express from 'express'
import { authorize } from '../../middleware/authorize'
import {
	getCategorizedExpenditure,
	getTimelineReport,
	getVendorReport,
	validateVendorReport,
} from './reports.handler'

export const reportsRouter = express.Router()

reportsRouter.get(
	'/categorized-expenditure',
	authorize(Role.STUDENT, Role.VENDOR),
	getCategorizedExpenditure,
)

reportsRouter.get(
	'/vendor',
	authorize(Role.VENDOR),
	validateVendorReport,
	getVendorReport,
)

reportsRouter.get(
	'/timeline',
	authorize(Role.STUDENT, Role.VENDOR),
	getTimelineReport,
)
