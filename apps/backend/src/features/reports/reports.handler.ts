import dayjs from 'dayjs'
import { RequestHandler } from 'express'
import { prisma } from '../../config/prisma'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'

export const getCategorizedExpenditure: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const user = getAuthorizedUser(req)

		const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')
		const currentYear = new Date().getFullYear()

		const currentMonthDate = dayjs(
			`${currentYear}-${currentMonth}-01T00:00:00.000Z`,
		)
		const nextMonthDate = currentMonthDate.add(1, 'month')

		const outgoingTransactionsMadeThisMonth = await prisma.transaction.findMany(
			{
				where: {
					createdAt: {
						gte: currentMonthDate.toDate(),
						lte: nextMonthDate.toDate(),
					},
					senderUsername: user.username,
				},
			},
		)

		const categorizedExpenditure: Map<string, number> = new Map<
			string,
			number
		>()

		for (const transaction of outgoingTransactionsMadeThisMonth) {
			if (transaction.senderTags.length === 0) {
				if (!categorizedExpenditure.has('Uncategorized')) {
					categorizedExpenditure.set('Uncategorized', transaction.amount)
				} else {
					const oldValue = categorizedExpenditure.get('Uncategorized')
					if (oldValue !== undefined) {
						categorizedExpenditure.set(
							'Uncategorized',
							transaction.amount + oldValue,
						)
					}
				}
			} else {
				if (!categorizedExpenditure.has(transaction.senderTags[0])) {
					categorizedExpenditure.set(
						transaction.senderTags[0],
						transaction.amount,
					)
				} else {
					const oldValue = categorizedExpenditure.get(transaction.senderTags[0])
					if (oldValue !== undefined) {
						categorizedExpenditure.set(
							transaction.senderTags[0],
							transaction.amount + oldValue,
						)
					}
				}
			}
		}

		return res.json({
			expenditure: Array.from(categorizedExpenditure).map(([key, value]) => ({
				name: key,
				value: value,
			})),
		})
	} catch (err) {
		next(err)
	}
}
