import { Icon } from '@iconify/react'
import { Anchor, Button, Menu } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { User } from '@prisma/client'
import { IconPlus } from '@tabler/icons-react'
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
								<IconPlus size={20} fill='green' />
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
				<Outlet />
			</main>
		</>
	)
}

export default MainLayout
