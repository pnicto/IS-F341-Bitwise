import { User } from '@schemas'
import { transporter } from '../../config/mailer'

export const sendLoginCredentials = async (user: User) => {
	try {
		const msg = {
			from: 'bitwise@gmail.com',
			to: user.email,
			subject: 'Bitwise Account created successfully',
			html: `<h2>Welcome to Bitwise!</h2>\nYour username is <b>${user.username}</b>.\nYour password is <b>${user.password}</b>\n`,
		}

		transporter
			.sendMail(msg)
			.then(() => {
				console.log('Email sent successfully')
			})
			.catch((err) => {
				console.log(err)
				return err
			})
		return null
	} catch (err) {
		console.log(err)
		return err
	}
}
