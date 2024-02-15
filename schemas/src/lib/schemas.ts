import { HydratedDocument, InferSchemaType, model, Schema } from 'mongoose'

const userSchema = new Schema({
	name: {
		type: String,
		required: [true, 'User must have a name'],
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
})

export type User = HydratedDocument<InferSchemaType<typeof userSchema>>
export const UserModel = model('User', userSchema)
