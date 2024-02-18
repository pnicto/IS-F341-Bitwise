import express from 'express'
import { transact, validateTransaction } from './payment.handler'

export const paymentRouter = express.Router()
paymentRouter.post('/', validateTransaction, transact)
