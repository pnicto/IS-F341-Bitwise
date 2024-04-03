import { Category, Product, Role } from '@prisma/client'
import { RequestHandler } from 'express'
import { body, param, query } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, Forbidden, NotFound } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { intOrNaN } from '../../utils/intOrNaN'
import { validateRequest } from '../../utils/validateRequest'

export const validateNewProduct = [
	body('name').trim().notEmpty().withMessage('Product name is required'),
	body('description')
		.trim()
		.notEmpty()
		.withMessage('Product description is required'),
	body('price').isInt({ min: 1 }).toInt().withMessage('Price must be a number'),
	body('categoryName').trim().optional(),
]
export const createProduct: RequestHandler = async (req, res, next) => {
	try {
		const { name, description, price, categoryName } =
			validateRequest<
				Pick<Product, 'name' | 'description' | 'price' | 'categoryName'>
			>(req)

		if (categoryName) {
			const category = await prisma.category.findUnique({
				where: { name: categoryName },
			})
			if (!category) {
				throw new NotFound('The category does not exist')
			}
		}

		const vendor = getAuthorizedUser(req)
		await prisma.product.create({
			data: {
				name,
				description,
				price,
				categoryName: categoryName || null,
				vendorId: vendor.id,
				sellerDetails: {
					username: vendor.username,
					email: vendor.email,
					mobile: vendor.mobile,
					shopName: vendor.shopName,
				},
			},
		})
		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'Product successfully created' })
	} catch (err) {
		next(err)
	}
}

export const validateProductQuery = [
	query('shopName').trim().notEmpty().optional(),
	query('vendorId').trim().notEmpty().optional(),
]
export const getProducts: RequestHandler = async (req, res, next) => {
	try {
		const { shopName, vendorId } = validateRequest<{
			shopName: string | undefined
			vendorId: string | undefined
		}>(req)

		let products

		if (!(vendorId || shopName)) {
			products = await prisma.product.findMany()
		}

		if (vendorId) {
			const vendor = await prisma.user.findFirst({ where: { id: vendorId } })
			if (!vendor) {
				throw new NotFound('The user does not exist')
			}

			products = await prisma.product.findMany({
				where: { vendorId: vendor.id },
			})
		} else if (shopName === 'buy&sell') {
			// for 'buy and sell' products, include the student details so the frontend can display them
			products = await prisma.product.findMany({
				where: { vendor: { role: Role.STUDENT } },
			})
		} else {
			const vendor = await prisma.user.findFirst({ where: { shopName } })
			if (!vendor) {
				throw new NotFound('The shop does not exist')
			}

			products = await prisma.product.findMany({
				where: { vendorId: vendor.id },
			})
		}
		return res.status(StatusCodes.OK).json({ products })
	} catch (err) {
		next(err)
	}
}

export const validateSearchProduct = [
	query('name').trim().notEmpty().withMessage('Product name is required'),
	query('category').trim().optional(),
	query('items').trim().optional(),
	query('page').trim().optional(),
]

