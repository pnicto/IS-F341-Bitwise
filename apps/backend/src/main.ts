import type { User } from '@schemas'
import { UserModel } from '@schemas'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import { dashboardRouter } from './features/dashboard/route'

const app = express()

// load env vars
const PORT = process.env.PORT || 3333
const DATABASE_URL = process.env.DATABASE_URL

// middleware
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set')
}

// connect to the database
async function connectDB() {
	await mongoose.connect(DATABASE_URL)
}
console.log('Connecting to the database...')
connectDB()
	.then(() => console.log('Connected to the database'))
	.catch((err) => console.log(err))

// util function to set the root path for the url
function root(url: string) {
	return `/api${url}`
}

// routes
app.get(root(''), async (_req, res) => {
	return res.send({ message: 'Welcome to bitwise!' })
})

// TODO: test routes which will be changed/removed later
app.get(root('/users'), async (req, res) => {
	const users = await UserModel.find()
	return res.json(users)
})

app.post(root('/user'), async (req, res) => {
	const { username, email }: User = req.body

	const user = new UserModel({ username, email })
	await user.save()
	return res.json(user)
})

app.use(root('/dashboard'), dashboardRouter)

const server = app.listen(PORT, () => {
	console.log(`Listening at http://localhost:${PORT}/api`)
})

server.on('error', console.error)
