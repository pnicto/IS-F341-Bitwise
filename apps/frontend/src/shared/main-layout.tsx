import { Icon } from '@iconify/react'
import { Anchor, Button, Menu, Popover, Select, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { User } from '@prisma/client'
import { IconPlus } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
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
	const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false)
	const categoriesQuery = useCategoriesQuery()
	const currentRoute = useLocation()
	const navigate = useNavigate()
	const logout = useMutation({
		mutationFn: () => {
			return axios.post<{ message: string }>('/auth/logout')
		},
		onSuccess: ({ data }) => {
			notifications.show({
				message: data.message,
				color: 'green',
			})
			navigate('/login', { replace: true })
		},
		onError: (err) => {
			handleAxiosErrors(err)
		},
	})
	const [searchParams] = useSearchParams()
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
								rightSection={
									<Popover
										opened={isFilterPopoverOpen}
										onChange={setIsFilterPopoverOpen}
									>
										<Popover.Target>
											<Button
												variant='light'
												onClick={() => setIsFilterPopoverOpen((prev) => !prev)}
											>
												<Icon icon='lucide:filter' />
											</Button>
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
								}
								leftSection={
									<Button variant='light' type='submit'>
										<Icon icon='lucide:search' />
									</Button>
								}
								{...searchForm.getInputProps('name')}
								leftSectionPointerEvents='all'
								leftSectionWidth={50}
								rightSectionPointerEvents='all'
								rightSectionWidth={50}
							/>
						</form>
					)}

					<div className='flex gap-8 items-center'>
						{currentRoute.pathname === '/catalogue' && (
							<Button
								color='green'
								radius='xl'
								size='compact-md'
								component={NavLink}
								to='/catalogue/add-product'
							>
								<IconPlus size={20} fill='green' />
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
				<Outlet />
			</main>
		</>
	)
}

export default MainLayout
