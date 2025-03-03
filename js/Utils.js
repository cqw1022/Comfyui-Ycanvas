

// 验证 ComfyUI 的图像数据格式
function validateImageData(data) {
    // 打印完整的输入数据结构
    console.log("Validating data structure:", {
        hasData: !!data,
        type: typeof data,
        isArray: Array.isArray(data),
        keys: data ? Object.keys(data) : null,
        shape: data?.shape,
        dataType: data?.data ? data.data.constructor.name : null,
        fullData: data  // 打印完整数据
    });

    // 检查是否为空
    if (!data) {
        console.log("Data is null or undefined");
        return false;
    }

    // 如果是数组，获取第一个元素
    if (Array.isArray(data)) {
        console.log("Data is array, getting first element");
        data = data[0];
    }

    // 检查数据结构
    if (!data || typeof data !== 'object') {
        console.log("Invalid data type");
        return false;
    }

    // 检查是否有数据属性
    if (!data.data) {
        console.log("Missing data property");
        return false;
    }

    // 检查数据类型
    if (!(data.data instanceof Float32Array)) {
        // 如果不是 Float32Array，尝试转换
        try {
            data.data = new Float32Array(data.data);
        } catch (e) {
            console.log("Failed to convert data to Float32Array:", e);
            return false;
        }
    }

    return true;
}

// 转换 ComfyUI 图像数据为画布可用格式
function convertImageData(data) {
    console.log("Converting image data:", data);
    
    // 如果是数组，获取第一个元素
    if (Array.isArray(data)) {
        data = data[0];
    }

    // 获取维度信息 [batch, height, width, channels]
    const shape = data.shape;
    const height = shape[1];  // 1393
    const width = shape[2];   // 1393
    const channels = shape[3]; // 3
    const floatData = new Float32Array(data.data);
    
    console.log("Processing dimensions:", { height, width, channels });
    
    // 创建画布格式的数据 (RGBA)
    const rgbaData = new Uint8ClampedArray(width * height * 4);
    
    // 转换数据格式 [batch, height, width, channels] -> RGBA
    for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
            const pixelIndex = (h * width + w) * 4;
            const tensorIndex = (h * width + w) * channels;
            
            // 复制 RGB 通道并转换值范围 (0-1 -> 0-255)
            for (let c = 0; c < channels; c++) {
                const value = floatData[tensorIndex + c];
                rgbaData[pixelIndex + c] = Math.max(0, Math.min(255, Math.round(value * 255)));
            }
            
            // 设置 alpha 通道为完全不透明
            rgbaData[pixelIndex + 3] = 255;
        }
    }
    
    // 返回画布可用的格式
    return {
        data: rgbaData,       // Uint8ClampedArray 格式的 RGBA 数据
        width: width,         // 图像宽度
        height: height        // 图像高度
    };
}

// 处理遮罩数据
function applyMaskToImageData(imageData, maskData) {
    console.log("Applying mask to image data");
    
    const rgbaData = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    // 获取遮罩数据 [batch, height, width]
    const maskShape = maskData.shape;
    const maskFloatData = new Float32Array(maskData.data);
    
    console.log(`Applying mask of shape: ${maskShape}`);
    
    // 将遮罩数据应用到 alpha 通道
    for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
            const pixelIndex = (h * width + w) * 4;
            const maskIndex = h * width + w;
            // 使遮罩值作为 alpha 值，转换值范围从 0-1 到 0-255
            const alpha = maskFloatData[maskIndex];
            rgbaData[pixelIndex + 3] = Math.max(0, Math.min(255, Math.round(alpha * 255)));
        }
    }
    
    console.log("Mask application completed");
    
    return {
        data: rgbaData,
        width: width,
        height: height
    };
}

// 改进数据准备函数
function prepareImageForCanvas(inputImage) {
    console.log("Preparing image for canvas:", inputImage);
    
    try {
        // 如果是数组，获取第一个元素
        if (Array.isArray(inputImage)) {
            inputImage = inputImage[0];
        }

        if (!inputImage || !inputImage.shape || !inputImage.data) {
            throw new Error("Invalid input image format");
        }

        // 获取维度信息 [batch, height, width, channels]
        const shape = inputImage.shape;
        const height = shape[1];
        const width = shape[2];
        const channels = shape[3];
        const floatData = new Float32Array(inputImage.data);
        
        console.log("Image dimensions:", { height, width, channels });
        
        // 创建 RGBA 格式数据
        const rgbaData = new Uint8ClampedArray(width * height * 4);
        
        // 转换数据格式 [batch, height, width, channels] -> RGBA
        for (let h = 0; h < height; h++) {
            for (let w = 0; w < width; w++) {
                const pixelIndex = (h * width + w) * 4;
                const tensorIndex = (h * width + w) * channels;
                
                // 转换 RGB 通道 (0-1 -> 0-255)
                for (let c = 0; c < channels; c++) {
                    const value = floatData[tensorIndex + c];
                    rgbaData[pixelIndex + c] = Math.max(0, Math.min(255, Math.round(value * 255)));
                }
                
                // 设置 alpha 通道
                rgbaData[pixelIndex + 3] = 255;
            }
        }
        
        // 返回画布需要的格式
        return {
            data: rgbaData,
            width: width,
            height: height
        };
    } catch (error) {
        console.error("Error preparing image:", error);
        throw new Error(`Failed to prepare image: ${error.message}`);
    }
}

async function handleImportInput(data) {
    if (data && data.image) {
        const imageData = data.image;
        await importImage(imageData);
    }
}
