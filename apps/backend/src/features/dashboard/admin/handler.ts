import { User, UserModel } from '@schemas'
import { Request, RequestHandler, Response } from 'express'
import {
	extractUsernameFromEmail,
	hashPassword,
	sendLoginCredentials,
} from './utils'
import crypto from 'crypto'
import mongoose, { ClientSession } from 'mongoose'

export const createAccount: RequestHandler = async (
	req: Request,
	res: Response,
) => {
	const email = req.body.email

	if (!email) {
		return res.status(400).send({ message: 'Invalid body' })
	}

	const username = extractUsernameFromEmail(email)
	const password = crypto.randomBytes(4).toString('hex')
	const hashedPassword = await hashPassword(password)

	const session: ClientSession = await mongoose.startSession()
	session.startTransaction()

	try {
		const user: User = new UserModel({
			username: username,
			email: email,
			password: hashedPassword,
		})
		await user.save({ session })

		const emailUser: User = new UserModel({
			username: user.username,
			email: user.email,
			password: password,
		})

		try {
			const err = await sendLoginCredentials(emailUser)
			if (err) {
				throw err
			} else {
				await session.commitTransaction()
				return res.status(201).send({ message: 'User created successfully' })
			}
		} catch (err) {
			await session.abortTransaction()
			return res.status(500).send({ error: err })
		}
	} catch (err) {
		console.log(err)
		await session.abortTransaction()
		return res.status(400).send({ error: err })
	} finally {
		session.endSession()
	}
}
