import { Button, NumberInput, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Transaction } from '@prisma/client'
import { IconCurrencyRupee } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

const PaymentsPage = () => {
	const form = useForm({
		initialValues: { receiverUsername: '', amount: 1 },
		validate: {
			receiverUsername: (value) =>
				value.length > 0 ? null : 'Name cannot be empty',
			amount: (value) => (value > 0 ? null : 'Please enter a valid amount.'),
		},
	})

	const payUser = useMutation({
		mutationFn: (
			transactionDetails: Pick<Transaction, 'receiverUsername' | 'amount'>,
		) => {
			return axios.post<{ message: string }>('/pay', transactionDetails)
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
			className='flex flex-col gap-5 max-w-2xl mx-auto'
			onSubmit={form.onSubmit((values) => payUser.mutate(values))}
		>
			<TextInput
				label='Recipient Username'
				placeholder='john43'
				{...form.getInputProps('receiverUsername')}
			/>
			<NumberInput
				label='Amount to send (INR)'
				placeholder='40'
				min={1}
				leftSection={<IconCurrencyRupee />}
				allowDecimal={false}
				{...form.getInputProps('amount')}
			/>
			<Button type='submit'>Pay</Button>
		</form>
	)
}

export default PaymentsPage
