/**
 * client/src/lib/image-compress.ts
 * Client-side utility to resize and compress images before uploading to the AI OCR pipeline.
 * This prevents timeouts on slow network connections (like Serveo/Ngrok tunnels)
 * and keeps token costs low while preserving text legibility.
 */

export interface ProcessedFileResult {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

export function compressFileForOcr(file: File): Promise<ProcessedFileResult> {
  return new Promise((resolve, reject) => {
    // If it's a PDF, we don't compress/modify it - read as-is
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        resolve({ base64, mimeType: "application/pdf", dataUrl });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    // It's an image - compress and resize using HTML5 Canvas
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback if canvas context cannot be created
            const dataUrl = e.target?.result as string;
            const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
            resolve({ base64, mimeType: file.type, dataUrl });
            return;
          }

          // Target maximum dimensions (3000px preserves details for low-contrast/blurry phone photos)
          const MAX_WIDTH = 3000;
          const MAX_HEIGHT = 3000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with 0.95 quality to dramatically reduce size while keeping text sharp
          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
          const base64 = dataUrl.split(",")[1];
          resolve({ base64, mimeType: "image/jpeg", dataUrl });
        } catch (err) {
          // Fallback to original file base64 on error
          const dataUrl = e.target?.result as string;
          const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
          resolve({ base64, mimeType: file.type, dataUrl });
        }
      };
      img.onerror = () => {
        // Fallback to original file base64 if image loading fails
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        resolve({ base64, mimeType: file.type, dataUrl });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
