import { Loader, Stack } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import axios from '../../lib/axios'
import TransactionItemCard from '../../shared/transaction-item-card'
import { HistoryItem } from './types'

const TransactionHistory = () => {
	const transactionsQuery = useQuery({
		queryKey: ['transactions'],
		queryFn: async () => {
			const response = await axios.get<HistoryItem[]>('/transactions/view', {})
			return response.data
		},
		select: (data) =>
			// this is performed to convert the date strings in the json to Date objects
			data.map((transaction) => ({
				...transaction,
				createdAt: new Date(transaction.createdAt),
			})),
	})

	if (transactionsQuery.isPending)
		return (
			// TODO: Extract this loader to a separate component and make it better
			<div className='text-center'>
				<Loader />
			</div>
		)

	if (transactionsQuery.isError) {
		// TODO: Replace with a better error component
		return <div>Error fetching user data</div>
	}

	return (
		<Stack>
			{transactionsQuery.data.map((transaction) => {
				return (
					<TransactionItemCard key={transaction.id} transaction={transaction} />
				)
			})}
		</Stack>
	)
}

export default TransactionHistory
