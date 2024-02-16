import { User } from '@schemas'
import { transporter } from '../../../config/mailer'

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
