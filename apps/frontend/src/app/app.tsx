import { Button, List, Loader, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { User } from '@schemas'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

async function fetchUsers() {
	const response = await axios.get<User[]>('http://localhost:5000/users')
	return response.data
}

function App() {
	const { isLoading, error, data, isPending } = useQuery({
		queryKey: ['users'],
		queryFn: () => fetchUsers(),
	})
	const queryClient = useQueryClient()

	const createUser = useMutation({
		mutationFn: (newUser: User) => {
			return axios.post('http://localhost:5000/user', newUser)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] })
		},
	})

	const form = useForm({
		initialValues: { email: '', name: '' },
		validate: {
			name: (value) => (value.length > 0 ? null : 'Name cannot be empty'),
			email: (value) => (value.length > 0 ? null : 'Invalid email'),
		},
	})

	if (isLoading || isPending) return <Loader />

	if (error) {
		return <div>Error {error.message}</div>
	}

	return (
		<main className='mx-auto max-w-xl p-24 text-center'>
			<div>
				<form
					onSubmit={form.onSubmit((values) => {
						createUser.mutate(values)
					})}
					className='flex flex-col gap-5'
				>
					<TextInput
						label='Name'
						description='Your name'
						placeholder='Eg., John'
						{...form.getInputProps('name')}
					/>
					<TextInput
						label='Email'
						description='Your email'
						placeholder='Eg., john@john.com'
						{...form.getInputProps('email')}
					/>
					<Button type='submit'>Create</Button>
				</form>
			</div>
			<div className='m-10'>
				<List>
					{data.map((user, i) => (
						<List.Item key={i}>{user.name}</List.Item>
					))}
				</List>
			</div>
		</main>
	)
}

export default App
