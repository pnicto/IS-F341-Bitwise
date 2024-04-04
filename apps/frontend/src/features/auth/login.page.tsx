import { Anchor, Button, Modal, PasswordInput, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { User } from '@prisma/client'
import { useMutation } from '@tanstack/react-query'
import { redirect, useNavigate } from 'react-router-dom'
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
	const [opened, { open, close }] = useDisclosure(false)

	const loginForm = useForm({
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

	const resetPasswordForm = useForm({
		initialValues: {
			email: '',
		},
		validate: {
			email: (value) =>
				value.length > 0
					? /^\S+@\S+$/.test(value)
						? null
						: 'Invalid email'
					: 'Email cannot be empty',
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
			else navigate('/admin', { replace: true })
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	const resetPassword = useMutation({
		mutationFn: (body: { email: string }) => {
			return axios.post<{ message: string }>('/auth/reset-password', body)
		},
		onSuccess: ({ data }) => {
			notifications.show({ message: data.message, color: 'green' })
			resetPasswordForm.reset()
			close()
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	return (
		<>
			<Modal opened={opened} onClose={close} title='Reset Password'>
				<form
					onSubmit={resetPasswordForm.onSubmit((values) =>
						resetPassword.mutate(values),
					)}
				>
					<p className='text-md font-bold'>
						Note: You must have an account previously to reset password. If this
						is the first time, contact the administrator at{' '}
						<Anchor href='mailto:john@email.com'>john@email.com</Anchor> create
						an account first.
					</p>
					<TextInput
						label='Email'
						placeholder='Enter your email'
						type='email'
						{...resetPasswordForm.getInputProps('email')}
					/>
					<Button type='submit' loading={resetPassword.isPending}>
						Reset Password
					</Button>
				</form>
			</Modal>

			<div className='ml-[-1.5em] mt-36'>
				<span className='mx-auto flex justify-center items-center'>
					{/* the bitcoin symbol which is used as B in Bitwise */}
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='8rem'
						height='8rem'
						viewBox='0 0 24 24'
					>
						<g fill='none' stroke='currentColor' strokeWidth='0.6'>
							<path d='M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2l-2 2l-2-2l-2 2l-2-2z' />
							<path d='M9 7h4.09C14.145 7 15 7.895 15 9s-.855 2-1.91 2c1.055 0 1.91.895 1.91 2s-.855 2-1.91 2H9m1-4h4m-4-5v10v-9m3-1v1m0 8v1' />
						</g>
					</svg>
					<p className='mx-[-0.65em] text-4xl'>itwise</p>
				</span>
			</div>
			<form
				onSubmit={loginForm.onSubmit((values) => {
					login.mutate(values)
				})}
			>
				<TextInput
					label='Email'
					placeholder='Enter your email'
					type='email'
					{...loginForm.getInputProps('email')}
				/>
				<PasswordInput
					label='Password'
					placeholder='Enter your password'
					{...loginForm.getInputProps('password')}
				/>
				<Button type='submit'>Login</Button>
				<p className='text-center text-sm'>
					Click{' '}
					<Anchor component='button' size='sm' onClick={open} type='button'>
						here
					</Anchor>{' '}
					to reset your password
				</p>
			</form>
		</>
	)
}

export default Login
