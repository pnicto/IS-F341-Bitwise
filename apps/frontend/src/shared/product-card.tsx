import { Badge, Card, Grid, Group, Image, Stack } from '@mantine/core'
import { Product, User } from '@prisma/client'
import { ReactNode } from 'react'

type Props = Product & {
	showVendorDetails?: boolean
	vendor?: Pick<User, 'mobile' | 'username'>
	allowEdit?: boolean
	editComponent?: ReactNode
	deleteComponent?: ReactNode
}

const ProductCard = ({
	id,
	name,
	description,
	price,
	categoryName,
	vendor,
	showVendorDetails = false,
	allowEdit = false,
	editComponent,
	deleteComponent,
	imageId,
	imagePath,
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
						<p>Price: ₹ {price}</p>
						{categoryName && <Badge>{categoryName}</Badge>}
					</Grid.Col>
				</Grid>
				<p>{description}</p>
				<Image
					src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${imagePath}`}
					fallbackSrc='/fallbackProductImage.png'
				/>
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
