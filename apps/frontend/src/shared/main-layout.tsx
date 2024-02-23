import { Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import {
	NavLink,
	Outlet,
	useNavigate,
	useRouteLoaderData,
} from 'react-router-dom'
import axios from '../lib/axios'
import { handleAxiosErrors } from '../notifications/utils'

const MainLayout = () => {
	const data = useRouteLoaderData('protected-layout')
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
					<Button onClick={() => logout.mutate()}>Logout</Button>
				</nav>
			)}
			<main className='px-10 py-4 lg:max-w-xl lg:mx-auto max-w-md mx-auto'>
				<Outlet />
			</main>
		</>
	)
}

export default MainLayout
