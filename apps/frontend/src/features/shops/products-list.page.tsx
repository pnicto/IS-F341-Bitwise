import { SimpleGrid } from '@mantine/core'
import { Product } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useParams } from 'react-router-dom'
import axios from '../../lib/axios'
import ProductCard from '../../shared/product-card'

const ProductList = () => {
	const location = useLocation()
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
		<SimpleGrid
			cols={{
				base: 1,
				sm: 2,
				md: 3,
			}}
			spacing='xl'
			verticalSpacing='md'
		>
			{shopProductsQuery.data.products.map((product) => (
				<ProductCard
					key={product.id}
					{...product}
					showVendorDetails={location.pathname.startsWith('/buy&sell')}
				/>
			))}
		</SimpleGrid>
	)
}

export default ProductList
