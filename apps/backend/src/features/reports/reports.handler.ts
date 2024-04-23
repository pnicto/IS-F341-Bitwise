import dayjs, { ManipulateType } from 'dayjs'
import { RequestHandler } from 'express'
import { query } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, Forbidden } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'
import {
	calculateVendorDataForInterval,
	getStartAndEndDates,
	getTimeIntervals,
} from './reports.utils'

export const validateVendorReport = [
	query('preset')
		.trim()
		.isIn(['day', 'week', 'month', 'year', 'hour', ''])
		.optional()
		.withMessage('Invalid preset'),
	query('fromDate').trim().optional(),
	query('toDate').trim().optional(),
]
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

		const fromDateObj = dayjs(fromDate)
		const toDateObj = dayjs(toDate)

		if (fromDate && toDate && !(fromDateObj.isValid() && toDateObj.isValid())) {
			throw new BadRequest('Invalid date format')
		}

		if (preset && fromDate && toDate) {
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
			const diffInDays = toDateObj.diff(fromDateObj, 'day')
			const diffInHours = toDateObj.diff(fromDateObj, 'hour')
			let intervalUnit: ManipulateType

			if (diffInDays >= 28) {
				intervalUnit = 'month'
			} else if (diffInDays > 6) {
				intervalUnit = 'week'
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
			calculateVendorDataForInterval(currentTransactions, interval),
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

export const getTimelineReport: RequestHandler = async (req, res, next) => {
	try {
		const user = getAuthorizedUser(req)
		const transactionsMadeThisMonth = await prisma.transaction.findMany({
			where: {
				createdAt: {
					gte: dayjs().startOf('month').toDate(),
					lte: dayjs().endOf('month').toDate(),
				},
				OR: [
					{
						senderUsername: user.username,
					},
					{
						receiverUsername: user.username,
					},
				],
			},
		})

		let sentAmount = 0,
			receivedAmount = 0

		const combinedTransactions: Record<
			string,
			{ sentAmount: number; receivedAmount: number }
		> = {}

		transactionsMadeThisMonth.forEach((transaction) => {
			const label = dayjs(transaction.createdAt).format('DD/MM')
			if (combinedTransactions[label]) {
				if (transaction.senderUsername === user.username) {
					combinedTransactions[label].sentAmount += transaction.amount
					sentAmount += transaction.amount
				} else {
					combinedTransactions[label].receivedAmount += transaction.amount
					receivedAmount += transaction.amount
				}
			} else {
				if (transaction.senderUsername === user.username) {
					combinedTransactions[label] = {
						sentAmount: transaction.amount,
						receivedAmount: 0,
					}
					sentAmount += transaction.amount
				} else {
					combinedTransactions[label] = {
						sentAmount: 0,
						receivedAmount: transaction.amount,
					}
					receivedAmount += transaction.amount
				}
			}
		})

		const combinedTimeline: {
			label: string
			sentAmount: number
			receivedAmount: number
		}[] = []

		for (const label in combinedTransactions) {
			combinedTimeline.push({
				label,
				receivedAmount: combinedTransactions[label].receivedAmount,
				sentAmount: combinedTransactions[label].sentAmount,
			})
		}

		combinedTimeline.sort((a, b) =>
			dayjs(a.label, 'DD/MM') < dayjs(b.label, 'DD/MM') ? -1 : 1,
		)

		const transactionsMadePreviousMonth = await prisma.transaction.findMany({
			where: {
				createdAt: {
					gte: dayjs().subtract(1, 'month').startOf('month').toDate(),
					lte: dayjs().subtract(1, 'month').endOf('month').toDate(),
				},
				OR: [
					{
						senderUsername: user.username,
					},
					{
						receiverUsername: user.username,
					},
				],
			},
		})
		const sentPrevious = transactionsMadePreviousMonth.filter(
			(transaction) => transaction.senderUsername === user.username,
		)
		const receivedPrevious = transactionsMadePreviousMonth.filter(
			(transaction) => transaction.receiverUsername === user.username,
		)

		const sentAmountPrevious = sentPrevious.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		)
		const receivedAmountPrevious = receivedPrevious.reduce(
			(acc, transaction) => acc + transaction.amount,
			0,
		)

		return res.json({
			timeline: combinedTimeline,
			current: {
				sent: sentAmount,
				received: receivedAmount,
			},
			previous: {
				sent: sentAmountPrevious,
				received: receivedAmountPrevious,
			},
		})
	} catch (err) {
		next(err)
	}
}

export const validateAdminReport = [
	query('datePreset')
		.trim()
		.isIn(['day', 'week', 'month', 'year', 'hour', ''])
		.optional()
		.withMessage('Invalid preset'),
	query('fromDate').trim().optional(),
	query('toDate').trim().optional(),
	query('vendor').trim().optional(),
]

export const getAdminReport: RequestHandler = async (req, res, next) => {
	try {
		const { datePreset, fromDate, toDate, vendor } = validateRequest<{
			datePreset?: string
			fromDate?: string
			toDate?: string
			vendor?: string
		}>(req)

		let startDate: Date,
			endDate: Date,
			compareStartDate: Date,
			compareEndDate: Date,
			intervals: Date[][]

		const fromDateObj = dayjs(fromDate)
		const toDateObj = dayjs(toDate)

		if (fromDate && toDate && !(fromDateObj.isValid() && toDateObj.isValid())) {
			throw new BadRequest('Invalid date format')
		}

		if (datePreset && fromDate && toDate) {
			const diffInDays = toDateObj.diff(fromDateObj, 'day') + 1
			compareStartDate = fromDateObj.subtract(diffInDays, 'day').toDate()
			compareEndDate = fromDateObj.subtract(1, 'day').toDate()
			startDate = fromDateObj.toDate()
			endDate = toDateObj.toDate()

			intervals = getTimeIntervals(
				startDate,
				endDate,
				datePreset as ManipulateType,
			)
		} else if (datePreset) {
			// eslint-disable-next-line @typescript-eslint/no-extra-semi
			;({ startDate, endDate, compareStartDate, compareEndDate, intervals } =
				getStartAndEndDates(datePreset))
		} else if (fromDate && toDate) {
			const diffInDays = toDateObj.diff(fromDateObj, 'day')
			const diffInHours = toDateObj.diff(fromDateObj, 'hour')
			let intervalUnit: ManipulateType

			if (diffInDays >= 28) {
				intervalUnit = 'month'
			} else if (diffInDays > 6) {
				intervalUnit = 'week'
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
				receiverUsername: vendor ? vendor : undefined,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
		})

		const compareTransactions = await prisma.transaction.findMany({
			where: {
				receiverUsername: vendor ? vendor : undefined,
				createdAt: {
					gte: compareStartDate,
					lte: compareEndDate,
				},
			},
		})
		const currentVendorUniqueVisitors = new Set(),
			currentTotalUniqueVisitors = new Set()
		let currentVendorIncome = 0,
			currentTotalIncome = 0
		let currentVendorUniqueVisitorsCount = 0,
			currentTotalUniqueVisitorsCount = 0

		const compareVendorUniqueVisitors = new Set(),
			compareTotalUniqueVisitors = new Set()
		let compareVendorIncome = 0,
			compareTotalIncome = 0

		let compareVendorUniqueVisitorsCount = 0,
			compareTotalUniqueVisitorsCount = 0
		let intervalData
		if (vendor) {
			currentTransactions.forEach((transaction) => {
				currentVendorUniqueVisitors.add(transaction.senderUsername)
				currentVendorIncome += transaction.amount
			})
			currentVendorUniqueVisitorsCount = currentVendorUniqueVisitors.size
			compareTransactions.forEach((transaction) => {
				compareVendorUniqueVisitors.add(transaction.senderUsername)
				compareVendorIncome += transaction.amount
			})
			compareVendorUniqueVisitorsCount = compareVendorUniqueVisitors.size
			intervalData = intervals.map((interval) =>
				calculateVendorDataForInterval(currentTransactions, interval),
			)

			const totalCurrentTransactions = await prisma.transaction.findMany({
				where: {
					createdAt: {
						gte: startDate,
						lte: endDate,
					},
				},
			})
			const totalCompareTransactions = await prisma.transaction.findMany({
				where: {
					createdAt: {
						gte: compareStartDate,
						lte: compareEndDate,
					},
				},
			})
			totalCurrentTransactions.forEach((transaction) => {
				currentTotalUniqueVisitors.add(transaction.senderUsername)
				currentTotalIncome += transaction.amount
			})
			currentTotalUniqueVisitorsCount = currentTotalUniqueVisitors.size
			totalCompareTransactions.forEach((transaction) => {
				compareTotalUniqueVisitors.add(transaction.senderUsername)
				compareTotalIncome += transaction.amount
			})
			compareTotalUniqueVisitorsCount = compareTotalUniqueVisitors.size
		} else {
			currentTransactions.forEach((transaction) => {
				currentTotalUniqueVisitors.add(transaction.senderUsername)
				currentTotalIncome += transaction.amount
			})
			currentTotalUniqueVisitorsCount = currentTotalUniqueVisitors.size
			compareTransactions.forEach((transaction) => {
				compareTotalUniqueVisitors.add(transaction.senderUsername)
				compareTotalIncome += transaction.amount
			})
			compareTotalUniqueVisitorsCount = compareTotalUniqueVisitors.size
		}

		const shopCount = await prisma.user.aggregate({
			_count: {
				shopName: true,
			},
		})

		const disabledCount = await prisma.user.aggregate({
			_count: true,
			where: {
				enabled: false,
			},
		})

		let vendorObj
		if (vendor) {
			vendorObj = await prisma.user.findFirst({
				where: {
					shopName: vendor,
				},
			})
		}
		const productsByCategory = await prisma.product.groupBy({
			by: ['categoryName'],
			_count: true,
			where: {
				vendorId: vendorObj ? vendorObj.id : undefined,
			},
		})

		const uniqueReceivers = await prisma.transaction.findMany({
			where: {
				createdAt: {
					gte: dayjs().subtract(1, 'month').toISOString(),
				},
			},
			distinct: ['receiverUsername'],
			select: {
				receiverUsername: true,
			},
		})
		const uniqueSenders = await prisma.transaction.findMany({
			where: {
				createdAt: {
					gte: dayjs().subtract(1, 'month').toISOString(),
				},
			},
			distinct: ['senderUsername'],
			select: {
				senderUsername: true,
			},
		})

		const activeUsers = new Set()
		for (const r of uniqueReceivers) {
			activeUsers.add(Object.values(r)[0])
		}
		for (const s of uniqueSenders) {
			activeUsers.add(Object.values(s)[0])
		}

		const cashFlow = await prisma.transaction.aggregateRaw({
			pipeline: [
				{
					$group: {
						_id: {
							$dateToString: {
								format: '%Y-%m-%d',
								date: '$createdAt',
							},
						},
						total: {
							$sum: '$amount',
						},
					},
				},
				{
					$match: {
						_id: {
							$gte: fromDateObj.format('YYYY-MM-DD'),
							$lte: toDateObj.format('YYYY-MM-DD'),
						},
					},
				},
				{
					$sort: {
						_id: 1,
					},
				},
			],
		})

		return res.status(StatusCodes.OK).json({
			uniqueVisitorsCount: {
				currentVendorUniqueVisitorsCount,
				compareVendorUniqueVisitorsCount,
				currentTotalUniqueVisitorsCount,
				compareTotalUniqueVisitorsCount,
			},
			income: {
				currentVendorIncome,
				compareVendorIncome,
				currentTotalIncome,
				compareTotalIncome,
			},
			intervalData,
			shopCount: shopCount._count.shopName,
			disabledCount: disabledCount._count,
			productsByCategory,
			activeUserCount: activeUsers.size - shopCount._count.shopName,
			cashFlow: cashFlow,
		})
	} catch (err) {
		next(err)
	}
}
