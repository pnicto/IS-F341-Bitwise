import { Role } from '@prisma/client'
import express from 'express'
import Multer from 'multer'
import { authorize } from '../../middleware/authorize'
import {
	addCategory,
	createProduct,
	deleteCategory,
	deleteProduct,
	getCategories,
	getProducts,
	searchProducts,
	unpackProductJSON,
	updateCategory,
	updateProduct,
	validateDeletedCategory,
	validateDeletedProduct,
	validateNewCategory,
	validateNewProduct,
	validateProductQuery,
	validateSearchProduct,
	validateUpdatedCategory,
	validateUpdatedProduct,
} from './products.handler'

const upload = Multer()

export const productRouter = express.Router()

productRouter.post(
	'/new',
	authorize(Role.VENDOR, Role.STUDENT),
	upload.single('image'),
	unpackProductJSON,
	validateNewProduct,
	createProduct,
)
productRouter.post('/update/:id', validateUpdatedProduct, updateProduct)
productRouter.post('/delete/:id', validateDeletedProduct, deleteProduct)
productRouter.get('/', validateProductQuery, getProducts)
productRouter.get('/search', validateSearchProduct, searchProducts)
productRouter.get('/categories', getCategories)

productRouter.post(
	'/categories/new',
	authorize(Role.ADMIN),
	validateNewCategory,
	addCategory,
)
productRouter.post(
	'/categories/delete/:id',
	authorize(Role.ADMIN),
	validateDeletedCategory,
	deleteCategory,
)
productRouter.post(
	'/categories/update/:id',
	authorize(Role.ADMIN),
	validateUpdatedCategory,
	updateCategory,
)
