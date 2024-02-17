import { User } from '@prisma/client'
import { Request, RequestHandler, Response } from 'express'
import { prisma } from '../../config/prisma'
import { generateAccessToken } from '../../utils/generateToken'
import { verifyPassword } from './utils'

export const login: RequestHandler = async (req: Request, res: Response) => {
	let user: User | undefined
	try {
		user = await prisma.user.findUniqueOrThrow({
			where: { email: req.body.email },
		})
	} catch (err) {
		return res.status(404).send({ error: 'User not found' })
	}

	const validPassword = await verifyPassword(req.body.password, user.password)

	if (!validPassword) {
		return res.status(403).send({ error: 'Incorrect password' })
	}

	const accessToken = generateAccessToken(user)

	// TODO: Set correct redirect pathname
	res
		.status(200)
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
		.send({
			data: {
				user,
			},
			message: 'Logged in successfully',
			redirect: '/logout',
		})
}

export const logout: RequestHandler = async (req: Request, res: Response) => {
	try {
		res
			.status(200)
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
		res.status(500).send({
			error: 'Something went wrong while logging out',
		})
	}
}
