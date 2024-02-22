import { User } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import axios from '../../lib/axios'

export const useUserQuery = () =>
	useQuery({
		queryKey: ['user'],
		queryFn: async () => {
			const response = await axios.get<{ user: User }>('/auth/me')
			return response.data
		},
	})
