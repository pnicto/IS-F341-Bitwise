import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose'

const userSchema = new Schema({
	username: {
		type: String,
		required: [true, 'User must have a username'],
	},
	email: {
		type: String,
		required: [true, 'User must have an email'],
		unique: [true, 'This email has already been used'],
	},
	password: {
		type: String,
		required: [true, 'User must have a password'],
	},
	wallet: {
		type: Schema.Types.ObjectId,
		ref: 'Wallet',
		required: true,
	},
})

export type NewUser = InferSchemaType<typeof userSchema>
export type User = HydratedDocument<NewUser>
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

const walletSchema = new Schema({
	balance: {
		type: Number,
		required: true,
		min: 0,
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
})

export type NewWallet = InferSchemaType<typeof walletSchema>
export type Wallet = HydratedDocument<NewWallet>
export const WalletModel = model('Wallet', walletSchema)
