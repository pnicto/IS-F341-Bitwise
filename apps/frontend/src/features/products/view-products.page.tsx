import { Grid } from '@mantine/core'
import { Product } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const ViewProducts = () => {
	const getProducts = useQuery({
		queryKey: ['products'],
		queryFn: () => {
			return axios
				.get<Product[]>('http://localhost:5000/api/products')
				.then((res) => res.data)
		},
	})

	if (getProducts.isPending) {
		return <div>Loading...</div>
	}

	if (getProducts.isError) {
		return <div>Error fetching products</div>
	}

	return (
		<main className='mx-auto p-24 text-center'>
			<Grid>
				<Grid.Col span={2} className='text-2xl font-semibold'>
					Name
				</Grid.Col>
				<Grid.Col span={8} className='text-2xl font-semibold'>
					Description
				</Grid.Col>
				<Grid.Col span={2} className='text-2xl font-semibold'>
					Price
				</Grid.Col>

				{getProducts.data.map((product) => {
					return (
						<>
							<Grid.Col span={2}>{product.name}</Grid.Col>
							<Grid.Col span={8}>{product.description}</Grid.Col>
							<Grid.Col span={2}>{product.price}</Grid.Col>
						</>
					)
				})}
			</Grid>
		</main>
	)
}

export default ViewProducts
