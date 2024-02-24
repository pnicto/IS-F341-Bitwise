import { Card, SimpleGrid } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import axios from '../../lib/axios'

const ShopList = () => {
	const shopsQuery = useQuery({
		queryKey: ['shops'],
		queryFn: async () => {
			const response = await axios.get<{ shops: { shopName: string }[] }>(
				'/shops',
			)
			return response.data
		},
	})

	if (shopsQuery.isPending) return <div>Loading</div>

	if (shopsQuery.isError) return <div>Error fetching data</div>

	return (
		<SimpleGrid
			cols={{ base: 1, sm: 2 }}
			spacing={{ base: 10, sm: 'xl' }}
			verticalSpacing={{ base: 'md' }}
			className='md:min-w-80'
		>
			{shopsQuery.data.shops.map(({ shopName }) => (
				<Card
					key={shopName}
					shadow='md'
					withBorder
					className='text-center'
					component={Link}
					to={`/${shopName}/products`}
				>
					{shopName}
				</Card>
			))}
		</SimpleGrid>
	)
}

export default ShopList
