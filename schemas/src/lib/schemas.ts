import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose'

const userSchema = new Schema({
	name: String,
	email: String,
	password: String,
})

export type User = InferSchemaType<typeof userSchema>
export const UserModel = model('User', userSchema)

const productSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
		min: 0,
	},
})

export type NewProduct = InferSchemaType<typeof productSchema>
export type Product = HydratedDocument<NewProduct>
export const ProductModel = model('Product', productSchema)
