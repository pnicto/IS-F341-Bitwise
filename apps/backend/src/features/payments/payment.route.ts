import express from 'express'
import { Role } from '@prisma/client'
import { authorize } from '../../middleware/authorize'
import {
	transact,
	validateTransaction,
	requestPayment,
	validatePaymentRequest,
} from './payment.handler'

export const paymentRouter = express.Router()

paymentRouter.post(
	'/',
	authorize(Role.STUDENT, Role.VENDOR),
	validateTransaction,
	transact,
)

paymentRouter.post(
	'/request',
	authorize(Role.STUDENT, Role.VENDOR),
	validatePaymentRequest,
	requestPayment,
)
