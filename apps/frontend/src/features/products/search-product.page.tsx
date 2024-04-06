import { Pagination, SimpleGrid } from '@mantine/core'
import { Product } from '@prisma/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from '../../lib/axios'
import ProductCard from '../../shared/product-card'

const SearchProduct = () => {
	const numberOfItems = 6

	const [searchParams] = useSearchParams()
	const productName = searchParams.get('name')
	const categoryName = searchParams.get('category')

	const [currentPage, setCurrentPage] = useState(1)

	const queryClient = useQueryClient()

	const searchQuery = useQuery({
		queryKey: [
			'search-product',
			productName,
			categoryName,
			{ page: currentPage },
		],
		queryFn: async () => {
			const response = await axios.get<{
				products: Product[]
				totalPages: number
			}>(
				`/products/search?name=${productName}&category=${categoryName}&items=${numberOfItems}&page=${currentPage}`,
			)
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
					Showing results {(currentPage - 1) * numberOfItems + 1} -{' '}
					{(currentPage - 1) * numberOfItems + searchQuery.data.products.length}{' '}
					for "<em>{productName}</em>"
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
			<div className='flex flex-col items-center'>
				<Pagination
					total={searchQuery.data.totalPages}
					value={currentPage}
					onChange={(value: number) => {
						setCurrentPage(value)
						queryClient.invalidateQueries({
							queryKey: [
								'search-product',
								productName,
								categoryName,
								{ page: value },
							],
						})
					}}
					mt='sm'
				/>
			</div>
		</>
	)
}

export default SearchProduct
