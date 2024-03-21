import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'

export const viewTransactionHistory: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const sender = getAuthorizedUser(req)
		const debitTransactions = await prisma.transaction.findMany({
			where: {
				senderUsername: sender.username,
			},
			select: {
				amount: true,
				senderUsername: true,
				receiverUsername: true,
				createdAt: true,
			},
		})
		const creditTransactions = await prisma.transaction.findMany({
			where: {
				receiverUsername: sender.username,
			},
			select: {
				amount: true,
				senderUsername: true,
				receiverUsername: true,
				createdAt: true,
			},
		})
		const walletTransactions = await prisma.walletTransactionHistory.findMany({
			where: { userId: sender.id },
			select: {
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
