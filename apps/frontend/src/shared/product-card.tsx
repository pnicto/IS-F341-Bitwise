import { Badge, Card, Grid, Group, Stack } from '@mantine/core'
import { Product, User } from '@prisma/client'
import { ReactNode } from 'react'

type Props = Product & {
	showVendorDetails?: boolean
	vendor?: User
	allowEdit?: boolean
	editComponent?: ReactNode
	deleteComponent?: ReactNode
	category: string
}

const ProductCard = ({
	id,
	name,
	description,
	price,
	category,
	vendor,
	showVendorDetails = false,
	allowEdit = false,
	editComponent,
	deleteComponent,
}: Props) => {
	return (
		// TODO: show image
		<Card>
			<Stack>
				{/* TODO: is a grid really needed here? */}
				<Grid columns={10}>
					<Grid.Col span='auto'>
						<p className='text-2xl font-bold'>{name}</p>
					</Grid.Col>
					<Grid.Col span={'content'}>
						<p>Price: {price} ₹</p>
						<Badge>{category}</Badge>
					</Grid.Col>
				</Grid>
				<p>{description}</p>

				{vendor && showVendorDetails && (
					<Group>
						<p>Sold by: {vendor.username}</p>
						<p>Contact: {vendor.mobile}</p>
					</Group>
				)}

				{allowEdit && (
					<Group justify='space-evenly'>
						{editComponent}
						{deleteComponent}
					</Group>
				)}
			</Stack>
		</Card>
	)
}

export default ProductCard
