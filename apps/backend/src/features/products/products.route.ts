import express from 'express'
import { createProduct } from './products.handler'

export const productRouter = express.Router()
productRouter.post('/new', createProduct)
