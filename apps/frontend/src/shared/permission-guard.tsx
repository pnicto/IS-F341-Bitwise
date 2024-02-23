import { Button } from '@mantine/core'
import { Role, User } from '@prisma/client'
import { Outlet, useNavigate, useRouteLoaderData } from 'react-router-dom'

type Props = { permissions: Role[] }

type RouteLoaderData = {
	msg: string
	user: User
}

const PermissionGuard = ({ permissions }: Props) => {
	const {
		user: { role },
	} = useRouteLoaderData('protected-layout') as RouteLoaderData
	const navigate = useNavigate()

	// TODO: Replace the div with something good
	return permissions.includes(role) ? (
		<Outlet />
	) : (
		<>
			<div>Forbidden</div>
			<Button onClick={() => navigate(-1)}>Go Back</Button>
		</>
	)
}

export default PermissionGuard
