import { PieChart } from '@mantine/charts'
import { useQuery } from '@tanstack/react-query'
import axios from '../../lib/axios'
import CustomLoader from '../../shared/loader'

const getColors = (value: number) => {
	const pallet = [
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

	return pallet[value % (pallet.length - 1)]
}

const UserReportsPage = () => {
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
				color: getColors(index),
			}))
		},
	})

	if (userExpenditureQuery.isPending) {
		return <div>Loading</div>
	}

	if (userExpenditureQuery.isError) {
		return <div>Error fetching data</div>
	}

	return (
		<CustomLoader
			query={userExpenditureQuery}
			errorMessage='Failed to fetch user expenditure report'
		>
			{(data) => (
				<>
					<h1>Expenditure Report</h1>
					<PieChart
						withLabelsLine
						labelsPosition='outside'
						labelsType='percent'
						withLabels
						size={200}
						data={data}
						withTooltip
						tooltipDataSource='segment'
						mx='auto'
					/>
				</>
			)}
		</CustomLoader>
	)
}

export default UserReportsPage
