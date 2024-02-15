import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose'

const userSchema = new Schema({
	idNumber: {
		type: String,
		required: true,
		unique: true,
	},
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
		balance: {
			type: Number,
			required: true,
			min: 0,
		},
	},
})

export type NewUser = InferSchemaType<typeof userSchema>
export type User = HydratedDocument<NewUser>
export const UserModel = model('User', userSchema)

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
