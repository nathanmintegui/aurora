export async function mock_request<T>(data: T, options: ResponseInit, sleep = 100): Promise<T> {
	const response = new Response(JSON.stringify(data), options);

	return new Promise(function (resolve, reject) {
		setTimeout(function () {
			if (options.status && options.status >= 400) {
				reject(response);
				return;
			}

			response.json().then(resolve).catch(reject);
		}, sleep);
	});
}
