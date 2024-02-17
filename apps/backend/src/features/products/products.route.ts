import express from 'express'
import { createProduct, getAllProducts } from './products.handler'

export const productRouter = express.Router()
productRouter.post('/new', createProduct)
productRouter.get('/', getAllProducts)
