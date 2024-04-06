import { Loader } from '@mantine/core'
import { UseQueryResult } from '@tanstack/react-query'

type Props<T> = {
	children: (data: T) => React.ReactNode
	errorComponent: string
	query: UseQueryResult<T, unknown>
}

const CustomLoader = <T,>({
	children: component,
	errorComponent,
	query,
}: Props<T>) => {
	if (query.isError)
		return (
			<div className='flex flex-col items-center justify-center text-center'>
				<h1 className='text-2xl font-bold text-gray-800'>{errorComponent}</h1>
				<p className='text-lg text-gray-600'>
					We couldn't fetch the data you requested. Please try again later.
				</p>
				<img
					src='/undraw_blank_canvas.svg'
					alt='lost'
					className='md:max-w-xl md:max-h-[30rem]'
				/>
			</div>
		)

	if (query.isPending)
		return (
			<div className='text-center'>
				<Loader />
			</div>
		)

	return component(query.data)
}

export default CustomLoader
