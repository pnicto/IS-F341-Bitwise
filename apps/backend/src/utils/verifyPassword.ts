import bcrypt from 'bcrypt'

export const verifyPassword = async (
	password: string,
	hashedPassword: string,
) => {
	return await bcrypt.compare(password, hashedPassword)
}
