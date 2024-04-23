import { Loader } from '@mantine/core'
import { UseQueryResult } from '@tanstack/react-query'
import { AxiosError } from 'axios'

type Props<T> = {
	children: (data: T) => React.ReactNode
	errorMessage: string
	query: UseQueryResult<T, unknown>
	arrayKey?: keyof T
	emptyMessage?: string | ((data: T) => string)
}

const CustomLoader = <T,>({
	children,
	errorMessage,
	query,
	arrayKey,
	emptyMessage = "Hmm... It seems there's nothing to show here.",
}: Props<T>) => {
	if (query.isError || query.failureReason) {
		const errors: { msg: string }[] = []
		const requestError = query.isError ? query.error : query.failureReason
		if (requestError instanceof AxiosError) {
			if (requestError.response && requestError.response.data.errors)
				errors.push(...requestError.response.data.errors)
			else errors.push({ msg: requestError.message })
		}

		return (
			<div className='flex flex-col items-center justify-center text-center'>
				<p className='text-2xl font-bold text-gray-800'>{errorMessage}</p>
				{errors.length > 0 && (
					<>
						<p className='text-xl font-bold text-gray-800'>
							Here's a list of errors
						</p>
						{errors.map((err, i) => (
							<p key={i} className='text-lg font-bold text-gray-800'>
								{i + 1}. {err.msg}
							</p>
						))}
					</>
				)}
				<p className='text-lg text-gray-600'>
					We couldn't fetch the data you requested. Please try again later.
				</p>
				<img
					src='/undraw_blank_canvas.svg'
					alt='blank canvas'
					className='md:max-w-xl md:max-h-[30rem]'
				/>
			</div>
		)
	}

	if (query.isPending)
		return (
			<div className='text-center'>
				<Loader />
			</div>
		)

	// if arrayKey is given then check if the array is empty to show a default message
	// first we check if the query.data is an object and not null explicitly as null is an object too
	// then we check if the arrayKey gives us an array from the data object
	if (arrayKey && typeof query.data === 'object' && query.data !== null) {
		const expectedArray = query.data[arrayKey]
		if (Array.isArray(expectedArray) && expectedArray.length === 0) {
			return (
				<div className='flex flex-col items-center justify-center text-center gap-6'>
					<p className='text-2xl font-bold text-gray-800'>
						{typeof emptyMessage === 'function'
							? emptyMessage(query.data)
							: emptyMessage}
					</p>
					<img
						src='/undraw_empty.svg'
						alt='lost'
						className='md:max-w-xl md:max-h-[30rem]'
					/>
				</div>
			)
		}
	}

	return children(query.data)
}

export default CustomLoader
