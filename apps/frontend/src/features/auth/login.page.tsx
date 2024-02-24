import { Anchor, Button, PasswordInput, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { User } from '@prisma/client'
import { IconReceiptBitcoin } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { Link, redirect, useNavigate } from 'react-router-dom'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

export async function loginLoader() {
	try {
		const response = await axios.get<{ user: User }>('/user/details', {
			headers: {
				'Cache-Control': 'no-cache',
				Pragma: 'no-cache',
				Expires: '0',
			},
		})
		return redirect(response.data.user.role === 'ADMIN' ? '/admin' : '/')
	} catch (err) {
		return null
	}
}

const Login = () => {
	const navigate = useNavigate()

	const form = useForm({
		initialValues: {
			email: '',
			password: '',
		},
		validate: {
			email: (value) =>
				value.length > 0
					? /^\S+@\S+$/.test(value)
						? null
						: 'Invalid email'
					: 'Email cannot be empty',
			password: (value) =>
				value.length > 0 ? null : 'Password cannot be empty',
		},
	})

	const login = useMutation({
		mutationFn: (body: { email: string; password: string }) => {
			return axios.post<{ message: string; user: Pick<User, 'role'> }>(
				'/auth/login',
				body,
			)
		},
		onSuccess: ({ data }) => {
			if (data.user.role !== 'ADMIN') navigate('/', { replace: true })
			else navigate('/admin/add-student', { replace: true })
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	return (
		<>
			<div className='ml-[-1.5em] mt-36'>
				<span className='mx-auto flex justify-center items-center'>
					<IconReceiptBitcoin size={150} stroke={0.5} />
					<p className='mx-[-0.75em] text-4xl'>itwise</p>
				</span>
			</div>
			<form
				className='flex flex-col gap-5'
				onSubmit={form.onSubmit((values) => {
					login.mutate(values)
				})}
			>
				<TextInput
					label='Email'
					placeholder='Enter your email'
					{...form.getInputProps('email')}
				/>
				<PasswordInput
					label='Password'
					placeholder='Enter your password'
					{...form.getInputProps('password')}
				/>
				<Button type='submit'>Login</Button>
				<p className='text-center text-sm'>
					Click{' '}
					<Anchor component={Link} to='/forgot-password' size='sm'>
						here
					</Anchor>{' '}
					to reset your password
				</p>
			</form>
		</>
	)
}

export default Login
