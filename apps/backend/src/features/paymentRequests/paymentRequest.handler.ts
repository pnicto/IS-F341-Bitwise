import { PaymentRequest, PaymentStatus } from '@prisma/client'
import { RequestHandler } from 'express'
import { body, param, query } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, Forbidden, NotFound } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'

export const validatePaymentRequest = [
	body('requesteeUsername')
		.trim()
		.notEmpty()
		.withMessage('To account is required'),
	body('amount')
		.isInt({ min: 1 })
		.toInt()
		.withMessage('Amount must be a number'),
]
export const requestPayment: RequestHandler = async (req, res, next) => {
	try {
		const { requesteeUsername, amount } =
			validateRequest<Pick<PaymentRequest, 'requesteeUsername' | 'amount'>>(req)
		const requester = getAuthorizedUser(req)

		const requestee = await prisma.user.findUnique({
			where: { username: requesteeUsername },
		})

		if (requester.username === requesteeUsername) {
			throw new BadRequest('Cannot request payment from self')
		}
		if (!requestee) {
			throw new NotFound('Requestee not found')
		}
		if (!requestee.enabled) {
			throw new BadRequest('Requestee account is disabled')
		}
		if (requestee.role === 'ADMIN') {
			throw new BadRequest('Cannot request payment from admin')
		}

		await prisma.paymentRequest.create({
			data: {
				requesterUsername: requester.username,
				requesteeUsername,
				amount,
			},
		})
		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'Payment request created successfully' })
	} catch (err) {
		next(err)
	}
}

export const validateSplitRequest = [
	param('id').trim().notEmpty().withMessage('Transaction ID is required'),
	body('requesteeUsernames')
		.isArray({ min: 1 })
		.withMessage('At least one requestee is required'),
	body('includeSelf')
		.isBoolean()
		.withMessage('Include self field must be a boolean'),
]
export const splitPaymentRequest: RequestHandler = async (req, res, next) => {
	try {
		const { id, requesteeUsernames, includeSelf } = validateRequest<{
			id: string
			requesteeUsernames: string[]
			includeSelf: boolean
		}>(req)
		const requester = getAuthorizedUser(req)

		const transaction = await prisma.transaction.findUnique({
			where: { id },
		})
		if (!transaction) {
			throw new NotFound('Transaction not found')
		}
		if (transaction.senderUsername !== requester.username) {
			throw new Forbidden('User is not the person who paid for the transaction')
		}

		if (requesteeUsernames.includes(transaction.senderUsername)) {
			throw new BadRequest('Cannot request payment from self')
		}
		const isAdminInRequestees = await prisma.user.findFirst({
			where: { username: { in: requesteeUsernames }, role: 'ADMIN' },
		})
		if (isAdminInRequestees) {
			throw new BadRequest('Cannot request payment from admin')
		}
		const requestees = await prisma.user.findMany({
			where: { username: { in: requesteeUsernames }, enabled: true },
		})
		const requesteeUsernamesFound = requestees.map(
			(requestee) => requestee.username,
		)
		const requesteeUsernamesNotFound = requesteeUsernames.filter(
			(requesteeUsername) =>
				!requesteeUsernamesFound.includes(requesteeUsername),
		)
		if (requesteeUsernamesNotFound.length > 0) {
			throw new BadRequest(
				`Requestee(s) either not found or have their accounts disabled: ${requesteeUsernamesNotFound.join(
					', ',
				)}`,
			)
		}
		let amountPerRequestee = transaction.amount / requesteeUsernamesFound.length
		if (includeSelf) {
			amountPerRequestee =
				transaction.amount / (requesteeUsernamesFound.length + 1)
		}
		const paymentRequests = requesteeUsernamesFound.map(
			(requesteeUsername) => ({
				requesterUsername: requester.username,
				requesteeUsername: requesteeUsername,
				amount: amountPerRequestee,
			}),
		)
		await prisma.paymentRequest.createMany({
			data: paymentRequests,
		})
		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'Split request created successfully' })
	} catch (err) {
		next(err)
	}
}

export const getPaymentRequests: RequestHandler = async (req, res, next) => {
	try {
		const user = getAuthorizedUser(req)

		const incomingRequests = await prisma.paymentRequest.findMany({
			where: { requesteeUsername: user.username },
			orderBy: { createdAt: 'desc' },
		})
		const outgoingRequests = await prisma.paymentRequest.findMany({
			where: { requesterUsername: user.username },
			orderBy: { createdAt: 'desc' },
		})

		return res
			.status(StatusCodes.OK)
			.json({ incomingRequests, outgoingRequests })
	} catch (err) {
		next(err)
	}
}

