import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, NotFound } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { hashPassword, verifyPassword } from '../../utils/password'
import { validateRequest } from '../../utils/validateRequest'

export const getUserDetails: RequestHandler = async (req, res) => {
	const user = getAuthorizedUser(req)
	res.status(StatusCodes.OK).json({
		user,
	})
}

export const validateNewDetails = [
	body('mobile')
		.isMobilePhone('en-IN')
		.optional()
		.withMessage('Invalid mobile number'),
	body('oldPassword').custom((value, { req }) => {
		if (req.body.newPassword && !value) {
			throw new Error('Old password is required when changing password')
		} else if (value && !req.body.newPassword) {
			throw new Error('New password is required when changing password')
		} else if (value && value === req.body.newPassword) {
			// the check on value is to ensure that when both are undefined this is not triggered
			throw new Error('New password must be different from old password')
		}
		return true
	}),
	body('newPassword').optional(),
]
export const editUserDetails: RequestHandler = async (req, res, next) => {
	try {
		const { mobile, oldPassword, newPassword } = validateRequest<{
			mobile: string | undefined
			oldPassword: string | undefined
			newPassword: string | undefined
		}>(req)

		const authorizedUser = getAuthorizedUser(req)

		const userDetails = await prisma.user.findUnique({
			where: { id: authorizedUser.id },
			select: {
				mobile: true,
				password: true,
			},
		})

		if (!userDetails) throw new NotFound('User not found')

		if (mobile) {
			userDetails.mobile = mobile
		}

		if (oldPassword && newPassword) {
			const validPassword = await verifyPassword(
				oldPassword,
				userDetails.password,
			)
			if (!validPassword) throw new BadRequest('The old password is incorrect')
			const newHashedPassword = await hashPassword(newPassword)
			userDetails.password = newHashedPassword
		}

		await prisma.user.update({
			data: { ...userDetails },
			where: { id: authorizedUser.id },
		})

		return res.status(StatusCodes.OK).json({ message: 'Details updated' })
	} catch (err) {
		next(err)
	}
}

export const disableAccount: RequestHandler = async (req, res, next) => {
	try {
		const authorizedUser = getAuthorizedUser(req)
		const userDetails = await prisma.user.findUnique({
			where: { id: authorizedUser.id },
		})
		if (!userDetails) throw new NotFound('User not found')
		await prisma.user.update({
			where: { id: authorizedUser.id },
			data: { enabled: false },
		})
		return res
			.status(StatusCodes.OK)
			.json({ message: 'Account disabled successfully' })
	} catch (err) {
		next(err)
	}
}

export const validateTag = [
	body('name').trim().notEmpty().withMessage('Tag name is required'),
]
export const createNewTag: RequestHandler = async (req, res, next) => {
	try {
		const { name } = validateRequest<{
			name: string
		}>(req)

		const authorizedUser = getAuthorizedUser(req)

		const tags = authorizedUser.tags

		if (tags.includes(name)) {
			throw new BadRequest(`Tag ${name} already exists`)
		}

		tags.push(name)

		await prisma.user.update({
			where: {
				id: authorizedUser.id,
			},
			data: {
				tags: tags,
			},
		})

		return res
			.status(StatusCodes.OK)
			.json({ message: `Tag ${name} added successfully` })
	} catch (err) {
		next(err)
	}
}

export const validateUpdateTag = [
	body('oldName').trim().notEmpty().withMessage('Old tag name is required'),
	body('newName').trim().notEmpty().withMessage('New Tag name is required'),
]
export const editTag: RequestHandler = async (req, res, next) => {
	try {
		const { oldName, newName } = validateRequest<{
			oldName: string | undefined
			newName: string | undefined
		}>(req)

		const authorizedUser = getAuthorizedUser(req)

		const tags = authorizedUser.tags

		if (oldName && newName) {
			if (!tags.includes(oldName)) {
				throw new BadRequest(`Tag ${oldName} does not exist`)
			}
			if (tags.includes(newName)) {
				throw new BadRequest(`Tag ${newName} already exists`)
			}
			const index = tags.indexOf(oldName)
			tags[index] = newName
		}

		await prisma.user.update({
			where: { id: authorizedUser.id },
			data: {
				tags: tags,
			},
		})

		return res
			.status(StatusCodes.OK)
			.send({ message: 'Tag updated successfully' })
	} catch (err) {
		next(err)
	}
}

export const deleteTag: RequestHandler = async (req, res, next) => {
	try {
		const { name } = validateRequest<{
			name: string
		}>(req)

		const authorizedUser = getAuthorizedUser(req)

		const tags = authorizedUser.tags

		if (!tags.includes(name)) {
			throw new BadRequest(`Tag ${name} does not exist`)
		}

		const index = tags.indexOf(name)
		tags.splice(index, 1)

		await prisma.user.update({
			where: { id: authorizedUser.id },
			data: {
				tags: tags,
			},
		})

		return res
			.status(StatusCodes.OK)
			.send({ message: `Tag ${name} deleted successfully` })
	} catch (err) {
		next(err)
	}
}
