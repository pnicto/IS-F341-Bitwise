import { Role, User } from '@prisma/client'
import crypto from 'crypto'
import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest } from '../../errors/CustomErrors'
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

export const validateBulkUsers = [
	body().isArray().withMessage('Invalid users'),
	body('*.email').trim().isEmail().withMessage('Invalid email'),
	body('*.role')
		.trim()
		.isIn([Role.STUDENT, Role.VENDOR])
		.withMessage('Invalid role'),
	body('*.shopName')
		.if(body('*.role').equals(Role.VENDOR))
		.trim()
		.notEmpty()
		.withMessage('Invalid shop name'),
]

export const createAccountsInBulk: RequestHandler = async (req, res, next) => {
	try {
		const userReq =
			validateRequest<Pick<User, 'email' | 'role' | 'shopName'>[]>(req)
		const userEmails: string[] = []
		const users = []
		const user_password = new Map()
		const skipped = []
		for (let i = 0; i < req.body.length; i++) {
			const { email, role, shopName } = userReq[i]
			if (userEmails.includes(email)) {
				skipped.push(`User with email ${email} already exists`)
				continue
			}
			userEmails.push(email)
			const username = extractUsernameFromEmail(email)
			const password = crypto.randomBytes(4).toString('hex')
			user_password.set(email, password)
			const hashedPassword = await hashPassword(password)
			if (role === 'STUDENT') {
				users.push({
					username,
					email,
					password: hashedPassword,
					role,
				})
			} else {
				const existingUser = await prisma.user.findFirst({
					where: { shopName },
				})
				if (existingUser) {
					skipped.push(`Shop name ${shopName} already exists`)
					continue
				}
				users.push({
					username,
					email,
					password: hashedPassword,
					role,
					shopName,
				})
			}
		}
		await prisma.user.createMany({ data: users })
		const usersCreated = await prisma.user.findMany({
			where: { email: { in: userEmails } },
		})
		if (process.env.NODE_ENV === 'production') {
			for (const user of usersCreated) {
				await sendLoginCredentials(user, user_password.get(user.email))
			}
		} else {
			console.log('DEV LOG: Emails will only be sent in production')
			for (const user of usersCreated) {
				console.log(
					`DEV LOG: User: ${user.email}, Password: ${user_password.get(
						user.email,
					)}`,
				)
			}
		}

		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'Users created successfully', errors: skipped })
	} catch (err) {
		next(err)
	}
}
