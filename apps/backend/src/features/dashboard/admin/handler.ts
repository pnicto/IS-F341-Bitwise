import { User, UserModel } from '@schemas'
import { Request, RequestHandler, Response } from 'express'
import { extractUsernameFromEmail, hashPassword } from './utils'
import { sendLoginCredentials } from './middleware'
import crypto from 'crypto'

export const createAccount: RequestHandler = async (
	req: Request,
	res: Response,
) => {
	try {
		const email = req.body.email

		if (!email) {
			return res.status(400).send({ message: 'Invalid body' })
		}

		const username = extractUsernameFromEmail(email)
		const password = crypto.randomBytes(4).toString('hex')
		const hashedPassword = await hashPassword(password)

		const user: User = new UserModel({
			username: username,
			email: email,
			password: hashedPassword,
		})

		try {
			await user.save()

			const emailUser: User = new UserModel({
				username: user.username,
				email: user.email,
				password: password,
			})

			try {
				const err = await sendLoginCredentials(emailUser)
				if (err) throw err
			} catch (err) {
				return res.status(500).send({ error: err })
			}
		} catch (err) {
			console.log(err)
			return res.status(400).send({ error: err })
		}

		return res.status(201).send({ message: 'User created successfully' })
	} catch (err) {
		console.log(err)
		res.status(500).send({
			error: 'Something went wrong while creating accounts',
		})
	}
}
