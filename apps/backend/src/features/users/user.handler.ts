import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, NotFound } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'
import { verifyPassword } from '../../utils/verifyPassword'
import { hashPassword } from '../admin/admin.utils'

export const getUserDetails: RequestHandler = async (req, res) => {
	const user = getAuthorizedUser(req)
	res.status(StatusCodes.OK).json({
		user,
	})
}

export const validateNewDetails = [
	body('mobile')
		.isInt()
		.optional({ checkFalsy: true })
		.withMessage('The mobile number must be a number'),
	body('oldPassword').optional({ checkFalsy: true }),
	body('newPassword').optional({ checkFalsy: true }),
]
export const editUserDetails: RequestHandler = async (req, res, next) => {
	try {
		const { mobile, oldPassword, newPassword } = validateRequest<{
			mobile: string
			oldPassword: string
			newPassword: string
		}>(req)
		const authorizedUser = getAuthorizedUser(req)
		const user = await prisma.user.findUnique({
			where: { id: authorizedUser.id },
		})

		if (!user) throw new NotFound('User not found')

		if (
			mobile === undefined &&
			oldPassword === undefined &&
			newPassword === undefined
		) {
			throw new BadRequest('All fields cannot be empty')
		}
		if (mobile !== undefined && mobile === user.mobile) {
			throw new BadRequest('The mobile number is the same')
		}
		const newMobile = mobile === undefined ? user.mobile : mobile

		if (oldPassword === undefined && newPassword !== undefined) {
			throw new BadRequest('The old password must also be entered')
		}

		if (oldPassword !== undefined) {
			if (newPassword === undefined) {
				throw new BadRequest('The new password needs to be entered')
			}
			if (oldPassword === newPassword) {
				throw new BadRequest(
					'The new password must be different from the old password',
				)
			}

			console.log(oldPassword, user.password)

			const validPassword = await verifyPassword(oldPassword, user.password)

			if (!validPassword) {
				throw new BadRequest('The old password is incorrect')
			}
		}

		const newHashedPassword =
			newPassword === undefined
				? user.password
				: await hashPassword(newPassword)

		await prisma.user.update({
			where: { username: user.username },
			data: { mobile: newMobile, password: newHashedPassword },
		})
		return res.status(StatusCodes.OK).json({ message: 'Details updated' })
	} catch (err) {
		next(err)
	}
}
