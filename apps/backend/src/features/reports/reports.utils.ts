import { Transaction } from '@prisma/client'
import dayjs, { ManipulateType } from 'dayjs'

export const getTimeIntervals = (
	startDate: Date,
	endDate: Date,
	intervalUnit: ManipulateType,
) => {
	const intervals = []
	let currentIntervalStart = dayjs(startDate).startOf('day')
	const end = dayjs(endDate)

	while (currentIntervalStart.isBefore(end)) {
		const currentIntervalEnd = currentIntervalStart.clone().endOf(intervalUnit)
		intervals.push([currentIntervalStart.toDate(), currentIntervalEnd.toDate()])
		currentIntervalStart = currentIntervalEnd
			.add(1, intervalUnit)
			.startOf(intervalUnit)
	}

	if (currentIntervalStart.isBefore(endDate)) {
		intervals.push([currentIntervalStart.toDate(), end.toDate()])
	}

	return intervals
}

export const calculateVendorDataForInterval = (
	transactions: Transaction[],
	interval: Date[],
) => {
	let label: string
	const [startDate, endDate] = interval
	const startDay = dayjs(startDate)
	const endDay = dayjs(endDate)
	const diffDays = endDay.diff(startDay, 'day') + 1
	const diffHours = endDay.diff(startDay, 'hour')

	if (diffDays >= 28) {
		label = startDay.format('MMMM')
	} else if (diffDays >= 2) {
		label = startDay.format('DD/MM')
	} else if (diffDays === 1 && diffHours > 1) {
		label = startDay.format('dddd')
	} else {
		label = startDay.format('HH:mm')
	}

	const filteredTransactions = transactions.filter(
		(transaction) =>
			transaction.createdAt >= startDate && transaction.createdAt <= endDate,
	)

	const uniqueVisitors = new Set()
	let totalIncome = 0

	filteredTransactions.forEach((transaction) => {
		uniqueVisitors.add(transaction.senderUsername)
		totalIncome += transaction.amount
	})

	return {
		uniqueVisitorsCount: uniqueVisitors.size,
		totalIncome,
		label,
	}
}

export const getStartAndEndDates = (preset: string) => {
	const currentDate = dayjs()
	switch (preset) {
		case 'hour': {
			const startDate = currentDate.startOf('hour').toDate()
			const endDate = currentDate.endOf('hour').toDate()
			return {
				startDate,
				endDate,
				compareStartDate: currentDate
					.subtract(1, 'hour')
					.startOf('hour')
					.toDate(),
				compareEndDate: currentDate.subtract(1, 'hour').endOf('hour').toDate(),
				intervals: getTimeIntervals(startDate, endDate, 'minute'),
			}
		}
		case 'day': {
			const startDate = currentDate.startOf('day').toDate()
			const endDate = currentDate.endOf('day').toDate()
			return {
				startDate,
				endDate,
				compareStartDate: currentDate
					.subtract(1, 'day')
					.startOf('day')
					.toDate(),
				compareEndDate: currentDate.subtract(1, 'day').endOf('day').toDate(),
				intervals: getTimeIntervals(startDate, endDate, 'hour'),
			}
		}
		case 'week': {
			const startDate = currentDate.startOf('week').toDate()
			const endDate = currentDate.endOf('week').toDate()
			return {
				startDate,
				endDate,
				compareStartDate: currentDate
					.subtract(1, 'week')
					.startOf('week')
					.toDate(),
				compareEndDate: currentDate.subtract(1, 'week').endOf('week').toDate(),
				intervals: getTimeIntervals(startDate, endDate, 'day'),
			}
		}
		case 'month': {
			const startDate = currentDate.startOf('month').toDate()
			const endDate = currentDate.endOf('month').toDate()
			return {
				startDate,
				endDate,
				compareStartDate: currentDate
					.subtract(1, 'month')
					.startOf('month')
					.toDate(),
				compareEndDate: currentDate
					.subtract(1, 'month')
					.endOf('month')
					.toDate(),
				intervals: getTimeIntervals(startDate, endDate, 'week'),
			}
		}
		case 'year': {
			const startDate = currentDate.startOf('year').toDate()
			const endDate = currentDate.endOf('year').toDate()
			return {
				startDate,
				endDate,
				compareStartDate: currentDate
					.subtract(1, 'year')
					.startOf('year')
					.toDate(),
				compareEndDate: currentDate.subtract(1, 'year').endOf('year').toDate(),
				intervals: getTimeIntervals(startDate, endDate, 'month'),
			}
		}
		default:
			throw new Error('Invalid preset')
	}
}

export const calculateUserDataForInterval = (
	transactions: Transaction[],
	interval: Date[],
	username: string,
) => {
	let label: string
	const [startDate, endDate] = interval
	const startDay = dayjs(startDate)
	const endDay = dayjs(endDate)
	const diffDays = endDay.diff(startDay, 'day') + 1
	const diffHours = endDay.diff(startDay, 'hour')

	if (diffDays >= 28) {
		label = startDay.format('MMMM')
	} else if (diffDays >= 2) {
		label = startDay.format('DD/MM')
	} else if (diffDays === 1 && diffHours > 1) {
		label = startDay.format('dddd')
	} else {
		label = startDay.format('HH:mm')
	}

	const filteredTransactions = transactions.filter(
		(transaction) =>
			transaction.createdAt >= startDate && transaction.createdAt <= endDate,
	)

	let sentAmount = 0,
		receivedAmount = 0

	filteredTransactions.forEach((transaction) => {
		if (transaction.senderUsername === username) {
			sentAmount += transaction.amount
		} else {
			receivedAmount += transaction.amount
		}
	})

	return {
		sentAmount,
		receivedAmount,
		label,
	}
}
