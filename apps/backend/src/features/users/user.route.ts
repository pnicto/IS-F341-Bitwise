import express from 'express'
import {
	createNewTag,
	editUserDetails,
	getTags,
	getUserDetails,
	validateNewDetails,
	validateNewTag,
} from './user.handler'

export const userRouter = express.Router()
userRouter.get('/details', getUserDetails)
userRouter.post('/details/edit', validateNewDetails, editUserDetails)
userRouter.get('/tags/', getTags)
userRouter.post('/tags/create', validateNewTag, createNewTag)
