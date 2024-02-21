import { Button, Select, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Role } from '@prisma/client'
import { useMutation } from '@tanstack/react-query'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

const CreateAccount = () => {
	const form = useForm<{ email: string; role: Role; shopName: string }>({
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

	const createAccount = useMutation({
		mutationFn: (body: { email: string; role: Role }) => {
			return axios.post<{ message: string }>('/admin/create', body)
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
			onSubmit={form.onSubmit((values) => {
				createAccount.mutate(values)
			})}
		>
			<TextInput
				label='Email'
				description='Email address of the account to be created'
				placeholder='Eg., john@john.com'
				{...form.getInputProps('email')}
			/>
			<Select
				label='Role'
				description='Role of the account to be created (Student/Vendor)'
				data={[
					{ value: Role.STUDENT, label: 'Student' },
					{ value: Role.VENDOR, label: 'Vendor' },
				]}
				{...form.getInputProps('role')}
			/>
			{form.values.role === Role.VENDOR && (
				<TextInput
					label='Shop Name'
					description='Name of the shop owned by the vendor'
					placeholder='Eg., YumPlease'
					{...form.getInputProps('shopName')}
				/>
			)}
			<Button type='submit' loading={createAccount.isPending}>
				Create
			</Button>
		</form>
	)
}

export default CreateAccount
