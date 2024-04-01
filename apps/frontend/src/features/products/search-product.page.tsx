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
		select: (data) => {
			const groupedProducts: Record<string, Product[]> = {}

			// Group products by shop name or 'Buy & Sell' if no shop name is present
			data.products.forEach((product) => {
				const shopName = product.sellerDetails.shopName

				if (shopName) {
					if (!groupedProducts[shopName]) {
						groupedProducts[shopName] = []
					}
					groupedProducts[shopName].push(product)
				} else {
					if (!groupedProducts['Buy & Sell']) {
						groupedProducts['Buy & Sell'] = []
					}
					groupedProducts['Buy & Sell'].push(product)
				}
			})
			return { groupedProducts, length: data.products.length }
		},
	})

	if (searchQuery.isPending) {
		return <div>Loading...</div>
	}

	if (searchQuery.isError) {
		return <div>Error: {searchQuery.error.message}</div>
	}

	if (searchQuery.data.length === 0) {
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
			<div className='text-lg'>
				<p className='inline'>
					Showing {searchQuery.data.length} results for "<em>{productName}</em>"
				</p>
				{categoryName && (
					<p className='inline'>
						{' '}
						in category "<em>{categoryName}</em>"
					</p>
				)}
			</div>

			{Object.entries(searchQuery.data.groupedProducts).map(
				([shopName, products]) => (
					<div key={shopName} className='pt-5'>
						<h2 className='text-xl font-bold'>From {shopName}</h2>
						<SimpleGrid
							cols={{
								base: 1,
								sm: 2,
								md: 3,
							}}
							spacing='xl'
							verticalSpacing='md'
						>
							{products.map((product) => (
								<ProductCard
									key={product.id}
									{...product}
									// Show vendor details only for products from 'Buy & Sell'
									showVendorDetails={shopName === 'Buy & Sell'}
								/>
							))}
						</SimpleGrid>
					</div>
				),
			)}
		</>
	)
}

export default SearchProduct
