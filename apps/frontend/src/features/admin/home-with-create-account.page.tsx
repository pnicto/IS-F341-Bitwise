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
		.get<{ user: User }>(`/admin/${email}/details`)
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
		<div className='flex flex-col gap-20'>
			<form
				className='flex flex-col gap-5'
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
				className='flex flex-col gap-5'
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
			{userDetailsQueryResult.data !== undefined && (
				<div className='flex flex-col border-2'>
					<div className='text-center mt-2'>
						<h1 className='text-2xl font-bold'>
							{userDetailsQueryResult.data.user.email}
						</h1>
						<p className='text-xl'>
							Account is{' '}
							{userDetailsQueryResult.data.user.enabled
								? 'Enabled'
								: 'Disabled'}
						</p>
					</div>
					{userDetailsQueryResult.data.user.enabled === false ? (
						<Button
							onClick={() => {
								updateAccount.mutate({
									email: userDetailsQueryResult.data.user.email,
									enabled: true,
								})
							}}
						>
							Enable User
						</Button>
					) : (
						<Button
							onClick={() => {
								updateAccount.mutate({
									email: userDetailsQueryResult.data.user.email,
									enabled: false,
								})
							}}
						>
							Disable User
						</Button>
					)}
				</div>
			)}
		</div>
	)
}

export default HomeWithCreateAndUpdateAccount
