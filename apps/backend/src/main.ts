import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import passport from 'passport'
import { authRouter } from './features/auth/route'
import { dashboardRouter } from './features/dashboard/route'
import { productRouter } from './features/products/products.route'

const app = express()

// load env vars
const PORT = process.env.PORT || 3333
const DATABASE_URL = process.env.DATABASE_URL

// middleware
app.use(cookieParser())

// FIXME: deal with the typecast
const frontendIsHTTPS = (process.env.FRONTEND_URL as string).includes(
	'https://',
)
app.use(
	cors({
		credentials: true,
		origin: [
			process.env.FRONTEND_URL as string,
			(process.env.FRONTEND_URL as string).replace(
				frontendIsHTTPS ? 'https://' : 'http://',
				frontendIsHTTPS ? 'https://www.' : 'http://www.',
			),
		],
	}),
)
app.use(morgan('dev'))
app.use(express.json())
app.use(passport.initialize())

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set')
}

// util function to set the root path for the url
function root(url: string) {
	return `/api${url}`
}

// routes
app.get(root(''), async (_req, res) => {
	return res.send({ message: 'Welcome to bitwise!' })
})

// routes
app.use(root('/products'), productRouter)
app.use(root('/dashboard'), dashboardRouter)
app.use(root('/auth'), authRouter)

const server = app.listen(PORT, () => {
	console.log(`Listening at http://localhost:${PORT}/api`)
})

server.on('error', console.error)
