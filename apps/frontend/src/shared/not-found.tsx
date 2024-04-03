import { Button } from '@mantine/core'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
	const navigate = useNavigate()
	return (
		<div className='flex flex-col items-center gap-4 justify-center text-center'>
			<h1 className='text-3xl font-bold text-gray-800'>
				Oops! You're Lost in the Digital Woods
			</h1>
			<img src='/undraw_lost.svg' alt='lost' className='md:max-w-2xl' />
			<p className='text-lg text-gray-600'>
				Looks like you've stumbled upon a page that doesn't exist. But don't
				worry, we'll help you find your way back!
			</p>
			<Button onClick={() => navigate('/login', { replace: true })}>
				Return Home
			</Button>
		</div>
	)
}

export default NotFound
