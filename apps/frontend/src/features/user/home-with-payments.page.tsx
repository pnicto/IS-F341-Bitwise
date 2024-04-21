import { Icon } from '@iconify/react'
import { Button, Card, NumberInput, SimpleGrid, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Role, Transaction, User } from '@prisma/client'
import { useMutation } from '@tanstack/react-query'
import React from 'react'
import { Link, useRouteLoaderData } from 'react-router-dom'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

type RouteOption = {
	icon: React.ReactNode
	label: string
	path: string
}

const commonOptions: RouteOption[] = [
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
		icon: <Icon icon='lucide:history' />,
		label: 'Transaction History',
		path: '/txn-history',
	},
	{
		icon: <Icon icon='uil:money-withdraw' />,
		label: 'Payment Requests',
		path: '/payment-requests',
	},
	{
		icon: <Icon icon='lucide:line-chart' />,
		label: 'User Reports',
		path: '/reports/user',
	},
	{
		icon: <Icon icon='lucide:line-chart' />,
		label: 'Reports',
		path: '/reports/timeline',
	},
]

const studentOptions: RouteOption[] = [
	...commonOptions,
	{
		icon: <Icon icon='lucide:warehouse' />,
		label: 'My Listings',
		path: '/catalogue',
	},
]

const vendorOptions: RouteOption[] = [
	...commonOptions,
	{
		icon: <Icon icon='lucide:warehouse' />,
		label: 'Catalogue',
		path: '/catalogue',
	},
	{
		icon: <Icon icon='lucide:receipt-indian-rupee' />,
		label: 'Shop Transactions',
		path: '/shop/transactions',
	},
	{
		icon: <Icon icon='lucide:file-bar-chart' />,
		label: 'Shop Reports',
		path: '/reports/shop',
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

function renderGridItems(role: Role) {
	const options = role === 'STUDENT' ? studentOptions : vendorOptions
	return options.map((option) => <GridItem key={option.label} {...option} />)
}

const HomeWithPayments = () => {
	const {
		user: { role },
	} = useRouteLoaderData('protected-layout') as { user: User }
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
			return axios.post<{ msg: string }>('/pay', transactionDetails)
		},
		onSuccess: ({ data }) => {
			form.reset()
			notifications.show({ message: data.msg, color: 'green' })
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
					leftSection={<Icon icon='lucide:indian-rupee' />}
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
				{renderGridItems(role)}
			</SimpleGrid>
		</>
	)
}

export default HomeWithPayments
