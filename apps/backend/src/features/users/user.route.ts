import express from 'express'
import { getUserDetails } from './user.handler'

export const userRouter = express.Router()
userRouter.get('/details', getUserDetails)
