import { Role, User } from '@prisma/client'
import { Outlet, useRouteLoaderData } from 'react-router-dom'

type Props = { permissions: Role[] }

type RouteLoaderData = {
	msg: string
	user: Pick<User, 'id' | 'email' | 'role'>
}

const PermissionGuard = ({ permissions }: Props) => {
	const {
		user: { role },
	} = useRouteLoaderData('protected-layout') as RouteLoaderData
	console.log(role)

	// TODO: Replace the div with something meaningful
	return permissions.includes(role) ? <Outlet /> : <div>Stop snooping</div>
}

export default PermissionGuard
