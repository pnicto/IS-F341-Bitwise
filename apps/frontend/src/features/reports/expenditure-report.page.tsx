import { DonutChart } from '@mantine/charts'
import { Button, Group, Pagination, Select } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useState } from 'react'
import axios from '../../lib/axios'
import CustomLoader from '../../shared/loader'
import ExpenditureItemCard from './expenditure-item-card'
import { getCategoryColor } from './utils'

const ExpenditureReportsPage = () => {
	const numberOfItems = 4

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
	})
	const filterFormValues = filterForm.values
	const filterFormTransformedValues = filterForm.getTransformedValues()

	const [currentPage, setCurrentPage] = useState(1)

	const userExpenditureQuery = useQuery({
		queryKey: [
			'reports',
			'user',
			{
				preset: filterFormValues.preset,
				fromDate: filterFormTransformedValues.fromDate,
				toDate: filterFormTransformedValues.toDate,
			},
		],
		queryFn: async () => {
			const response = await axios.get<{
				startDate: string
				endDate: string
				expenditure: { name: string; value: number }[]
			}>(
				`/reports/categorized-expenditure?preset=${filterFormValues.preset}&fromDate=${filterFormTransformedValues.fromDate}&toDate=${filterFormTransformedValues.toDate}`,
			)
			return response.data
		},
		select: (data) => {
			return {
				startDate: new Date(data.startDate),
				endDate: new Date(data.endDate),
				expenditure: data.expenditure.map((category, index) => ({
					name: category.name,
					value: category.value,
					color: getCategoryColor(index),
				})),
			}
		},
	})

	return (
		<div className='flex flex-col gap-2'>
			<h1>Expenditure Report</h1>
			<Group justify='center' className='py-4'>
				<Select
					label='Range'
					defaultValue='month'
					data={[
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
				query={userExpenditureQuery}
				errorMessage='Failed to fetch user expenditure report'
				arrayKey='expenditure'
				emptyMessage={(data) =>
					`No expenditure data found for ${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}`
				}
			>
				{(data) => {
					const totalAmount = data.expenditure.reduce(
						(acc, current) => acc + current.value,
						0,
					)

					return (
						<div className='flex flex-col gap-2'>
							<div className='flex flex-row items-center'>
								<DonutChart
									withLabelsLine
									withLabels
									size={200}
									data={data.expenditure}
									withTooltip
									tooltipDataSource='segment'
									w={400}
									mx='auto'
								/>
							</div>
							<h2>
								{data.startDate.toLocaleDateString()} -{' '}
								{data.endDate.toLocaleDateString()}
							</h2>
							{data.expenditure
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
									total={Math.ceil(data.expenditure.length / numberOfItems)}
									value={currentPage}
									onChange={setCurrentPage}
									mt='sm'
								/>
							</div>
						</div>
					)
				}}
			</CustomLoader>
		</div>
	)
}

export default ExpenditureReportsPage
