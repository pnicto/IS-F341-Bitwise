import { WalletTransactionType } from '@prisma/client'
import { RequestHandler } from 'express'
import { body, param, query } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, Forbidden, NotFound } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { intOrNaN } from '../../utils/intOrNaN'
import { validateRequest } from '../../utils/validateRequest'

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
					receiverTags: tags,
				},
			})
		}

		return res
			.status(StatusCodes.OK)
			.json({ msg: 'Transaction updated successfully' })
	} catch (err) {
		next(err)
	}
}

export const validateTransactionFilters = [
	query('items').trim().optional(),
	query('page').trim().optional(),
	query('transactionType')
		.trim()
		.isIn([...Object.values(WalletTransactionType), 'DEBIT', 'CREDIT', ''])
		.withMessage(
			"transaction Type must be one of 'DEBIT', 'CREDIT', 'DEPOSIT', 'WITHDRAW'",
		)
		.optional(),
	query('fromUser').trim().optional(),
	query('toUser').trim().optional(),
	query('fromDate').trim().optional(),
	query('toDate').trim().optional(),
	query('category').trim().optional(),
	query('minAmount')
		.trim()
		.optional()
		.custom((value) => {
			if (value !== undefined && value !== '') {
				if (!Number.isInteger(parseInt(value))) {
					throw new Error('Minimum amount must be a number')
				}
			}
			return true
		})
		.customSanitizer((value) => {
			if (value === '') {
				return undefined
			}
			return parseInt(value)
		}),
	query('maxAmount')
		.trim()
		.optional()
		.custom((value) => {
			if (value !== undefined && value !== '') {
				if (!Number.isInteger(parseInt(value))) {
					throw new Error('Maximum amount must be a number')
				}
			}
			return true
		})
		.customSanitizer((value) => {
			if (value === '') {
				return undefined
			}
			return parseInt(value)
		}),
	query().custom((value, { req }) => {
		const { minAmount, maxAmount } = req.query as {
			minAmount: number
			maxAmount: number
		}
		if (minAmount && maxAmount && minAmount > maxAmount) {
			throw new Error('Minimum amount must be less than maximum amount')
		}
		return true
	}),
]
export const filterTransactionHistory: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const {
			items,
			page,
			transactionType,
			fromUser,
			toUser,
			fromDate,
			toDate,
			category,
			minAmount,
			maxAmount,
		} = validateRequest<{
			items: string | undefined
			page: string | undefined
			transactionType:
				| 'DEBIT'
				| 'CREDIT'
				| 'DEPOSIT'
				| 'WITHDRAWAL'
				| ''
				| undefined
			fromUser: string | undefined
			toUser: string | undefined
			fromDate: string | undefined
			toDate: string | undefined
			category: string | undefined
			minAmount: number | undefined
			maxAmount: number | undefined
		}>(req)
		const user = getAuthorizedUser(req)

		const senderCategories = await prisma.transaction.findMany({
			where: { senderUsername: user.username },
			select: { senderTags: true },
		})
		const receiverCategories = await prisma.transaction.findMany({
			where: { receiverUsername: user.username },
			select: { receiverTags: true },
		})
		const allCategories = new Set()
		for (const x of senderCategories) {
			for (const element of Object.values(x)[0]) allCategories.add(element)
		}
		for (const x of receiverCategories) {
			for (const element of Object.values(x)[0]) allCategories.add(element)
		}
		console.log(allCategories)
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

		const allTransactions = []

		if (!fromUser && (transactionType === 'DEBIT' || !transactionType)) {
			const debitTransactions = await prisma.transaction.findMany({
				where: {
					senderUsername: user.username,
					receiverUsername: toUser ? toUser : undefined,
					createdAt: {
						gte: fromDate ? fromDate : undefined,
						lte: toDate ? toDate : undefined,
					},
					amount: {
						gte: minAmount ? minAmount : undefined,
						lte: maxAmount ? maxAmount : undefined,
					},
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
			const debitHistory = debitTransactions.map((transaction) => {
				return {
					...transaction,
					type: 'DEBIT',
				}
			})
			allTransactions.push(...debitHistory)
		}

		if (!toUser && (transactionType === 'CREDIT' || !transactionType)) {
			const creditTransactions = await prisma.transaction.findMany({
				where: {
					senderUsername: fromUser ? fromUser : undefined,
					receiverUsername: user.username,
					createdAt: {
						gte: fromDate ? fromDate : undefined,
						lte: toDate ? toDate : undefined,
					},
					amount: {
						gte: minAmount ? minAmount : undefined,
						lte: maxAmount ? maxAmount : undefined,
					},
				},
				select: {
					id: true,
					amount: true,
					senderUsername: true,
					receiverUsername: true,
					receiverTags: true,
					createdAt: true,
				},
			})
			const creditHistory = creditTransactions.map((transaction) => {
				return {
					...transaction,
					type: 'CREDIT',
				}
			})
			allTransactions.push(...creditHistory)
		}

		if (
			!(fromUser || toUser) &&
			(transactionType === 'DEPOSIT' || !transactionType)
		) {
			const depositTransactions =
				await prisma.walletTransactionHistory.findMany({
					where: {
						userId: user.id,
						type: WalletTransactionType.DEPOSIT,
						createdAt: {
							gte: fromDate ? fromDate : undefined,
							lte: toDate ? toDate : undefined,
						},
						amount: {
							gte: minAmount ? minAmount : undefined,
							lte: maxAmount ? maxAmount : undefined,
						},
					},
					select: {
						id: true,
						amount: true,
						type: true,
						createdAt: true,
					},
				})
			const depositHistory = depositTransactions.map((transaction) => {
				return {
					...transaction,
					senderUsername: '-',
					receiverUsername: '-',
				}
			})
			allTransactions.push(...depositHistory)
		}

		if (
			!(fromUser || toUser) &&
			(transactionType === 'WITHDRAWAL' || !transactionType)
		) {
			const withdrawTransactions =
				await prisma.walletTransactionHistory.findMany({
					where: {
						userId: user.id,
						type: WalletTransactionType.WITHDRAWAL,
						createdAt: {
							gte: fromDate ? fromDate : undefined,
							lte: toDate ? toDate : undefined,
						},
						amount: {
							gte: minAmount ? minAmount : undefined,
							lte: maxAmount ? maxAmount : undefined,
						},
					},
					select: {
						id: true,
						amount: true,
						type: true,
						createdAt: true,
					},
				})
			const withdrawHistory = withdrawTransactions.map((transaction) => {
				return {
					...transaction,
					senderUsername: '-',
					receiverUsername: '-',
				}
			})
			allTransactions.push(...withdrawHistory)
		}

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
