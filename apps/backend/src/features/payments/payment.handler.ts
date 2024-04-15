import { Transaction } from '@prisma/client'
import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, NotFound } from '../../errors/CustomErrors'
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
		const shop = await prisma.user.findFirst({
			where: { shopName: receiverUsername },
		})

		if (shop && receiver) {
			throw new BadRequest('Ambiguous receiver account')
		}

		if (sender.balance < amount) {
			throw new BadRequest('Insufficient balance')
		}

		if (shop) {
			await prisma.$transaction([
				prisma.user.update({
					where: { shopName: receiverUsername, email: shop.email },
					data: { balance: { increment: amount } },
				}),
				prisma.user.update({
					where: { username: sender.username },
					data: { balance: { decrement: amount } },
				}),
				prisma.transaction.create({
					data: {
						senderUsername: sender.username,
						receiverUsername: receiverUsername,
						amount,
					},
				}),
			])
			return res
				.status(StatusCodes.CREATED)
				.json({ msg: 'Transaction successful' })
		}

		if (!receiver) {
			throw new NotFound('Receiver not found')
		}
		if (!receiver.enabled) {
			throw new BadRequest('Receiver account is disabled')
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
					receiverUsername: receiver.username,
					amount,
				},
			}),
		])
		return res
			.status(StatusCodes.CREATED)
			.json({ msg: 'Transaction successful' })
	} catch (err) {
		next(err)
	}
}
