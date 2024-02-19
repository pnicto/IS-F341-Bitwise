import AxiosClient from 'axios'

const axios = AxiosClient.create({
	withCredentials: true,
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
})

export default axios
