import { Icon } from '@iconify/react'
import {
	Button,
	Image,
	Loader,
	Modal,
	NumberInput,
	Select,
	SimpleGrid,
	Switch,
	Text,
	TextInput,
	Textarea,
} from '@mantine/core'
import { Dropzone, FileWithPath, MIME_TYPES } from '@mantine/dropzone'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { Product } from '@prisma/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'
import ProductCard from '../../shared/product-card'
import { useUserQuery } from '../user/queries'
import { useCategoriesQuery } from './queries'

const EditProducts = () => {
	const userQuery = useUserQuery()

	const categoriesQuery = useCategoriesQuery()

	const vendorId = userQuery.data?.user.id

	const [imageURL, setImageURL] = useState('')

	const shopProductsQuery = useQuery({
		queryKey: ['shopProducts', vendorId],
		queryFn: async () => {
			const response = await axios.get<{ products: Product[] }>('/products', {
				params: { vendorId },
			})
			return response.data
		},
		enabled: !!vendorId,
	})

	const updateProductForm = useForm<{
		id: string
		name: string
		description: string
		price: number
		categoryName: string
		image: FileWithPath | null
		imageWasEdited: boolean
		imagePath: string
	}>({
		initialValues: {
			id: '',
			name: '',
			description: '',
			price: 100,
			categoryName: '',
			image: null,
			imageWasEdited: false,
			imagePath: '',
		},
		validate: {
			name: (value) => (value.length > 0 ? null : 'Name cannot be empty'),
			description: (value) =>
				value.length > 0 ? null : 'Description cannot be empty',
			price: (value) => (value > 0 ? null : 'Invalid price'),
			image: (value, values) =>
				values.imageWasEdited && value === null ? 'Image is required' : null,
		},
	})

	const [modalIsOpen, modalHandlers] = useDisclosure(false)

	const queryClient = useQueryClient()

	const updateProduct = useMutation({
		mutationFn: (
			newProduct: Pick<
				Product,
				'id' | 'name' | 'description' | 'price' | 'categoryName' | 'imagePath'
			> & { image: FileWithPath | null; imageWasEdited: boolean },
		) => {
			const formData = new FormData()

			const productJSON = JSON.stringify({
				name: newProduct.name,
				description: newProduct.description,
				price: newProduct.price,
				categoryName: newProduct.categoryName,
			})

			formData.append('product', productJSON)
			if (newProduct.imageWasEdited) {
				formData.append('image', newProduct.image as FileWithPath)
			}

			return axios.post<{ message: string }>(
				`/products/update/${newProduct.id}`,
				formData,
				{
					headers: {
						'Content-Type': `multipart/form-data`,
					},
				},
			)
		},
		onSuccess: ({ data }) => {
			queryClient.invalidateQueries({ queryKey: ['shopProducts', vendorId] })
			updateProductForm.reset()
			modalHandlers.close()
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	const deleteProduct = useMutation({
		mutationFn: (product: Pick<Product, 'id'>) => {
			return axios.post<{ message: string }>(`/products/delete/${product.id}`)
		},
		onSuccess: ({ data }) => {
			queryClient.invalidateQueries({ queryKey: ['shopProducts', vendorId] })
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	if (
		userQuery.isPending ||
		shopProductsQuery.isPending ||
		categoriesQuery.isPending
	) {
		return (
			// TODO: Extract this loader to a separate component and make it better
			<div className='text-center'>
				<Loader />
			</div>
		)
	}

	if (userQuery.isError) {
		// TODO: Replace with a better error component
		return <div>Error fetching user data</div>
	}

	if (shopProductsQuery.isError) {
		// TODO: Replace with a better error component
		return <div>Error fetching catalogue data</div>
	}

	if (categoriesQuery.isError) {
		// TODO: Replace with a better error component
		return <div>Error fetching product categories</div>
	}

	return (
		<>
			<Modal opened={modalIsOpen} onClose={modalHandlers.close}>
				<form
					onSubmit={updateProductForm.onSubmit((values) => {
						updateProduct.mutate(values)
					})}
					className='flex flex-col gap-2'
				>
					<TextInput
						label='Name'
						placeholder='Eg., Bucket'
						{...updateProductForm.getInputProps('name')}
					/>
					<Textarea
						label='Description'
						placeholder='Eg., A strong bucket to carry water.'
						{...updateProductForm.getInputProps('description')}
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
						{...updateProductForm.getInputProps('categoryName')}
					/>
					<NumberInput
						label='Price in INR'
						placeholder='40'
						{...updateProductForm.getInputProps('price')}
					/>
					{!updateProductForm.values.imageWasEdited ? (
						<div>
							<Image
								src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${
									updateProductForm.values.imagePath
								}`}
								fallbackSrc='/fallbackProductImage.png'
							/>
						</div>
					) : updateProductForm.values.image === null ? (
						<Dropzone
							accept={[MIME_TYPES.png, MIME_TYPES.jpeg]}
							onDrop={(files) => {
								setImageURL(URL.createObjectURL(files[0]))
								updateProductForm.setFieldValue('image', files[0])
							}}
							onReject={() =>
								updateProductForm.setFieldError(
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
						<>
							<Image
								src={imageURL}
								onLoad={() => URL.revokeObjectURL(imageURL)}
								h={200}
								w={'auto'}
								className='m-auto'
							/>
							<div className='flex flex-col pt-4'>
								{/* TODO: figure out how to replace with a cross button on top right of image */}
								<Button
									size='s'
									onClick={() => {
										updateProductForm.setFieldValue('image', null)
										setImageURL('')
									}}
									color='red'
								>
									Remove Image
								</Button>
							</div>
						</>
					)}
					{updateProductForm.errors.image && (
						<Text c='red' mt={5}>
							{updateProductForm.errors.image}
						</Text>
					)}
					<Switch
						label='Replace Image'
						{...updateProductForm.getInputProps('imageWasEdited')}
					/>
					<Button type='submit' loading={updateProduct.isPending}>
						Update
					</Button>
				</form>
			</Modal>

			<SimpleGrid
				cols={{
					base: 1,
					sm: 2,
					md: 3,
				}}
				spacing='xl'
				verticalSpacing='md'
			>
				{shopProductsQuery.data.products.map((product) => (
					<ProductCard
						key={product.id}
						{...product}
						allowEdit
						editComponent={
							<Button
								variant='default'
								onClick={() => {
									updateProductForm.setValues({
										...product,
										categoryName: product.categoryName ?? '',
									})
									modalHandlers.open()
								}}
							>
								<Icon icon='lucide:edit' className='font-bold text-2xl' />
							</Button>
						}
						deleteComponent={
							<Button
								variant='default'
								onClick={() => {
									// TODO: Add a modal for confirmation once we have a default one to use everywhere
									deleteProduct.mutate({ id: product.id })
								}}
							>
								<Icon
									icon='lucide:trash-2'
									className='text-red-500 text-2xl font-bold'
								/>
							</Button>
						}
					/>
				))}
			</SimpleGrid>
		</>
	)
}

export default EditProducts
