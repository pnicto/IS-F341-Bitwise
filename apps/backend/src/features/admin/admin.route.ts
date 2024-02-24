import express from 'express'
import {
    createAccount,
    getUserDetails,
    updateUserStatus,
    validateNewUser,
    validateUpdateUserBody,
    validateUserEmailBody,
} from './admin.handler'

export const adminRouter = express.Router()

adminRouter.post('/create', validateNewUser, createAccount)
adminRouter.get('/details', validateUserEmailBody, getUserDetails)
adminRouter.post(
	'/user/update-status',
	validateUpdateUserBody,
	updateUserStatus,
)
