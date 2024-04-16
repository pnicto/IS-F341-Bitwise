import { BarChart } from '@mantine/charts'
import { Card, Group, Select } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useQuery } from '@tanstack/react-query'
import axios from '../../lib/axios'
import CustomLoader from '../../shared/loader'

type VendorReport = {
	totalIncome: {
		currentTotalIncome: number
		compareTotalIncome: number
	}
	uniqueVisitorsCount: {
		currentUniqueVisitorsCount: number
		compareUniqueVisitorsCount: number
	}
	intervalData: {
		uniqueVisitorsCount: number
		totalIncome: number
		label: string
	}[]
}

const VendorReportsPage = () => {
	const filterForm = useForm({
		initialValues: {
			preset: 'month',
		},
	})
	const filterFormValues = filterForm.values
	const reportsQuery = useQuery({
		queryKey: [
			'reports',
			'vendor',
			{
				preset: filterFormValues.preset,
			},
		],
		queryFn: async () => {
			const response = await axios.get<VendorReport>(
				`/reports/vendor?preset=${filterFormValues.preset}`,
			)
			return response.data
		},
	})

	return (
		<>
			<Group>
				<Select
					label='Range'
					defaultValue='month'
					data={[
						{ value: 'day', label: 'Today' },
						{ value: 'week', label: 'Week' },
						{ value: 'month', label: 'Month' },
						{ value: 'year', label: 'Year' },
					]}
					allowDeselect={false}
					{...filterForm.getInputProps('preset')}
				/>
			</Group>
			<CustomLoader
				query={reportsQuery}
				errorMessage='Failed to fetch vendor reports'
			>
				{(data) => (
					<>
						<Group justify='center'>
							<Card>
								<h2>Total Income</h2>
								<p>Current: {data.totalIncome.currentTotalIncome}</p>
								<p>Past: {data.totalIncome.compareTotalIncome}</p>
							</Card>
							<Card>
								<h2>Unique Visitors Count</h2>
								<p>
									Current: {data.uniqueVisitorsCount.currentUniqueVisitorsCount}
								</p>
								<p>
									Past: {data.uniqueVisitorsCount.compareUniqueVisitorsCount}
								</p>
							</Card>
						</Group>

						<h2>Total Income</h2>
						<BarChart
							h={300}
							data={data.intervalData}
							dataKey='label'
							yAxisProps={{ width: 80 }}
							series={[
								{
									name: 'totalIncome',
									color: 'blue',
									label: 'Total Income',
								},
							]}
							barChartProps={{ syncId: 'reports' }}
						/>
						<h2>Unique Visitors Count</h2>
						<BarChart
							h={300}
							data={data.intervalData}
							dataKey='label'
							yAxisProps={{ width: 80 }}
							series={[
								{
									name: 'uniqueVisitorsCount',
									color: 'orange',
									label: 'Unique Visitors Count',
								},
							]}
							barChartProps={{ syncId: 'reports' }}
						/>
					</>
				)}
			</CustomLoader>
		</>
	)
}

export default VendorReportsPage
