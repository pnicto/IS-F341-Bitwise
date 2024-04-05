import { Transaction } from '@prisma/client'
import { RequestHandler } from 'express'
import { body, param, query } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, Forbidden, NotFound } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'
import { intOrNaN } from '../../utils/intOrNaN'

export const viewTransactionHistoryValidator = [
	query('items').trim().optional(),
	query('page').trim().optional(),
]
export const viewTransactionHistory: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { items, page } = validateRequest<{
			items: string | undefined
			page: string | undefined
		}>(req)

		let numberOfItems = intOrNaN(items)
		let currentPage = intOrNaN(page)

		if (isNaN(numberOfItems)) {
			numberOfItems = 10
		}
		if (isNaN(currentPage)) {
			currentPage = 1
		}
		currentPage -= 1

		if (numberOfItems < 1) {
			throw new BadRequest('Invalid number of items')
		}
		if (currentPage < 0) {
			throw new BadRequest('Invalid page number')
		}

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

		return res.status(StatusCodes.OK).json({
			transactions: allTransactions.slice(
				numberOfItems * currentPage,
				numberOfItems * currentPage + numberOfItems,
			),
			totalPages: Math.ceil(
				allTransactions.length /
					Math.min(numberOfItems, allTransactions.length),
			),
		})
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

export const validateTransactionFilters = [
	query('transactionType').trim().isIn(['DEBIT', 'CREDIT']).optional(),
	query('from').trim().optional(),
	query('to').trim().optional(),
	query('amountUpperLimit').isInt().toInt().optional(),
	query('amountLowerLimit').isInt().toInt().optional(),
	query('amount').isInt().toInt().optional(),
]
export const filterTransactionHistory: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const filterList = Object.keys(req.query)
		if (filterList.length === 0) {
			throw new BadRequest('Use at least one filter.')
		}
		const {
			transactionType,
			from,
			to,
			amountUpperLimit,
			amountLowerLimit,
			amount,
		} = validateRequest<{
			transactionType: string | null
			from: Transaction['senderUsername']
			to: Transaction['receiverUsername']
			amountUpperLimit: Transaction['amount']
			amountLowerLimit: Transaction['amount']
			amount: Transaction['amount']
		}>(req)
		if (from && to) {
			throw new BadRequest('Cannot filter with from and to')
		}
		if (transactionType === 'DEBIT' && from) {
			throw new BadRequest('Cannot filter with from and DEBIT')
		}
		if (transactionType === 'CREDIT' && to) {
			throw new BadRequest('Cannot filter with to and CREDIT')
		}
		if (amountLowerLimit >= amountUpperLimit) {
			throw new BadRequest(
				'The minimum amount cannot be more than the maximum amount',
			)
		}
		if (amountLowerLimit === amountUpperLimit - 1) {
			throw new BadRequest(
				'There cannot be any transactions with this amount range',
			)
		}
		if (amount && (amountLowerLimit || amountUpperLimit)) {
			throw new BadRequest('Cannot filter with an exact amount and a range')
		}
		const user = getAuthorizedUser(req)
		const filtered = await prisma.transaction.findMany({
			where: {
				senderUsername:
					transactionType === 'DEBIT' || to
						? user.username
						: from
						? from
						: undefined,
				receiverUsername:
					transactionType === 'CREDIT' || from
						? user.username
						: to
						? to
						: undefined,
				amount: amountLowerLimit
					? amountUpperLimit
						? { lt: amountUpperLimit, gt: amountLowerLimit }
						: { gt: amountLowerLimit }
					: amountUpperLimit
					? { lt: amountUpperLimit }
					: amount
					? amount
					: undefined,
			},
		})
		return res.status(StatusCodes.OK).json({ filtered })
	} catch (err) {
		next(err)
	}
}
