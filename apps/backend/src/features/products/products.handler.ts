import { Category, Product, Role } from '@prisma/client'
import { RequestHandler } from 'express'
import { body, param, query } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import ImageKit from 'imagekit'
import { prisma } from '../../config/prisma'
import { CustomError } from '../../errors/BaseCustomError'
import { BadRequest, Forbidden, NotFound } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'

const imagekit = new ImageKit({
	urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT as string,
	publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY as string,
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
})

export const unpackProductJSON: RequestHandler = (req, res, next) => {
	if (req.body.product)
		req.body = { ...req.body, ...JSON.parse(req.body.product) }
	next()
}

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

		const image = req.file
		if (image === undefined) {
			throw new BadRequest('Product image is required')
		}

		// TODO: figure out what other mime types to support
		if (!['image/jpeg', 'image/png'].includes(image.mimetype)) {
			throw new BadRequest('Product image must be a PNG or JPG')
		}

		// TODO: figure out what max size of image to allow (if changed, frontend will also need updating)
		if (image.size > 5 * 1024 ** 2) {
			throw new BadRequest('Product image must not be larger than 5 MB')
		}

		if (categoryName) {
			const category = await prisma.category.findUnique({
				where: { name: categoryName },
			})
			if (!category) {
				throw new NotFound('The category does not exist')
			}
		}

		const vendor = getAuthorizedUser(req)
		let uploadResponse

		// TODO: Properly handle errors in uploading image
		try {
			uploadResponse = await imagekit.upload({
				file: image.buffer,
				fileName: name,
				useUniqueFileName: true,
				folder: '/bitwise',
			})
		} catch (err) {
			throw new CustomError('Error updating product image', 500)
		}

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
				imageId: uploadResponse.fileId,
				imagePath: uploadResponse.filePath,
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
]

export const searchProducts: RequestHandler = async (req, res, next) => {
	try {
		const { name, category } = validateRequest<{
			name: string
			category?: Product['categoryName']
		}>(req)

		const products = await prisma.product.findMany({
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

		const image = req.file

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

		let imageId = product.imageId
		let imagePath = product.imagePath

		if (image !== undefined) {
			// TODO: figure out what other mime types to support
			if (!['image/jpeg', 'image/png'].includes(image.mimetype)) {
				throw new BadRequest('Product image must be a PNG or JPG')
			}

			// TODO: figure out what max size of image to allow (if changed, frontend will also need updating)
			if (image.size > 5 * 1024 ** 2) {
				throw new BadRequest('Product image must not be larger than 5 MB')
			}

			// TODO: Properly handle errors in deleting and uploading image
			try {
				await imagekit.deleteFile(product.imageId)
			} catch (err) {
				// We don't want to always throw an error here because even if delete failed (probably due to the image not existing) we still want the update to go through
				console.log(err)
			}
			try {
				const uploadResponse = await imagekit.upload({
					file: image.buffer,
					fileName: product.name,
					useUniqueFileName: true,
					folder: 'bitwise',
				})

				imageId = uploadResponse.fileId
				imagePath = uploadResponse.filePath
			} catch (err) {
				console.log(err)

				throw new CustomError('Error updating product image', 500)
			}
		}

		await prisma.product.update({
			where: { id: id },
			data: {
				name,
				description,
				price,
				categoryName: categoryName || null,
				imageId,
				imagePath,
			},
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
			.json({ message: 'Category successfully created' })
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
