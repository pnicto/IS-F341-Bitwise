import { Role } from '@prisma/client'
import express from 'express'
import { authorize } from '../../middleware/authorize'
import {
	filterTransactionHistory,
	updateTransactionTags,
	validateTransactionFilters,
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

transactionRouter.get(
	'/filter',
	validateTransactionFilters,
	filterTransactionHistory,
)
