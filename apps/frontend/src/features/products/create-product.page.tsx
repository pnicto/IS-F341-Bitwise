import { Button, NumberInput, TextInput, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import { NewProduct } from '@schemas'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

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
		mutationFn: (newProduct: NewProduct) => {
			return axios.post('http://localhost:5000/api/products/new', newProduct)
		},
		onSuccess: ({ data }) => {
			form.reset()
			console.log(data)
		},
	})

	return (
		<main className='mx-auto max-w-xl p-24 text-center'>
			<div>
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
					<Button type='submit'>Create</Button>
				</form>
			</div>

			{/* TODO: move to mantine notifications */}
			{createProduct.isSuccess && <div>Successfully added product</div>}
		</main>
	)
}

export default CreateProduct
