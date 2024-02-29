import { Table } from '@mantine/core'
import { Product } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import axios from '../../lib/axios'

const ProductList = () => {
	const { shopName } = useParams()
	const shopProductsQuery = useQuery({
		queryKey: ['shopProducts', shopName],
		queryFn: async () => {
			const response = await axios.get<{ products: Product[] }>('/products/', {
				params: { shopName },
			})
			return response.data
		},
	})

	if (shopProductsQuery.isPending) return <div>Loading</div>

	if (shopProductsQuery.isError) return <div>Error fetching data</div>

	return (
		<Table className='text-center !text-xl' withColumnBorders>
			<Table.Thead>
				{/* ! and repetition here is due to mantine styles taking more priority than tailwind styles */}
				<Table.Tr>
					<Table.Th className='!text-center'>Name</Table.Th>
					<Table.Th className='!text-center'>Description</Table.Th>
					<Table.Th className='!text-center'>Price</Table.Th>
				</Table.Tr>
			</Table.Thead>

			{shopProductsQuery.data.products.map(
				({ id, name, description, price }) => {
					return (
						<Table.Tr key={id}>
							<Table.Td>{name}</Table.Td>
							<Table.Td>{description}</Table.Td>
							<Table.Td>{price} ₹</Table.Td>
						</Table.Tr>
					)
				},
			)}
		</Table>
	)
}

export default ProductList
