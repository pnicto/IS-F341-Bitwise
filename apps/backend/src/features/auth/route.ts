import express from 'express'
import passport from '../../config/passport'
import { login, logout } from './handler'

const passportJWT = passport.authenticate('jwt', { session: false })

export const authRouter = express.Router()

authRouter.post('/login', login)
authRouter.post('/logout', passportJWT, logout)
