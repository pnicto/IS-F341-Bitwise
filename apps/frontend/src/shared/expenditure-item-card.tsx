import { Badge, Card, Progress } from '@mantine/core'

type Props = {
	name: string
	amount: number
	totalAmount: number
	color: string
}

const ExpenditureItemCard = ({ name, amount, totalAmount, color }: Props) => {
	return (
		<Card>
			<div className='flex flex-col'>
				<div className='flex flex-row justify-between'>
					<Badge>{name}</Badge>
					<p>₹ {amount}</p>
				</div>
				<div className='flex flex-row justify-between'>
					<Progress
						value={amount / totalAmount}
						size='lg'
						transitionDuration={200}
						color={color}
					/>
					<p>{amount / totalAmount}%</p>
				</div>
			</div>
		</Card>
	)
}

export default ExpenditureItemCard
