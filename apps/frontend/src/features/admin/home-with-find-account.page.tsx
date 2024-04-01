import { Icon } from '@iconify/react'
import { Button, Card, SimpleGrid, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { User } from '@prisma/client'
import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

const fetchUserDetails = async (email: string) => {
	return axios
		.get<{ user: User }>(`/admin/details?email=${email}`)
		.then((res) => res.data)
}

const userDetailsQueryOptions = (email: string) =>
	queryOptions({
		queryKey: ['user', email],
		queryFn: () => fetchUserDetails(email),
		enabled: false,
	})
type RouteOption = {
	icon: React.ReactNode
	label: string
	path: string
}
const navigationOptions: RouteOption[] = [
	{
		icon: <Icon icon='mdi:account-add-outline' />,
		label: 'Create User',
		path: '/admin/add-account',
	},
	{
		icon: <Icon icon='mdi:account-multiple-add-outline' />,
		label: 'Create Users in Bulk',
		path: '/admin/bulk-add-account',
	},
	{
		icon: <Icon icon='mdi:tag-multiple-outline' />,
		label: 'Manage Product Categories',
		path: '/admin/manage-categories',
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

const HomeWithCreateAndUpdateAccount = () => {
	const queryClient = useQueryClient()

	const getDetailsForm = useForm<{ email: string }>({
		initialValues: { email: '' },
		validate: {
			email: (value) =>
				value.length > 0
					? /^\S+@\S+$/.test(value)
						? null
						: 'Invalid email'
					: 'Email cannot be empty',
		},
	})

	const userDetailsQueryResult = useQuery(
		userDetailsQueryOptions(getDetailsForm.values.email),
	)

	const updateAccount = useMutation({
		mutationFn: (body: { email: string; enabled: boolean }) => {
			return axios.post<{ message: string }>('/admin/user/update-status', body)
		},
		onSuccess: ({ data }, variables) => {
			queryClient.invalidateQueries({ queryKey: ['user', variables.email] })
			notifications.show({ message: data.message, color: 'green' })
			userDetailsQueryResult.refetch()
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	return (
		<>
			<form
				className=''
				onSubmit={getDetailsForm.onSubmit(() => {
					userDetailsQueryResult.refetch()
				})}
			>
				<TextInput
					label='Email'
					description='Email address of the account to be searched'
					placeholder='Eg., john@john.com'
					{...getDetailsForm.getInputProps('email')}
				/>
				<Button type='submit' loading={userDetailsQueryResult.isRefetching}>
					Search User
				</Button>
			</form>

			{/* TODO: Replace this with a single component so we can have loading and errors in that component */}
			{userDetailsQueryResult.data !== undefined && (
				<div className='flex flex-col items-center gap-3'>
					<h2 className='text-xl font-bold'>
						User Details for {userDetailsQueryResult.data.user.email}
					</h2>

					<div className='grid grid-cols-2'>
						<p>Email:</p>
						<p>{userDetailsQueryResult.data.user.email}</p>
						<p>Balance:</p>
						<p>₹ {userDetailsQueryResult.data.user.balance}</p>
						<p>Mobile:</p>
						<p>{userDetailsQueryResult.data.user.mobile}</p>
						<p>Role:</p>
						<p>{userDetailsQueryResult.data.user.role}</p>
					</div>
					<p className={`text-xl`}>
						Account is{' '}
						{userDetailsQueryResult.data.user.enabled ? 'Enabled' : 'Disabled'}
					</p>

					<Button
						onClick={() => {
							updateAccount.mutate({
								email: userDetailsQueryResult.data.user.email,
								enabled: !userDetailsQueryResult.data.user.enabled,
							})
						}}
					>
						{userDetailsQueryResult.data.user.enabled
							? 'Disable User'
							: 'Enable User'}
					</Button>
				</div>
			)}

			{/* TODO: Replace with a better error message */}
			{userDetailsQueryResult.isError && (
				<div className='text-center mt-2'>
					<h1 className='text-2xl'>{userDetailsQueryResult.error.message}</h1>
				</div>
			)}

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

export default HomeWithCreateAndUpdateAccount
