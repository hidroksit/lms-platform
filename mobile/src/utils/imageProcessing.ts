/**
 * Image Processing Utilities for OMR
 * Helper functions for image manipulation
 */

export interface ImageDimensions {
    width: number;
    height: number;
}

export class ImageProcessingUtils {
    /**
     * Convert image to grayscale
     * Formula: Gray = 0.299*R + 0.587*G + 0.114*B
     */
    static toGrayscale(imageData: ImageData): ImageData {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
            // Alpha channel (i+3) remains unchanged
        }

        return imageData;
    }

    /**
     * Apply Gaussian blur for noise reduction
     */
    static gaussianBlur(imageData: ImageData, radius: number = 5): ImageData {
        // Simplified blur implementation
        // In production: Use separable Gaussian kernel

        const { width, height, data } = imageData;
        const output = new ImageData(width, height);
        const kernel = this.createGaussianKernel(radius);
        const kernelSize = kernel.length;
        const half = Math.floor(kernelSize / 2);

        for (let y = half; y < height - half; y++) {
            for (let x = half; x < width - half; x++) {
                let r = 0, g = 0, b = 0;

                for (let ky = 0; ky < kernelSize; ky++) {
                    for (let kx = 0; kx < kernelSize; kx++) {
                        const px = x + kx - half;
                        const py = y + ky - half;
                        const idx = (py * width + px) * 4;
                        const weight = kernel[ky][kx];

                        r += data[idx] * weight;
                        g += data[idx + 1] * weight;
                        b += data[idx + 2] * weight;
                    }
                }

                const outIdx = (y * width + x) * 4;
                output.data[outIdx] = r;
                output.data[outIdx + 1] = g;
                output.data[outIdx + 2] = b;
                output.data[outIdx + 3] = data[outIdx + 3]; // Alpha
            }
        }

        return output;
    }

    /**
     * Binary thresholding
     * Converts grayscale to pure black/white
     */
    static threshold(imageData: ImageData, thresholdValue: number = 128): ImageData {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const value = data[i] > thresholdValue ? 255 : 0;
            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
        }

        return imageData;
    }

    /**
     * Adaptive thresholding
     * Better for forms with uneven lighting
     */
    static adaptiveThreshold(
        imageData: ImageData,
        blockSize: number = 11,
        constant: number = 2
    ): ImageData {
        const { width, height, data } = imageData;
        const output = new ImageData(width, height);
        const half = Math.floor(blockSize / 2);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Calculate local mean
                let sum = 0;
                let count = 0;

                for (let ky = -half; ky <= half; ky++) {
                    for (let kx = -half; kx <= half; kx++) {
                        const px = x + kx;
                        const py = y + ky;

                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            const idx = (py * width + px) * 4;
                            sum += data[idx];
                            count++;
                        }
                    }
                }

                const mean = sum / count;
                const idx = (y * width + x) * 4;
                const value = data[idx] > (mean - constant) ? 255 : 0;

                output.data[idx] = value;
                output.data[idx + 1] = value;
                output.data[idx + 2] = value;
                output.data[idx + 3] = data[idx + 3];
            }
        }

        return output;
    }

    /**
     * Create Gaussian kernel for blur
     */
    private static createGaussianKernel(size: number): number[][] {
        const kernel: number[][] = [];
        const sigma = size / 3;
        let sum = 0;

        for (let y = 0; y < size; y++) {
            kernel[y] = [];
            for (let x = 0; x < size; x++) {
                const dx = x - Math.floor(size / 2);
                const dy = y - Math.floor(size / 2);
                const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
                kernel[y][x] = value;
                sum += value;
            }
        }

        // Normalize
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                kernel[y][x] /= sum;
            }
        }

        return kernel;
    }

    /**
     * Calculate bubble fill percentage
     * Used to determine if bubble is marked
     */
    static calculateFillPercentage(
        imageData: ImageData,
        x: number,
        y: number,
        width: number,
        height: number
    ): number {
        const data = imageData.data;
        const imgWidth = imageData.width;
        let darkPixels = 0;
        let totalPixels = 0;

        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const px = x + dx;
                const py = y + dy;

                if (px >= 0 && px < imgWidth && py >= 0 && py < imageData.height) {
                    const idx = (py * imgWidth + px) * 4;
                    const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

                    if (brightness < 128) {
                        darkPixels++;
                    }
                    totalPixels++;
                }
            }
        }

        return totalPixels > 0 ? darkPixels / totalPixels : 0;
    }

    /**
     * Find edges using Sobel operator
     */
    static sobelEdgeDetection(imageData: ImageData): ImageData {
        const { width, height, data } = imageData;
        const output = new ImageData(width, height);

        // Sobel kernels
        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const pixel = data[idx];
                        gx += pixel * sobelX[ky + 1][kx + 1];
                        gy += pixel * sobelY[ky + 1][kx + 1];
                    }
                }

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const outIdx = (y * width + x) * 4;
                const value = Math.min(255, magnitude);

                output.data[outIdx] = value;
                output.data[outIdx + 1] = value;
                output.data[outIdx + 2] = value;
                output.data[outIdx + 3] = 255;
            }
        }

        return output;
    }
}

export default ImageProcessingUtils;
