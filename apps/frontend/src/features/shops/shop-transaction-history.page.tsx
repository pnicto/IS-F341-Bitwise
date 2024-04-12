import { Icon } from '@iconify/react'
import {
	Button,
	Card,
	Collapse,
	Group,
	NumberInput,
	Pagination,
	Stack,
	TextInput,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { Transaction } from '@prisma/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import axios from '../../lib/axios'
import CustomLoader from '../../shared/loader'
import TransactionItemCard from '../../shared/transaction-item-card'

const ShopTransactionHistory = () => {
	const numberOfItems = 5

	const [currentPage, setCurrentPage] = useState(1)

	const filterForm = useForm({
		initialValues: {
			fromUser: '',
			fromDate: '',
			toDate: '',
			minAmount: '',
			maxAmount: '',
		},
		transformValues: (values) => ({
			fromDate: values.fromDate ? new Date(values.fromDate).toISOString() : '',
			toDate: values.toDate ? new Date(values.toDate).toISOString() : '',
		}),
	})

	const queryClient = useQueryClient()

	const filterFormValues = filterForm.values
	const filterFormTransformedValues = filterForm.getTransformedValues()

	const transactionsQuery = useQuery({
		queryKey: [
			'transactions',
			{
				page: currentPage,
				fromUser: filterFormValues.fromUser,
				fromDate: filterFormTransformedValues.fromDate,
				toDate: filterFormTransformedValues.toDate,
				minAmount: filterFormValues.minAmount,
				maxAmount: filterFormValues.maxAmount,
			},
		],
		queryFn: async () => {
			const response = await axios.get<{
				transactions: Transaction[]
				totalPages: number
			}>(
				`/transactions/view/shop?items=${numberOfItems}&page=${currentPage}&fromUser=${filterFormValues.fromUser}&fromDate=${filterFormTransformedValues.fromDate}&toDate=${filterFormTransformedValues.toDate}&minAmount=${filterFormValues.minAmount}&maxAmount=${filterFormValues.maxAmount}`,
			)
			return response.data
		},
		select: (data) => {
			// this is performed to convert the date strings in the json to Date objects
			return {
				...data,
				transactions: data.transactions.map((transaction) => ({
					...transaction,
					createdAt: new Date(transaction.createdAt),
				})),
			}
		},
	})

	const [filtersIsOpen, { toggle: filtersToggle }] = useDisclosure(false)

	return (
		<>
			<Group justify='right' className='pb-5'>
				<Button onClick={filtersToggle}>
					{filtersIsOpen ? 'Hide' : 'Show'} Filters
				</Button>
			</Group>
			<Collapse in={filtersIsOpen}>
				<Card className='mb-5'>
					<Stack>
						<Group justify='center'>
							<TextInput
								label='From User'
								placeholder='john420'
								{...filterForm.getInputProps('fromUser')}
							/>

							<DateTimePicker
								label='From date and time'
								placeholder='Pick date and time'
								clearable
								{...filterForm.getInputProps('fromDate')}
							/>
							<DateTimePicker
								label='To date and time'
								placeholder='Pick date and time'
								clearable
								{...filterForm.getInputProps('toDate')}
							/>
							<NumberInput
								label='Minimum Amount (INR)'
								placeholder='40'
								leftSection={<Icon icon='lucide:indian-rupee' />}
								{...filterForm.getInputProps('minAmount')}
							/>
							<NumberInput
								label='Maximum Amount (INR)'
								placeholder='40'
								leftSection={<Icon icon='lucide:indian-rupee' />}
								{...filterForm.getInputProps('maxAmount')}
							/>
							<Button onClick={filterForm.reset}>Clear All Filters</Button>
						</Group>
					</Stack>
				</Card>
			</Collapse>

			<CustomLoader
				errorMessage={"Couldn't get your transactions"}
				query={transactionsQuery}
				arrayKey='transactions'
			>
				{(data) => (
					<>
						<Stack>
							{data.transactions.map((transaction) => (
								<TransactionItemCard
									key={transaction.id}
									{...transaction}
									type='CREDIT'
									username={transaction.senderUsername}
								/>
							))}
						</Stack>
						<div className='flex flex-col items-center'>
							<Pagination
								total={data.totalPages}
								value={currentPage}
								onChange={(value: number) => {
									setCurrentPage(value)
									queryClient.invalidateQueries({
										queryKey: ['transactions', { page: value }],
									})
								}}
								mt='sm'
							/>
						</div>
					</>
				)}
			</CustomLoader>
		</>
	)
}

export default ShopTransactionHistory
