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
})

export type NewUser = InferSchemaType<typeof userSchema>
export type User = HydratedDocument<NewUser>
export const UserModel = model('User', userSchema)
