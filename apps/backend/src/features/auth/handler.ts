import { User, UserModel } from '@schemas'
import { Request, RequestHandler, Response } from 'express'
import { verifyPassword } from './utils'
import { generateAccessToken } from '../../utils/generateToken'

export const login: RequestHandler = async (req: Request, res: Response) => {
	try {
		const isValidUser: User = await UserModel.findOne({ email: req.body.email })
		if (!isValidUser) {
			return res
				.status(404)
				.send({ error: 'Account with this email does not exist' })
		}

		const validPassword = await verifyPassword(
			req.body.password,
			isValidUser.password,
		)
		if (!validPassword) {
			return res.status(403).send({ error: 'Incorrect password' })
		}

		const accessToken = generateAccessToken(isValidUser)
		const user = await UserModel.findOne(
			{ email: isValidUser.email },
			{ _id: 0, password: 0 },
		)

		// TODO: Set correct redirect pathname
		res
			.status(200)
			.cookie('jwt', accessToken, {
				maxAge: 24 * 60 * 60 * 1000,
				httpOnly: true,
				domain: process.env.FRONTEND_URL.replace('https://', '')
					.replace('http://', '')
					.split(':')[0],
				secure: true,
				sameSite: 'lax',
			})
			.send({
				data: {
					user,
				},
				message: 'Logged in successfully',
				redirect: '/logout',
			})
	} catch (err) {
		res.status(500).send({
			error: 'Something went wrong while logging in',
		})
	}
}

export const logout: RequestHandler = async (req: Request, res: Response) => {
	try {
		res
			.status(200)
			.clearCookie('jwt')
			.send({ message: 'Logged out successfully' })
	} catch (err) {
		res.status(500).send({
			error: 'Something went wrong while logging out',
		})
	}
}
