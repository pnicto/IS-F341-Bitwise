import { InferSchemaType, model, Schema } from 'mongoose'

const userSchema = new Schema({
	name: String,
	email: String,
	password: String,
})

export type User = InferSchemaType<typeof userSchema>
export const UserModel = model('User', userSchema)
