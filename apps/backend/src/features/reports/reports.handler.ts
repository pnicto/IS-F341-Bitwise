import { Transaction } from '@prisma/client'
import dayjs, { ManipulateType } from 'dayjs'
import { RequestHandler } from 'express'
import { query } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { Forbidden } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'

export const validateVendorReport = [
	query('preset')
		.trim()
		.isIn(['day', 'week', 'month', 'year', 'hour', ''])
		.optional()
		.withMessage('Invalid preset'),
	query('fromDate').trim().optional(),
	query('toDate').trim().optional(),
]
const getTimeIntervals = (
	startDate: Date,
	endDate: Date,
	intervalUnit: ManipulateType,
) => {
	const intervals = []
	let currentIntervalStart = dayjs(startDate)
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
const calculateDataForInterval = (
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
const getStartAndEndDates = (preset: string) => {
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
export const getVendorReport: RequestHandler = async (req, res, next) => {
	try {
		const vendor = getAuthorizedUser(req)
		const { preset, fromDate, toDate } = validateRequest<{
			preset?: string
			fromDate?: string
			toDate?: string
		}>(req)

		if (!vendor.shopName) {
			throw new Forbidden('Only vendors can view their reports')
		}

		let startDate: Date,
			endDate: Date,
			compareStartDate: Date,
			compareEndDate: Date,
			intervals: Date[][]

		if (preset && fromDate && toDate) {
			const fromDateObj = dayjs(fromDate)
			const toDateObj = dayjs(toDate)
			const diffInDays = toDateObj.diff(fromDateObj, 'day') + 1
			compareStartDate = fromDateObj.subtract(diffInDays, 'day').toDate()
			compareEndDate = fromDateObj.subtract(1, 'day').toDate()
			startDate = fromDateObj.toDate()
			endDate = toDateObj.toDate()

			intervals = getTimeIntervals(startDate, endDate, preset as ManipulateType)
		} else if (preset) {
			// https://github.com/prettier/prettier/issues/1935#issuecomment-306729468
			// eslint-disable-next-line @typescript-eslint/no-extra-semi
			;({ startDate, endDate, compareStartDate, compareEndDate, intervals } =
				getStartAndEndDates(preset))
		} else if (fromDate && toDate) {
			const fromDateObj = dayjs(fromDate)
			const toDateObj = dayjs(toDate)

			const diffInDays = toDateObj.diff(fromDateObj, 'day') + 1
			const diffInHours = toDateObj.diff(fromDateObj, 'hour') + 1
			let intervalUnit: ManipulateType

			if (diffInDays >= 28) {
				intervalUnit = 'month'
			} else if (diffInDays > 6) {
				intervalUnit = 'week'
			} else if (diffInDays === 6) {
				intervalUnit = 'day'
			} else if (diffInDays >= 1 && diffInHours > 1) {
				intervalUnit = 'day'
			} else {
				intervalUnit = 'hour'
			}

			compareStartDate = fromDateObj.subtract(diffInDays, 'day').toDate()
			compareEndDate = fromDateObj.subtract(1, 'day').toDate()
			startDate = fromDateObj.toDate()
			endDate = toDateObj.toDate()

			intervals = getTimeIntervals(startDate, endDate, intervalUnit)
		} else {
			// eslint-disable-next-line @typescript-eslint/no-extra-semi
			;({ startDate, endDate, compareStartDate, compareEndDate, intervals } =
				getStartAndEndDates('month'))
		}

		const currentTransactions = await prisma.transaction.findMany({
			where: {
				receiverUsername: vendor.shopName,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
		})

		const compareTransactions = await prisma.transaction.findMany({
			where: {
				receiverUsername: vendor.shopName,
				createdAt: {
					gte: compareStartDate,
					lte: compareEndDate,
				},
			},
		})

		const currentUniqueVisitors = new Set()
		let currentTotalIncome = 0
		currentTransactions.forEach((transaction) => {
			currentUniqueVisitors.add(transaction.senderUsername)
			currentTotalIncome += transaction.amount
		})
		const currentUniqueVisitorsCount = currentUniqueVisitors.size

		const compareUniqueVisitors = new Set()
		let compareTotalIncome = 0
		compareTransactions.forEach((transaction) => {
			compareUniqueVisitors.add(transaction.senderUsername)
			compareTotalIncome += transaction.amount
		})
		const compareUniqueVisitorsCount = compareUniqueVisitors.size

		const intervalData = intervals.map((interval) =>
			calculateDataForInterval(currentTransactions, interval),
		)

		return res.status(StatusCodes.OK).json({
			uniqueVisitorsCount: {
				currentUniqueVisitorsCount,
				compareUniqueVisitorsCount,
			},
			totalIncome: {
				currentTotalIncome,
				compareTotalIncome,
			},
			intervalData,
		})
	} catch (err) {
		next(err)
	}
}
