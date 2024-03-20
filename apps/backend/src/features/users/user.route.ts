import express from 'express'
import {
	editUserDetails,
	getUserDetails,
	updateUserStatus,
	validateNewDetails,
	validateUpdateUserStatus,
} from './user.handler'

export const userRouter = express.Router()
userRouter.get('/details', getUserDetails)
userRouter.post('/details/edit', validateNewDetails, editUserDetails)
userRouter.post('/update-status', validateUpdateUserStatus, updateUserStatus)
