import { Role } from '@prisma/client'
import express from 'express'
import { authorize } from '../../middleware/authorize'
import {
	cancelPaymentRequest,
	getPaymentRequests,
	getPaymentRequestsByStatus,
	requestPayment,
	respondToPaymentRequest,
	validateCancelPaymentRequest,
	validateGetPaymentRequestsByStatus,
	validatePaymentRequest,
	validatePaymentRequestResponse,
} from './paymentRequest.handler'

export const paymentRequestRouter = express.Router()

paymentRequestRouter.get(
	'/all',
	authorize(Role.STUDENT, Role.VENDOR),
	getPaymentRequests,
)

paymentRequestRouter.get(
	'/',
	authorize(Role.STUDENT, Role.VENDOR),
	validateGetPaymentRequestsByStatus,
	getPaymentRequestsByStatus,
)

paymentRequestRouter.post(
	'/',
	authorize(Role.STUDENT, Role.VENDOR),
	validatePaymentRequest,
	requestPayment,
)

paymentRequestRouter.post(
	'/respond',
	authorize(Role.STUDENT, Role.VENDOR),
	validatePaymentRequestResponse,
	respondToPaymentRequest,
)

paymentRequestRouter.post(
	'/cancel',
	authorize(Role.STUDENT, Role.VENDOR),
	validateCancelPaymentRequest,
	cancelPaymentRequest,
)
