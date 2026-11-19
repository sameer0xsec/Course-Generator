/**
 * Utility functions for image processing
 */

/**
 * Resize an image to fit within specified dimensions while maintaining aspect ratio
 * @param {File} file - The image file to resize
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @returns {Promise<string>} - Promise that resolves to a data URL of the resized image
 */
export const resizeImage = (file, maxWidth = 800, maxHeight = 600) => {
  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const dataURL = canvas.toDataURL(file.type, 0.8); // 80% quality
        resolve(dataURL);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Convert image to specific dimensions with cropping if necessary
 * @param {File} file - The image file to process
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @returns {Promise<string>} - Promise that resolves to a data URL of the processed image
 */
export const cropAndResizeImage = (file, width = 800, height = 600) => {
  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas with target dimensions
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Calculate dimensions to cover the canvas while maintaining aspect ratio
        const sourceWidth = img.width;
        const sourceHeight = img.height;
        const sourceRatio = sourceWidth / sourceHeight;
        const targetRatio = width / height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (sourceRatio > targetRatio) {
          // Image is wider than target, crop sides
          drawHeight = sourceHeight;
          drawWidth = sourceHeight * targetRatio;
          offsetX = (sourceWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller than target, crop top/bottom
          drawWidth = sourceWidth;
          drawHeight = sourceWidth / targetRatio;
          offsetX = 0;
          offsetY = (sourceHeight - drawHeight) / 2;
        }

        // Draw the image on canvas
        ctx.drawImage(
          img,
          offsetX,
          offsetY,
          drawWidth,
          drawHeight,
          0,
          0,
          width,
          height
        );

        // Convert to data URL
        const dataURL = canvas.toDataURL(file.type, 0.8); // 80% quality
        resolve(dataURL);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};