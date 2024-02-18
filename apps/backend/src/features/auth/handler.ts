import { Request, RequestHandler, Response } from 'express'
import { prisma } from '../../config/prisma'
import { Unauthorized } from '../../errors/CustomErrors'
import { generateAccessToken } from '../../utils/generateToken'
import { verifyPassword } from './utils'

export const login: RequestHandler = async (req: Request, res: Response) => {
	const user = await prisma.user.findUniqueOrThrow({
		where: { email: req.body.email },
	})

	const validPassword = await verifyPassword(req.body.password, user.password)
	if (!validPassword) {
		throw new Unauthorized('Invalid email or password')
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
		.json({
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

export const check: RequestHandler = async (req, res) => {
	res.status(200).json({ user: req.user, msg: 'Logged in' })
}
