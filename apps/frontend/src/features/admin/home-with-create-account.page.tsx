import { Button, Select, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Role, User } from '@prisma/client'
import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
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

const HomeWithCreateAndUpdateAccount = () => {
	const queryClient = useQueryClient()

	const createForm = useForm<{ email: string; role: Role; shopName: string }>({
		initialValues: { email: '', role: Role.STUDENT, shopName: '' },
		validate: {
			email: (value) =>
				value.length > 0
					? /^\S+@\S+$/.test(value)
						? null
						: 'Invalid email'
					: 'Email cannot be empty',
			shopName: (value, values) =>
				values.role === Role.VENDOR
					? value.length > 0
						? null
						: 'Shop name cannot be empty for vendor'
					: null,
		},
	})

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

	const createAccount = useMutation({
		mutationFn: (body: { email: string; role: Role }) => {
			return axios.post<{ message: string }>('/admin/create', body)
		},
		onSuccess: ({ data }) => {
			createForm.reset()
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

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
				onSubmit={createForm.onSubmit((values) => {
					createAccount.mutate(values)
				})}
			>
				<TextInput
					label='Email'
					description='Email address of the account to be created'
					placeholder='Eg., john@john.com'
					{...createForm.getInputProps('email')}
				/>
				<Select
					label='Role'
					description='Role of the account to be created (Student/Vendor)'
					data={[
						{ value: Role.STUDENT, label: 'Student' },
						{ value: Role.VENDOR, label: 'Vendor' },
					]}
					{...createForm.getInputProps('role')}
				/>
				{createForm.values.role === Role.VENDOR && (
					<TextInput
						label='Shop Name'
						description='Name of the shop owned by the vendor'
						placeholder='Eg., YumPlease'
						{...createForm.getInputProps('shopName')}
					/>
				)}
				<Button type='submit' loading={createAccount.isPending}>
					Create
				</Button>
			</form>
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
						<p>{userDetailsQueryResult.data.user.balance} ₹</p>
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
		</>
	)
}

export default HomeWithCreateAndUpdateAccount
