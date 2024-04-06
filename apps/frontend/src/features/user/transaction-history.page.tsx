import { Icon } from '@iconify/react'
import {
	ActionIcon,
	Badge,
	Button,
	Card,
	Center,
	Collapse,
	ComboboxItem,
	Group,
	Modal,
	NumberInput,
	OptionsFilter,
	Pagination,
	Select,
	Stack,
	Switch,
	TagsInput,
	TextInput,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { Transaction, WalletTransactionType } from '@prisma/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'
import CustomLoader from '../../shared/loader'
import TransactionItemCard from '../../shared/transaction-item-card'
import { useUserQuery } from './queries'

export type HistoryItem = Omit<Transaction, 'status'> & {
	type: WalletTransactionType | 'DEBIT' | 'CREDIT'
}

const getPersonName = (transaction: HistoryItem) => {
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

const optionsFilter: OptionsFilter = ({ options, search }) => {
	const splittedSearch = search.toLowerCase().trim().split(' ')
	return (options as ComboboxItem[]).filter((option) => {
		const words = option.label.toLowerCase().trim().split(' ')
		return splittedSearch.every((searchWord) =>
			words.some((word) => word.includes(searchWord)),
		)
	})
}

const TransactionHistory = () => {
	const numberOfItems = 5

	const updateTransactionTagsForm = useForm<{
		id: string
		tags: string[]
	}>({
		initialValues: {
			id: '',
			tags: [],
		},
	})

	const [currentPage, setCurrentPage] = useState(1)
	const splitTransactionForm = useForm<{
		id: string
		requesteeUsernames: string[]
		includeSelf: boolean
	}>({
		initialValues: {
			id: '',
			requesteeUsernames: [],
			includeSelf: false,
		},
		validate: {
			requesteeUsernames: (value) => {
				if (value.length === 0) {
					return 'At least one username must be filled'
				}
				if (value.some((username) => username.length === 0)) {
					return 'All usernames must be filled'
				}
				return null
			},
		},
	})

	const filterForm = useForm({
		initialValues: {
			transactionType: '',
			fromUser: '',
			toUser: '',
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

	const [tagsModalIsOpen, tagsModalHandlers] = useDisclosure(false)
	const [splitsModalIsOpen, splitsModalHandlers] = useDisclosure(false)

	const queryClient = useQueryClient()

	const updateTransactionTags = useMutation({
		mutationFn: (transaction: { id: string; tags: string[] }) => {
			return axios.post<{ message: string }>(
				`/transactions/update/${transaction.id}`,
				{ tags: transaction.tags },
			)
		},
		onSuccess: ({ data }) => {
			queryClient.invalidateQueries({ queryKey: ['transactions'] })
			updateTransactionTagsForm.reset()
			tagsModalHandlers.close()
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	const splitTransaction = useMutation({
		mutationFn: (transaction: typeof splitTransactionForm.values) => {
			return axios.post<{ message: string }>(
				`/requests/${transaction.id}/split`,
				{
					requesteeUsernames: transaction.requesteeUsernames,
					includeSelf: transaction.includeSelf,
				},
			)
		},
		onSuccess: ({ data }) => {
			queryClient.invalidateQueries({ queryKey: ['transactions'] })
			splitTransactionForm.reset()
			splitsModalHandlers.close()
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	const userQuery = useUserQuery()

	const filterFormValues = filterForm.values
	const filterFormTransformedValues = filterForm.getTransformedValues()

	const transactionsQuery = useQuery({
		queryKey: [
			'transactions',
			{
				page: currentPage,
				transactionType: filterFormValues.transactionType,
				fromUser: filterFormValues.fromUser,
				toUser: filterFormValues.toUser,
				fromDate: filterFormTransformedValues.fromDate,
				toDate: filterFormTransformedValues.toDate,
				minAmount: filterFormValues.minAmount,
				maxAmount: filterFormValues.maxAmount,
			},
		],
		queryFn: async () => {
			const response = await axios.get<{
				transactions: HistoryItem[]
				totalPages: number
			}>(
				`/transactions/view?items=${numberOfItems}&page=${currentPage}&transactionType=${filterFormValues.transactionType}&fromUser=${filterFormValues.fromUser}&toUser=${filterFormValues.toUser}&fromDate=${filterFormTransformedValues.fromDate}&toDate=${filterFormTransformedValues.toDate}&minAmount=${filterFormValues.minAmount}&maxAmount=${filterFormValues.maxAmount}`,
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
			<Modal opened={tagsModalIsOpen} onClose={tagsModalHandlers.close}>
				<form
					onSubmit={updateTransactionTagsForm.onSubmit((values) => {
						updateTransactionTags.mutate(values)
					})}
					className='flex flex-col gap-2'
				>
					<CustomLoader
						errorComponent={"Couldn't get your tags"}
						query={userQuery}
					>
						{(data) => (
							<TagsInput
								label='Select Tags'
								placeholder='Pick value or enter anything'
								data={data.user.tags}
								filter={optionsFilter}
								comboboxProps={{
									transitionProps: { transition: 'pop', duration: 200 },
								}}
								{...updateTransactionTagsForm.getInputProps('tags')}
								clearable
							/>
						)}
					</CustomLoader>
					<Button type='submit' loading={updateTransactionTags.isPending}>
						Update tags
					</Button>
				</form>
			</Modal>
			<Modal
				opened={splitsModalIsOpen}
				onClose={() => {
					splitTransactionForm.reset()
					splitsModalHandlers.close()
				}}
			>
				<form
					onSubmit={splitTransactionForm.onSubmit(
						(values) => {
							splitTransaction.mutate(values)
						},
						(errors: typeof splitTransactionForm.errors) => {
							if (errors.requesteeUsernames) {
								notifications.show({
									message: errors.requesteeUsernames,
									color: 'red',
								})
							}
						},
					)}
				>
					{splitTransactionForm.values.requesteeUsernames.map((_, index) => (
						<TextInput
							required
							key={index}
							label={`Enter username ${index + 1}`}
							placeholder='john420'
							{...splitTransactionForm.getInputProps(
								`requesteeUsernames.${index}`,
							)}
							rightSection={
								index === 0 ? null : (
									<ActionIcon
										color='red'
										onClick={() =>
											splitTransactionForm.removeListItem(
												'requesteeUsernames',
												index,
											)
										}
									>
										<Icon icon='lucide:trash-2' />
									</ActionIcon>
								)
							}
						/>
					))}
					<Center>
						<Switch
							label='Include self?'
							{...splitTransactionForm.getInputProps('includeSelf')}
						/>
					</Center>
					<Button
						onClick={() => {
							splitTransactionForm.insertListItem('requesteeUsernames', '')
						}}
					>
						Add User
					</Button>
					<Button type='submit' color='green'>
						Split
					</Button>
				</form>
			</Modal>
			<Group justify='right' className='pb-5'>
				<Button onClick={filtersToggle}>
					{filtersIsOpen ? 'Hide' : 'Show'} Filters
				</Button>
			</Group>
			<Collapse in={filtersIsOpen}>
				<Card className='mb-5'>
					<Stack>
						<Group justify='center'>
							<Select
								label='Transaction Type'
								defaultValue=''
								data={[
									{ value: '', label: 'All' },
									{ value: 'CREDIT', label: 'Credit' },
									{ value: 'DEBIT', label: 'Debit' },
									{ value: 'DEPOSIT', label: 'Deposit' },
									{ value: 'WITHDRAWAL', label: 'Withdrawal' },
								]}
								allowDeselect={false}
								{...filterForm.getInputProps('transactionType')}
							/>
							<TextInput
								label='From User'
								placeholder='john420'
								{...filterForm.getInputProps('fromUser')}
							/>
							<TextInput
								label='To User'
								placeholder='john420'
								{...filterForm.getInputProps('toUser')}
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
				errorComponent={"Couldn't get your transactions"}
				query={transactionsQuery}
			>
				{(data) => (
					<>
						<Stack>
							{data.transactions.map((transaction) => (
								<TransactionItemCard
									key={transaction.id}
									{...transaction}
									username={getPersonName(transaction)}
									bottomLeft={
										transaction.type === 'DEBIT'
											? transaction.senderTags
												? transaction.senderTags.map((tag, id) => (
														<Badge key={id}>{tag}</Badge>
												  ))
												: null
											: transaction.type === 'CREDIT'
											? transaction.recieverTags
												? transaction.recieverTags.map((tag, id) => (
														<Badge key={id}>{tag}</Badge>
												  ))
												: null
											: null
									}
									bottomRight={
										<>
											{transaction.type === 'DEBIT' ||
											transaction.type === 'CREDIT' ? (
												<Button
													onClick={() => {
														updateTransactionTagsForm.setValues({
															id: transaction.id,
															tags:
																transaction.type === 'DEBIT'
																	? transaction.senderTags
																	: transaction.type === 'CREDIT'
																	? transaction.recieverTags
																	: [],
														})
														tagsModalHandlers.open()
													}}
												>
													Add tags
												</Button>
											) : null}
											{transaction.type === 'DEBIT' && (
												<Button
													onClick={() => {
														splitTransactionForm.setValues({
															id: transaction.id,
															requesteeUsernames: [''],
														})
														splitsModalHandlers.open()
													}}
												>
													Split
												</Button>
											)}
										</>
									}
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

export default TransactionHistory
