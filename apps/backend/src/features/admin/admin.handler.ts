import { Role, User } from '@prisma/client'
import crypto from 'crypto'
import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { validateRequest } from '../../utils/validateRequest'
import {
	extractUsernameFromEmail,
	hashPassword,
	sendLoginCredentials,
} from './admin.utils'

export const validateNewUser = [
	body('email').trim().isEmail().withMessage('Invalid email'),
	body('role')
		.trim()
		.toUpperCase()
		.isIn(['STUDENT', 'VENDOR'])
		.withMessage('Invalid role'),
	body('shopName')
		.if(body('role').equals(Role.VENDOR))
		.trim()
		.notEmpty()
		.withMessage('Invalid shop name'),
]
export const createAccount: RequestHandler = async (req, res, next) => {
	try {
		const { email, role } = validateRequest<Pick<User, 'email' | 'role'>>(req)

		const username = extractUsernameFromEmail(email)
		const password = crypto.randomBytes(4).toString('hex')
		const hashedPassword = await hashPassword(password)

		let user

		if (role === 'STUDENT') {
			user = await prisma.user.create({
				data: { username, email, password: hashedPassword, role },
			})
		} else {
			const { shopName } = validateRequest<Pick<User, 'shopName'>>(req)
			user = await prisma.user.create({
				data: { username, email, password: hashedPassword, role, shopName },
			})
		}

		// TODO: Check if throws errors as expected
		await sendLoginCredentials(user, password)
		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'User created successfully' })
	} catch (err) {
		next(err)
	}
}
