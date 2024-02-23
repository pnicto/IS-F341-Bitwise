import { Role } from '@prisma/client'
import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'

export const getAllShops: RequestHandler = async (_req, res, next) => {
	try {
		const shops = await prisma.user.findMany({
			where: { role: Role.VENDOR },
			select: { shopName: true },
		})
		return res.status(StatusCodes.OK).json({ shops })
	} catch (err) {
		next(err)
	}
}
