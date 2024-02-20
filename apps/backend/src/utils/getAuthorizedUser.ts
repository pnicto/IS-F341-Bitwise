import { User } from '@prisma/client'
import { Request } from 'express'
import { Forbidden } from '../errors/CustomErrors'

export const getAuthorizedUser = (req: Request) => {
	const user = req.user
	// TODO: Discuss if this is how we are going to handle role based user access and if the error thrown here is correct
	if (!user) {
		throw new Forbidden(
			'You are not authorized to perform this action. Please login.',
		)
	}
	// this is necessary to make the Express.User type compatible with the User type from Prisma
	// TODO: Preferably we should narrow the fields that are available in the req.user object as in passport.ts
	return user as User
}
