import { Card, Flex } from '@mantine/core'
import { WalletTransactionType } from '@prisma/client'
import { ReactNode } from 'react'

type Props = {
	username: string
	amount: number
	createdAt: Date
	type: WalletTransactionType | 'DEBIT' | 'CREDIT'
	bottomLeft?: ReactNode
	bottomRight?: ReactNode
}

const TransactionItemCard = ({
	username,
	amount,
	createdAt,
	type,
	bottomLeft,
	bottomRight,
}: Props) => {
	return (
		<Card>
			<Flex justify='space-between'>
				<div className='flex flex-col'>
					<p className='font-bold text-lg'>{username}</p>
					<p>{createdAt.toLocaleString()}</p>
					<div className='flex flex-wrap gap-3'>{bottomLeft}</div>
				</div>

				<div className='flex flex-col items-end'>
					<p
						className={`${
							type === 'DEPOSIT' || type === 'DEBIT'
								? 'text-green-500'
								: 'text-red-500'
						} font-bold`}
					>
						{amount} ₹
					</p>
					<div className='flex flex-wrap gap-3 justify-end'>{bottomRight}</div>
				</div>
			</Flex>
		</Card>
	)
}

export default TransactionItemCard
