import { Role } from '@prisma/client'
import express from 'express'
import { authorize } from '../../middleware/authorize'
import {
	getAdminReport,
	getTimelineReport,
	getVendorReport,
	validateAdminReport,
	validateVendorReport,
} from './reports.handler'

export const reportRouter = express.Router()

reportRouter.get(
	'/vendor',
	authorize(Role.VENDOR),
	validateVendorReport,
	getVendorReport,
)

reportRouter.get(
	'/timeline',
	authorize(Role.STUDENT, Role.VENDOR),
	getTimelineReport,
)

reportRouter.get(
	'/admin',
	authorize(Role.ADMIN),
	validateAdminReport,
	getAdminReport,
)
