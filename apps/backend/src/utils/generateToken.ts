import { User } from '@prisma/client'
import jwt from 'jsonwebtoken'

export const generateAccessToken = (user: User) => {
	// Create JWT Token
	const accessToken = jwt.sign(
		{
			sub: user.id,
		},
		// FIXME: Add a proper check
		process.env.TOKEN_SECRET as string,
		{ expiresIn: '1d' },
	)
	if (!accessToken) {
		throw Error('Something went wrong while generating access token')
	}

	// Sending token
	return accessToken
}
