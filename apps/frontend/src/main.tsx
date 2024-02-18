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
import App from './features/app'
import Login, { loginLoader } from './features/auth/login.page'
import Logout from './features/auth/logout.page'
import CreateAccount from './features/dashboard/admin/create-account.page'
import ErrorBoundary from './shared/error-boundary'
import MainLayout from './shared/main-layout'
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
				<Route path='/dashboard/admin/create' element={<CreateAccount />} />
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
