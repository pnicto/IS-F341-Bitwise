import { Button, Select, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Role } from '@prisma/client'
import { useMutation } from '@tanstack/react-query'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

const CreateAccount = () => {
	const createForm = useForm<{
		email: string
		role: Role
		mobile: string
		shopName: string
	}>({
		initialValues: { email: '', role: Role.STUDENT, shopName: '', mobile: '' },
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
			mobile: (value) =>
				value.length > 0 ? null : 'Mobile number cannot be empty',
		},
	})

	const createAccount = useMutation({
		mutationFn: (body: { email: string; role: Role }) => {
			return axios.post<{ msg: string }>('/admin/create', body)
		},
		onSuccess: ({ data }) => {
			createForm.reset()
			notifications.show({ message: data.msg, color: 'green' })
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	return (
		<form
			onSubmit={createForm.onSubmit((values) => {
				createAccount.mutate(values)
			})}
		>
			<h1 className='pb-8'>Create User</h1>

			<TextInput
				label='Email'
				description='Email address of the account to be created'
				placeholder='Eg., john@john.com'
				{...createForm.getInputProps('email')}
			/>
			<TextInput
				label='Mobile Number'
				description='Mobile number of the account to be created'
				placeholder='Eg., 9876543210'
				{...createForm.getInputProps('mobile')}
			/>
			<Select
				label='Role'
				description='Role of the account to be created (Student/Vendor)'
				data={[
					{ value: Role.STUDENT, label: 'Student' },
					{ value: Role.VENDOR, label: 'Vendor' },
				]}
				allowDeselect={false}
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
	)
}

export default CreateAccount
