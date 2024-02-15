import express from 'express'
import { makePayment } from './wallet.handler'

export const walletRouter = express.Router()
walletRouter.post('/pay', makePayment)
