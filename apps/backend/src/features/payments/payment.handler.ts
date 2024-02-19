import { Transaction } from '@prisma/client'
import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { validateRequest } from '../../utils/validateRequest'
import { BadRequest } from '../../errors/CustomErrors'

export const validateTransaction = [
	body('senderUsername').trim().notEmpty().withMessage('From account is required'),
	body('receiverUsername').trim().notEmpty().withMessage('To account is required'),
	body('amount').isNumeric().toInt().withMessage('Amount must be a number'),
]

export const transact: RequestHandler = async (req, res, next) => {
	try {
		const { senderUsername, receiverUsername, amount } = validateRequest<Transaction>(req)
		const sender = await prisma.user.findUnique({
			where: { username: senderUsername },
		})
		if (!sender) {
			throw new BadRequest('Sender not found')
		}
		const receiver = await prisma.user.findUnique({
			where: { username: receiverUsername },
		})
		if (!receiver) {
			throw new BadRequest('Receiver not found')
		}
		if (sender.balance < amount) {
			throw new BadRequest('Insufficient balance')
		}
		await prisma.$transaction([
			prisma.user.update({
				where: { username: senderUsername },
				data: { balance: { decrement: amount } },
			}),
			prisma.user.update({
				where: { username: receiverUsername },
				data: { balance: { increment: amount } },
			}),
			prisma.transaction.create({
				data: {
					senderUsername,
					receiverUsername,
					amount,
					status: true,
					createdAt: new Date(),
				},
			}),
		])
		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'Transaction successful', errors: [] })
	} catch (err) {
		next(err)
	}
}
