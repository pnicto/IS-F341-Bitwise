import express from 'express'
import { Role } from '@prisma/client'
import { authorize } from '../../middleware/authorize'
import {
	transact,
	validateTransaction,
	requestPayment,
	validatePaymentRequest,
	respondToPaymentRequest,
	validatePaymentRequestResponse,
	validateGetPaymentRequests,
	getPaymentRequests,
} from './payment.handler'

export const paymentRouter = express.Router()

paymentRouter.get(
	'/requests',
	authorize(Role.STUDENT, Role.VENDOR),
	validateGetPaymentRequests,
	getPaymentRequests,
)

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

paymentRouter.post(
	'/respond',
	authorize(Role.STUDENT, Role.VENDOR),
	validatePaymentRequestResponse,
	respondToPaymentRequest,
)
