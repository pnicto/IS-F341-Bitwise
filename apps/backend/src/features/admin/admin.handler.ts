import { Role, User } from '@prisma/client'
import crypto from 'crypto'
import { RequestHandler } from 'express'
import { body, param } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, NotFound } from '../../errors/CustomErrors'
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
		.isIn([Role.STUDENT, Role.VENDOR])
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

			const existingUser = await prisma.user.findFirst({
				where: { shopName },
			})
			if (existingUser) {
				throw new BadRequest('Shop name already exists')
			}

			user = await prisma.user.create({
				data: { username, email, password: hashedPassword, role, shopName },
			})
		}

		// send account creation emails only in production
		if (process.env.NODE_ENV === 'production') {
			await sendLoginCredentials(user, password)
		} else {
			console.log('DEV LOG: Emails will only be sent in production')
			console.log(`DEV LOG: User: ${email}, Password: ${password}`)
		}

		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'User created successfully' })
	} catch (err) {
		next(err)
	}
}

export const validateUserEmailParam = [
	param('email').trim().isEmail().withMessage('Invalid email'),
]
export const getUserDetails: RequestHandler = async (req, res, next) => {
	try {
		const { email } = validateRequest<Pick<User, 'email'>>(req)

		const user = await prisma.user.findFirst({
			where: { email },
		})
		if (!user) {
			throw new NotFound('User does not exist')
		}

		// Remove password from user object when exposing
		user.password = ''

		return res.status(StatusCodes.OK).json({
			user,
		})
	} catch (err) {
		next(err)
	}
}

export const validateUpdateUserBody = [
	body('email').trim().isEmail().withMessage('Invalid email'),
	body('enabled').isBoolean().toBoolean().withMessage('Invalid status'),
]
export const updateUserStatus: RequestHandler = async (req, res, next) => {
	try {
		const { email, enabled } =
			validateRequest<Pick<User, 'email' | 'enabled'>>(req)

		const user = await prisma.user.findFirst({
			where: { email },
		})
		if (!user) {
			throw new NotFound('User does not exist')
		}
		if (user.role === Role.ADMIN) {
			throw new BadRequest('Cannot update status of admin account')
		}

		await prisma.user.update({
			where: { email },
			data: {
				enabled,
			},
		})

		const returnMessage = enabled
			? 'Account enabled successfully'
			: 'Account disabled successfully'
		return res.status(StatusCodes.OK).json({ message: returnMessage })
	} catch (err) {
		next(err)
	}
}
