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
		// balance in this case is the amount that is to be added or removed
		const { amount } = validateRequest<{ amount: number }>(req)
		const currentUser = getAuthorizedUser(req)
		const currentBalance = currentUser.balance

		if (amount === 0) {
			throw new BadRequest('Amount cannot be zero')
		}

		if (amount < 0 && -1 * amount > currentBalance) {
			throw new BadRequest('Insufficient balance')
		}
		await prisma.user.update({
			where: { username: currentUser.username },
			data: { balance: { increment: amount } },
		})
		const returnMessage = amount < 0 ? 'Amount withdrawn' : 'Amount added'
		return res.status(StatusCodes.CREATED).json({ message: returnMessage })
	} catch (err) {
		next(err)
	}
}
