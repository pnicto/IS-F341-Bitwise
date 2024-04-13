import { Role } from '@prisma/client'
import express from 'express'
import { authorize } from '../../middleware/authorize'
import { getTimelineReport } from './reports.handler'

export const reportRouter = express.Router()

reportRouter.get(
	'/timeline',
	authorize(Role.STUDENT, Role.VENDOR),
	getTimelineReport,
)
