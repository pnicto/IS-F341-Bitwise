import { Role } from '@prisma/client'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { ErrorRequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import morgan from 'morgan'
import passport from 'passport'
import { CustomError } from './errors/BaseCustomError'
import { ValidationError } from './errors/CustomErrors'
import { adminRouter } from './features/admin/admin.route'
import { authRouter } from './features/auth/auth.route'
import { paymentRouter } from './features/payments/payment.route'
import { productRouter } from './features/products/products.route'
import { userRouter } from './features/users/user.route'
import { walletRouter } from './features/wallet/wallet.route'
import { authorize } from './middleware/authorize'

const app = express()
const passportJWT = passport.authenticate('jwt', { session: false })

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
app.use(root('/admin'), passportJWT, authorize(Role.ADMIN), adminRouter)
app.use(root('/auth'), authRouter)
app.use(root('/pay'), passportJWT, paymentRouter)
app.use(root('/wallet'), passportJWT, walletRouter)
app.use(root('/user'), passportJWT, userRouter)

// Custom error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	switch (true) {
		case err instanceof ValidationError:
			console.error('Validation Error at', req.url, err)
			res.status(err.statusCode).json({ errors: err.errors })
			break
		case err instanceof CustomError:
			console.error('Custom Error at', req.url, err)
			res.status(err.statusCode).json({ errors: err.serializeErrors() })
			break
		case err instanceof Error:
			console.error('Known Error at', req.url, err)
			res
				.status(StatusCodes.INTERNAL_SERVER_ERROR)
				.json({ errors: [{ msg: 'Something went wrong' }] })
			break
		default:
			console.error('Unknown Error at', req.url, err)
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				errors: [{ msg: err }],
			})
	}
}

app.use(errorHandler)

const server = app.listen(PORT, () => {
	console.log(`Listening at http://localhost:${PORT}/api`)
})

server.on('error', console.error)
