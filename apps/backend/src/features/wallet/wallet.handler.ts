import { User } from '@prisma/client'
import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'

export const validateTopUp = [
	body('username').trim().notEmpty().withMessage('Username is required'),
	body('amount').isInt().toInt().withMessage('The amount must be a number'),
]

export const modifyWalletBalance: RequestHandler = async (req, res, next) => {
	try {
		// balance in this case is the amount that is to be added or removed
		const { username, balance } =
			validateRequest<Pick<User, 'username' | 'balance'>>(req)
		const currentUser = getAuthorizedUser(req)
		const currentBalance = currentUser.balance
		if (balance < 0 && balance > currentBalance) {
			throw new BadRequest('Insufficient balance')
		}
		await prisma.user.update({
			where: { username: username },
			data: { balance: { increment: balance } },
		})
		const returnMessage = balance < 0 ? 'Amount withdrawn' : 'Amount added'
		return res.status(StatusCodes.CREATED).json({ message: returnMessage })
	} catch (err) {
		next(err)
	}
}
