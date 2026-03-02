interface ValidationRule {
	key: string
	type: string[]
}

export function roomsValidation(obj: any): void {
	const roomsValidate: ValidationRule[] = [
		{ key: 'roomId', type: ['string', 'number'] },
		{ key: 'roomName', type: ['string'] },
		{ key: 'users', type: ['array'] },
	]
	const validate = (obj: Record<string, unknown>, props: ValidationRule[]): boolean => {
		return props.every((prop) => {
			let validType = false
			if (prop.type[0] === 'array' && Array.isArray(obj[prop.key])) {
				validType = true
			}
			else if (prop.type.includes(typeof obj[prop.key])) {
				validType = true
			}
			return validType && checkObjectValid(obj, prop.key)
		})
	}
	if (!validate(obj, roomsValidate)) {
		throw new Error(
			'Rooms object is not valid! Must contain at least roomId[String, Number], roomName[String] and users[Array]',
		)
	}
}

export function partcipantsValidation(obj: any): void {
	const participantsValidate: ValidationRule[] = [
		{ key: '_id', type: ['string', 'number'] },
		{ key: 'username', type: ['string'] },
	]
	const validate = (obj: Record<string, unknown>, props: ValidationRule[]): boolean => {
		return props.every((prop) => {
			const validType = prop.type.includes(typeof obj[prop.key])
			return validType && checkObjectValid(obj, prop.key)
		})
	}
	if (!validate(obj, participantsValidate)) {
		throw new Error(
			'Participants object is not valid! Must contain at least _id[String, Number] and username[String]',
		)
	}
}

export function messagesValidation(obj: any): void {
	const messagesValidate: ValidationRule[] = [
		{ key: '_id', type: ['string', 'number'] },
		{ key: 'senderId', type: ['string', 'number'] },
	]
	const validate = (obj: Record<string, unknown>, props: ValidationRule[]): boolean => {
		return props.every((prop) => {
			const validType = prop.type.includes(typeof obj[prop.key])
			return validType && checkObjectValid(obj, prop.key)
		})
	}
	if (!validate(obj, messagesValidate)) {
		throw new Error(
			'Messages object is not valid! Must contain at least _id[String, Number] and senderId[String, Number]',
		)
	}
}
function checkObjectValid(obj: Record<string, unknown>, key: string): boolean {
	return (
		Object.prototype.hasOwnProperty.call(obj, key)
		&& obj[key] !== null
		&& obj[key] !== undefined
	)
}
