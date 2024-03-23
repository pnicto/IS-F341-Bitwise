import { Icon } from '@iconify/react'
import {
	Anchor,
	Button,
	Menu,
	Modal,
	NumberInput,
	TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { User } from '@prisma/client'
import { useMutation } from '@tanstack/react-query'
import {
	NavLink,
	Outlet,
	useLocation,
	useNavigate,
	useRouteLoaderData,
} from 'react-router-dom'
import axios from '../lib/axios'
import { handleAxiosErrors } from '../notifications/utils'

const MainLayout = () => {
	const data = useRouteLoaderData('protected-layout') as { user: User }
	const [opened, { open, close }] = useDisclosure(false)

	const currentRoute = useLocation()
	const navigate = useNavigate()
	const logout = useMutation({
		mutationFn: () => {
			return axios.post<{ message: string }>('/auth/logout')
		},
		onSuccess: ({ data }) => {
			notifications.show({
				message: data.message,
				color: 'green',
			})
			navigate('/login', { replace: true })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	const paymentRequest = useMutation({
		mutationFn: (body: { requesteeUsername: string; amount: number }) => {
			return axios.post<{ message: string }>('/pay/request', body)
		},
		onSuccess: ({ data }) => {
			notifications.show({ message: data.message, color: 'green' })
			close()
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	const paymentRequestForm = useForm({
		initialValues: {
			requesteeUsername: '',
			amount: 100,
		},
		validate: {
			requesteeUsername: (value) =>
				value.length > 0 ? null : 'Name cannot be empty',
			amount: (value) => (value > 0 ? null : 'Please enter a valid amount.'),
		},
	})

	return (
		<>
			{data && (
				<nav className='flex justify-between py-2 items-center pl-10 pr-6'>
					<Anchor
						component={NavLink}
						to={data.user.role === 'ADMIN' ? '/admin' : '/'}
					>
						Home
					</Anchor>
					<div className='flex gap-8 items-center'>
						{currentRoute.pathname === '/catalogue' && (
							<Button
								color='green'
								radius='xl'
								size='compact-md'
								component={NavLink}
								to='/catalogue/add-product'
							>
								<Icon icon='lucide:plus' className='text-2xl' />
							</Button>
						)}
						{currentRoute.pathname === '/admin' && (
							<Anchor component={NavLink} to='/admin/bulk-add-account'>
								Bulk Add Users
							</Anchor>
						)}
						{currentRoute.pathname === '/payment-requests' && (
							<Button color='green' onClick={open}>
								New Request
							</Button>
						)}

						<Menu>
							<Menu.Target>
								<Button variant='light'>
									<Icon icon='lucide:more-horizontal' className='text-2xl' />
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item component={NavLink} to='/edit-profile'>
									Edit Profile
								</Menu.Item>
								<Menu.Item
									leftSection={<Icon icon='lucide:log-out' />}
									component='button'
									onClick={() => logout.mutate()}
									color='red'
								>
									Logout
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</div>
				</nav>
			)}
			<main className='px-10 py-4 mx-auto sm:px-32 md:px-40 max-w-7xl'>
				<Modal opened={opened} onClose={close} title='New Payment Request'>
					<form
						onSubmit={paymentRequestForm.onSubmit((values) =>
							paymentRequest.mutate(values),
						)}
					>
						<TextInput
							label='Requestee Username'
							placeholder='john43'
							{...paymentRequestForm.getInputProps('requesteeUsername')}
						/>
						<NumberInput
							label='Amount to request (INR)'
							placeholder='40'
							leftSection={<Icon icon='lucide:indian-rupee' />}
							{...paymentRequestForm.getInputProps('amount')}
						/>
						<Button type='submit'>Request</Button>
					</form>
				</Modal>
				<Outlet />
			</main>
		</>
	)
}

export default MainLayout
