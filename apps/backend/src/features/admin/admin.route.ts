import express from 'express'
import {
	createAccount,
	createAccountsInBulk,
	getUserDetails,
	updateUserStatus,
	validateBulkUsers,
	validateNewUser,
	validateUpdateUserBody,
	validateUserEmailParam,
} from './admin.handler'

export const adminRouter = express.Router()

adminRouter.post('/create', validateNewUser, createAccount)
adminRouter.post('/create/bulk', validateBulkUsers, createAccountsInBulk)
adminRouter.get('/details', validateUserEmailParam, getUserDetails)
adminRouter.post(
	'/user/update-status',
	validateUpdateUserBody,
	updateUserStatus,
)
