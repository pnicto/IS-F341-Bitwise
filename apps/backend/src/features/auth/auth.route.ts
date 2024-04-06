import express from 'express'
import passport from '../../config/passport'
import {
	login,
	logout,
	resetPassword,
	validateLogin,
	validateResetPassword,
} from './auth.handler'

const passportJWT = passport.authenticate('jwt', { session: false })

export const authRouter = express.Router()

authRouter.post('/login', validateLogin, login)
authRouter.post('/logout', passportJWT, logout)
authRouter.post('/reset-password', validateResetPassword, resetPassword)
