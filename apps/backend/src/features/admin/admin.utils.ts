import { User } from '@prisma/client'
import bcrypt from 'bcrypt'
import { transporter } from '../../config/mailer'

const SENDER_EMAIL = process.env.GOOGLE_MAIL_USER as string

export const extractUsernameFromEmail = (emailStr: string) => {
	if (!emailStr) {
		return ''
	} else {
		return emailStr.replace(/\./g, '').match(/([^@]+)/)?.[1] as string
	}
}

export const hashPassword = async (password: string) => {
	const salt = await bcrypt.genSalt(10)

	return await bcrypt.hash(password, salt)
}

export const sendLoginCredentials = async (
	newUser: User,
	rawPassword: string,
) => {
	const msg = {
		from: SENDER_EMAIL,
		to: newUser.email,
		subject: 'Bitwise Account created successfully',
		html: `<p><h2>Welcome to Bitwise!</h2></p>
			<p>Your username is <b>${newUser.username}</b>.<br>
			Your password is <b>${rawPassword}</b>.</p>`,
	}

	return transporter.sendMail(msg)
}
