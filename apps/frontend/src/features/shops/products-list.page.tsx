import { Loader, SimpleGrid } from '@mantine/core'
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

	if (shopProductsQuery.isPending) {
		return (
			// TODO: Extract this loader to a separate component and make it better
			<div className='text-center'>
				<Loader />
			</div>
		)
	}

	if (shopProductsQuery.isError) {
		// TODO: Replace with a better error component
		return <div>Error fetching data</div>
	}

	return (
		<>
			<h1 className='pb-8'>List of products at {shopName}</h1>
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
		</>
	)
}

export default ProductList
