import { User } from '@prisma/client'
import crypto from 'crypto'
import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../../config/prisma'
import { validateRequest } from '../../../utils/validateRequest'
import {
	extractUsernameFromEmail,
	hashPassword,
	sendLoginCredentials,
} from './utils'

export const validateNewUser = [
	body('email').trim().isEmail().withMessage('Invalid email'),
]
export const createAccount: RequestHandler = async (req, res, next) => {
	try {
		const { email } = validateRequest<Pick<User, 'email'>>(req)

		const username = extractUsernameFromEmail(email)
		const password = crypto.randomBytes(4).toString('hex')
		const hashedPassword = await hashPassword(password)

		const user = await prisma.user.create({
			data: { username, email, password: hashedPassword },
		})

		// TODO: Check if throws errors as expected
		await sendLoginCredentials(user, password)
		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'User created successfully' })
	} catch (err) {
		next(err)
	}
}
