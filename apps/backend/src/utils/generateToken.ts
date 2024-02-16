import jwt from 'jsonwebtoken'
import { User } from '@schemas'

export const generateAccessToken = (user: User) => {
	// Create JWT Token
	const accessToken = jwt.sign(
		{
			sub: user._id,
		},
		process.env.TOKEN_SECRET,
		{ expiresIn: '1d' },
	)
	if (!accessToken) {
		throw Error('Something went wrong while generating access token')
	}

	// Sending token
	return accessToken
}
