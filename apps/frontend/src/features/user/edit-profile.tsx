import { Button, PasswordInput, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'
import { useUserQuery } from './queries'

const EditProfile = () => {
	const editForm = useForm<{
		mobile: string | null
		oldPassword: string
		newPassword: string
	}>({
		initialValues: {
			mobile: '',
			oldPassword: '',
			newPassword: '',
		},
	})
	const queryClient = useQueryClient()
	const userQuery = useUserQuery()
	const editUser = useMutation({
		mutationFn: (body: typeof editForm.values) =>
			axios.post('/user/details/edit', body),

		onSuccess: ({ data }) => {
			queryClient.invalidateQueries({ queryKey: ['user'] })
			editForm.reset()
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	useEffect(() => {
		if (userQuery.data) {
			editForm.initialize({
				...userQuery.data.user,
				oldPassword: '',
				newPassword: '',
			})
		}
	})

	if (userQuery.isPending) return <div>Loading...</div>

	if (userQuery.isError) return <div>Error</div>

	return (
		<form
			onSubmit={editForm.onSubmit((values) => {
				editUser.mutate(values)
			})}
		>
			<TextInput
				label='Mobile Number'
				placeholder='Enter your mobile number'
				{...editForm.getInputProps('mobile')}
			/>
			<PasswordInput
				label='Old Password'
				placeholder='Enter your old password'
				{...editForm.getInputProps('oldPassword')}
			/>
			<PasswordInput
				label='New Password'
				placeholder='Enter your new password'
				{...editForm.getInputProps('newPassword')}
			/>
			<Button type='submit'>Update Details</Button>
		</form>
	)
}

export default EditProfile
