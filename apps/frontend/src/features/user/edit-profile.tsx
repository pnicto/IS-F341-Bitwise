import { Button, PasswordInput, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'
import { useUserQuery } from './queries'

const EditProfile = () => {
	const editForm = useForm<{
		mobile: string
		oldPassword: string
		newPassword: string
	}>({
		initialValues: {
			mobile: '',
			oldPassword: '',
			newPassword: '',
		},
		validate: {
			mobile: (value) =>
				value.length > 0 ? null : 'Mobile number cannot be empty',
		},
	})
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const userQuery = useUserQuery()
	const editUser = useMutation({
		mutationFn: (body: typeof editForm.values) =>
			axios.post('/user/details/edit', body),

		onSuccess: async ({ data }) => {
			await queryClient.invalidateQueries({ queryKey: ['user'] })
			// very dirty hack to reset the password fields as react query doesn't seem to trigger the useEffect when only password is changed not entirely sure why it works that way
			editForm.setValues({
				oldPassword: '',
				newPassword: '',
			})
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})
	const disableAccount = useMutation({
		mutationFn: () => axios.post('/user/disable-account'),
		onSuccess: async ({ data }) => {
			await queryClient.invalidateQueries({ queryKey: ['user'] })
			notifications.show({ message: data.message, color: 'green' })
			navigate('/login', { replace: true })
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
		// disable eslint exhaustive deps as we don't want to run this effect when editForm changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userQuery.data])

	if (userQuery.isPending) return <div>Loading...</div>

	if (userQuery.isError) return <div>Error</div>

	return (
		<>
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

			<div className='py-3 max-w-md mx-auto'>
				<h2 className='text-red-500 font-bold text-3xl'>Danger Zone</h2>
				<p className='text-sm mb-2 font-bold'>
					Settings here may have dire consequences. Proceed with caution.
				</p>
				{/* TODO: A confirmation modal */}
				<Button
					color='red'
					onClick={() => disableAccount.mutate()}
					loading={disableAccount.isPending}
				>
					Disable Account
				</Button>
			</div>
		</>
	)
}

export default EditProfile
