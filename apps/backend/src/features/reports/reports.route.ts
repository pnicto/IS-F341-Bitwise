import { Role } from '@prisma/client'
import express from 'express'
import { authorize } from '../../middleware/authorize'
import { getCategorizedExpenditure } from './reports.handler'

export const reportsRouter = express.Router()

reportsRouter.get(
	'/categorized-expenditure',
	authorize(Role.STUDENT, Role.VENDOR),
	getCategorizedExpenditure,
)
