import { MantineProvider } from '@mantine/core'
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
import CreateAccount from './features/admin/create-account.page'
import App from './features/app'
import Login, { loginLoader } from './features/auth/login.page'
import Logout from './features/auth/logout.page'
import CreateProduct from './features/products/create-product.page'
import ViewProducts from './features/products/view-products.page'
import ErrorBoundary from './shared/error-boundary'
import MainLayout from './shared/main-layout'
import PermissionGuard from './shared/permissino-guard'
import ProtectedLayout, { protectedLoader } from './shared/protected-layout'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

const queryClient = new QueryClient()

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route path='/' element={<MainLayout />}>
			<Route path='login' element={<Login />} loader={loginLoader} />
			<Route path='logout' element={<Logout />} />

			{/* Protected example */}
			<Route
				path='/'
				element={<ProtectedLayout />}
				id='protected-layout'
				loader={protectedLoader}
				errorElement={<ErrorBoundary />}
			>
				<Route index element={<App />} />
				<Route path='/products' element={<ViewProducts />} />

				<Route path='catalogue' element={<PermissionGuard permission='VENDOR' />}>
					<Route path='add-product' element={<CreateProduct />} />
				</Route>

				{/* Role based example */}
				<Route path='admin' element={<PermissionGuard permission='ADMIN' />}>
					<Route path='add-student' element={<CreateAccount />} />
				</Route>
			</Route>
		</Route>,
	),
)

root.render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<MantineProvider>
				<Notifications />
				<RouterProvider router={router} />
			</MantineProvider>
		</QueryClientProvider>
	</StrictMode>,
)
