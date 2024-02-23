import express from 'express'
import { getAllShops } from './shops.handler'

export const shopRouter = express.Router()
shopRouter.get('/', getAllShops)
