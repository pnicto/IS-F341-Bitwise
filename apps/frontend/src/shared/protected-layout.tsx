import { Outlet } from 'react-router-dom'
import axios from '../lib/axios'

export async function protectedLoader() {
	const response = await axios.get('/user/details', {
		headers: {
			'Cache-Control': 'no-cache',
			Pragma: 'no-cache',
			Expires: '0',
		},
	})
	return response.data
}

const ProtectedLayout = () => {
	// data from the loader can be here used to make the navbar dynamic
	// const data = useLoaderData()

	return <Outlet />
}

export default ProtectedLayout
