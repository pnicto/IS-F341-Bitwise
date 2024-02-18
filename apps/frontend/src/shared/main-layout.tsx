// This is a test main layout
import { NavLink, Outlet } from 'react-router-dom'

const MainLayout = () => {
	return (
		<div>
			<nav>
				<NavLink to='/'>Home</NavLink>
				<NavLink to='/login'>Login</NavLink>
				<NavLink to='/logout'>Logout</NavLink>
				<NavLink to='/dashboard/admin/create'>Create</NavLink>
			</nav>
			<Outlet />
		</div>
	)
}

export default MainLayout
