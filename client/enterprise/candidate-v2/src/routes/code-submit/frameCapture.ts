import type { ImageCaptureInterface } from "./imageCaptureInterface";

export class frameCapture {
    videoEl: HTMLVideoElement;
    canvasEl: HTMLCanvasElement;
    isCapturing = false;
    intervalId: number;
    frameCount = 0;
    status = 'Parado';

    async captureFrameAsBytes(): Promise<Uint8Array> {
        const ctx = canvasEl.getContext('2d')!;

        // Desenha o frame atual do vídeo no canvas
        ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

        // Converte canvas para blob
        return new Promise((resolve) => {
            canvasEl.toBlob(async (blob) => {
                if (blob) {
                    const arrayBuffer = await blob.arrayBuffer();
                    resolve(new Uint8Array(arrayBuffer));
                }
            }, 'image/jpeg', 0.8); // 80% qualidade JPEG
        });
    }

    async sendFrameToBackend() {
        if (isCapturing) return;
        isCapturing = true;
        status = 'Enviando...';

        try {
            const frameBytes = await captureFrameAsBytes();

            // Envia para o backend
            const response = await fetch('/api/process-frame', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'X-Frame-Number': frameCount.toString(),
                    'X-Frame-Size': frameBytes.length.toString()
                },
                body: frameBytes
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Frame processado:', result);
            frameCount++;
            status = `Frame ${frameCount} enviado (${frameBytes.length} bytes)`;

        } catch (error) {
            console.error('Erro ao enviar frame:', error);
            status = `Erro: ${error.message}`;
        } finally {
            isCapturing = false;
        }
    }

    startAutoCapture() {
        if (intervalId) return;

        intervalId = setInterval(sendFrameToBackend, 500); // A cada 500ms
        status = 'Captura automática iniciada';
    }

    stopAutoCapture() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        status = 'Captura automática parada';
    }
}
