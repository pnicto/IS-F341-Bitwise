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
					<Badge color={color}>{name}</Badge>
					<p className='font-bold text-red-400'>₹ {amount}</p>
				</div>
				<div className='flex flex-row justify-between items-center lg:gap-16 gap-8'>
					<Progress.Root
						className='flex-grow'
						size='md'
						transitionDuration={200}
					>
						<Progress.Section
							value={Math.round((amount / totalAmount) * 100)}
							color={color}
						/>
					</Progress.Root>
					<p className='font-bold'>
						{Math.round((amount / totalAmount) * 100)}%
					</p>
				</div>
			</div>
		</Card>
	)
}

export default ExpenditureItemCard
