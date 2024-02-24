import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'

export const getUserDetails: RequestHandler = async (req, res) => {
	const user = getAuthorizedUser(req)
	res.status(StatusCodes.OK).json({
		user,
	})
}
