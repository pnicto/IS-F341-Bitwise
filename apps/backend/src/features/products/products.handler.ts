import { Product } from '@prisma/client'
import { RequestHandler } from 'express'
import { body, param } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { Forbidden, NotFound } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
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
		const vendor = getAuthorizedUser(req)
		await prisma.product.create({
			data: { name, description, price, vendorId: vendor.id },
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

export const validateShopNameParam = [
	param('shopName').trim().notEmpty().withMessage('Shop name is required'),
]
export const getAllProductsByShopName: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const { shopName } = validateRequest<{ shopName: string }>(req)

		const vendor = await prisma.user.findFirst({ where: { shopName } })
		if (!vendor) {
			throw new NotFound('The shop does not exist')
		}

		const products = await prisma.product.findMany({
			where: { vendorId: vendor.id },
		})
		return res.status(StatusCodes.OK).json({ products })
	} catch (err) {
		next(err)
	}
}

export const validateUpdatedProduct = [
	param('id').trim().notEmpty().withMessage('Product ID is required'),
	body('name').trim().notEmpty().withMessage('Product name is required'),
	body('description')
		.trim()
		.notEmpty()
		.withMessage('Product description is required'),
	body('price').isInt({ min: 1 }).toInt().withMessage('Price must be a number'),
]
export const updateProduct: RequestHandler = async (req, res, next) => {
	try {
		const { name, description, price, id } =
			validateRequest<Pick<Product, 'name' | 'description' | 'price' | 'id'>>(
				req,
			)
		const vendor = getAuthorizedUser(req)

		const product = await prisma.product.findUnique({ where: { id: id } })

		if (!product) {
			throw new NotFound('The product does not exist')
		}
		if (product.vendorId !== vendor.id) {
			throw new Forbidden('The user does not own this product')
		}

		await prisma.product.update({
			where: { id: id },
			data: { name, description, price, vendorId: vendor.id },
		})
		return res
			.status(StatusCodes.OK)
			.json({ message: 'Product successfully updated' })
	} catch (err) {
		next(err)
	}
}
