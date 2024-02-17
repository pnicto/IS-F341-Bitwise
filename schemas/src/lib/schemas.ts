import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose'

const userSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
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
