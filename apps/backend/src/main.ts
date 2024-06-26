import { Role } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
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
import { paymentRequestRouter } from './features/paymentRequests/paymentRequest.route'
import { paymentRouter } from './features/payments/payment.route'
import { productRouter } from './features/products/products.route'
import { reportsRouter } from './features/reports/reports.route'
import { shopRouter } from './features/shops/shops.route'
import { transactionRouter } from './features/transactions/transactions.route'
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

app.use(
	cors({
		credentials: true,
		origin:
			process.env.NODE_ENV === 'production'
				? 'https://bitwise.fly.dev'
				: 'http://localhost:4200',
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
	return res.send({ msg: 'Welcome to bitwise!' })
})

// routes
app.use(root('/products'), passportJWT, productRouter)
app.use(root('/admin'), passportJWT, authorize(Role.ADMIN), adminRouter)
app.use(root('/auth'), authRouter)
app.use(root('/pay'), passportJWT, paymentRouter)
app.use(root('/wallet'), passportJWT, walletRouter)
app.use(root('/user'), passportJWT, userRouter)
app.use(root('/shops'), passportJWT, shopRouter)
app.use(root('/transactions'), passportJWT, transactionRouter)
app.use(root('/requests'), passportJWT, paymentRequestRouter)
app.use(root('/reports'), passportJWT, reportsRouter)

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
		// TODO: Probably create a function which deals with this horrible nesting
		case err instanceof PrismaClientKnownRequestError:
			if (err.code === 'P2002') {
				if (err.meta) {
					res
						.status(StatusCodes.BAD_REQUEST)
						.json({ errors: [{ msg: err.meta.modelName + ' already exists' }] })
				} else
					res
						.status(StatusCodes.BAD_REQUEST)
						.json({ errors: [{ msg: 'Record already exists' }] })
			} else {
				res
					.status(StatusCodes.INTERNAL_SERVER_ERROR)
					.json({ errors: [{ msg: 'Database error' }] })
			}
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
