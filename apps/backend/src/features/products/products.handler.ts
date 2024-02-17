import { Product } from '@prisma/client'
import { RequestHandler } from 'express'
import { prisma } from '../../config/prisma'

export const createProduct: RequestHandler = async (req, res) => {
	const { name, description, price }: Product = req.body

	if (!name || !description || !price) {
		return res.status(400).send({ message: 'Invalid body' })
	}

	const product = await prisma.product.create({
		data: { name, description, price },
	})

	return res.status(201).json({ product })
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
