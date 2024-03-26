import { Icon } from '@iconify/react'
import { Button, Loader, Modal, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'
import { useUserQuery } from './queries'

const ManageTags = () => {
	const queryClient = useQueryClient()

	const userQuery = useUserQuery()

	const createTagForm = useForm<{ name: string }>({
		initialValues: { name: '' },
		validate: {
			name: (value) => (value.length > 0 ? null : 'Tag name is required'),
		},
	})

	const createTag = useMutation({
		mutationFn: (body: { name: string }) => {
			return axios.post<{ message: string }>('/user/tags/create', body)
		},
		onSuccess: ({ data }) => {
			createTagForm.reset()
			notifications.show({ message: data.message, color: 'green' })
			queryClient.invalidateQueries({ queryKey: ['user'] })
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	const updateTagForm = useForm<{ oldName: string; newName: string }>({
		initialValues: { oldName: '', newName: '' },
		validate: {
			oldName: (value) =>
				value.length > 0 ? null : 'Old tag name is required',
			newName: (value) =>
				value.length > 0 ? null : 'New tag name is required',
		},
	})

	const updateTag = useMutation({
		mutationFn: (body: { oldName: string; newName: string }) => {
			return axios.post<{ message: string }>(`/user/tags/edit`, body)
		},
		onSuccess: ({ data }) => {
			updateTagForm.reset()
			notifications.show({ message: data.message, color: 'green' })
			queryClient.invalidateQueries({ queryKey: ['user'] })
			modalHandlers.close()
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	const deleteTag = useMutation({
		mutationFn: (body: { name: string }) => {
			return axios.post<{ message: string }>(`/user/tags/delete`, body)
		},
		onSuccess: ({ data }) => {
			notifications.show({ message: data.message, color: 'green' })
			queryClient.invalidateQueries({ queryKey: ['user'] })
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	const [modalIsOpen, modalHandlers] = useDisclosure(false)

	if (userQuery.isPending) {
		return (
			// TODO: Extract this loader to a separate component and make it better
			<div className='text-center'>
				<Loader />
			</div>
		)
	}

	if (userQuery.isError) {
		// TODO: Replace with a better error component
		return <div>Error fetching user tags</div>
	}

	return (
		<>
			<Modal opened={modalIsOpen} onClose={modalHandlers.close}>
				<form
					onSubmit={updateTagForm.onSubmit((values) => {
						updateTag.mutate(values)
					})}
					className='flex flex-col gap-2'
				>
					<TextInput
						label='Old name'
						placeholder='Eg., Beverages'
						disabled
						{...updateTagForm.getInputProps('oldName')}
					/>
					<TextInput
						label='New name'
						placeholder='Eg., Bills'
						{...updateTagForm.getInputProps('newName')}
					/>

					<Button type='submit' loading={updateTag.isPending}>
						Update
					</Button>
				</form>
			</Modal>
			<h1 className='pb-8'>Manage User Tags</h1>
			<h2>Create New Tag</h2>
			<form
				onSubmit={createTagForm.onSubmit((values) => {
					createTag.mutate(values)
				})}
			>
				<TextInput
					label='Name'
					description='Name of the tag to be created'
					placeholder='Eg., Bills'
					{...createTagForm.getInputProps('name')}
				/>
				<Button type='submit' loading={createTag.isPending}>
					Create
				</Button>
			</form>
			<h2>Current Tags</h2>
			<div className='flex flex-col gap-2 max-w-lg m-auto'>
				{userQuery.data.user.tags.map((tag) => {
					return (
						<div className='flex gap-2 items-center justify-between' key={tag}>
							<span className='pr-4'>{tag}</span>
							<div className='flex gap-4'>
								<Button
									variant='default'
									onClick={() => {
										updateTagForm.setValues({
											oldName: tag,
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
										deleteTag.mutate({ name: tag })
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
export default ManageTags
