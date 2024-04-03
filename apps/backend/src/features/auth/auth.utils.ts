import { User } from '@prisma/client'
import { transporter } from '../../config/mailer'

const SENDER_EMAIL = process.env.GOOGLE_MAIL_USER as string

export const sendPaswordResetMail = async (user: User, rawPassword: string) => {
	const msg = {
		from: SENDER_EMAIL,
		to: user.email,
		subject: 'Bitwise Account password reset successfully',
		html: `<p><h2>Please change your password on login!</h2></p>
			Your new password is <b>${rawPassword}</b>.</p>`,
	}

	return transporter.sendMail(msg)
}
