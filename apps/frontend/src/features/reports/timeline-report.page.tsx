import { Icon } from '@iconify/react'
import { LineChart } from '@mantine/charts'
import { Card, Group, Stack } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
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

const TimelineReportPage = () => {
	const reportsQuery = useQuery({
		queryKey: ['reports'],
		queryFn: async () => {
			const response = await axios.get<TimelineReport>(`/reports/timeline`)
			return response.data
		},
	})

	return (
		<CustomLoader query={reportsQuery} errorMessage='Failed to fetch reports'>
			{(data) => (
				<>
					<Group justify='center'>
						<Stack gap={2}>
							<h2 className='py-0 capitalize'>Current month</h2>
							<Group>
								<Card>
									<h2>Amount sent</h2>
									<p className='font-bold text-xl'>₹ {data.current.sent}</p>
								</Card>
								<Card>
									<h2>Amount received</h2>
									<p className='font-bold text-xl'>₹ {data.current.received}</p>
								</Card>
							</Group>
						</Stack>
						<Stack gap={2}>
							<h2 className='py-0 capitalize'>Previous Month</h2>
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
					></LineChart>
					<div className='pt-8 flex flex-row justify-end'>
						<Card
							component={Link}
							to='/reports/expenditure'
							className='flex flex-col items-center gap-3 justify-center'
						>
							<span className='text-3xl'>
								<Icon icon='lucide:pie-chart' />
							</span>
							<h2>Expenditure Report</h2>
						</Card>
					</div>
				</>
			)}
		</CustomLoader>
	)
}

export default TimelineReportPage