export const validateGetPaymentRequestsByStatus = [
	query('status')
		.isIn(Object.values(PaymentStatus).map((status) => status.toLowerCase()))
		.withMessage(
			'Invalid status, status must be one of pending, completed, rejected or cancelled',
		),
]
export const getPaymentRequestsByStatus: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		let { status } = validateRequest<{
			status: PaymentStatus
		}>(req)
		status = status.toUpperCase() as PaymentStatus
		const user = getAuthorizedUser(req)

		const requests = await prisma.paymentRequest.findMany({
			where: {
				OR: [
					{ requesterUsername: user.username },
					{ requesteeUsername: user.username },
				],
				status,
			},
			select: {
				id: true,
				requesterUsername: true,
				requesteeUsername: true,
				amount: true,
				status: true,
			},
		})
		return res.status(StatusCodes.OK).json({ requests })
	} catch (err) {
		next(err)
	}
}

export const validatePaymentRequestResponse = [
	param('id').trim().notEmpty().withMessage('Request ID is required'),
	body('accept').isBoolean().withMessage('Accept field is required'),
]
export const respondToPaymentRequest: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { id, accept } = validateRequest<{
			id: string
			accept: boolean
		}>(req)
		const requestee = getAuthorizedUser(req)

		const request = await prisma.paymentRequest.findUnique({
			where: { id },
		})
		if (!request) {
			throw new NotFound('Request not found')
		}
		if (request.requesteeUsername !== requestee.username) {
			throw new Forbidden('User is not requestee')
		}
		if (request.status !== 'PENDING') {
			if (request.status === 'COMPLETED') {
				throw new BadRequest('Request has already been accepted')
			}
			if (request.status === 'CANCELLED') {
				throw new BadRequest('Request has been cancelled by requester')
			}
			if (request.status === 'REJECTED') {
				throw new BadRequest('Request has already been rejected')
			}
		}
		if (!requestee.enabled) {
			throw new BadRequest('Requestee account is disabled')
		}
		if (accept) {
			if (requestee.balance > request.amount) {
				await prisma.$transaction([
					prisma.user.update({
						where: { username: request.requesterUsername },
						data: { balance: { increment: request.amount } },
					}),
					prisma.user.update({
						where: { username: request.requesteeUsername },
						data: { balance: { decrement: request.amount } },
					}),
					prisma.paymentRequest.update({
						where: { id },
						data: { status: 'COMPLETED' },
					}),
					prisma.transaction.create({
						data: {
							amount: request.amount,
							senderUsername: request.requesteeUsername,
							receiverUsername: request.requesterUsername,
						},
					}),
				])
			} else {
				throw new BadRequest('Insufficient balance')
			}
			return res
				.status(StatusCodes.OK)
				.json({ message: 'Payment request accepted' })
		} else {
			await prisma.paymentRequest.update({
				where: { id },
				data: { status: 'REJECTED' },
			})
			return res
				.status(StatusCodes.OK)
				.json({ message: 'Payment request rejected' })
		}
	} catch (err) {
		next(err)
	}
}

export const validateCancelPaymentRequest = [
	param('id').trim().notEmpty().withMessage('Request ID is required'),
]
export const cancelPaymentRequest: RequestHandler = async (req, res, next) => {
	try {
		const { id } = validateRequest<Pick<PaymentRequest, 'id'>>(req)
		const user = getAuthorizedUser(req)

		const request = await prisma.paymentRequest.findUnique({
			where: { id },
		})
		if (!request) {
			throw new NotFound('Request not found')
		}
		if (request.requesterUsername !== user.username) {
			throw new Forbidden('User is not requester')
		}
		if (request.status !== 'PENDING') {
			if (request.status === 'COMPLETED') {
				throw new BadRequest('Request has already been accepted')
			}
			if (request.status === 'CANCELLED') {
				throw new BadRequest('Request has been cancelled by requester')
			}
			if (request.status === 'REJECTED') {
				throw new BadRequest('Request has already been rejected')
			}
		}
		await prisma.paymentRequest.update({
			where: { id },
			data: { status: 'CANCELLED' },
		})
		return res
			.status(StatusCodes.OK)
			.json({ message: 'Payment request cancelled' })
	} catch (err) {
		next(err)
	}
}
