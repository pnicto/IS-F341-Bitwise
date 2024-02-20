import express from 'express'
import passport from '../../config/passport'
import { Role } from '@prisma/client'
import { authorize } from '../../middleware/authorize'
import {
	createProduct,
	getAllProducts,
	validateNewProduct,
} from './products.handler'

const passportJWT = passport.authenticate('jwt', { session: false })

export const productRouter = express.Router()

productRouter.post(
	'/new',
	passportJWT,
	authorize(Role.VENDOR),
	validateNewProduct,
	createProduct,
)
productRouter.get('/', getAllProducts)
