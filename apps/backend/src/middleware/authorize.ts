import { Role } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import { Forbidden } from '../errors/CustomErrors'
import { getAuthorizedUser } from '../utils/getAuthorizedUser'

export const authorize =
	(...permittedRoles: Role[]) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const user = getAuthorizedUser(req)

			if (user.role && permittedRoles.includes(user.role)) {
				next()
			} else {
				throw new Forbidden(
					'You are not authorized to access this resource as you do not have the required role',
				)
			}
		} catch (err) {
			next(err)
		}
	}
