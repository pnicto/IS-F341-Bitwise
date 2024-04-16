import { BarChart } from '@mantine/charts'
import { Card, Group } from '@mantine/core'
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
	const reportsQuery = useQuery({
		queryKey: ['reports', 'vendor'],
		queryFn: async () => {
			const response = await axios.get<VendorReport>(
				'/reports/vendor?preset=year',
			)
			return response.data
		},
	})

	console.log(reportsQuery.data?.intervalData)

	return (
		<CustomLoader
			query={reportsQuery}
			errorMessage='Failed to fetch vendor reports'
		>
			{(data) => (
				<>
					<h1>Vendor Reports</h1>

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
							<p>Past: {data.uniqueVisitorsCount.compareUniqueVisitorsCount}</p>
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
	)
}

export default VendorReportsPage
