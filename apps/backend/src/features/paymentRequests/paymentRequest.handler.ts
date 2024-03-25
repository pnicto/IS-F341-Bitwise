import { PaymentRequest, PaymentStatus } from '@prisma/client'
import { RequestHandler } from 'express'
import { body, query } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, Unauthorized } from '../../errors/CustomErrors'
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
		if (!requestee) {
			throw new BadRequest('Requestee not found')
		}
		if (!requestee.enabled) {
			throw new BadRequest('Requestee account is disabled')
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

export const validateGetPaymentRequests = [
	query('status')
		.optional()
		.isIn(Object.values(PaymentStatus).map((status) => status.toLowerCase()))
		.withMessage(
			'Invalid status, status must be one of pending, completed, rejected or cancelled',
		),
]

export const getPaymentRequests: RequestHandler = async (req, res, next) => {
	try {
		let { status } = validateRequest<{
			status?: PaymentStatus
		}>(req)
		status = status?.toUpperCase() as PaymentStatus
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
	body('requestId').trim().notEmpty().withMessage('Request ID is required'),
	body('response')
		.trim()
		.isIn(['accept', 'reject'])
		.withMessage('Invalid response'),
]

export type PaymentRequestResponse = {
	requestId: string
	response: 'accept' | 'reject'
}

export const respondToPaymentRequest: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { requestId, response } = validateRequest<PaymentRequestResponse>(req)
		const requestee = getAuthorizedUser(req)

		const request = await prisma.paymentRequest.findUnique({
			where: { id: requestId },
		})
		if (!request) {
			throw new BadRequest('Request not found')
		}
		if (request.requesteeUsername !== requestee.username) {
			throw new Unauthorized('Unauthorized, user is not requestee')
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
		if (response === 'accept') {
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
						where: { id: requestId },
						data: { status: 'COMPLETED' },
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
				where: { id: requestId },
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
	body('id').trim().notEmpty().withMessage('Request ID is required'),
]

export const cancelPaymentRequest: RequestHandler = async (req, res, next) => {
	try {
		const { id } = validateRequest<Pick<PaymentRequest, 'id'>>(req)
		const user = getAuthorizedUser(req)

		const request = await prisma.paymentRequest.findUnique({
			where: { id },
		})
		if (!request) {
			throw new BadRequest('Request not found')
		}
		if (request.requesterUsername !== user.username) {
			throw new Unauthorized('Unauthorized, user is not requester')
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
