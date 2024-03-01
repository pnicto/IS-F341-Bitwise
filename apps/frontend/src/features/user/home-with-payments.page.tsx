import { Icon } from '@iconify/react'
import { Button, Grid, NumberInput, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Transaction } from '@prisma/client'
import { IconCurrencyRupee } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
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
]

const studentOptions: RouteOption[] = [...commonOptions]

const vendorOptions: RouteOption[] = [
	...commonOptions,
	{
		icon: <Icon icon='lucide:warehouse' />,
		label: 'Catalogue',
		path: '/catalogue',
	},
]

const GridItem = ({ icon, label, path }: RouteOption) => {
	return (
		<Grid.Col span={4}>
			<Card
				shadow='md'
				withBorder
				component={Link}
				to={path}
				className='flex flex-col items-center gap-3 justify-center'
			>
				<span className='text-3xl'>{icon}</span>
				<h2>{label}</h2>
			</Card>
		</Grid.Col>
	)
}

// this is with the assumption that ADMIN role can never reach this page
function renderGridItems(role: Role) {
	const options = role === 'STUDENT' ? studentOptions : vendorOptions
	return options.map((option) => <GridItem key={option.label} {...option} />)
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
			<form
				className='flex flex-col gap-5'
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

			<Grid columns={8} className='py-8'>
				{renderGridItems(role)}
			</Grid>
		</>
	)
}

export default HomeWithPayments
