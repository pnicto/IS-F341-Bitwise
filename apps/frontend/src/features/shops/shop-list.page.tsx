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
		<>
			<h1 className='font-bold text-4xl text-center pb-8'>Available Shops</h1>
			<SimpleGrid
				cols={{
					base: 1,
					sm: 2,
				}}
				spacing='xl'
				verticalSpacing='md'
				className='mx-auto max-w-xl'
			>
				<Card
					key='buy&sell'
					className='text-center text-2xl'
					padding='lg'
					component={Link}
					to={'/buy&sell/products'}
				>
					<p className='break-words'>Buy & Sell</p>
				</Card>
				{shopsQuery.data.shops.map(({ shopName }) => (
					<Card
						key={shopName}
						className='text-center text-2xl'
						padding='lg'
						component={Link}
						to={`/${shopName}/products`}
					>
						<p className='break-words'>{shopName}</p>
					</Card>
				))}
			</SimpleGrid>
		</>
	)
}

export default ShopList
