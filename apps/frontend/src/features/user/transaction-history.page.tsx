import { Icon } from '@iconify/react'
import {
	ActionIcon,
	Badge,
	Button,
	Center,
	ComboboxItem,
	Loader,
	Modal,
	OptionsFilter,
	Pagination,
	Stack,
	Switch,
	TagsInput,
	TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { Transaction, WalletTransactionType } from '@prisma/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'
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

	const transactionsQuery = useQuery({
		queryKey: ['transactions', { page: currentPage }],
		queryFn: async () => {
			const response = await axios.get<{
				transactions: HistoryItem[]
				totalPages: number
			}>(`/transactions/view?items=5&page=${currentPage}`)
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

	if (userQuery.isPending || transactionsQuery.isPending) {
		return (
			// TODO: Extract this loader to a separate component and make it better
			<div className='text-center'>
				<Loader />
			</div>
		)
	}

	if (userQuery.isError || transactionsQuery.isError) {
		// TODO: Replace with a better error component
		return <div>Error fetching user data</div>
	}

	return (
		<>
			<Modal opened={tagsModalIsOpen} onClose={tagsModalHandlers.close}>
				<form
					onSubmit={updateTransactionTagsForm.onSubmit((values) => {
						updateTransactionTags.mutate(values)
					})}
					className='flex flex-col gap-2'
				>
					<TagsInput
						label='Select Tags'
						placeholder='Pick value or enter anything'
						data={userQuery.data.user.tags}
						filter={optionsFilter}
						comboboxProps={{
							transitionProps: { transition: 'pop', duration: 200 },
						}}
						{...updateTransactionTagsForm.getInputProps('tags')}
						clearable
					/>
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
			<Stack>
				{transactionsQuery.data.transactions.map((transaction) => (
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
					total={transactionsQuery.data.totalPages}
					value={currentPage}
					onChange={(value: number) => {
						setCurrentPage(value)
						queryClient.invalidateQueries({
							queryKey: ['transactions', { page: currentPage }],
						})
					}}
					mt='sm'
				/>
			</div>
		</>
	)
}

export default TransactionHistory
