import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'

export const validateTopUp = [
	body('amount').isInt().toInt().withMessage('The amount must be a number'),
]

export const modifyWalletBalance: RequestHandler = async (req, res, next) => {
	try {
		// a positive amount indicates a deposit (add) and a negative amount indicates a withdrawal (remove)
		const { amount } = validateRequest<{ amount: number }>(req)
		const currentUser = getAuthorizedUser(req)
		const currentBalance = currentUser.balance

		if (amount === 0) {
			throw new BadRequest('Amount cannot be zero')
		}

		// if the user tries to withdraw an amount greater than their current wallet balance
		if (amount < 0 && -1 * amount > currentBalance) {
			throw new BadRequest('Insufficient balance')
		}
		if (amount < 0) {
			await prisma.$transaction([
				prisma.user.update({
					where: { username: currentUser.username },
					data: { balance: { increment: amount } },
				}),
				prisma.walletTransactionHistory.create({
					data: {
						amount: -amount,
						userId: currentUser.id,
						type: 'WITHDRAWAL',
					},
				}),
			])
		} else {
			await prisma.$transaction([
				prisma.user.update({
					where: { username: currentUser.username },
					data: { balance: { increment: amount } },
				}),
				prisma.walletTransactionHistory.create({
					data: {
						amount: amount,
						userId: currentUser.id,
						type: 'DEPOSIT',
					},
				}),
			])
		}
		const returnMessage = amount < 0 ? 'Amount withdrawn' : 'Amount added'
		return res.status(StatusCodes.OK).json({ message: returnMessage })
	} catch (err) {
		next(err)
	}
}
