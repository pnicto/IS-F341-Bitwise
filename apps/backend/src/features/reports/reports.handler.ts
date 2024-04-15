import dayjs from 'dayjs'
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
		.isIn(['today', 'week', 'month', 'year'])
		.optional()
		.withMessage('Invalid preset'),
	query('fromDate').trim().optional(),
	query('toDate').trim().optional(),
]

const getStartAndEndDates = (preset: string) => {
	const currentDate = dayjs()
	switch (preset) {
		case 'today':
			return {
				startDate: currentDate.startOf('day').toDate(),
				endDate: currentDate.endOf('day').toDate(),
				compareStartDate: currentDate
					.subtract(1, 'day')
					.startOf('day')
					.toDate(),
				compareEndDate: currentDate.subtract(1, 'day').endOf('day').toDate(),
			}

		case 'week':
			return {
				startDate: currentDate.startOf('week').toDate(),
				endDate: currentDate.endOf('week').toDate(),
				compareStartDate: currentDate
					.subtract(1, 'week')
					.startOf('week')
					.toDate(),
				compareEndDate: currentDate.subtract(1, 'week').endOf('week').toDate(),
			}
		case 'month':
			return {
				startDate: currentDate.startOf('month').toDate(),
				endDate: currentDate.endOf('month').toDate(),
				compareStartDate: currentDate
					.subtract(1, 'month')
					.startOf('month')
					.toDate(),
				compareEndDate: currentDate
					.subtract(1, 'month')
					.endOf('month')
					.toDate(),
			}
		case 'year':
			return {
				startDate: currentDate.startOf('year').toDate(),
				endDate: currentDate.endOf('year').toDate(),
				compareStartDate: currentDate
					.subtract(1, 'year')
					.startOf('year')
					.toDate(),
				compareEndDate: currentDate.subtract(1, 'year').endOf('year').toDate(),
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
			compareEndDate: Date
		if (preset) {
			// https://github.com/prettier/prettier/issues/1935#issuecomment-306729468
			// eslint-disable-next-line @typescript-eslint/no-extra-semi
			;({ startDate, endDate, compareStartDate, compareEndDate } =
				getStartAndEndDates(preset))
		} else if (fromDate && toDate) {
			const fromDateObj = dayjs(fromDate)
			const toDateObj = dayjs(toDate)
			const diffInDays = toDateObj.diff(fromDateObj, 'day')
			compareStartDate = fromDateObj.subtract(diffInDays, 'day').toDate()
			compareEndDate = fromDateObj.subtract(1, 'day').toDate()
			startDate = fromDateObj.toDate()
			endDate = toDateObj.toDate()
		} else {
			// eslint-disable-next-line @typescript-eslint/no-extra-semi
			;({ startDate, endDate, compareStartDate, compareEndDate } =
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

		return res.status(StatusCodes.OK).json({
			uniqueVisitorsCount: {
				currentUniqueVisitorsCount,
				compareUniqueVisitorsCount,
			},
			totalIncome: {
				currentTotalIncome,
				compareTotalIncome,
			},
		})
	} catch (err) {
		next(err)
	}
}
