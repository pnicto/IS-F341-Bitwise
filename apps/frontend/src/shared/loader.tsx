import { Loader } from '@mantine/core'
import { UseQueryResult } from '@tanstack/react-query'

type Props<T> = {
	children: (data: T) => React.ReactNode
	errorComponent: React.ReactNode
	query: UseQueryResult<T, unknown>
}

const CustomLoader = <T,>({
	children: component,
	errorComponent,
	query,
}: Props<T>) => {
	if (query.isError) return errorComponent

	if (query.isPending)
		return (
			<div className='text-center'>
				<Loader />
			</div>
		)

	return component(query.data)
}

export default CustomLoader
