export const intOrNaN = (numString: string | undefined) => {
	if (!numString) {
		return NaN
	}
	return /^\d+$/.test(numString) ? +numString : NaN
}