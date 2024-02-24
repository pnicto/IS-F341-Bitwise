import express from 'express'
import {
    createAccount,
    getUserDetails,
    validateNewUser,
    validateUserEmailParam,
} from './admin.handler'

export const adminRouter = express.Router()

adminRouter.post('/create', validateNewUser, createAccount)
adminRouter.get('/details', validateUserEmailParam, getUserDetails)
