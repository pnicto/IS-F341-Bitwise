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
	validateSplitRequest,
	splitPaymentRequest,
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
	'/respond/:id',
	authorize(Role.STUDENT, Role.VENDOR),
	validatePaymentRequestResponse,
	respondToPaymentRequest,
)

paymentRequestRouter.post(
	'/cancel/:id',
	authorize(Role.STUDENT, Role.VENDOR),
	validateCancelPaymentRequest,
	cancelPaymentRequest,
)

paymentRequestRouter.post(
	'/:id/split',
	authorize(Role.STUDENT, Role.VENDOR),
	validateSplitRequest,
	splitPaymentRequest,
)
