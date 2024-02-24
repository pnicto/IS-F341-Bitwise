import express from 'express'
import {
    createAccount,
    getUserDetails,
    updateUserStatus,
    validateNewUser,
    validateUpdateUserParams,
    validateUserEmailParam,
} from './admin.handler'

export const adminRouter = express.Router()

adminRouter.post('/create', validateNewUser, createAccount)
adminRouter.get('/details', validateUserEmailParam, getUserDetails)
adminRouter.post(
	'/user/update-status',
	validateUpdateUserParams,
	updateUserStatus,
)
