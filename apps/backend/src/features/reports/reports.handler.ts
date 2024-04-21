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

export const getCategorizedExpenditure: RequestHandler = async (
	req,
	res,
	next,
) => {
	try {
		const user = getAuthorizedUser(req)

		const currentMonthDate = dayjs().startOf('month')
		const nextMonthDate = currentMonthDate.add(1, 'month')

		const outgoingTransactionsMadeThisMonth = await prisma.transaction.findMany(
			{
				where: {
					createdAt: {
						gte: currentMonthDate.toDate(),
						lte: nextMonthDate.toDate(),
					},
					senderUsername: user.username,
				},
			},
		)

		const categorizedExpenditure: Map<string, number> = new Map<
			string,
			number
		>()

		for (const transaction of outgoingTransactionsMadeThisMonth) {
			if (transaction.senderTags.length === 0) {
				// The transcation has no tags, therefore the transaction is categorized as "Uncategorized"
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
			expenditure: Array.from(categorizedExpenditure).map(([key, value]) => ({
				name: key,
				value: value,
			})),
		})
	} catch (err) {
		next(err)
	}
}
