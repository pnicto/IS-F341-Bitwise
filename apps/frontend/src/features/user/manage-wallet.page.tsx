import { Button, Group, NumberInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Transaction } from '@prisma/client'
import { IconCurrencyRupee } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

const ManageWallet = () => {
	// the backend uses these signs to figure out whether this is a deposit or a withdrawal
	const [transactionSign, setTransactionSign] = useState<1 | -1>(1)
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
			form.reset()
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	return (
		<form
			className='flex flex-col gap-5'
			onSubmit={form.onSubmit(({ amount }) => {
				updateWallet.mutate({ amount: amount * transactionSign })
			})}
		>
			<NumberInput
				label='Amount (INR)'
				placeholder='40'
				min={1}
				leftSection={<IconCurrencyRupee />}
				allowDecimal={false}
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
	)
}

export default ManageWallet
