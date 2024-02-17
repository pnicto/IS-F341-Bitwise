import { User } from '@schemas'
import { transporter } from '../../../config/mailer'
import bcrypt from 'bcrypt'

export const extractUsernameFromEmail = (emailStr: string) => {
	if (!emailStr) {
		return ''
	} else {
		return emailStr.replace(/\./g, '').match(/([^@]+)/)?.[1]
	}
}

export const hashPassword = async (password: string) => {
	const salt = await bcrypt.genSalt(10)

	return await bcrypt.hash(password, salt)
}

export const sendLoginCredentials = async (user: User) => {
	try {
		const msg = {
			from: 'bitwise@gmail.com',
			to: user.email,
			subject: 'Bitwise Account created successfully',
			html: `<p><h2>Welcome to Bitwise!</h2></p>
			<p>Your username is <b>${user.username}</b>.<br>
			Your password is <b>${user.password}</b>.</p>`,
		}

		await transporter.sendMail(msg)
		return null
	} catch (err) {
		console.log(err)
		return err
	}
}
