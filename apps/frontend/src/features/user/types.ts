import { Transaction, TransactionType } from '@prisma/client'

// TODO: Ask about the status of the transaction
export type HistoryItem = Omit<Transaction, 'status'> & {
	type: TransactionType | 'DEBIT' | 'CREDIT'
}
