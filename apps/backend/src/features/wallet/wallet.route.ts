import express from 'express'
import { modifyWalletBalance, validateTopUp } from './wallet.handler'

export const walletRouter = express.Router()
walletRouter.post('/', validateTopUp, modifyWalletBalance)
