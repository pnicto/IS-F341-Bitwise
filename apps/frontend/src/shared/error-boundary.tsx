import { AxiosError, HttpStatusCode } from 'axios'
import { Navigate, useRouteError } from 'react-router-dom'

// Despite the name this is not same as the ErrorBoundary from React
const ErrorBoundary = () => {
	const error = useRouteError()

	if (error instanceof AxiosError) {
		if (error.response?.status === HttpStatusCode.Unauthorized) {
			return <Navigate to='/login' />
		}
	}

	// TODO: Handle other errors
	return <div>{JSON.stringify(error)}</div>
}

export default ErrorBoundary