export const searchProducts: RequestHandler = async (req, res, next) => {
	try {
		const { name, category, items, page } = validateRequest<{
			name: string
			category?: Product['categoryName']
			items: string | undefined
			page: undefined
		}>(req)

		let numberOfItems = intOrNaN(items)
		let currentPage = intOrNaN(page)

		if (isNaN(numberOfItems)) {
			numberOfItems = 10
		}
		if (isNaN(currentPage)) {
			currentPage = 1
		}
		currentPage -= 1

		if (numberOfItems < 1) {
			throw new BadRequest('Invalid number of items')
		}
		if (currentPage < 0) {
			throw new BadRequest('Invalid page number')
		}

		const products = await prisma.product.findMany({
			skip: numberOfItems * currentPage,
			take: numberOfItems,
			where: {
				name: { contains: name, mode: 'insensitive' },
				// prisma with field undefined will discard the filter on that field. so when the category is ''it will only filter by name
				categoryName: category === '' ? undefined : category,
			},
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
	body('categoryName').trim().optional(),
]
export const updateProduct: RequestHandler = async (req, res, next) => {
	try {
		const { name, description, price, categoryName, id } =
			validateRequest<
				Pick<Product, 'name' | 'description' | 'price' | 'categoryName' | 'id'>
			>(req)

		if (categoryName) {
			const category = await prisma.category.findUnique({
				where: { name: categoryName },
			})
			if (!category) {
				throw new NotFound('The category does not exist')
			}
		}

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
			data: { name, description, price, categoryName: categoryName || null },
		})
		return res
			.status(StatusCodes.OK)
			.json({ message: 'Product successfully updated' })
	} catch (err) {
		next(err)
	}
}

export const validateDeletedProduct = [
	param('id').trim().notEmpty().withMessage('Product ID is required'),
]
export const deleteProduct: RequestHandler = async (req, res, next) => {
	try {
		const { id } = validateRequest<Pick<Product, 'id'>>(req)
		const vendor = getAuthorizedUser(req)

		const product = await prisma.product.findUnique({ where: { id: id } })

		if (!product) {
			throw new NotFound('The product does not exist')
		}
		if (product.vendorId !== vendor.id) {
			throw new Forbidden('The user does not own this product')
		}

		await prisma.product.delete({
			where: { id: id },
		})
		return res
			.status(StatusCodes.OK)
			.json({ message: 'Product successfully deleted' })
	} catch (err) {
		next(err)
	}
}

export const getCategories: RequestHandler = async (req, res, next) => {
	try {
		const categories = await prisma.category.findMany()
		return res.status(StatusCodes.OK).json({ categories })
	} catch (err) {
		next(err)
	}
}

export const validateNewCategory = [
	body('name').trim().notEmpty().withMessage('Category name is required'),
]
export const addCategory: RequestHandler = async (req, res, next) => {
	try {
		const { name } = validateRequest<Pick<Category, 'name'>>(req)
		if (name === '(None)') {
			// To stop confusion when user doesn't want to pick any category
			throw new BadRequest("Category can't be named '(None)'")
		}
		await prisma.category.create({ data: { name } })
		return res
			.status(StatusCodes.CREATED)
			.json({ message: 'Product successfully created' })
	} catch (err) {
		next(err)
	}
}

export const validateDeletedCategory = [
	param('id').trim().notEmpty().withMessage('Category ID is required'),
]
export const deleteCategory: RequestHandler = async (req, res, next) => {
	try {
		const { id } = validateRequest<Pick<Category, 'id'>>(req)

		const category = await prisma.category.findUnique({ where: { id } })
		if (!category) {
			throw new NotFound('The category does not exist')
		}

		await prisma.$transaction([
			prisma.product.updateMany({
				data: { categoryName: null },
				where: { categoryName: category.name },
			}),
			prisma.category.delete({
				where: { id },
			}),
		])

		return res
			.status(StatusCodes.OK)
			.json({ message: 'Category successfully deleted' })
	} catch (err) {
		next(err)
	}
}

export const validateUpdatedCategory = [
	param('id').trim().notEmpty().withMessage('Category ID is required'),
	body('name').trim().notEmpty().withMessage('Category name is required'),
]
export const updateCategory: RequestHandler = async (req, res, next) => {
	try {
		const { id, name } = validateRequest<Pick<Category, 'id' | 'name'>>(req)

		const category = await prisma.category.findUnique({ where: { id } })
		if (!category) {
			throw new NotFound('The category does not exist')
		}

		await prisma.$transaction([
			prisma.category.update({ data: { name }, where: { id } }),
			prisma.product.updateMany({
				data: { categoryName: name },
				where: { categoryName: category.name },
			}),
		])

		return res
			.status(StatusCodes.OK)
			.json({ message: 'Category successfully updated' })
	} catch (err) {
		next(err)
	}
}
