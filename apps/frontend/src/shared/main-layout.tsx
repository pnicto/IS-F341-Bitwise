import { Icon } from '@iconify/react'
import {
	ActionIcon,
	Anchor,
	Button,
	Menu,
	Modal,
	NumberInput,
	Popover,
	Select,
	TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { User } from '@prisma/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
	NavLink,
	Outlet,
	useLocation,
	useNavigate,
	useRouteLoaderData,
	useSearchParams,
} from 'react-router-dom'
import { useCategoriesQuery } from '../features/products/queries'
import axios from '../lib/axios'
import { handleAxiosErrors } from '../notifications/utils'

const MainLayout = () => {
	const data = useRouteLoaderData('protected-layout') as { user: User }
	const [modalIsOpen, modalHandlers] = useDisclosure(false)
	const queryClient = useQueryClient()
	const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false)
	const categoriesQuery = useCategoriesQuery()
	const currentRoute = useLocation()
	const navigate = useNavigate()
	const logout = useMutation({
		mutationFn: () => {
			return axios.post<{ msg: string }>('/auth/logout')
		},
		onSuccess: ({ data }) => {
			queryClient.clear()
			notifications.show({
				message: data.msg,
				color: 'green',
			})
			navigate('/login', { replace: true })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})
	const [searchParams] = useSearchParams()

	const paymentRequest = useMutation({
		mutationFn: (body: { requesteeUsername: string; amount: number }) => {
			return axios.post<{ msg: string }>('/requests', body)
		},
		onSuccess: ({ data }) => {
			queryClient.invalidateQueries({ queryKey: ['paymentRequests'] })
			notifications.show({ message: data.msg, color: 'green' })
			paymentRequestForm.reset()
			modalHandlers.close()
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})

	const paymentRequestForm = useForm({
		initialValues: {
			requesteeUsername: '',
			amount: 100,
		},
		validate: {
			requesteeUsername: (value) =>
				value.length > 0 ? null : 'Name cannot be empty',
			amount: (value) => (value > 0 ? null : 'Please enter a valid amount.'),
		},
	})
	const searchForm = useForm({
		initialValues: {
			name: searchParams.get('name') || '',
			categoryName: searchParams.get('category') || '',
		},
		validate: {
			name: (value) => {
				if (value.length < 3) {
					return 'Search must be at least 3 characters long'
				}
			},
		},
	})

	return (
		<>
			{data && (
				<nav className='flex justify-between py-2 items-center pl-3 pr-2 gap-3'>
					{/* TODO: Discuss if we are going to replace this with back button */}
					<Anchor
						component={NavLink}
						className='flex items-center justify-center'
						to={data.user.role === 'ADMIN' ? '/admin' : '/'}
					>
						<Icon icon='lucide:home' className='text-2xl' />
					</Anchor>

					{(currentRoute.pathname === '/' ||
						currentRoute.pathname === '/shops/view' ||
						currentRoute.pathname === '/search-product') && (
						<form
							className='p-0 grow'
							onSubmit={searchForm.onSubmit((values) => {
								navigate(
									`/search-product?name=${values.name}&category=${values.categoryName}`,
								)
							})}
						>
							<TextInput
								placeholder='Search for products'
								type='search'
								rightSection={
									<>
										<ActionIcon
											variant='light'
											type='submit'
											size='lg'
											className='mr-1'
										>
											<Icon icon='lucide:search' />
										</ActionIcon>
										<Popover
											opened={isFilterPopoverOpen}
											onChange={setIsFilterPopoverOpen}
										>
											<Popover.Target>
												<ActionIcon
													variant='light'
													onClick={() =>
														setIsFilterPopoverOpen((prev) => !prev)
													}
													size='lg'
												>
													<Icon icon='lucide:filter' />
												</ActionIcon>
											</Popover.Target>

											<Popover.Dropdown>
												{!(
													categoriesQuery.isPending || categoriesQuery.isError
												) && (
													<Select
														className='max-w-32'
														data={[
															{ value: '', label: 'All' },
															...categoriesQuery.data.categories.map(
																(category) => {
																	return {
																		value: category.name,
																		label: category.name,
																	}
																},
															),
														]}
														{...searchForm.getInputProps('categoryName')}
													/>
												)}
											</Popover.Dropdown>
										</Popover>
									</>
								}
								{...searchForm.getInputProps('name')}
								rightSectionWidth={75}
								rightSectionPointerEvents='all'
							/>
						</form>
					)}

					<div className='flex gap-8 items-center'>
						{currentRoute.pathname === '/txn-history' && (
							<Button
								color='green'
								radius='xl'
								size='compact-md'
								component={NavLink}
								to='/manage-tags'
							>
								Manage tags
							</Button>
						)}
						{currentRoute.pathname === '/catalogue' && (
							<Button
								color='green'
								radius='xl'
								size='compact-md'
								component={NavLink}
								to='/catalogue/add-product'
							>
								<Icon icon='lucide:plus' className='text-2xl' />
							</Button>
						)}
						{currentRoute.pathname === '/payment-requests' && (
							<Button
								onClick={modalHandlers.open}
								color='green'
								radius='xl'
								size='compact-md'
							>
								New Request
							</Button>
						)}

						<Menu>
							<Menu.Target>
								<Button variant='light' className=''>
									<Icon icon='lucide:more-vertical' className='text-2xl' />
								</Button>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item component={NavLink} to='/edit-profile'>
									Edit Profile
								</Menu.Item>
								<Menu.Item
									leftSection={<Icon icon='lucide:log-out' />}
									component='button'
									onClick={() => logout.mutate()}
									color='red'
								>
									Logout
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</div>
				</nav>
			)}
			<main className='px-10 py-4 mx-auto sm:px-32 md:px-40 max-w-7xl'>
				<Modal
					opened={modalIsOpen}
					onClose={modalHandlers.close}
					title='New Payment Request'
				>
					<form
						onSubmit={paymentRequestForm.onSubmit((values) =>
							paymentRequest.mutate(values),
						)}
					>
						<TextInput
							label='Requestee Username'
							placeholder='john43'
							{...paymentRequestForm.getInputProps('requesteeUsername')}
						/>
						<NumberInput
							label='Amount to request (INR)'
							placeholder='40'
							leftSection={<Icon icon='lucide:indian-rupee' />}
							{...paymentRequestForm.getInputProps('amount')}
						/>
						<Button type='submit'>Request</Button>
					</form>
				</Modal>
				<Outlet />
			</main>
		</>
	)
}

export default MainLayout
