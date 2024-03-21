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
