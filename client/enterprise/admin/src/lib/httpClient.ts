const RETRY_COUNT = 3;

export async function get_with_retry(uri: string, retry_count: number = RETRY_COUNT) {
	let count = retry_count;

	while (count > 0) {
		try {
			return (await get(uri)).json();
		} catch (_err) {
			//log.info('retry 1')
		}
		count -= 1;
	}
}

export async function get(uri: string) {
	const init: RequestInit = {
		method: 'GET',
		headers: { Accept: 'application/json' },
		mode: 'cors',
		cache: 'default',
		signal: new_abort_signal(2000),
		keepalive: false
	};

	return await fetch(uri, init);
}

function new_abort_signal(timeout_ms: number) {
	if (timeout_ms === undefined || timeout_ms === null) {
		throw new Error('Parameter timeoutMs is null or undefined.');
	}

	if (typeof timeout_ms !== 'number') {
		throw new Error('Parameter timeoutMs must be of type number.');
	}

	if (timeout_ms < 0) {
		throw new Error('Parameter timeoutMs should be a positive number.');
	}

	const abort_controller = new AbortController();

	setTimeout(function () {
		abort_controller.abort();
	}, timeout_ms || 0);

	return abort_controller.signal;
}
