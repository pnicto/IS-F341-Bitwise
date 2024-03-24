import { RequestHandler } from 'express'
import { body, param } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { Forbidden, NotFound } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'

export const viewTransactionHistory: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const user = getAuthorizedUser(req)
		const debitTransactions = await prisma.transaction.findMany({
			where: {
				senderUsername: user.username,
			},
			select: {
				id: true,
				amount: true,
				senderUsername: true,
				receiverUsername: true,
				senderTags: true,
				createdAt: true,
			},
		})
		const creditTransactions = await prisma.transaction.findMany({
			where: {
				receiverUsername: user.username,
			},
			select: {
				id: true,
				amount: true,
				senderUsername: true,
				receiverUsername: true,
				recieverTags: true,
				createdAt: true,
			},
		})
		const walletTransactions = await prisma.walletTransactionHistory.findMany({
			where: { userId: user.id },
			select: {
				id: true,
				amount: true,
				type: true,
				createdAt: true,
			},
		})

		const debitHistory = debitTransactions.map((transaction) => {
			return {
				...transaction,
				type: 'DEBIT',
			}
		})

		const creditHistory = creditTransactions.map((transaction) => {
			return {
				...transaction,
				type: 'CREDIT',
			}
		})

		const walletHistory = walletTransactions.map((transaction) => {
			return {
				...transaction,
				senderUsername: '-',
				receiverUsername: '-',
			}
		})

		const allTransactions = [
			...debitHistory,
			...creditHistory,
			...walletHistory,
		]

		allTransactions.sort((a, b) => {
			return b.createdAt.getTime() - a.createdAt.getTime()
		})

		return res.status(StatusCodes.OK).json(allTransactions)
	} catch (err) {
		next(err)
	}
}

export const validateUpdatedTags = [
	param('id').trim().notEmpty().withMessage('Transaction ID is required'),
	body('tags').isArray().withMessage('Tags must be an array'),
	body('tags.*')
		.isString()
		.withMessage('Tag name must be a string')
		.trim()
		.notEmpty()
		.withMessage('Tag name cannot be empty'),
]
export const updateTransactionTags: RequestHandler = async (req, res, next) => {
	try {
		const { id, tags } = validateRequest<{ id: string; tags: string[] }>(req)

		const user = getAuthorizedUser(req)
		const transaction = await prisma.transaction.findUnique({
			where: { id: id },
		})
		if (!transaction) {
			throw new NotFound('The transaction does not exist')
		}
		if (
			transaction.senderUsername !== user.username &&
			transaction.receiverUsername !== user.username
		) {
			throw new Forbidden('You cannot edit the tags for this transaction')
		}

		if (transaction.senderUsername === user.username) {
			await prisma.transaction.update({
				where: { id: transaction.id },
				data: {
					senderTags: tags,
				},
			})
		} else {
			await prisma.transaction.update({
				where: { id: transaction.id },
				data: {
					recieverTags: tags,
				},
			})
		}

		return res
			.status(StatusCodes.OK)
			.json({ message: 'Transaction updated successfully' })
	} catch (err) {
		next(err)
	}
}