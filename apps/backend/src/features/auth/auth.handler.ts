import { User, UserModel } from '@schemas'
import { Request, RequestHandler, Response } from 'express'
import { extractUsernameFromEmail, hashPassword } from './auth.utils'
import crypto from "crypto";

export const createAccount: RequestHandler = async (
	req: Request,
	res: Response,
) => {
	try {
		const email = req.body.email

		if (!email) {
			return res.status(400).send({ message: 'Invalid body' })
		}

		const name = extractUsernameFromEmail(email)
		const password = crypto.randomBytes(8).toString("hex");
        const hashedPassword = await hashPassword(password);

		try {
			const user: User = new UserModel({ name, email, hashedPassword })
			user.save()
			return res.status(201).send({ message: 'User created successfully' })
		} catch (err) {
			console.log(err)
			return res.status(400).send({ error: err })
		}
	} catch (err) {
		console.log(err)
		res.status(500).send({
			error: 'Something went wrong while creating accounts',
		})
	}
}
