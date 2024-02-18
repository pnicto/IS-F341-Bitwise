import express from 'express'
import {
	createProduct,
	getAllProducts,
	validateNewProduct,
} from './products.handler'

export const productRouter = express.Router()
productRouter.post('/new', validateNewProduct, createProduct)
productRouter.get('/', getAllProducts)
