import { User } from '@prisma/client'
import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { Forbidden, Unauthorized } from '../../errors/CustomErrors'
import { generateAccessToken } from '../../utils/generateToken'
import { verifyPassword } from '../../utils/password'
import { validateRequest } from '../../utils/validateRequest'

export const validateLogin = [
	body('email').trim().isEmail().withMessage('Invalid email'),
	body('password').trim().notEmpty().withMessage('Password is required'),
]
export const login: RequestHandler = async (req, res, next) => {
	try {
		const { email, password } =
			validateRequest<Pick<User, 'email' | 'password'>>(req)
		const user = await prisma.user.findUnique({
			where: { email },
		})

		if (!user) {
			throw new Unauthorized('Invalid email or password')
		}
		if (!user.enabled) {
			throw new Forbidden('User account is disabled')
		}

		const validPassword = await verifyPassword(password, user.password)
		if (!validPassword) {
			throw new Unauthorized('Invalid email or password')
		}

		const accessToken = generateAccessToken(user)

		res
			.status(StatusCodes.OK)
			.cookie('jwt', accessToken, {
				maxAge: 24 * 60 * 60 * 1000,
				httpOnly: true,
				secure: true,
				sameSite: 'none',
			})
			.json({
				message: 'Logged in successfully',
				user: { role: user.role },
			})
	} catch (err) {
		next(err)
	}
}

export const logout: RequestHandler = async (_req, res, next) => {
	try {
		res
			.status(StatusCodes.OK)
			.clearCookie('jwt', {
				httpOnly: true,
				secure: true,
				sameSite: 'none',
			})
			.send({ message: 'Logged out successfully', redirect: '/login' })
	} catch (err) {
		next(err)
	}
}
