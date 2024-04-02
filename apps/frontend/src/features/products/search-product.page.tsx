import { SimpleGrid } from '@mantine/core'
import { Product } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import axios from '../../lib/axios'
import ProductCard from '../../shared/product-card'

const SearchProduct = () => {
	const [searchParams] = useSearchParams()
	const productName = searchParams.get('name')
	const categoryName = searchParams.get('category')

	const searchQuery = useQuery({
		queryKey: ['search-product', productName, categoryName],
		queryFn: async () => {
			const response = await axios.get<{
				products: Product[]
			}>(`/products/search?name=${productName}&category=${categoryName}`)
			return response.data
		},
		enabled: !!productName || !!categoryName,
	})

	if (searchQuery.isPending) {
		return <div>Loading...</div>
	}

	if (searchQuery.isError) {
		return <div>Error: {searchQuery.error.message}</div>
	}

	if (searchQuery.data.products.length === 0) {
		return (
			<>
				<p className='text-2xl inline'>
					No products found for query "<em>{productName}</em>""
				</p>
				{categoryName && (
					<p className='text-2xl inline'>
						{' '}
						and category "<em>{categoryName}</em>"
					</p>
				)}
			</>
			// TODO: We can add some svg here	to make it more visually appealing
		)
	}

	return (
		<>
			<div className='text-lg pb-5'>
				<p className='inline'>
					Showing {searchQuery.data.products.length} results for "
					<em>{productName}</em>"
				</p>
				{categoryName && (
					<p className='inline'>
						{' '}
						in category "<em>{categoryName}</em>"
					</p>
				)}
			</div>

			<SimpleGrid
				cols={{
					base: 1,
					sm: 2,
					md: 3,
				}}
				spacing='xl'
				verticalSpacing='md'
			>
				{searchQuery.data.products.map((product) => (
					<ProductCard key={product.id} {...product} showVendorDetails={true} />
				))}
			</SimpleGrid>
		</>
	)
}

export default SearchProduct
