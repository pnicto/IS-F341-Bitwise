import nodemailer from 'nodemailer'

const config = {
	service: 'gmail',
	auth: {
		user: process.env.GOOGLE_MAIL_USER,
		pass: process.env.GOOGLE_MAIL_PASSWORD,
	},
}

export const transporter = nodemailer.createTransport(config)
