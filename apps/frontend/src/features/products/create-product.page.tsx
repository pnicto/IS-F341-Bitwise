import {
	Button,
	Loader,
	NumberInput,
	Select,
	TextInput,
	Textarea,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Category, Product } from '@prisma/client'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

const CreateProduct = () => {
	const categoriesQuery = useQuery({
		queryKey: ['categories'],
		queryFn: async () => {
			const response = await axios.get<{ categories: Category[] }>(
				'/products/categories',
			)
			return response.data
		},
	})

	const form = useForm<{
		name: string
		description: string
		price: number
		categoryId: string
	}>({
		initialValues: {
			name: '',
			description: '',
			price: 100,
			categoryId: categoriesQuery.data
				? categoriesQuery.data.categories[0].id
				: '',
		},
		validate: {
			name: (value) => (value.length > 0 ? null : 'Name cannot be empty'),
			description: (value) =>
				value.length > 0 ? null : 'Description cannot be empty',
			price: (value) => (value > 0 ? null : 'Invalid price'),
		},
	})

	const createProduct = useMutation({
		mutationFn: (
			newProduct: Pick<
				Product,
				'name' | 'description' | 'price' | 'categoryId'
			>,
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

	if (categoriesQuery.isPending) {
		return (
			// TODO: Extract this loader to a separate component and make it better
			<div className='text-center'>
				<Loader />
			</div>
		)
	}

	if (categoriesQuery.isError) {
		// TODO: Replace with a better error component
		return <div>Error fetching product categories</div>
	}

	return (
		<form
			onSubmit={form.onSubmit((values) => {
				createProduct.mutate(values)
			})}
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
			<Select
				label='Category'
				data={categoriesQuery.data.categories.map((category) => {
					return {
						value: category.id,
						label: category.name,
					}
				})}
				{...form.getInputProps('categoryId')}
			/>
			<NumberInput
				label='Price in INR'
				placeholder='40'
				{...form.getInputProps('price')}
			/>
			<Button type='submit' loading={createProduct.isPending}>
				Create
			</Button>
		</form>
	)
}

export default CreateProduct
