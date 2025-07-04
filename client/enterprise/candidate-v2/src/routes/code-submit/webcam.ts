export class Webcam {
	mockVideoEl: HTMLVideoElement | null = null;
	outputVideoEl: HTMLVideoElement | null = null;
	canvasEl: HTMLCanvasElement | null = null;
	isStreaming = false;
	connectionStatus = 'Desconectado';
	framesSent = 0;
	lastFrameTime = 0;
	fps = 0;
	animationId: number = -1;

	constructor(
		mockVideoEl: HTMLVideoElement,
		outputVideoEl: HTMLVideoElement,
		canvasEl: HTMLCanvasElement
	) {
		if (!mockVideoEl || !outputVideoEl || !canvasEl) {
			return;
		}

		this.mockVideoEl = mockVideoEl;
		this.outputVideoEl = outputVideoEl;
		this.canvasEl = canvasEl;
	}

	async setup(mockVideoEl: HTMLVideoElement) {
		await new Promise<void>((resolve) => {
			if (mockVideoEl!.readyState >= 2) {
				resolve();
				return;
			}
			mockVideoEl!.addEventListener('loadedmetadata', () => resolve(), { once: true });
		});
	}

	public async run(
		mockVideoEl: HTMLVideoElement,
		outputVideoEl: HTMLVideoElement,
		canvasEl: HTMLCanvasElement
	) {
		try {
			await mockVideoEl.play();
			canvasEl.width = mockVideoEl.videoWidth;
			canvasEl.height = mockVideoEl.videoHeight;

			const ctx = canvasEl.getContext('2d')!;
			function drawFrame() {
				if (mockVideoEl && !mockVideoEl.paused) {
					ctx.drawImage(mockVideoEl, 0, 0);
					requestAnimationFrame(drawFrame);
				}
			}
			drawFrame();
			const stream = canvasEl.captureStream(30);
			outputVideoEl.srcObject = stream;

			/* websocket start here */
			const now = performance.now();

			// Controla FPS (máximo 15 FPS para não sobrecarregar)
			if (now - this.lastFrameTime < 66) {
				// ~15 FPS
				this.animationId = requestAnimationFrame(this.streamFrames);
				return;
			}

			this.lastFrameTime = now;

			try {
				canvasEl.toBlob(
					async (blob) => {
						if (blob) {
							const arrayBuffer = await blob.arrayBuffer();
							const bytes = new Uint8Array(arrayBuffer);

							function uint8Array(bytes: Uint8Array<ArrayBuffer>) {
								console.assert(bytes !== null && bytes.length !== 0);

								fetch('http://localhost:2002/video-stream-octet', {
									method: 'POST',
									body: bytes,
									headers: {
										'Content-Type': 'application/octet-stream'
									}
								}).catch((e) => console.error(e));
							}

							uint8Array(bytes);

							// Envia metadados primeiro
							const metadata = {
								type: 'frame_metadata',
								timestamp: Date.now(),
								frameNumber: this.framesSent,
								size: bytes.length,
								width: canvasEl.width,
								height: canvasEl.height
							};

							console.info('[INFO]: bytes >> ', bytes);

							this.framesSent++;

							// Calcula FPS aproximado
							if (this.framesSent % 15 === 0) {
								this.fps = Math.round(15 / ((now - (this.lastFrameTime - 15 * 66)) / 1000));
							}
						}
					},
					'image/jpeg',
					0.5
				); // Qualidade média para equilibrar velocidade/qualidade
			} catch (error) {
				console.error('[ERROR]: nao foi possível processar frame:', error);
			}

			// Próximo frame
			if (this.isStreaming) {
				this.animationId = requestAnimationFrame(this.streamFrames);
			}
		} catch (err) {
			console.error('Error setting up mock webcam:', err);
		}
	}

	public async streamFrames() {
		const now = performance.now();

		// Controla FPS (máximo 15 FPS para não sobrecarregar)
		if (now - this.lastFrameTime < 66) {
			// ~15 FPS
			this.animationId = requestAnimationFrame(this.streamFrames);
			return;
		}

		if (!this.canvasEl) {
			console.warn('[WARN]: canvasEl is null or undefined.');
			return;
		}

		this.lastFrameTime = now;

		try {
			const ctx = this.canvasEl.getContext('2d')!;
			ctx.drawImage(this.mockVideoEl, 0, 0, this.canvasEl.width, this.canvasEl.height);

			// Converte frame para JPEG com baixa qualidade (mais rápido)
			this.canvasEl.toBlob(
				async (blob) => {
					// ws implementation
					//if (blob && ws?.readyState === WebSocket.OPEN) {
					if (blob) {
						const arrayBuffer = await blob.arrayBuffer();
						const bytes = new Uint8Array(arrayBuffer);

						// Envia metadados primeiro
						const metadata = {
							type: 'frame_metadata',
							timestamp: Date.now(),
							frameNumber: this.framesSent,
							size: bytes.length,
							width: this.canvasEl.width,
							height: this.canvasEl.height
						};

						// Envia metadados como JSON
						//ws.send(JSON.stringify(metadata));

						// Envia bytes do frame
						//ws.send(bytes);
						console.info('[INFO]: bytes >> ', bytes);

						this.framesSent++;

						// Calcula FPS aproximado
						if (this.framesSent % 15 === 0) {
							this.fps = Math.round(15 / ((now - (this.lastFrameTime - 15 * 66)) / 1000));
						}
					}
				},
				'image/jpeg',
				0.6
			); // Qualidade média para equilibrar velocidade/qualidade
		} catch (error) {
			console.error('[ERROR]: nao foi possível processar frame:', error);
		}

		// Próximo frame
		if (this.isStreaming) {
			this.animationId = requestAnimationFrame(this.streamFrames);
		}
	}
}
