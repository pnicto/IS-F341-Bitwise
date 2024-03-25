import { Category } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import axios from '../../lib/axios'

export const useCategoriesQuery = () =>
	useQuery({
		queryKey: ['categories'],
		queryFn: async () => {
			const response = await axios.get<{ categories: Category[] }>(
				'/products/categories',
			)
			return response.data
		},
	})
