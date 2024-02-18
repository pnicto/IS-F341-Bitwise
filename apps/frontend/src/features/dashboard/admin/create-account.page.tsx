import { Button, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation } from '@tanstack/react-query'
import axios from '../../../lib/axios'
import { handleAxiosErrors } from '../../../notifications/utils'

const CreateAccount = () => {
	const form = useForm({
		initialValues: { email: '' },
		validate: {
			email: (value) =>
				value.length > 0
					? /^\S+@\S+$/.test(value)
						? null
						: 'Invalid email'
					: 'Email cannot be empty',
		},
	})

	const createAccount = useMutation({
		mutationFn: (body: { email: string }) => {
			return axios.post('/dashboard/admin/create', body)
		},
		onSuccess: ({ data }) => {
			/* TODO: Navigate back to admin dashboard page*/
			form.reset()
			console.log(data)
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	return (
		<main className='mx-auto max-w-xl p-24 text-center'>
			<div>
				<form
					onSubmit={form.onSubmit((values) => {
						createAccount.mutate(values)
					})}
					className='flex flex-col gap-5'
				>
					<TextInput
						label='Email'
						description='Email address of the account to be created'
						placeholder='Eg., john@john.com'
						{...form.getInputProps('email')}
					/>
					<Button type='submit'>Create</Button>
				</form>
			</div>

			{/* TODO: Move to mantine notifications */}
			{createAccount.isSuccess && <div>Successfully added account</div>}
		</main>
	)
}

export default CreateAccount
