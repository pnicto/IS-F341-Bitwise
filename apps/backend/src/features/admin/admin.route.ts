import express from 'express'
import {
	createAccount,
	validateNewUser,
	createAccountsInBulk,
	validateBulkUsers,
} from './admin.handler'

export const adminRouter = express.Router()

adminRouter.post('/create', validateNewUser, createAccount)
adminRouter.post('/create/bulk', validateBulkUsers, createAccountsInBulk)
