import { Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
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
	const data = useRouteLoaderData('protected-layout')
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
				<nav className='flex justify-between px-10 py-2 items-center'>
					<NavLink to='/'>Home</NavLink>
					<div className='flex gap-8 items-center'>
						{currentRoute.pathname === '/catalogue' && (
							<Button
								color='green'
								radius='xl'
								size='compact-md'
								onClick={(e) => {
									e.preventDefault()
								}}
							>
								<NavLink to='/catalogue/add-product'>
									<IconPlus size={20} fill='green' />
								</NavLink>
							</Button>
						)}
						<Button onClick={() => logout.mutate()}>Logout</Button>
					</div>
				</nav>
			)}
			<main className='px-10 py-4 lg:max-w-xl lg:mx-auto max-w-md mx-auto'>
				<Outlet />
			</main>
		</>
	)
}

export default MainLayout
