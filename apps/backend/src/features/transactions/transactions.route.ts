import express from 'express'
import { Role } from '@prisma/client'
import { authorize } from '../../middleware/authorize'
import {
	updateTransactionTags,
	validateUpdatedTags,
	viewTransactionHistory,
} from './transactions.handler'

export const transactionRouter = express.Router()

transactionRouter.get(
	'/view',
	authorize(Role.STUDENT, Role.VENDOR),
	viewTransactionHistory,
)
transactionRouter.post(
	'/update/:id',
	authorize(Role.STUDENT, Role.VENDOR),
	validateUpdatedTags,
	updateTransactionTags,
)
