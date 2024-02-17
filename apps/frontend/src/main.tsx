import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import App from './features/app'
import Login from './features/auth/login.page'
import Logout from './features/auth/logout.page'
import CreateAccount from './features/dashboard/admin/create-account.page'
import CreateProduct from './features/products/create-product.page'
import ViewProducts from './features/products/view-products.page'
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

export const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
	},
	{
		path: '/test',
		element: <div>tested</div>,
	},
	{
		path: '/create-product',
		element: <CreateProduct />,
	},
	{
		path: '/view-products',
		element: <ViewProducts />,
	},
	{
		path: '/login',
		element: <Login />,
	},
	{
		path: '/logout',
		element: <Logout />,
	},
	{
		path: '/dashboard/admin/create',
		element: <CreateAccount />,
	},
])

const queryClient = new QueryClient()

root.render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<MantineProvider>
				<RouterProvider router={router} />
			</MantineProvider>
		</QueryClientProvider>
	</StrictMode>,
)
