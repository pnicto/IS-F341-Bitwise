// IMPORTANT: This file is a test file for logging out, and will probably be reworked in the future
import { Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from '../../lib/axios'

const Logout = () => {
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
			navigate('/', { replace: true })
		},
		onError: () => {
			notifications.show({
				message: 'Something went wrong while logging out',
				color: 'red',
			})
			navigate('/', { replace: true })
		},
	})

	return (
		<main className='mx-auto max-w-xl p-24 text-center'>
			<div>
				<Button onClick={() => logout.mutate()}>Logout</Button>
			</div>
		</main>
	)
}

export default Logout
