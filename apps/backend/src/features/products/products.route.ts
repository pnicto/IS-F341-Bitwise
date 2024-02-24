import { Role } from '@prisma/client'
import express from 'express'
import { authorize } from '../../middleware/authorize'
import {
	createProduct,
	getAllProducts,
	getAllProductsByShopName,
	updateProduct,
	validateNewProduct,
	validateShopNameParam,
	validateUpdatedProduct,
} from './products.handler'

export const productRouter = express.Router()

productRouter.post(
	'/new',
	authorize(Role.VENDOR),
	validateNewProduct,
	createProduct,
)
productRouter.get('/', getAllProducts)
productRouter.get('/:shopName', validateShopNameParam, getAllProductsByShopName)
productRouter.post('/update/:id', validateUpdatedProduct, updateProduct)
