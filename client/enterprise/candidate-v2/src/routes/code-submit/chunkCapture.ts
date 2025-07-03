class chunckCapture {
    videoEl: HTMLVideoElement;
    canvasEl: HTMLCanvasElement;
    mediaRecorder: MediaRecorder | null = null;
    isRecording = false;
    chunkCount = 0;
    status = 'Parado';
    animationId: number;

    /*
    onMount(async () => {
        await setupMediaRecorder();
    });

onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
    if (mediaRecorder) mediaRecorder.stop();
});
    */

    async setupMediaRecorder() {
        // Espera o vídeo carregar
        await new Promise<void>((resolve) => {
            if (videoEl.readyState >= 2) {
                resolve();
            } else {
                videoEl.addEventListener('loadedmetadata', () => resolve(), { once: true });
            }
        });

        // Configura canvas
        canvasEl.width = videoEl.videoWidth || 640;
        canvasEl.height = videoEl.videoHeight || 480;

        const ctx = canvasEl.getContext('2d')!;

        // Função para desenhar frames continuamente
        drawFrame() {
            if (videoEl && !videoEl.paused && !videoEl.ended) {
                ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
            }
            animationId = requestAnimationFrame(drawFrame);
        }

        // Inicia quando o vídeo começar
        videoEl.addEventListener('play', drawFrame);

        // Captura stream do canvas
        const stream = canvasEl.captureStream(30); // 30 FPS

        // Configura MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm';

        mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 1000000 // 1Mbps
        });

        mediaRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
                status = 'Enviando chunk...';

                // Converte chunk para bytes e envia
                const arrayBuffer = await event.data.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer);
                await sendChunkToBackend(bytes);
            }
        };

        mediaRecorder.onstart = () => {
            status = 'Gravação iniciada';
            isRecording = true;
        };

        mediaRecorder.onstop = () => {
            status = 'Gravação parada';
            isRecording = false;
        };

        mediaRecorder.onerror = (event) => {
            console.error('Erro MediaRecorder:', event);
            status = `Erro: ${event.error?.message || 'Erro desconhecido'}`;
        };
    }

    async sendChunkToBackend(chunkBytes: Uint8Array) {
        try {
            const response = await fetch('/api/process-video-chunk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'video/webm',
                    'X-Chunk-Number': chunkCount.toString(),
                    'X-Chunk-Size': chunkBytes.length.toString(),
                    'X-Timestamp': Date.now().toString()
                },
                body: chunkBytes
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Chunk processado:', result);
            chunkCount++;
            status = `Chunk ${chunkCount} enviado (${(chunkBytes.length / 1024).toFixed(1)} KB)`;

        } catch (error) {
            console.error('Erro ao enviar chunk:', error);
            status = `Erro: ${error.message}`;
        }
    }

    startRecording() {
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
            chunkCount = 0;
            // Grava chunks a cada 2 segundos
            mediaRecorder.start(2000);
        }
    }

    stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    }
}
