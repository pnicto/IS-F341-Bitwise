import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import App from './features/app'
import CreateProduct from './features/products/create-product.page'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

const router = createBrowserRouter([
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
