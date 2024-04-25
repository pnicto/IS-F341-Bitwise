import { Role } from '@prisma/client'
import express from 'express'
import { authorize } from '../../middleware/authorize'
import {
	getAdminReport,
	getCategorizedExpenditure,
	getTimelineReport,
	getVendorReport,
	validateAdminReport,
	validateCategorizedExpenditure,
	validateTimelineReport,
	validateVendorReport,
} from './reports.handler'

export const reportsRouter = express.Router()

reportsRouter.get(
	'/categorized-expenditure',
	authorize(Role.STUDENT, Role.VENDOR),
	validateCategorizedExpenditure,
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
	validateTimelineReport,
	getTimelineReport,
)

reportsRouter.get(
	'/admin',
	authorize(Role.ADMIN),
	validateAdminReport,
	getAdminReport,
)
