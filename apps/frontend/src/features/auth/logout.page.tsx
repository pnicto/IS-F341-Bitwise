// IMPORTANT: This file is a test file for logging out, and will probably be reworked in the future
import { Button } from '@mantine/core'
import { useMutation } from '@tanstack/react-query'
import axios from '../../lib/axios'
import { router } from '../../main'

const Logout = () => {
	const logout = useMutation({
		mutationFn: () => {
			return axios.post('http://localhost:5000/api/auth/logout')
		},
		onSuccess: ({ data }) => {
			console.log(data)
			router.navigate({ pathname: data.redirect })
		},
		/* TODO: Handle onError */
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
