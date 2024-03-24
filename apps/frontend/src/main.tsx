import { Card, MantineProvider, NumberInput } from '@mantine/core'
import '@mantine/core/styles.css'
import { Notifications } from '@mantine/notifications'
import '@mantine/notifications/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'
import {
	Route,
	RouterProvider,
	createBrowserRouter,
	createRoutesFromElements,
} from 'react-router-dom'
import CreateAccountsBulk from './features/admin/create-accounts-bulk.page'
import HomeWithCreateAndUpdateAccount from './features/admin/home-with-create-account.page'
import Login, { loginLoader } from './features/auth/login.page'
import CreateProduct from './features/products/create-product.page'
import EditProducts from './features/products/edit-products-page'
import SearchProduct from './features/products/search-product.page'
import ProductList from './features/shops/products-list.page'
import ShopList from './features/shops/shop-list.page'
import EditProfile from './features/user/edit-profile'
import HomeWithPayments from './features/user/home-with-payments.page'
import ManageWallet from './features/user/manage-wallet.page'
import ErrorBoundary from './shared/error-boundary'
import MainLayout from './shared/main-layout'
import PermissionGuard from './shared/permission-guard'
import ProtectedLayout, { protectedLoader } from './shared/protected-layout'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

const queryClient = new QueryClient()

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route path='/' element={<MainLayout />}>
			{/* Public routes */}
			<Route path='login' element={<Login />} loader={loginLoader} />

			{/* Protected routes */}
			<Route
				path='/'
				element={<ProtectedLayout />}
				id='protected-layout'
				loader={protectedLoader}
				errorElement={<ErrorBoundary />}
			>
				{/* Protected for both user and vendor */}
				<Route
					element={<PermissionGuard permissions={['STUDENT', 'VENDOR']} />}
				>
					<Route index element={<HomeWithPayments />} />
					<Route path='/manage-wallet' element={<ManageWallet />} />
					<Route path='/shops/view' element={<ShopList />} />
					<Route path='/:shopName/products' element={<ProductList />} />
					<Route path='/edit-profile' element={<EditProfile />} />
					<Route path='catalogue'>
						<Route index element={<EditProducts />} />
						<Route path='add-product' element={<CreateProduct />} />
					</Route>
					<Route path='/search-product' element={<SearchProduct />} />
				</Route>

				{/* Protected only for admin */}
				<Route element={<PermissionGuard permissions={['ADMIN']} />}>
					<Route path='admin/' element={<HomeWithCreateAndUpdateAccount />} />
					<Route
						path='admin/bulk-add-account'
						element={<CreateAccountsBulk />}
					/>
				</Route>
			</Route>
		</Route>,
	),
)

root.render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<MantineProvider
				theme={{
					defaultRadius: 'md',
					components: {
						Card: Card.extend({
							defaultProps: {
								shadow: 'lg',
								withBorder: true,
							},
						}),
						NumberInput: NumberInput.extend({
							defaultProps: {
								allowNegative: false,
								allowDecimal: false,
							},
						}),
					},
				}}
			>
				<Notifications />
				<RouterProvider router={router} />
			</MantineProvider>
		</QueryClientProvider>
	</StrictMode>,
)
