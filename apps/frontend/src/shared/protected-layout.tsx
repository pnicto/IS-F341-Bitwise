import { Outlet } from 'react-router-dom'
import axios from '../lib/axios'

export async function protectedLoader() {
	const response = await axios.get('/auth/me')
	return response.data
}

const ProtectedLayout = () => {
	// data from the loader can be here used to make the navbar dynamic
	// const data = useLoaderData()

	return <Outlet />
}

export default ProtectedLayout