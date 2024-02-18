import { Product } from '@prisma/client'
import { RequestHandler } from 'express'
import { prisma } from '../../config/prisma'
import { validateRequest } from '../../utils/validateRequest'

export const validateNewProduct = [
	body('name').trim().notEmpty().withMessage('Product name is required'),
	body('description')
		.trim()
		.notEmpty()
		.withMessage('Product description is required'),
	body('price').isNumeric().toInt().withMessage('Price must be a number'),
]
}

export const getAllProducts: RequestHandler = async (req, res) => {
	try {
		const products = await prisma.product.findMany()
		return res.json(products)
	} catch (err) {
		console.log(err)
		return res.json({ msg: 'Something went wrong' })
	}
}
