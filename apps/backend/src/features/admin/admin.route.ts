import express from 'express'
import passport from '../../config/passport'
import { Role } from '@prisma/client'
import { authorize } from '../../middleware/authorize'
import { createAccount, validateNewUser } from './admin.handler'

const passportJWT = passport.authenticate('jwt', { session: false })

export const adminRouter = express.Router()

adminRouter.post(
	'/create',
	passportJWT,
	authorize(Role.ADMIN),
	validateNewUser,
	createAccount,
)
