import express from 'express'
import {
	createAccount,
	getUserDetails,
	updateUserStatus,
	validateNewUser,
	validateUpdateUserBody,
	validateUserEmailParam,
} from './admin.handler'

export const adminRouter = express.Router()

adminRouter.post('/create', validateNewUser, createAccount)
adminRouter.get('/:email/details', validateUserEmailParam, getUserDetails)
adminRouter.post(
	'/user/update-status',
	validateUpdateUserBody,
	updateUserStatus,
)
