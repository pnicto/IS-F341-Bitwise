import { Button, Group, Loader, NumberInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Transaction } from '@prisma/client'
import { IconCurrencyRupee } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'
import { useUserQuery } from './queries'

const ManageWallet = () => {
	// the backend uses these signs to figure out whether this is a deposit or a withdrawal
	const [transactionSign, setTransactionSign] = useState<1 | -1>(1)
	const queryClient = useQueryClient()
	const userQuery = useUserQuery()
	const form = useForm({
		initialValues: { amount: 1 },
		validate: {
			amount: (value) => (value > 0 ? null : 'Please enter a valid amount.'),
		},
	})

	const updateWallet = useMutation({
		mutationFn: (body: Pick<Transaction, 'amount'>) => {
			return axios.post<{ message: string }>('/wallet/update', body)
		},
		onSuccess: ({ data }) => {
			queryClient.invalidateQueries({ queryKey: ['user'] })
			form.reset()
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	if (userQuery.isPending)
		return (
			// TODO: Extract this loader to a separate component and make it better
			<div className='text-center'>
				<Loader />
			</div>
		)

	if (userQuery.isError) {
		// TODO: Replace with a better error component
		return <div>Error fetching user data</div>
	}

	return (
		<>
			<div className='text-center mt-36'>
				<h1 className='text-3xl font-bold'>Current Balance</h1>
				<p className='text-2xl'>₹ {userQuery.data.user.balance}</p>
			</div>
			<form
				onSubmit={form.onSubmit(({ amount }) => {
					updateWallet.mutate({ amount: amount * transactionSign })
				})}
			>
				<NumberInput
					label='Amount (INR)'
					placeholder='40'
					leftSection={<IconCurrencyRupee />}
					allowDecimal={false}
					allowNegative={false}
					{...form.getInputProps('amount')}
				/>
				<Group justify='center'>
					<Button type='submit' onClick={() => setTransactionSign(-1)}>
						Withdraw
					</Button>
					<Button type='submit' onClick={() => setTransactionSign(1)}>
						Deposit
					</Button>
				</Group>
			</form>
		</>
	)
}

export default ManageWallet
