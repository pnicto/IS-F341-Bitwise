import { User } from '@prisma/client'
import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { Unauthorized } from '../../errors/CustomErrors'
import { generateAccessToken } from '../../utils/generateToken'
import { validateRequest } from '../../utils/validateRequest'
import { verifyPassword } from './auth.utils'

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

		const validPassword = await verifyPassword(password, user.password)
		if (!validPassword) {
			throw new Unauthorized('Invalid email or password')
		}

		const accessToken = generateAccessToken(user)

		// TODO: Set correct redirect pathname
		res
			.status(StatusCodes.OK)
			.cookie('jwt', accessToken, {
				maxAge: 24 * 60 * 60 * 1000,
				httpOnly: true,
				domain: (process.env.FRONTEND_URL as string)
					.replace('https://', '')
					.replace('http://', '')
					.split(':')[0],
				secure: true,
				sameSite: 'lax',
			})
			.json({
				message: 'Logged in successfully',
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
				domain: (process.env.FRONTEND_URL as string)
					.replace('https://', '')
					.replace('http://', '')
					.split(':')[0],
				secure: true,
				sameSite: 'lax',
			})
			.send({ message: 'Logged out successfully', redirect: '/login' })
	} catch (err) {
		next(err)
	}
}

export const check: RequestHandler = async (req, res) => {
	res.status(StatusCodes.OK).json({ user: req.user, msg: 'Logged in' })
}
