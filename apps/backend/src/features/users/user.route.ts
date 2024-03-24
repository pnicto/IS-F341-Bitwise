import express from 'express'
import {
	disableAccount,
	createNewTag,
	deleteTag,
	editTag,
	editUserDetails,
	getTags,
	getUserDetails,
	validateNewDetails,
	validateTag,
	validateUpdateTag,
} from './user.handler'

export const userRouter = express.Router()
userRouter.get('/details', getUserDetails)
userRouter.post('/details/edit', validateNewDetails, editUserDetails)
userRouter.post('/disable-account', disableAccount)
userRouter.get('/tags/', getTags)
userRouter.post('/tags/create', validateTag, createNewTag)
userRouter.post('/tags/edit', validateUpdateTag, editTag)
userRouter.post('/tags/delete', validateTag, deleteTag)
