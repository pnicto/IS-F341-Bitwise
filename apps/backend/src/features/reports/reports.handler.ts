import dayjs, { ManipulateType } from 'dayjs'
import { RequestHandler } from 'express'
import { query } from 'express-validator'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../../config/prisma'
import { BadRequest, Forbidden } from '../../errors/CustomErrors'
import { getAuthorizedUser } from '../../utils/getAuthorizedUser'
import { validateRequest } from '../../utils/validateRequest'
import {
	calculateCashFlowLabels,
	calculateUserDataForInterval,
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

export const validateTimelineReport = [
	query('preset')
		.trim()
		.isIn(['day', 'week', 'month', 'year', 'hour', ''])
		.optional()
		.withMessage('Invalid preset'),
	query('fromDate').trim().optional(),
	query('toDate').trim().optional(),
]
export const getTimelineReport: RequestHandler = async (req, res, next) => {
	try {
		const user = getAuthorizedUser(req)

		const { preset, fromDate, toDate } = validateRequest<{
			preset?: string
			fromDate?: string
			toDate?: string
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

		if (preset && fromDate && toDate) {
			const diffInDays = toDateObj.diff(fromDateObj, 'day') + 1
			compareStartDate = fromDateObj.subtract(diffInDays, 'day').toDate()
			compareEndDate = fromDateObj.subtract(1, 'day').toDate()
			startDate = fromDateObj.toDate()
			endDate = toDateObj.toDate()

			intervals = getTimeIntervals(startDate, endDate, preset as ManipulateType)
		} else if (preset) {
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

		const transactionsMadeThisPeriod = await prisma.transaction.findMany({
			where: {
				createdAt: {
					gte: startDate,
					lte: endDate,
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

		transactionsMadeThisPeriod.forEach((transaction) => {
			if (transaction.senderUsername === user.username) {
				sentAmount += transaction.amount
			} else {
				receivedAmount += transaction.amount
			}
		})

		const timeline = intervals.map((interval) =>
			calculateUserDataForInterval(
				transactionsMadeThisPeriod,
				interval,
				user.username,
			),
		)

		const transactionsMadePreviousPeriod = await prisma.transaction.findMany({
			where: {
				createdAt: {
					gte: compareStartDate,
					lte: compareEndDate,
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
		const sentPrevious = transactionsMadePreviousPeriod.filter(
			(transaction) => transaction.senderUsername === user.username,
		)
		const receivedPrevious = transactionsMadePreviousPeriod.filter(
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
			timeline,
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

export const validateCategorizedExpenditure = [
	query('preset')
		.trim()
		.isIn(['day', 'week', 'month', 'year', ''])
		.optional()
		.withMessage('Invalid preset'),
	query('fromDate').trim().optional(),
	query('toDate').trim().optional(),
]
export const getCategorizedExpenditure: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const user = getAuthorizedUser(req)

		const { preset, fromDate, toDate } = validateRequest<{
			preset?: string
			fromDate?: string
			toDate?: string
		}>(req)

		let startDate: Date, endDate: Date

		const fromDateObj = dayjs(fromDate)
		const toDateObj = dayjs(toDate)

		if (fromDate && toDate && !(fromDateObj.isValid() && toDateObj.isValid())) {
			throw new BadRequest('Invalid date format')
		}

		if (fromDate && toDate) {
			startDate = fromDateObj.toDate()
			endDate = toDateObj.toDate()
		} else if (preset) {
			// eslint-disable-next-line @typescript-eslint/no-extra-semi
			;({ startDate, endDate } = getStartAndEndDates(preset))
		} else {
			// eslint-disable-next-line @typescript-eslint/no-extra-semi
			;({ startDate, endDate } = getStartAndEndDates('month'))
		}

		const outgoingTransactionsMadeThisPeriod =
			await prisma.transaction.findMany({
				where: {
					createdAt: {
						gte: startDate,
						lte: endDate,
					},
					senderUsername: user.username,
				},
			})

		const categorizedExpenditure: Map<string, number> = new Map<
			string,
			number
		>()

		for (const transaction of outgoingTransactionsMadeThisPeriod) {
			if (transaction.senderTags.length === 0) {
				// The transaction has no tags, therefore the transaction is categorized as "Uncategorized"
				if (!categorizedExpenditure.has('Uncategorized')) {
					categorizedExpenditure.set('Uncategorized', transaction.amount)
				} else {
					const oldValue = categorizedExpenditure.get('Uncategorized')
					if (oldValue !== undefined) {
						categorizedExpenditure.set(
							'Uncategorized',
							transaction.amount + oldValue,
						)
					}
				}
			} else {
				// The transaction has tags, therefore the transaction is categorized into the first tag present on it
				if (!categorizedExpenditure.has(transaction.senderTags[0])) {
					categorizedExpenditure.set(
						transaction.senderTags[0],
						transaction.amount,
					)
				} else {
					const oldValue = categorizedExpenditure.get(transaction.senderTags[0])
					if (oldValue !== undefined) {
						categorizedExpenditure.set(
							transaction.senderTags[0],
							transaction.amount + oldValue,
						)
					}
				}
			}
		}

		return res.json({
			startDate: startDate,
			endDate: endDate,
			expenditure: Array.from(categorizedExpenditure).map(([key, value]) => ({
				name: key,
				value: value,
			})),
		})
	} catch (err) {
		next(err)
	}
}

export const validateAdminReport = [
	query('preset')
		.trim()
		.isIn(['day', 'week', 'month', 'year', 'hour', ''])
		.optional()
		.withMessage('Invalid preset'),
	query('fromDate').trim().optional(),
	query('toDate').trim().optional(),
	query('shopName').trim().optional(),
]

export const getAdminReport: RequestHandler = async (req, res, next) => {
	try {
		const { preset, fromDate, toDate, shopName } = validateRequest<{
			preset?: string
			fromDate?: string
			toDate?: string
			shopName?: string
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

		if (preset && fromDate && toDate) {
			const diffInDays = toDateObj.diff(fromDateObj, 'day') + 1
			compareStartDate = fromDateObj.subtract(diffInDays, 'day').toDate()
			compareEndDate = fromDateObj.subtract(1, 'day').toDate()
			startDate = fromDateObj.toDate()
			endDate = toDateObj.toDate()

			intervals = getTimeIntervals(startDate, endDate, preset as ManipulateType)
		} else if (preset) {
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
				receiverUsername: shopName ? shopName : undefined,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
		})

		const compareTransactions = await prisma.transaction.findMany({
			where: {
				receiverUsername: shopName ? shopName : undefined,
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
		if (shopName) {
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
		const intervalData = intervals.map((interval) =>
			calculateVendorDataForInterval(currentTransactions, interval),
		)

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
		if (shopName) {
			vendorObj = await prisma.user.findFirst({
				where: {
					shopName,
				},
			})
		}
		const productsByCategory = await prisma.product.groupBy({
			by: ['categoryName'],
			_count: true,
			where: {
				vendorId: vendorObj ? vendorObj.id : undefined,
			},
			orderBy: {
				categoryName: 'asc',
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
							$gte: dayjs(startDate).format('YYYY-MM-DD'),
							$lte: dayjs(toDateObj).format('YYYY-MM-DD'),
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

		const cashFlowWithLabel: { total: number; _id: string; label: string }[] =
			[]
		intervals.forEach((interval) => {
			cashFlowWithLabel.push(...calculateCashFlowLabels(cashFlow, interval))
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
			cashFlowWithLabel,
		})
	} catch (err) {
		next(err)
	}
}
