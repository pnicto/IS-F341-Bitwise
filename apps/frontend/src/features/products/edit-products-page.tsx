import {
	Button,
	Loader,
	Modal,
	NumberInput,
	Select,
	SimpleGrid,
	TextInput,
	Textarea,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { Category, Product } from '@prisma/client'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'
import ProductCard from '../../shared/product-card'
import { useUserQuery } from '../user/queries'

const EditProducts = () => {
	const userQuery = useUserQuery()

	const vendorId = userQuery.data?.user.id
	const categories = Object.values(Category).map((category) => {
		return {
			value: category,
			label: category[0] + category.slice(1).toLowerCase(),
		}
	})

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
		category: Category
	}>({
		initialValues: {
			id: '',
			name: '',
			description: '',
			price: 100,
			category: Category.FOOD,
		},
		validate: {
			name: (value) => (value.length > 0 ? null : 'Name cannot be empty'),
			description: (value) =>
				value.length > 0 ? null : 'Description cannot be empty',
		},
	})

	const [modalIsOpen, modalHandlers] = useDisclosure(false)

	const queryClient = useQueryClient()

	const updateProduct = useMutation({
		mutationFn: (
			newProduct: Pick<
				Product,
				'id' | 'name' | 'description' | 'price' | 'category'
			>,
		) => {
			return axios.post<{ message: string }>(
				`/products/update/${newProduct.id}`,
				newProduct,
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

	if (userQuery.isPending || shopProductsQuery.isPending) {
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
						data={categories}
						{...updateProductForm.getInputProps('category')}
					/>
					<NumberInput
						label='Price in INR'
						placeholder='0'
						allowNegative={false}
						{...updateProductForm.getInputProps('price')}
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
									})
									modalHandlers.open()
								}}
							>
								<IconEdit />
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
								<IconTrash color='red' />
							</Button>
						}
					/>
				))}
			</SimpleGrid>
		</>
	)
}

export default EditProducts
