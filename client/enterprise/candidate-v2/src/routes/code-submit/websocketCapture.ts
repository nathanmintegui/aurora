export class WebsocketCapture {
	videoEl: HTMLVideoElement;
	canvasEl: HTMLCanvasElement;
	ws: WebSocket | null = null;
	isStreaming = false;
	connectionStatus = 'Desconectado';
	framesSent = 0;
	lastFrameTime = 0;
	fps = 0;
	animationId: number = -1;

	/*
    onDestroy(() => {
        isStreaming = false;
        if (animationId) cancelAnimationFrame(animationId);
        if (ws) {
            ws.close();
        }
    });
        */

	connectWebSocket() {
		try {
			this.ws = new WebSocket('ws://localhost:8080/video-stream');

			this.ws.onopen = () => {
				this.connectionStatus = 'Conectado';
				console.log('WebSocket conectado');
			};

			ws.onmessage = (event) => {
				// Recebe respostas do servidor
				try {
					const response = JSON.parse(event.data);
					console.log('Resposta do servidor:', response);
				} catch (e) {
					console.log('Mensagem do servidor:', event.data);
				}
			};

			ws.onclose = () => {
				connectionStatus = 'Desconectado';
				console.log('WebSocket desconectado');
			};

			ws.onerror = (error) => {
				connectionStatus = 'Erro na conexão';
				console.error('Erro WebSocket:', error);
			};
		} catch (error) {
			connectionStatus = 'Erro na conexão';
			console.error('Erro ao conectar WebSocket:', error);
		}
	}

	setupCanvas() {
		this.videoEl.addEventListener('loadedmetadata', () => {
			this.canvasEl.width = Math.min(this.videoEl.videoWidth, 320);
			this.canvasEl.height = Math.min(this.videoEl.videoHeight, 240);
		});
	}

	public async streamFrames() {
		/* ws implementation
        if (!isStreaming || !ws || ws.readyState !== WebSocket.OPEN) {
            if (isStreaming) {
                animationId = requestAnimationFrame(streamFrames);
            }
            return;
        }
        */

		const now = performance.now();

		// Controla FPS (máximo 15 FPS para não sobrecarregar)
		if (now - this.lastFrameTime < 66) {
			// ~15 FPS
			this.animationId = requestAnimationFrame(this.streamFrames);
			return;
		}

		this.lastFrameTime = now;

		try {
			const ctx = this.canvasEl.getContext('2d')!;
			ctx.drawImage(this.videoEl, 0, 0, this.canvasEl.width, this.canvasEl.height);

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

	startStreaming() {
		if (ws?.readyState !== WebSocket.OPEN) {
			alert('WebSocket não está conectado!');
			return;
		}

		isStreaming = true;
		framesSent = 0;
		lastFrameTime = performance.now();

		// Envia sinal de início
		ws.send(
			JSON.stringify({
				type: 'stream_start',
				timestamp: Date.now()
			})
		);

		streamFrames();
	}

	stopStreaming() {
		isStreaming = false;

		if (ws?.readyState === WebSocket.OPEN) {
			// Envia sinal de parada
			ws.send(
				JSON.stringify({
					type: 'stream_stop',
					timestamp: Date.now(),
					totalFrames: framesSent
				})
			);
		}
	}

	reconnect() {
		if (ws) {
			ws.close();
		}
		connectWebSocket();
	}
}
