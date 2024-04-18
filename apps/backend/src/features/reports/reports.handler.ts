import { RequestHandler } from 'express'
import { prisma } from '../../config/prisma'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import dayjs from 'dayjs'

export const getTimelineReport: RequestHandler = async (req, res, next) => {
	try {
		const user = getAuthorizedUser(req)
		const transactionsMadeThisMonth = await prisma.transaction.findMany({
			where: {
				createdAt: {
					gte: dayjs().startOf('month').toDate(),
					lte: dayjs().endOf('month').toDate(),
				},
				OR: [
					{
						senderUsername: user.username,
					},
					{
						receiverUsername: user.username,
					},
				],
			},
		})
		const sent = transactionsMadeThisMonth.filter(
			(transaction) => transaction.senderUsername === user.username,
		)
		const received = transactionsMadeThisMonth.filter(
			(transaction) => transaction.receiverUsername === user.username,
		)

		const sentAmount = sent.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		)
		const receivedAmount = received.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		)

		const sentSorted = sent.sort(
			(a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
		)
		const receivedSorted = received.sort(
			(a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
		)

		const sentTimeline = sentSorted.map((transaction) => ({
			date: transaction.createdAt,
			amount: transaction.amount,
		}))
		const receivedTimeline = receivedSorted.map((transaction) => ({
			date: transaction.createdAt,
			amount: transaction.amount,
		}))

		const transactionsMadePreviousMonth = await prisma.transaction.findMany({
			where: {
				createdAt: {
					gte: dayjs().subtract(1, 'month').startOf('month').toDate(),
					lte: dayjs().subtract(1, 'month').endOf('month').toDate(),
				},
				OR: [
					{
						senderUsername: user.username,
					},
					{
						receiverUsername: user.username,
					},
				],
			},
		})
		const sentPrevious = transactionsMadePreviousMonth.filter(
			(transaction) => transaction.senderUsername === user.username,
		)
		const receivedPrevious = transactionsMadePreviousMonth.filter(
			(transaction) => transaction.receiverUsername === user.username,
		)

		const sentAmountPrevious = sentPrevious.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		)
		const receivedAmountPrevious = receivedPrevious.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		)

		return res.json({
			sent: {
				amount: sentAmount,
				timeline: sentTimeline,
			},
			received: {
				amount: receivedAmount,
				timeline: receivedTimeline,
			},
			previous: {
				sent: sentAmountPrevious,
				received: receivedAmountPrevious,
			},
		})
	} catch (err) {
		next(err)
	}
}
