import { Card, MantineProvider, NumberInput } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/dropzone/styles.css'
import { Notifications } from '@mantine/notifications'
import '@mantine/notifications/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'
import {
	Route,
	RouterProvider,
	createBrowserRouter,
	createRoutesFromElements,
} from 'react-router-dom'
import CreateAccountsBulk from './features/admin/create-accounts-bulk.page'
import CreateAccount from './features/admin/create-accout.page'
import HomeWithCreateAndUpdateAccount from './features/admin/home-with-find-account.page'
import ManageCategories from './features/admin/manage-categories.page'
import Login, { loginLoader } from './features/auth/login.page'
import CreateProduct from './features/products/create-product.page'
import EditProducts from './features/products/edit-products-page'
import SearchProduct from './features/products/search-product.page'
import ProductList from './features/shops/products-list.page'
import ShopList from './features/shops/shop-list.page'
import ShopTransactionHistory from './features/shops/shop-transaction-history.page'
import EditProfile from './features/user/edit-profile'
import HomeWithPayments from './features/user/home-with-payments.page'
import ManageTags from './features/user/manage-tags'
import ManageWallet from './features/user/manage-wallet.page'
import PaymentRequests from './features/user/payment-requests.page'
import TransactionHistory from './features/user/transaction-history.page'
import UserReportsPage from './features/reports/user-reports.page'
import ErrorBoundary from './shared/error-boundary'
import MainLayout from './shared/main-layout'
import NotFound from './shared/not-found'
import PermissionGuard from './shared/permission-guard'
import ProtectedLayout, { protectedLoader } from './shared/protected-layout'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

const queryClient = new QueryClient()

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route path='/' element={<MainLayout />}>
			{/* Public routes */}
			<Route path='login' element={<Login />} loader={loginLoader} />
			<Route path='*' element={<NotFound />} />

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
					<Route path='manage-wallet' element={<ManageWallet />} />
					<Route path='shops/view' element={<ShopList />} />
					<Route path=':shopName/products' element={<ProductList />} />
					<Route path='edit-profile' element={<EditProfile />} />
					<Route path='catalogue'>
						<Route index element={<EditProducts />} />
						<Route path='add-product' element={<CreateProduct />} />
					</Route>
					<Route path='txn-history' element={<TransactionHistory />} />
					<Route path='manage-tags' element={<ManageTags />} />
					<Route path='search-product' element={<SearchProduct />} />
					<Route path='payment-requests' element={<PaymentRequests />} />
					<Route path='reports/user' element={<UserReportsPage />} />
				</Route>

				{/* Protected only for vendor */}
				<Route element={<PermissionGuard permissions={['VENDOR']} />}>
					<Route path='shop'>
						<Route path='transactions' element={<ShopTransactionHistory />} />
					</Route>
				</Route>

				{/* Protected only for admin */}
				<Route element={<PermissionGuard permissions={['ADMIN']} />}>
					<Route path='admin'>
						<Route index element={<HomeWithCreateAndUpdateAccount />} />
						<Route path='add-account' element={<CreateAccount />} />
						<Route path='bulk-add-account' element={<CreateAccountsBulk />} />
						<Route path='manage-categories' element={<ManageCategories />} />
					</Route>
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
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	</StrictMode>,
)
