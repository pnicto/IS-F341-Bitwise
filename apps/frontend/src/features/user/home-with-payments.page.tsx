import { Icon } from '@iconify/react'
import { Button, Card, NumberInput, SimpleGrid, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Transaction } from '@prisma/client'
import { IconCurrencyRupee } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import React from 'react'
import { Link } from 'react-router-dom'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

type RouteOption = {
	icon: React.ReactNode
	label: string
	path: string
}

const navigationOptions: RouteOption[] = [
	{
		icon: <Icon icon='lucide:wallet' />,
		label: 'Wallet',
		path: '/manage-wallet',
	},
	{
		icon: <Icon icon='lucide:store' />,
		label: 'Shops',
		path: '/shops/view',
	},
	{
		icon: <Icon icon='lucide:warehouse' />,
		label: 'Catalogue',
		path: '/catalogue',
	},
	{
		icon: <Icon icon='uil:money-withdraw' />,
		label: 'Payment Requests',
		path: '/payment-requests',
	},
]

const GridItem = ({ icon, label, path }: RouteOption) => {
	return (
		<Card
			component={Link}
			to={path}
			className='flex flex-col items-center gap-3 justify-center'
		>
			<span className='text-3xl'>{icon}</span>
			<h2>{label}</h2>
		</Card>
	)
}

function renderGridItems() {
	return navigationOptions.map((option) => (
		<GridItem key={option.label} {...option} />
	))
}

const HomeWithPayments = () => {
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
		<>
			<form onSubmit={form.onSubmit((values) => payUser.mutate(values))}>
				<TextInput
					label='Recipient Username'
					placeholder='john43'
					{...form.getInputProps('receiverUsername')}
				/>
				<NumberInput
					label='Amount to send (INR)'
					placeholder='40'
					leftSection={<IconCurrencyRupee />}
					{...form.getInputProps('amount')}
				/>
				<Button type='submit'>Pay</Button>
			</form>

			<SimpleGrid
				cols={{
					base: 2,
					md: 3,
				}}
				spacing='xl'
				verticalSpacing='md'
				className='max-w-3xl mx-auto pt-5'
			>
				{renderGridItems()}
			</SimpleGrid>
		</>
	)
}

export default HomeWithPayments
