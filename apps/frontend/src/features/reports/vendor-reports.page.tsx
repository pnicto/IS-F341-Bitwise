import { BarChart } from '@mantine/charts'
import { Button, Card, Group, Select, Stack } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
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
			fromDate: '',
			toDate: '',
		},
		validate: {
			fromDate: (value, values) => {
				if (value && !dayjs(value).isValid()) return 'Invalid start date'

				if (value && values.toDate && dayjs(value).isAfter(values.toDate))
					return 'Start date must be before end date'

				return null
			},
			toDate: (value, values) => {
				if (value && !dayjs(value).isValid()) return 'Invalid end date'

				if (value && values.fromDate && dayjs(value).isBefore(values.fromDate))
					return 'End date must be after start date'

				return null
			},
		},
		transformValues: (values) => ({
			fromDate: values.fromDate ? new Date(values.fromDate).toISOString() : '',
			toDate: values.toDate ? new Date(values.toDate).toISOString() : '',
		}),
		validateInputOnChange: true,
		clearInputErrorOnChange: false,
	})
	const filterFormValues = filterForm.values
	const filterFormTransformedValues = filterForm.getTransformedValues()

	const reportsQuery = useQuery({
		queryKey: [
			'reports',
			'vendor',
			{
				preset: filterFormValues.preset,
				fromDate: filterFormTransformedValues.fromDate,
				toDate: filterFormTransformedValues.toDate,
			},
		],
		queryFn: async () => {
			const response = await axios.get<VendorReport>(
				`/reports/vendor?preset=${filterFormValues.preset}&fromDate=${filterFormTransformedValues.fromDate}&toDate=${filterFormTransformedValues.toDate}`,
			)
			return response.data
		},
	})

	return (
		<>
			<Group justify='center' className='py-4'>
				<Select
					label='Range'
					defaultValue='month'
					data={[
						{ value: 'hour', label: 'Hour' },
						{ value: 'day', label: 'Day' },
						{ value: 'week', label: 'Week' },
						{ value: 'month', label: 'Month' },
						{ value: 'year', label: 'Year' },
						{ value: '', label: 'Auto' },
					]}
					allowDeselect={false}
					{...filterForm.getInputProps('preset')}
				/>
				<DateTimePicker
					{...filterForm.getInputProps('fromDate')}
					label='Start Date'
					placeholder='Start Date'
				/>
				<DateTimePicker
					{...filterForm.getInputProps('toDate')}
					label='End Date'
					placeholder='End Date'
				/>
				<Button onClick={filterForm.reset}>Clear Filters</Button>
			</Group>
			<CustomLoader
				query={reportsQuery}
				errorMessage='Failed to fetch vendor reports'
			>
				{(data) => (
					<>
						<Group justify='center'>
							<Stack gap={2}>
								<h2 className='py-0'>Current Period</h2>
								<Group>
									<Card>
										<h2>Total Income</h2>
										<p className='font-bold text-xl'>
											₹ {data.totalIncome.currentTotalIncome}
										</p>
									</Card>
									<Card>
										<h2>Unique Visitors Count</h2>
										<p className='font-bold text-xl'>
											{data.uniqueVisitorsCount.currentUniqueVisitorsCount}
										</p>
									</Card>
								</Group>
							</Stack>
							<Stack gap={2}>
								<h2 className='py-0'>Previous Period</h2>
								<Group>
									<Card>
										<h2>Total Income</h2>
										<p className='font-bold text-xl'>
											₹ {data.totalIncome.compareTotalIncome}
										</p>
									</Card>
									<Card>
										<h2>Unique Visitors Count</h2>
										<p className='font-bold text-xl'>
											{data.uniqueVisitorsCount.compareUniqueVisitorsCount}
										</p>
									</Card>
								</Group>
							</Stack>
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
