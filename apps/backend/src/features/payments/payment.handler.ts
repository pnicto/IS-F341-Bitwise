import { PaymentRequest, Transaction } from '@prisma/client'
import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'

export const validateTransaction = [
	body('receiverUsername')
		.trim()
		.notEmpty()
		.withMessage('To account is required'),
	body('amount')
		.isInt({ min: 1 })
		.toInt()
		.withMessage('Amount must be a number'),
]

export const transact: RequestHandler = async (req, res, next) => {
	try {
		const { receiverUsername, amount } =
			validateRequest<Pick<Transaction, 'receiverUsername' | 'amount'>>(req)
		const sender = getAuthorizedUser(req)

		const receiver = await prisma.user.findUnique({
			where: { username: receiverUsername },
		})
		if (!receiver) {
			throw new BadRequest('Receiver not found')
		}
		if (!receiver.enabled) {
			throw new BadRequest('Receiver account is disabled')
		}
		if (sender.balance < amount) {
			throw new BadRequest('Insufficient balance')
		}
		await prisma.$transaction([
			prisma.user.update({
				where: { username: sender.username },
				data: { balance: { decrement: amount } },
			}),
			prisma.user.update({
				where: { username: receiverUsername },
				data: { balance: { increment: amount } },
			}),
			prisma.transaction.create({
				data: {
					senderUsername: sender.username,
					receiverUsername,
					amount,
				},
			}),
		])
		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'Transaction successful' })
	} catch (err) {
		next(err)
	}
}

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
			throw new BadRequest('Unauthorized')
		}
		if (request.status !== 'PENDING') {
			throw new BadRequest('Request already responded to')
		}

		if (response === 'accept') {
			if (requestee.balance < request.amount) {
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
						data: { status: 'COMPLETED'},
					}),
				])
			}
			else {
				throw new BadRequest('Insufficient balance')
			}
		} else {
			await prisma.paymentRequest.update({
				where: { id: requestId },
				data: { status: 'CANCELLED'},
			})
		}
		return res
			.status(StatusCodes.OK)
			.json({ message: 'Payment request responded to' })
	} catch (err) {
		next(err)
	}
}
