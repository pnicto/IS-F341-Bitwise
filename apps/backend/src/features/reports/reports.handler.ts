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

		const currentMonth = (new Date().getMonth() - 2).toString().padStart(2, '0')
		const nextMonth =
			new Date().getMonth() + 2 > 12
				? '01'
				: (new Date().getMonth() + 2).toString().padStart(2, '0')

		const currentYear = new Date().getFullYear()
		const nextYear =
			new Date().getMonth() + 2 > 12
				? new Date().getFullYear() + 1
				: new Date().getFullYear()

		const outgoingTransactionsMadeThisMonth = await prisma.transaction.findMany(
			{
				where: {
					createdAt: {
						gte: new Date(`${currentYear}-${currentMonth}-01T00:00:00.000Z`),
						lte: new Date(`${nextYear}-${nextMonth}-01T00:00:00.000Z`),
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
				key,
				value,
			})),
		})
	} catch (err) {
		next(err)
	}
}
