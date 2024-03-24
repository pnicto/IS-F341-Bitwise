import { Role } from '@prisma/client'
import express from 'express'
import { authorize } from '../../middleware/authorize'
import {
	createProduct,
	deleteProduct,
	getProducts,
	searchProducts,
	updateProduct,
	validateDeletedProduct,
	validateNewProduct,
	validateProductQuery,
	validateSearchProduct,
	validateUpdatedProduct,
} from './products.handler'

export const productRouter = express.Router()

productRouter.post(
	'/new',
	authorize(Role.VENDOR, Role.STUDENT),
	validateNewProduct,
	createProduct,
)
productRouter.post('/update/:id', validateUpdatedProduct, updateProduct)
productRouter.post('/delete/:id', validateDeletedProduct, deleteProduct)
productRouter.get('/', validateProductQuery, getProducts)
productRouter.get('/search', validateSearchProduct, searchProducts)
