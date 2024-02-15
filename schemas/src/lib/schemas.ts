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

const transactionSchema = new Schema({
	amount: {
		type: Number,
		required: true,
		min: 0,
	},
	from: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	to: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	time: {
		type: Date,
		default: Date.now(),
	},
})

export type NewTransaction = InferSchemaType<typeof transactionSchema>
export type Transaction = HydratedDocument<NewTransaction>
export const TransactionModel = model('Transaction', transactionSchema)
