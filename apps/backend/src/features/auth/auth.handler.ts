import { User, UserModel } from '@schemas'
import { Request, RequestHandler, Response } from 'express'
import { extractUsernameFromEmail, hashPassword } from './auth.utils'
import { sendLoginCredentials } from './auth.middleware';
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

		const username = extractUsernameFromEmail(email)
		const password = crypto.randomBytes(8).toString("hex");
        const hashedPassword = await hashPassword(password);

		try {
            const emailUser: User = new UserModel({ username, email, password })
			const user: User = new UserModel({ username, email, hashedPassword })
			user.save()

            try {
                const err = await sendLoginCredentials(emailUser);
                if (err) throw err;
            } catch (err) {
                return res.status(500).send(err);
            }
            
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
