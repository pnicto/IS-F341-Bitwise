import express from 'express'
import {
	disableAccount,
	editUserDetails,
	getUserDetails,
	validateNewDetails,
} from './user.handler'

export const userRouter = express.Router()
userRouter.get('/details', getUserDetails)
userRouter.post('/details/edit', validateNewDetails, editUserDetails)
userRouter.post('/disable-account', disableAccount)
