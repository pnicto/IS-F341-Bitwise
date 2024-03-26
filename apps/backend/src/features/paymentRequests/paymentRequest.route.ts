import express from 'express'
import { Role } from '@prisma/client'
import { authorize } from '../../middleware/authorize'
import {
	getPaymentRequestsByStatus,
	requestPayment,
	validatePaymentRequest,
	respondToPaymentRequest,
	validatePaymentRequestResponse,
	validateGetPaymentRequests,
	getPaymentRequests,
	validateCancelPaymentRequest,
	cancelPaymentRequest,
} from './paymentRequest.handler'

export const paymentRequestRouter = express.Router()

paymentRequestRouter.get(
	'/',
	authorize(Role.STUDENT, Role.VENDOR),
	validateGetPaymentRequests,
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
