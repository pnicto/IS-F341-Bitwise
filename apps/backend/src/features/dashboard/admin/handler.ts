import { User } from '@prisma/client'
import crypto from 'crypto'
import { Request, RequestHandler, Response } from 'express'
import { prisma } from '../../../config/prisma'
import {
	extractUsernameFromEmail,
	hashPassword,
	sendLoginCredentials,
} from './utils'

export const createAccount: RequestHandler = async (
	req: Request,
	res: Response,
) => {
	const { email }: User = req.body.email

	if (!email) {
		return res.status(400).send({ message: 'Invalid body' })
	}

	const username = extractUsernameFromEmail(email)
	const password = crypto.randomBytes(4).toString('hex')
	const hashedPassword = await hashPassword(password)

	let user: User | undefined

	try {
		user = await prisma.user.create({
			data: { username, email, password: hashedPassword },
		})
	} catch (err) {
		console.log(err)
		return res.status(500).json({ error: 'Error creating user' })
	}

	try {
		// FIXME: check if this is working as expected
		await sendLoginCredentials(user, password)
	} catch (err) {
		console.log(err)
		return res.status(207).json({ error: 'Error sending email to the user' })
	}

	return res.status(201).json({ message: 'User created successfully' })
}
