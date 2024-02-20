import { Button, NumberInput, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Product } from '@prisma/client'
import { useMutation } from '@tanstack/react-query'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

const CreateProduct = () => {
	const form = useForm({
		initialValues: { name: '', description: '', price: 100 },
		validate: {
			name: (value) => (value.length > 0 ? null : 'Name cannot be empty'),
			description: (value) =>
				value.length > 0 ? null : 'Description cannot be empty',
		},
	})

	const createProduct = useMutation({
		mutationFn: (
			newProduct: Pick<Product, 'name' | 'description' | 'price'>,
		) => {
			return axios.post<{ message: string }>('/products/new', newProduct)
		},
		onSuccess: ({ data }) => {
			form.reset()
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	return (
		<form
			onSubmit={form.onSubmit((values) => {
				createProduct.mutate(values)
			})}
			className='flex flex-col gap-5'
		>
			<TextInput
				label='Name'
				placeholder='Eg., Bucket'
				{...form.getInputProps('name')}
			/>
			<Textarea
				label='Description'
				placeholder='Eg., A strong bucket to carry water.'
				{...form.getInputProps('description')}
			/>
			<NumberInput
				label='Price in INR'
				placeholder='0'
				allowNegative={false}
				{...form.getInputProps('price')}
			/>
			<Button type='submit' loading={createProduct.isPending}>
				Create
			</Button>
		</form>
	)
}

export default CreateProduct
