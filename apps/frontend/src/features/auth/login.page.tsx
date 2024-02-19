import { Button, PasswordInput, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { redirect, useNavigate } from 'react-router-dom'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

export async function loginLoader() {
	try {
		await axios.get('/auth/me')
		return redirect('/')
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
			return axios.post<{ message: string }>('/auth/login', body)
		},
		onSuccess: ({ data }) => {
			notifications.show({ message: data.message, color: 'green' })
			navigate('/', { replace: true })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	return (
		<main className='mx-auto max-w-xl p-24 text-center'>
			<div>
				<form
					onSubmit={form.onSubmit((values) => {
						login.mutate(values)
					})}
					className='flex flex-col gap-5'
				>
					<TextInput
						label='Email'
						description='Your email'
						placeholder='Enter your email'
						{...form.getInputProps('email')}
					/>
					<PasswordInput
						label='Password'
						description='Your password'
						placeholder='Enter your password'
						{...form.getInputProps('password')}
					/>
					<Button type='submit'>Login</Button>
				</form>
			</div>
		</main>
	)
}

export default Login
