// This is a test main layout
import { NavLink, Outlet } from 'react-router-dom'

const MainLayout = () => {
	return (
		<div>
			<nav>
				<NavLink to='/'>Home</NavLink>
				<NavLink to='/login'>Login</NavLink>
				<NavLink to='/logout'>Logout</NavLink>
				<NavLink to='/products'>Products</NavLink>
				<NavLink to='/admin/add-student'>Create</NavLink>
				<NavLink to='/catalogue/add-product'>NewProduct</NavLink>
			</nav>
			<Outlet />
		</div>
	)
}

export default MainLayout
