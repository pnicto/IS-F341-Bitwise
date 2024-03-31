import express from 'express'
import { Role } from '@prisma/client'
import { authorize } from '../../middleware/authorize'
import {
	updateTransactionTags,
	validateUpdatedTags,
	viewTransactionHistory,
	viewTransactionHistoryValidator,
} from './transactions.handler'

export const transactionRouter = express.Router()

transactionRouter.get(
	'/view',
	authorize(Role.STUDENT, Role.VENDOR),
	viewTransactionHistoryValidator,
	viewTransactionHistory,
)
transactionRouter.post(
	'/update/:id',
	authorize(Role.STUDENT, Role.VENDOR),
	validateUpdatedTags,
	updateTransactionTags,
)
