import { User } from '@prisma/client'
import { Request } from 'express'
import { Forbidden } from '../errors/CustomErrors'

export const getAuthorizedUser = (req: Request) => {
	const user = req.user
	if (!user) {
		throw new Forbidden(
			'You are not authorized to perform this action. Please login.',
		)
	}
	// this is necessary to make the Express.User type compatible with the User type from Prisma
	return user as User
}
