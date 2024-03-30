import { Badge, Button, Loader, Stack, Tabs } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { PaymentRequest } from '@prisma/client'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from '../../lib/axios'
import { handleAxiosErrors } from '../../notifications/utils'
import TransactionItemCard from '../../shared/transaction-item-card'

const PaymentRequests = () => {
	const paymentRequestsQuery = useQuery({
		queryKey: ['paymentRequests'],
		queryFn: async () => {
			const response = await axios.get<{
				incomingRequests: PaymentRequest[]
				outgoingRequests: PaymentRequest[]
			}>('/requests/all')
			return response.data
		},
		select: (data) => {
			const incomingRequests = data.incomingRequests.map((request) => ({
				...request,
				createdAt: new Date(request.createdAt),
			}))
			const outgoingRequests = data.outgoingRequests.map((request) => ({
				...request,
				createdAt: new Date(request.createdAt),
			}))
			return { incomingRequests, outgoingRequests }
		},
	})

	const respondMutation = useMutation({
		mutationFn: async ({
			id,
			response,
		}: {
			id: string
			response: 'accept' | 'reject'
		}) => {
			return axios.post<{ message: string }>(`/requests/respond/${id}`, {
				response,
			})
		},
		onSuccess: ({ data }) => {
			paymentRequestsQuery.refetch()
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	const cancelMutation = useMutation({
		mutationFn: async ({ id }: { id: string }) => {
			return axios.post(`/requests/cancel/${id}`)
		},
		onSuccess: ({ data }) => {
			paymentRequestsQuery.refetch()
			notifications.show({ message: data.message, color: 'green' })
		},
		onError: (error) => {
			handleAxiosErrors(error)
		},
	})

	const renderStatusBadge = (status: PaymentRequest['status']) => {
		switch (status) {
			case 'PENDING':
				return <Badge color='blue'>Pending</Badge>
			case 'COMPLETED':
				return <Badge color='green'>Completed</Badge>
			case 'REJECTED':
				return <Badge color='red'>Rejected</Badge>
			case 'CANCELLED':
				return <Badge color='red'>Cancelled</Badge>
			default:
				return null
		}
	}

	const renderActionButtons = (
		request: PaymentRequest,
		type: 'incoming' | 'outgoing',
	) => {
		switch (request.status) {
			case 'PENDING':
				if (type === 'incoming') {
					return (
						<>
							<Button
								color='green'
								onClick={() =>
									respondMutation.mutate({
										id: request.id,
										response: 'accept',
									})
								}
							>
								Pay
							</Button>
							<Button
								color='red'
								onClick={() =>
									respondMutation.mutate({
										id: request.id,
										response: 'reject',
									})
								}
							>
								Reject
							</Button>
						</>
					)
				} else {
					return (
						<Button
							color='red'
							onClick={() => cancelMutation.mutate({ id: request.id })}
						>
							Cancel
						</Button>
					)
				}
			default:
				return renderStatusBadge(request.status)
		}
	}

	if (paymentRequestsQuery.isPending) {
		return (
			// TODO: Extract this loader to a separate component and make it better
			<div className='text-center'>
				<Loader />
			</div>
		)
	}

	if (paymentRequestsQuery.isError) {
		// TODO: Replace with a better error component
		return <div>Error fetching user data</div>
	}

	return (
		<Tabs defaultValue='incoming'>
			<Tabs.List justify='center'>
				<Tabs.Tab value='incoming'>
					<p className='text-md font-bold'>Incoming Requests</p>
				</Tabs.Tab>
				<Tabs.Tab value='outgoing'>
					<p className='text-md font-bold'>Outgoing Requests</p>
				</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value='incoming'>
				{paymentRequestsQuery.data.incomingRequests.length === 0 ? (
					<h2 className='text-center mt-10'>No incoming requests</h2>
				) : (
					<Stack className='pt-5'>
						{paymentRequestsQuery.data.incomingRequests.map((request) => (
							<TransactionItemCard
								key={request.id}
								{...request}
								username={request.requesterUsername}
								bottomRight={<>{renderActionButtons(request, 'incoming')}</>}
							/>
						))}
					</Stack>
				)}
			</Tabs.Panel>
			<Tabs.Panel value='outgoing'>
				{paymentRequestsQuery.data.outgoingRequests.length === 0 ? (
					<h2 className='text-center mt-10'>No outgoing requests</h2>
				) : (
					<Stack className='pt-5'>
						{paymentRequestsQuery.data.outgoingRequests.map((request) => (
							<TransactionItemCard
								key={request.id}
								{...request}
								username={request.requesteeUsername}
								bottomRight={<>{renderActionButtons(request, 'outgoing')}</>}
							/>
						))}
					</Stack>
				)}
			</Tabs.Panel>
		</Tabs>
	)
}

export default PaymentRequests
