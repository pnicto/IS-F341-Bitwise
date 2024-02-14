import { Product, ProductModel } from '@schemas'
import { RequestHandler } from 'express'

export const createProduct: RequestHandler = async (req, res) => {
	const { name, description, price }: Product = req.body
	if (!name || !description || !price) {
		return res.status(400).send({ message: 'Invalid body' })
	}

	try {
		const product = new ProductModel({ name, description, price })
		product.save()
		return res.status(201).json({ product })
	} catch (err) {
		console.log(err)
		return res.json({ msg: 'Something went wrong' })
	}
}
