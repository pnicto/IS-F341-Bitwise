import { notifications } from '@mantine/notifications'
import { AxiosError } from 'axios'

export type APIErrors = { msg: string }[]

export function notifyErrors(errors: APIErrors) {
	errors.forEach((error) => {
		notifications.show({
			message: error.msg,
			color: 'red',
		})
	})
}

export function handleAxiosErrors(error: unknown) {
	if (error instanceof AxiosError) {
		if (error.response && error.response.data)
			notifyErrors(error.response.data.errors)
		else notifications.show({ message: error.message, color: 'red' })
	}
}
