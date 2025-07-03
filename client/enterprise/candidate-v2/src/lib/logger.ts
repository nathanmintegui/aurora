class Logger {
	log(...messages: Array<any>) {
		if (process.env.NODE_ENV === 'development') {
			console.log('[LOG]: ', ...messages);
		}
	}

	info(...messages: Array<any>) {
		if (process.env.NODE_ENV === 'development') {
			console.info('[INFO]: ', ...messages);
		}
	}

	warn(...messages: Array<any>) {
		if (process.env.NODE_ENV === 'development') {
			console.warn('[WARN]: ', ...messages);
		}
	}

	error(...messages: Array<any>) {
		if (process.env.NODE_ENV === 'development') {
			console.error('[ERROR]: ', ...messages);
		}
	}

	assert(condition: boolean, ...messages: Array<any>) {
		if (process.env.NODE_ENV === 'development') {
			console.assert(condition, ...messages);
		}
	}
}

export default new Logger();
