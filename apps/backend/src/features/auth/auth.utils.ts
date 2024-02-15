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

export const verifyPassword = async (
	password: string,
	hashedPassword: string,
) => {
	return await bcrypt.compare(password, hashedPassword)
}
