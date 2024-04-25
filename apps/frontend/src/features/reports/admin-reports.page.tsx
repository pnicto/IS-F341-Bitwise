import { LineChart, PieChart } from '@mantine/charts'
import { Button, Card, Collapse, Group, Select, Stack } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import axios from '../../lib/axios'
import CustomLoader from '../../shared/loader'
import { getCategoryColor } from './utils'

type AdminReport = {
	uniqueVisitorsCount: {
		currentVendorUniqueVisitorsCount: number
		compareVendorUniqueVisitorsCount: number
		currentTotalUniqueVisitorsCount: number
		compareTotalUniqueVisitorsCount: number
	}
	income: {
		currentVendorIncome: number
		compareVendorIncome: number
		currentTotalIncome: number
		compareTotalIncome: number
	}
	shopCount: number
	disabledCount: number
	productsByCategory: {
		_count: number
		categoryName: string
	}[]
	activeUserCount: number
	cashFlow: {
		_id: string
		total: number
	}[]
}

const AdminReportsPage = () => {
	const shopsQuery = useQuery({
		queryKey: ['shops'],
		queryFn: async () => {
			const response = await axios.get<{ shops: { shopName: string }[] }>(
				'/shops',
			)
			return response.data
		},
		select: (data) => {
			return [
				{ value: '', label: 'All' },
				...data.shops.map((shop) => ({
					value: shop.shopName,
					label: shop.shopName,
				})),
			]
		},
	})

	const [KPIsIsOpen, { toggle: KPIsToggle }] = useDisclosure(true)

	const filterForm = useForm({
		initialValues: {
			preset: 'month',
			fromDate: '',
			toDate: '',
			shopName: shopsQuery.data?.[0].value ?? '',
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
	})
	const filterFormValues = filterForm.values
	const filterFormTransformedValues = filterForm.getTransformedValues()

	const reportsQuery = useQuery({
		queryKey: [
			'reports',
			'admin',
			{
				preset: filterFormValues.preset,
				fromDate: filterFormTransformedValues.fromDate,
				toDate: filterFormTransformedValues.toDate,
				shopName: filterFormValues.shopName,
			},
		],
		queryFn: async () => {
			const response = await axios.get<AdminReport>(
				`/reports/admin?preset=${filterFormValues.preset}&fromDate=${filterFormTransformedValues.fromDate}&toDate=${filterFormTransformedValues.toDate}&shopName=${filterFormValues.shopName}`,
			)
			return response.data
		},
		select: (data) => {
			const productsByCategory = data.productsByCategory.map(
				({ categoryName, _count }, idx) => ({
					name: categoryName,
					value: _count,
					color: getCategoryColor(idx),
				}),
			)

			return { ...data, productsByCategory }
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
				<Select
					label='Shop'
					placeholder={shopsQuery.isPending ? 'Loading...' : 'Select Shop'}
					data={shopsQuery.data}
					{...filterForm.getInputProps('shopName')}
					allowDeselect={false}
					disabled={shopsQuery.isPending}
				/>
				<Button onClick={filterForm.reset}>Clear Filters</Button>
				<Button onClick={KPIsToggle}>
					{KPIsIsOpen ? 'Hide' : 'Show'} KPIs
				</Button>
			</Group>

			<CustomLoader
				query={reportsQuery}
				errorMessage='Failed to fetch admin reports'
			>
				{(data) => (
					<Stack>
						<Collapse in={KPIsIsOpen}>
							<Group justify='center'>
								<Card className='text-center'>
									<h2>Total Shop Count</h2>
									<p className='font-bold text-xl'>{data.shopCount}</p>
								</Card>
								<Card className='text-center'>
									<h2>Active User Count</h2>
									<p className='font-bold text-xl'>{data.activeUserCount}</p>
								</Card>
								<Card className='text-center'>
									<h2>Disabled Count</h2>
									<p className='font-bold text-xl'>{data.disabledCount}</p>
								</Card>
							</Group>
							<h2>Overall Summary</h2>
							<Group justify='center'>
								<Stack>
									<h2 className='py-0 capitalize'>
										Current{' '}
										{filterFormValues.preset === ''
											? 'Period'
											: filterFormValues.preset}
									</h2>
									<Group>
										<Card className='text-center'>
											<h2>Total Revenue</h2>
											<p className='font-bold text-xl'>
												₹ {data.income.currentTotalIncome}
											</p>
										</Card>
										<Card className='text-center'>
											<h2>Unique Visitors</h2>
											<p className='font-bold text-xl'>
												{
													data.uniqueVisitorsCount
														.currentTotalUniqueVisitorsCount
												}
											</p>
										</Card>
									</Group>
								</Stack>
								<Stack>
									<h2 className='py-0 capitalize'>
										Last{' '}
										{filterFormValues.preset === ''
											? 'Period'
											: filterFormValues.preset}
									</h2>
									<Group>
										<Card className='text-center'>
											<h2>Total Revenue</h2>
											<p className='font-bold text-xl'>
												₹ {data.income.compareTotalIncome}
											</p>
										</Card>
										<Card className='text-center'>
											<h2>Unique Visitors</h2>
											<p className='font-bold text-xl'>
												{
													data.uniqueVisitorsCount
														.compareTotalUniqueVisitorsCount
												}
											</p>
										</Card>
									</Group>
								</Stack>
							</Group>
							{filterFormValues.shopName !== '' && (
								<>
									<h2>Vendor Summary</h2>
									<Group justify='center'>
										<Stack>
											<h2 className='py-0 capitalize'>
												Current{' '}
												{filterFormValues.preset === ''
													? 'Period'
													: filterFormValues.preset}
											</h2>
											<Group>
												<Card className='text-center'>
													<h2>Total Revenue</h2>
													<p className='font-bold text-xl'>
														₹ {data.income.currentVendorIncome}
													</p>
												</Card>
												<Card className='text-center'>
													<h2>Unique Visitors</h2>
													<p className='font-bold text-xl'>
														{
															data.uniqueVisitorsCount
																.currentVendorUniqueVisitorsCount
														}
													</p>
												</Card>
											</Group>
										</Stack>
										<Stack>
											<h2 className='py-0 capitalize'>
												Last{' '}
												{filterFormValues.preset === ''
													? 'Period'
													: filterFormValues.preset}
											</h2>
											<Group>
												<Card className='text-center'>
													<h2>Total Revenue</h2>
													<p className='font-bold text-xl'>
														₹ {data.income.compareVendorIncome}
													</p>
												</Card>
												<Card className='text-center'>
													<h2>Unique Visitors</h2>
													<p className='font-bold text-xl'>
														{
															data.uniqueVisitorsCount
																.compareVendorUniqueVisitorsCount
														}
													</p>
												</Card>
											</Group>
										</Stack>
									</Group>
								</>
							)}
						</Collapse>
						<div>
							<h2>Product Count by Category</h2>
							<PieChart
								data={data.productsByCategory}
								size={300}
								mx='auto'
								withLabels
								withLabelsLine={false}
								withTooltip
								tooltipDataSource='segment'
							/>
						</div>

						<div>
							<h2>Cashflow in the selected period</h2>
							<LineChart
								data={data.cashFlow}
								dataKey='_id'
								series={[{ name: 'total', color: 'blue' }]}
								h={300}
							/>
						</div>
					</Stack>
				)}
			</CustomLoader>
		</>
	)
}

export default AdminReportsPage
