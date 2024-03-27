import express from 'express'
import { Role } from '@prisma/client'
import { authorize } from '../../middleware/authorize'
import { transact, validateTransaction } from './payment.handler'

export const paymentRouter = express.Router()

paymentRouter.post(
	'/',
	authorize(Role.STUDENT, Role.VENDOR),
	validateTransaction,
	transact,
)
