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
import Login, { loginLoader } from './features/auth/login.page'
import CreateAccount from './features/dashboard/admin/create-account.page'
import PaymentsPage from './features/payments/payments.page'
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

			{/* Protected example */}
			<Route
				path='/'
				element={<ProtectedLayout />}
				id='protected-layout'
				loader={protectedLoader}
				errorElement={<ErrorBoundary />}
			>
				<Route index element={<PaymentsPage />} />
				<Route path='/products' element={<ViewProducts />} />

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
