import { LineChart } from '@mantine/charts'
import {
	Button,
	Card,
	ComboboxItem,
	Group,
	OptionsFilter,
	Select,
	Stack,
	TagsInput,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { User } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import axios from '../../lib/axios'
import CustomLoader from '../../shared/loader'

type TimelineReport = {
	timeline: {
		label: string
		sentAmount: number
		receivedAmount: number
	}[]
	current: {
		sent: number
		received: number
	}
	previous: {
		sent: number
		received: number
	}
}

const optionsFilter: OptionsFilter = ({ options, search }) => {
	const splittedSearch = search.toLowerCase().trim().split(' ')
	return (options as ComboboxItem[]).filter((option) => {
		const words = option.label.toLowerCase().trim().split(' ')
		return splittedSearch.every((searchWord) =>
			words.some((word) => word.includes(searchWord)),
		)
	})
}

const TimelineReportPage = () => {
	const filterForm = useForm({
		initialValues: {
			preset: 'month',
			fromDate: '',
			toDate: '',
			tags: [],
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
			{
				preset: filterFormValues.preset,
				fromDate: filterFormTransformedValues.fromDate,
				toDate: filterFormTransformedValues.toDate,
				tags: filterFormValues.tags,
			},
		],
		queryFn: async () => {
			let tagString = ''

			filterFormValues.tags.forEach((tag) => {
				tagString += `&tags[]=${tag}`
			})

			const response = await axios.get<TimelineReport>(
				`/reports/timeline?preset=${filterFormValues.preset}&fromDate=${filterFormTransformedValues.fromDate}&toDate=${filterFormTransformedValues.toDate}${tagString}`,
			)
			return response.data
		},
	})

	const userQuery = useQuery({
		queryKey: ['user'],
		queryFn: async () => {
			const response = await axios.get<{ user: User }>('/user/details')
			return response.data
		},
	})

	return (
		<>
			<div className='pb-8 flex flex-row justify-end'>
				<Button
					component={Link}
					to='/reports/expenditure'
					className='flex flex-col items-center gap-3 justify-center'
				>
					<h2>Expenditure Report</h2>
				</Button>
			</div>
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
				<CustomLoader
					errorMessage={"Couldn't get your tags"}
					query={userQuery}
					displayImage={false}
				>
					{(data) => (
						<TagsInput
							label='Select Tags'
							placeholder='Pick value or enter anything'
							data={data.user.tags}
							filter={optionsFilter}
							comboboxProps={{
								transitionProps: { transition: 'pop', duration: 200 },
							}}
							{...filterForm.getInputProps('tags')}
							clearable
						/>
					)}
				</CustomLoader>
				<Button onClick={filterForm.reset}>Clear Filters</Button>
			</Group>
			<CustomLoader query={reportsQuery} errorMessage='Failed to fetch reports'>
				{(data) => (
					<>
						<Group justify='center'>
							<Stack gap={2}>
								<h2 className='py-0 capitalize'>
									Current{' '}
									{filterFormValues.preset === ''
										? 'Period'
										: filterFormValues.preset}
								</h2>
								<Group>
									<Card>
										<h2>Amount sent</h2>
										<p className='font-bold text-xl'>₹ {data.current.sent}</p>
									</Card>
									<Card>
										<h2>Amount received</h2>
										<p className='font-bold text-xl'>
											₹ {data.current.received}
										</p>
									</Card>
								</Group>
							</Stack>
							<Stack gap={2}>
								<h2 className='py-0 capitalize'>
									Previous{' '}
									{filterFormValues.preset === ''
										? 'Period'
										: filterFormValues.preset}
								</h2>
								<Group>
									<Card>
										<h2>Amount sent</h2>
										<p className='font-bold text-xl'>₹ {data.previous.sent}</p>
									</Card>
									<Card>
										<h2>Amount received</h2>
										<p className='font-bold text-xl'>
											₹ {data.previous.received}
										</p>
									</Card>
								</Group>
							</Stack>
						</Group>

						<h2 className='pt-8'>Cash Flow</h2>
						<LineChart
							data={data.timeline}
							dataKey='label'
							series={[
								{
									name: 'receivedAmount',
									color: 'green',
									label: 'Amount Received',
								},
								{ name: 'sentAmount', color: 'red', label: 'Amount Sent' },
							]}
							h={300}
						/>
					</>
				)}
			</CustomLoader>
		</>
	)
}

export default TimelineReportPage
