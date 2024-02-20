import { Product } from '@prisma/client'
import { RequestHandler } from 'express'
import { body } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { validateRequest } from '../../utils/validateRequest'

export const validateNewProduct = [
	body('name').trim().notEmpty().withMessage('Product name is required'),
	body('description')
		.trim()
		.notEmpty()
		.withMessage('Product description is required'),
	body('price').isInt({ min: 1 }).toInt().withMessage('Price must be a number'),
]
export const createProduct: RequestHandler = async (req, res, next) => {
	try {
		const { name, description, price } =
			validateRequest<Pick<Product, 'name' | 'description' | 'price'>>(req)
		await prisma.product.create({
			data: { name, description, price },
		})
		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'Product successfully created' })
	} catch (err) {
		next(err)
	}
}

export const getAllProducts: RequestHandler = async (_req, res, next) => {
	try {
		const products = await prisma.product.findMany()
		return res.status(StatusCodes.OK).json({ products })
	} catch (err) {
		next(err)
	}
}
