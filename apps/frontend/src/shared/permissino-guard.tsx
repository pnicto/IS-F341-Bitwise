import { Role, User } from '@prisma/client'
import { Outlet, useRouteLoaderData } from 'react-router-dom'

type Props = { permission: Role }

type RouteLoaderData = {
	msg: string
	user: Pick<User, 'id' | 'email' | 'role'>
}

const PermissionGuard = ({ permission }: Props) => {
	const {
		user: { role },
	} = useRouteLoaderData('protected-layout') as RouteLoaderData

	return (
		<>
			<div>RoleGuard</div>
			{role === permission ? <Outlet /> : <div>Stop snooping</div>}
		</>
	)
}

export default PermissionGuard
