import { Card, Flex, Stack } from '@mantine/core'
import { HistoryItem } from '../features/user/types'

type Props = {
	transaction: HistoryItem
}

const getPersonName = (transaction: Props['transaction']) => {
	switch (transaction.type) {
		case 'DEBIT':
			return transaction.receiverUsername
		case 'CREDIT':
			return transaction.senderUsername
		case 'DEPOSIT':
			return '<DEPOSIT>'
		case 'WITHDRAWAL':
			return '<WITHDRAWAL>'
	}
}

const TransactionItemCard = ({ transaction }: Props) => {
	const personName = getPersonName(transaction)

	return (
		<Card>
			<Flex justify='space-between'>
				<Stack>
					<p className='font-bold text-lg'>{personName}</p>
					<p>{transaction.createdAt.toLocaleString()}</p>
				</Stack>

				<Stack>
					<p
						className={`${
							transaction.type === 'DEPOSIT' || transaction.type === 'DEBIT'
								? 'text-green-500'
								: 'text-red-500'
						} font-bold`}
					>
						{transaction.amount} ₹
					</p>
				</Stack>
			</Flex>
		</Card>
	)
}

export default TransactionItemCard
