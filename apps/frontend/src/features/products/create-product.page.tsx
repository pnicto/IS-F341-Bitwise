import { Icon } from '@iconify/react'
import {
	ActionIcon,
	Button,
	Image,
	Loader,
	NumberInput,
	Select,
	Text,
	TextInput,
	Textarea,
} from '@mantine/core'
import { Dropzone, FileWithPath, MIME_TYPES } from '@mantine/dropzone'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { Product } from '@prisma/client'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'
import { useCategoriesQuery } from './queries'

const CreateProduct = () => {
	const categoriesQuery = useCategoriesQuery()
	const [imageURL, setImageURL] = useState('')

	const form = useForm<{
		name: string
		description: string
		price: number
		categoryName: string
		image: FileWithPath | null
	}>({
		initialValues: {
			name: '',
			description: '',
			price: 100,
			categoryName: '',
			image: null,
		},
		validate: {
			name: (value) => (value.length > 0 ? null : 'Name cannot be empty'),
			description: (value) =>
				value.length > 0 ? null : 'Description cannot be empty',
			price: (value) => (value > 0 ? null : 'Invalid price'),
			image: (value) => (value === null ? 'Image is required' : null),
		},
	})

	const createProduct = useMutation({
		mutationFn: (
			newProduct: Pick<
				Product,
				'name' | 'description' | 'price' | 'categoryName'
			> & { image: FileWithPath | null },
		) => {
			const formData = new FormData()

			const productJSON = JSON.stringify({
				name: newProduct.name,
				description: newProduct.description,
				price: newProduct.price,
				categoryName: newProduct.categoryName,
			})

			formData.append('product', productJSON)
			formData.append('image', newProduct.image as FileWithPath)

			return axios.post<{ message: string }>('/products/new', formData, {
				headers: {
					'Content-Type': `multipart/form-data`,
				},
			})
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
				data={[
					{ value: '', label: '(None)' },
					...categoriesQuery.data.categories.map((category) => {
						return {
							value: category.name,
							label: category.name,
						}
					}),
				]}
				{...form.getInputProps('categoryName')}
			/>
			<NumberInput
				label='Price in INR'
				placeholder='40'
				{...form.getInputProps('price')}
			/>
			{form.values.image === null ? (
				<Dropzone
					accept={[MIME_TYPES.png, MIME_TYPES.jpeg]}
					onDrop={(files) => {
						setImageURL(URL.createObjectURL(files[0]))
						form.setFieldValue('image', files[0])
					}}
					onReject={() =>
						form.setFieldError(
							'image',
							'File must be an image no larger than 5MB',
						)
					}
					maxSize={5 * 1024 ** 2}
				>
					<div className='flex gap-4 justify-center items-center'>
						<Dropzone.Idle>
							<Icon icon='tabler:upload' width={24} height={24} />
						</Dropzone.Idle>
						<Dropzone.Accept>
							<Icon icon='tabler:check' width={24} height={24} />
						</Dropzone.Accept>
						<Dropzone.Reject>
							<Icon icon='tabler:x' width='24' height='24' color='red' />
						</Dropzone.Reject>
						<span>
							<Text size='xl' inline>
								Upload product image
							</Text>
							<Text size='sm' c='dimmed' inline mt={7}>
								The image size should not exceed 5MB.
							</Text>
							<Text size='sm' c='dimmed' inline mt={7}>
								Formats accepted: .png, .jpeg
							</Text>
						</span>
					</div>
				</Dropzone>
			) : (
				<div className='relative m-auto'>
					<Image
						src={imageURL}
						onLoad={() => URL.revokeObjectURL(imageURL)}
						h={200}
						w={'auto'}
					/>
					<div className='flex flex-col absolute -top-4 -right-4'>
						<ActionIcon
							size='s'
							onClick={() => {
								form.setFieldValue('image', null)
								setImageURL('')
							}}
							color='red'
							variant='transparent'
							radius={'xl'}
						>
							<Icon
								icon='tabler:playstation-x'
								color='red'
								width={30}
								height={30}
							/>
						</ActionIcon>
					</div>
				</div>
			)}
			{form.errors.image && (
				<Text c='red' mt={5}>
					{form.errors.image}
				</Text>
			)}
			<Button type='submit' loading={createProduct.isPending}>
				Create
			</Button>
		</form>
	)
}

export default CreateProduct
