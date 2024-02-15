import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose'

const userSchema = new Schema({
	name: String,
	email: String,
	password: String,
})

export type User = InferSchemaType<typeof userSchema>
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