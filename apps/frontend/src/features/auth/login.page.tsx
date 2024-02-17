import { Button, PasswordInput, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { router } from '../../main'

const Login = () => {
	const form = useForm({
		initialValues: { email: '', password: '' },
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
			return axios.post('http://localhost:5000/api/auth/login', body, {
                withCredentials: true,
				headers: {
					'Content-Type': 'application/json ',
				},
			})
		},
		onSuccess: ({ data }) => {
			form.reset()
			console.log(data)
			router.navigate({ pathname: data.redirect })
		},
		/* TODO: Handle onError */
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

			{/* TODO: Move to mantine notifications */}
			{login.isSuccess && <div>Logged in successfully</div>}
			{login.isError && <div>Failed to login</div>}
		</main>
	)
}

export default Login
