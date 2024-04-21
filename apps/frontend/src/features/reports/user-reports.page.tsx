import { DonutChart } from '@mantine/charts'
import { Pagination } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import axios from '../../lib/axios'
import ExpenditureItemCard from '../../shared/expenditure-item-card'
import CustomLoader from '../../shared/loader'

const getCategoryColor = (value: number) => {
	const palette = [
		'#0074D9',
		'#FF4136',
		'#2ECC40',
		'#FF851B',
		'#7FDBFF',
		'#B10DC9',
		'#FFDC00',
		'#001F3F',
		'#39CCCC',
		'#01FF70',
		'#85144B',
		'#F012BE',
		'#3D9970',
		'#111111',
		'#AAAAAA',
	]

	return palette[value % (palette.length - 1)]
}

const UserReportsPage = () => {
	const numberOfItems = 4

	const [currentPage, setCurrentPage] = useState(1)

	const userExpenditureQuery = useQuery({
		queryKey: ['reports', 'user'],
		queryFn: async () => {
			const response = await axios.get<{
				expenditure: { name: string; value: number }[]
			}>(`/reports/categorized-expenditure`)
			return response.data
		},
		select: (data) => {
			return data.expenditure.map((category, index) => ({
				name: category.name,
				value: category.value,
				color: getCategoryColor(index),
			}))
		},
	})

	if (userExpenditureQuery.isPending) {
		return <div>Loading</div>
	}

	if (userExpenditureQuery.isError) {
		return <div>Error fetching data</div>
	}

	const totalAmount = userExpenditureQuery.data
		.map((category) => category.value)
		.reduce((sum, value) => sum + value)

	return (
		<CustomLoader
			query={userExpenditureQuery}
			errorMessage='Failed to fetch user expenditure report'
		>
			{(data) => (
				<div className='flex flex-col gap-2'>
					<h1>Expenditure Report</h1>
					<DonutChart
						withLabelsLine
						withLabels
						size={200}
						data={data}
						withTooltip
						tooltipDataSource='segment'
						mx='auto'
					/>
					{data
						.slice(
							(currentPage - 1) * numberOfItems,
							(currentPage - 1) * numberOfItems + numberOfItems,
						)
						.map((category, index) => (
							<ExpenditureItemCard
								key={index}
								name={category.name}
								amount={category.value}
								totalAmount={totalAmount}
								color={category.color}
							/>
						))}
					<div className='flex flex-col items-center'>
						<Pagination
							total={Math.ceil(data.length / numberOfItems)}
							value={currentPage}
							onChange={setCurrentPage}
							mt='sm'
						/>
					</div>
				</div>
			)}
		</CustomLoader>
	)
}

export default UserReportsPage
