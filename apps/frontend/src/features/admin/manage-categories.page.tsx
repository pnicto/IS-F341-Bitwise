import { Icon } from '@iconify/react'
import { Button, Loader, Modal, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { Category } from '@prisma/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'

const ManageCategories = () => {
	const queryClient = useQueryClient()

	const categoriesQuery = useQuery({
		queryKey: ['categories'],
		queryFn: async () => {
			const response = await axios.get<{ categories: Category[] }>(
				'/products/categories',
			)
			return response.data
		},
	})

	const createCategoryForm = useForm<{ name: string }>({
		initialValues: { name: '' },
		validate: {
			name: (value) =>
				value.length > 0
					? value !== '(None)'
						? null
						: "category can't be named '(None)'"
					: 'Category name is required',
		},
	})

	const createCategory = useMutation({
		mutationFn: (body: { name: string }) => {
			return axios.post<{ message: string }>('/products/categories/new', body)
		},
		onSuccess: ({ data }) => {
			createCategoryForm.reset()
			notifications.show({ message: data.message, color: 'green' })
			queryClient.invalidateQueries({ queryKey: ['categories'] })
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	const updateCategoryForm = useForm<Category>({
		initialValues: { name: '', id: '' },
		validate: {
			name: (value) =>
				value.length > 0
					? value !== '(None)'
						? null
						: "category can't be named '(None)'"
					: 'Category name is required',
			id: (value) => (value.length > 0 ? null : 'Category ID is required'),
		},
	})

	const updateCategory = useMutation({
		mutationFn: (category: Category) => {
			return axios.post<{ message: string }>(
				`/products/categories/update/${category.id}`,
				{ name: category.name },
			)
		},
		onSuccess: ({ data }) => {
			createCategoryForm.reset()
			notifications.show({ message: data.message, color: 'green' })
			queryClient.invalidateQueries({ queryKey: ['categories'] })
			modalHandlers.close()
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	const deleteCategory = useMutation({
		mutationFn: (category: { id: string }) => {
			return axios.post<{ message: string }>(
				`/products/categories/delete/${category.id}`,
			)
		},
		onSuccess: ({ data }) => {
			createCategoryForm.reset()
			notifications.show({ message: data.message, color: 'green' })
			queryClient.invalidateQueries({ queryKey: ['categories'] })
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	const [modalIsOpen, modalHandlers] = useDisclosure(false)

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
		<>
			<Modal opened={modalIsOpen} onClose={modalHandlers.close}>
				<form
					onSubmit={updateCategoryForm.onSubmit((values) => {
						updateCategory.mutate(values)
					})}
					className='flex flex-col gap-2'
				>
					<TextInput
						label='Name'
						placeholder='Eg., Beverages'
						{...updateCategoryForm.getInputProps('name')}
					/>

					<Button type='submit' loading={updateCategory.isPending}>
						Update
					</Button>
				</form>
			</Modal>

			<h1 className='pb-8'>Manage Product Categories</h1>
			<h2>Create New Category</h2>
			<form
				onSubmit={createCategoryForm.onSubmit((values) => {
					createCategory.mutate(values)
				})}
			>
				<TextInput
					label='Name'
					description='Name of the category to be created'
					placeholder='Eg., Beverages'
					{...createCategoryForm.getInputProps('name')}
				/>
				<Button type='submit' loading={createCategory.isPending}>
					Create
				</Button>
			</form>
			<h2>Current Categories</h2>
			<div className='flex flex-col gap-2 max-w-lg m-auto'>
				{categoriesQuery.data.categories.map((category) => {
					return (
						<div
							className='flex gap-2 items-center justify-between'
							key={category.id}
						>
							<span className='pr-4'>{category.name}</span>
							<div className='flex gap-4'>
								<Button
									variant='default'
									onClick={() => {
										updateCategoryForm.setValues({
											...category,
										})
										modalHandlers.open()
									}}
								>
									<Icon icon='tabler:edit' />
								</Button>
								<Button
									variant='default'
									onClick={() => {
										// TODO: Add a modal for confirmation once we have a default one to use everywhere
										deleteCategory.mutate({ id: category.id })
									}}
								>
									<Icon icon='tabler:trash' style={{ color: 'red' }} />
								</Button>
							</div>
						</div>
					)
				})}
			</div>
		</>
	)
}

export default ManageCategories
