import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { $el } from "../../scripts/ui.js";
import { Canvas } from "./Canvas.js";
import { MattingStatusIndicator } from "./MattingStatusIndicator.js";

async function createCanvasWidget(node, widget, app) {
    const canvas = new Canvas(node, widget);

    // 添加全局样式
    const style = document.createElement('style');
    style.textContent = `
        .painter-button {
            background: linear-gradient(to bottom, #4a4a4a, #3a3a3a);
            border: 1px solid #2a2a2a;
            border-radius: 4px;
            color: #ffffff;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 80px;
            text-align: center;
            margin: 2px;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }

        .painter-button:hover {
            background: linear-gradient(to bottom, #5a5a5a, #4a4a4a);
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .painter-button:active {
            background: linear-gradient(to bottom, #3a3a3a, #4a4a4a);
            transform: translateY(1px);
        }

        .painter-button.primary {
            background: linear-gradient(to bottom, #4a6cd4, #3a5cc4);
            border-color: #2a4cb4;
        }

        .painter-button.primary:hover {
            background: linear-gradient(to bottom, #5a7ce4, #4a6cd4);
        }

        .painter-controls {
            background: linear-gradient(to bottom, #404040, #383838);
            border-bottom: 1px solid #2a2a2a;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 8px;
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }

        .painter-container {
            background: #607080;  /* 带蓝色的灰色背景 */
            border: 1px solid #4a5a6a;
            border-radius: 6px;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
        }

        .painter-dialog {
            background: #404040;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            padding: 20px;
            color: #ffffff;
        }

        .painter-dialog input {
            background: #303030;
            border: 1px solid #505050;
            border-radius: 4px;
            color: #ffffff;
            padding: 4px 8px;
            margin: 4px;
            width: 80px;
        }

        .painter-dialog button {
            background: #505050;
            border: 1px solid #606060;
            border-radius: 4px;
            color: #ffffff;
            padding: 4px 12px;
            margin: 4px;
            cursor: pointer;
        }

        .painter-dialog button:hover {
            background: #606060;
        }

        .blend-opacity-slider {
            width: 100%;
            margin: 5px 0;
            display: none;
        }
        
        .blend-mode-active .blend-opacity-slider {
            display: block;
        }
        
        .blend-mode-item {
            padding: 5px;
            cursor: pointer;
            position: relative;
        }
        
        .blend-mode-item.active {
            background-color: rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);

    // 修改控制面板，使其高度自适应
    const controlPanel = $el("div.painterControlPanel", {}, [
        $el("div.controls.painter-controls", {
            style: {
                position: "absolute",
                top: "0",
                left: "0",
                right: "0",
                minHeight: "50px", // 改为最小高度
                zIndex: "10",
                background: "linear-gradient(to bottom, #404040, #383838)",
                borderBottom: "1px solid #2a2a2a",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                padding: "8px",
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                alignItems: "center"
            },
            // 添加监听器来动态整画布容器的位置
            onresize: (entries) => {
                const controlsHeight = entries[0].target.offsetHeight;
                canvasContainer.style.top = (controlsHeight + 10) + "px";
            }
        }, [
            $el("button.painter-button.primary", {
                textContent: "Add Image",
                onclick: () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = async (e) => {
                        for (const file of e.target.files) {
                            // 创建图片对象
                            const img = new Image();
                            img.onload = async () => {
                                // 计算适当的缩放比例
                                // const scale = Math.min(
                                //     canvas.width / img.width * 0.8,
                                //     canvas.height / img.height * 0.8
                                // );
                                
                                // 创建新图层
                                const layer = {
                                    image: img,
                                    x: (canvas.width - img.width) / 2,
                                    y: (canvas.height - img.height) / 2,
                                    width: img.width,
                                    height: img.height,
                                    rotation: 0,
                                    zIndex: canvas.layers.length
                                };
                                
                                // 添加图层并选中
                                canvas.layers.push(layer);
                                canvas.selectedLayer = layer;
                                
                                // 渲染画布
                                canvas.render();
                                
                                // 立即保存并触发输出更新
                                await canvas.saveToServer(widget.value);
                                
                                // 触发节点更新
                                app.graph.runStep();
                            };
                            img.src = URL.createObjectURL(file);
                        }
                    };
                    input.click();
                }
            }),
            $el("button.painter-button.primary", {
                textContent: "Import Input",
                onclick: async () => {
                    try {
                        console.log("Import Input clicked");
                        console.log("Node ID:", node.id);
                        
                        const response = await fetch(`/ycnode/get_canvas_data/${node.id}`);
                        console.log("Response status:", response.status);
                        
                        const result = await response.json();
                        console.log("Full response data:", result);
                        
                        if (result.success && result.data) {
                            if (result.data.image) {
                                console.log("Found image data, importing...");
                                await canvas.importImage({
                                    image: result.data.image,
                                    mask: result.data.mask,
                                    canvas_width: result.data.canvas_width,
                                    canvas_height: result.data.canvas_height
                                });
                                await canvas.saveToServer(widget.value);
                                app.graph.runStep();
                            } else {
                                throw new Error("No image data found in cache");
                            }
                        } else {
                            throw new Error("Invalid response format");
                        }
                        
                    } catch (error) {
                        console.error("Error importing input:", error);
                        alert(`Failed to import input: ${error.message}`);
                    }
                }
            }),
            $el("div.canvas-size-display", {
                style: {
                    background: "linear-gradient(to bottom, #3a3a3a, #2a2a2a)",
                    border: "1px solid #1a1a1a",
                    borderRadius: "4px",
                    color: "#ffffff",
                    padding: "6px 12px",
                    fontSize: "12px",
                    margin: "2px",
                    textAlign: "center",
                    minWidth: "120px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                },
                textContent: `画布尺寸: ${canvas.width}×${canvas.height}`
            }),
            $el("button.painter-button", {
                textContent: "Remove Layer",
                onclick: () => {
                    const index = canvas.layers.indexOf(canvas.selectedLayer);
                    canvas.removeLayer(index);
                }
            }),
            $el("button.painter-button", {
                textContent: "Rotate +90°",
                onclick: () => canvas.rotateLayer(90)
            }),
            $el("button.painter-button", {
                textContent: "Scale +5%",
                onclick: () => canvas.resizeLayer(1.05)
            }),
            $el("button.painter-button", {
                textContent: "Scale -5%",
                onclick: () => canvas.resizeLayer(0.95)
            }),
            $el("button.painter-button", {
                textContent: "Layer Up",
                onclick: async () => {
                    canvas.moveLayerUp();
                    await canvas.saveToServer(widget.value);
                    app.graph.runStep();
                }
            }),
            $el("button.painter-button", {
                textContent: "Layer Down",
                onclick: async () => {
                    canvas.moveLayerDown();
                    await canvas.saveToServer(widget.value);
                    app.graph.runStep();
                }
            }),
            // 添加水平镜像按钮
            $el("button.painter-button", {
                textContent: "Mirror H",
                onclick: () => {
                    canvas.mirrorHorizontal();
                }
            }),
            // 添加垂直镜像按钮
            $el("button.painter-button", {
                textContent: "Mirror V",
                onclick: () => {
                    canvas.mirrorVertical();
                }
            }),
            // 添加文字按钮
            $el("button.painter-button", {
                textContent: "添加文字",
                onclick: () => {
                    canvas.addTextLayer();
                }
            }),
            // 添加裁剪按钮
            $el("button.painter-button", {
                textContent: "裁剪模式",
                onclick: () => {
                    if (!canvas.selectedLayer) {
                        alert("请先选择一个图层");
                        return;
                    }
                    canvas.enterCroppingMode();
                    // 动态添加应用裁剪按钮
                    const applyButton = document.createElement('button');
                    applyButton.className = 'painter-button primary';
                    applyButton.textContent = '应用裁剪';
                    applyButton.id = 'apply-crop-button';
                    applyButton.onclick = async () => {
                        canvas.applyCropping();
                        // 应用裁剪后保存并更新
                        await canvas.saveToServer(widget.value);
                        app.graph.runStep();
                        // 移除应用裁剪按钮
                        const existingButton = document.getElementById('apply-crop-button');
                        if (existingButton) {
                            existingButton.remove();
                        }
                        // 移除取消裁剪按钮
                        const cancelButton = document.getElementById('cancel-crop-button');
                        if (cancelButton) {
                            cancelButton.remove();
                        }
                    };
                    
                    // 添加取消裁剪按钮
                    const cancelButton = document.createElement('button');
                    cancelButton.className = 'painter-button';
                    cancelButton.textContent = '取消裁剪';
                    cancelButton.id = 'cancel-crop-button';
                    cancelButton.onclick = () => {
                        canvas.exitCroppingMode();
                        // 移除应用裁剪按钮
                        const existingButton = document.getElementById('apply-crop-button');
                        if (existingButton) {
                            existingButton.remove();
                        }
                        // 移除取消裁剪按钮
                        cancelButton.remove();
                    };
                    
                    // 将按钮添加到控制面板
                    const controls = controlPanel.querySelector('.controls');
                    controls.appendChild(applyButton);
                    controls.appendChild(cancelButton);
                }
            }),
            // 在控制面板中添加抠图按钮
            $el("button.painter-button", {
                textContent: "Matting",
                onclick: async () => {
                    try {
                        if (!canvas.selectedLayer) {
                            throw new Error("Please select an image first");
                        }
                        
                        // 获取或创建状态指示器
                        const statusIndicator = MattingStatusIndicator.getInstance(controlPanel.querySelector('.controls'));
                        
                        // 添加状态监听
                        const updateStatus = (event) => {
                            const {status} = event.detail;
                            statusIndicator.setStatus(status);
                        };
                        
                        api.addEventListener("matting_status", updateStatus);
                        
                        try {
                            // 获取图像据
                            const imageData = await canvas.getLayerImageData(canvas.selectedLayer);
                            console.log("Sending image to server...");
                            
                            // 发送请求
                            const response = await fetch("/matting", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    image: imageData,
                                    threshold: 0.5,
                                    refinement: 1
                                })
                            });
                            
                            if (!response.ok) {
                                throw new Error(`Server error: ${response.status}`);
                            }
                            
                            const result = await response.json();
                            console.log("Creating new layer with matting result...");
                            
                            // 创建新图层
                            const mattedImage = new Image();
                            mattedImage.onload = async () => {
                                // 创建临时画布来处理透明度
                                const tempCanvas = document.createElement('canvas');
                                const tempCtx = tempCanvas.getContext('2d');
                                tempCanvas.width = canvas.selectedLayer.width;
                                tempCanvas.height = canvas.selectedLayer.height;
                                
                                // 绘制原始图像
                                tempCtx.drawImage(
                                    mattedImage,
                                    0, 0,
                                    tempCanvas.width, tempCanvas.height
                                );
                                
                                // 创建新图层
                                const newImage = new Image();
                                newImage.onload = async () => {
                                    const newLayer = {
                                        image: newImage,
                                        x: canvas.selectedLayer.x,
                                        y: canvas.selectedLayer.y,
                                        width: canvas.selectedLayer.width,
                                        height: canvas.selectedLayer.height,
                                        rotation: canvas.selectedLayer.rotation,
                                        zIndex: canvas.layers.length + 1
                                    };
                                    
                                    canvas.layers.push(newLayer);
                                    canvas.selectedLayer = newLayer;
                                    canvas.render();
                                    
                                    // 保存并更新
                                    await canvas.saveToServer(widget.value);
                                    app.graph.runStep();
                                };
                                
                                // 转换为PNG并保持透明度
                                newImage.src = tempCanvas.toDataURL('image/png');
                            };
                            
                            mattedImage.src = result.matted_image;
                            console.log("Matting result applied successfully");
                            
                        } finally {
                            api.removeEventListener("matting_status", updateStatus);
                        }
                        
                    } catch (error) {
                        console.error("Matting error:", error);
                        alert(`Error during matting process: ${error.message}`);
                    }
                }
            })
        ])
    ]);

    // 创建ResizeObserver来监控控制面板的高度变化
    const resizeObserver = new ResizeObserver((entries) => {
        const controlsHeight = entries[0].target.offsetHeight;
        canvasContainer.style.top = (controlsHeight + 10) + "px";
    });

    // 监控控制面板的大小变化
    resizeObserver.observe(controlPanel.querySelector('.controls'));

    // 获取触发器widget
    const triggerWidget = node.widgets.find(w => w.name === "trigger");
    
    // 创建更新函数
    const updateOutput = async () => {
        // 保存画布
        await canvas.saveToServer(widget.value);
        // 更新触发器值
        triggerWidget.value = (triggerWidget.value + 1) % 99999999;
        // 触发节点更新
        app.graph.runStep();
    };

    // 修改所有可能触发更新的操作
    const addUpdateToButton = (button) => {
        const origClick = button.onclick;
        button.onclick = async (...args) => {
            await origClick?.(...args);
            await updateOutput();
        };
    };

    // 为所有按钮添加更新逻辑
    controlPanel.querySelectorAll('button').forEach(addUpdateToButton);

    // 修改画布容器样式，使用动态top值
    const canvasContainer = $el("div.painterCanvasContainer.painter-container", {
        style: {
            position: "absolute",
            top: "60px", // 初始值
            left: "10px",
            right: "10px",
            bottom: "10px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden"
        }
    }, [canvas.canvas]);

    // 修改节点大小调整逻辑
    node.onResize = function() {
        const minSize = 300;
        const controlsElement = controlPanel.querySelector('.controls');
        const controlPanelHeight = controlsElement.offsetHeight; // 取实际高
        const padding = 20;
        
        // 保持节点宽度，高度根据画布比例调整
        const width = Math.max(this.size[0], minSize);
        const height = Math.max(
            width * (canvas.height / canvas.width) + controlPanelHeight + padding * 2,
            minSize + controlPanelHeight
        );
        
        this.size[0] = width;
        this.size[1] = height;
        
        // 计算画布的实际可用空间
        const availableWidth = width - padding * 2;
        const availableHeight = height - controlPanelHeight - padding * 2;
        
        // 更新画布尺寸，保持比例
        const scale = Math.min(
            availableWidth / canvas.width,
            availableHeight / canvas.height
        );
        
        canvas.canvas.style.width = (canvas.width * scale) + "px";
        canvas.canvas.style.height = (canvas.height * scale) + "px";
        
        // 强制重新渲染
        canvas.render();
    };

    // 添加拖拽事件监听
    canvas.canvas.addEventListener('mouseup', updateOutput);
    canvas.canvas.addEventListener('mouseleave', updateOutput);

    // 创建一个包含控制面板和画布的容器
    const mainContainer = $el("div.painterMainContainer", {
        style: {
            position: "relative",
            width: "100%",
            height: "100%"
        }
    }, [controlPanel, canvasContainer]);
    
    // 将画布尺寸显示元素与Canvas类关联
    canvas.canvasSizeDisplay = controlPanel.querySelector('.canvas-size-display');
    
    // 监听画布尺寸widget的变化
    const canvasWidthWidget = node.widgets.find(w => w.name === "canvas_width");
    const canvasHeightWidget = node.widgets.find(w => w.name === "canvas_height");
    
    if (canvasWidthWidget && canvasHeightWidget) {
        // 更新尺寸显示
        canvas.canvasSizeDisplay.textContent = `画布尺寸: ${canvasWidthWidget.value}×${canvasHeightWidget.value}`;
        
        // 添加监听器
        canvasWidthWidget.callback = function(value) {
            canvas.updateCanvasSize(value, canvas.height);
            canvas.canvasSizeDisplay.textContent = `画布尺寸: ${value}×${canvas.height}`;
        };
        
        canvasHeightWidget.callback = function(value) {
            canvas.updateCanvasSize(canvas.width, value);
            canvas.canvasSizeDisplay.textContent = `画布尺寸: ${canvas.width}×${value}`;
        };
    }

    // 将主容器添加到节点
    const mainWidget = node.addDOMWidget("mainContainer", "widget", mainContainer);

    // 设置节点的默认大小
    node.size = [500, 500]; // 设置初始大小为正方形

    // 在执行开始时保存数据
    api.addEventListener("execution_start", async () => {
        // 保存画布
        await canvas.saveToServer(widget.value);
        
        // 保存当前节点的输入数据
        if (node.inputs[0].link) {
            const linkId = node.inputs[0].link;
            const inputData = app.nodeOutputs[linkId];
            if (inputData) {
                ImageCache.set(linkId, inputData);
            }
        }
    });

    // 移除原来在 saveToServer 中的缓存清理
    const originalSaveToServer = canvas.saveToServer;
    canvas.saveToServer = async function(fileName) {
        const result = await originalSaveToServer.call(this, fileName);
        // 移除这里的缓存清理
        // ImageCache.clear();
        return result;
    };

    return {
        canvas: canvas,
        panel: controlPanel
    };
}

async function diyCanvasWidget(node, canvas, widget, app, controlPanel) {
    // 添加保存配置按钮
    const saveConfigButton = $el("button.painter-button.primary", {
        textContent: "保存配置",
        onclick: async () => {
            try {
                // 初始化文本元素数组
                const textElements = [];
                let backgroundImage = null;
                let customImage = null;
                
                // 检查是否有选中的图层
                if (!canvas.selectedLayer || canvas.selectedLayer.type === 'text') {
                    alert('请先选择一个图片作为自定义图片');
                    return;
                }

                // 创建临时画布用于合并背景图
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                
                // 处理图层
                canvas.layers.forEach(layer => {
                    if (layer.type === 'text') {
                        // 添加文本图层
                        textElements.push({
                            text: layer.text || "文本",
                            x: Math.round(layer.x),
                            y: Math.round(layer.y),
                            font: "msyh.ttc", // 默认字体
                            font_dir: "C:\\Windows\\Fonts",
                            size: layer.fontSize || 24,
                            color: layer.fontColor || "#000000",
                            align: "center" // 默认居中
                        });
                    } else if (layer === canvas.selectedLayer) {
                        // 选中的图层作为自定义图片
                        customImage = {
                            name: "主图",
                            description: "中心主要图片",
                            x: Math.round(layer.x),
                            y: Math.round(layer.y),
                            width: Math.round(layer.width),
                            height: Math.round(layer.height),
                            align: "center",
                            max_width: Math.round(layer.width),
                            max_height: Math.round(layer.height),
                            opacity: layer.opacity || 1.0
                        };
                    } else {
                        // 其他图片图层绘制到临时画布上
                        tempCtx.save();
                        tempCtx.globalAlpha = layer.opacity || 1.0;
                        tempCtx.translate(layer.x + layer.width/2, layer.y + layer.height/2);
                        tempCtx.rotate(layer.rotation * Math.PI / 180);
                        tempCtx.drawImage(
                            layer.image,
                            -layer.width/2,
                            -layer.height/2,
                            layer.width,
                            layer.height
                        );
                        tempCtx.restore();
                    }
                });
                
                // 创建背景图配置
                backgroundImage = {
                    description: "整体背景图片",
                    x: 0,
                    y: 0,
                    width: canvas.width,
                    height: canvas.height,
                    align: "center",
                    max_width: canvas.width,
                    max_height: canvas.height,
                    opacity: 1.0
                };
                
                // 创建新格式的配置
                const config = {
                    canvas: {
                        width: canvas.width,
                        height: canvas.height,
                        background_color: canvas.canvas.style.backgroundColor || "#FFFFFF00"
                    },
                    text_elements: textElements,
                    background_image: backgroundImage,
                    custom_image: customImage
                };

                // 将背景图片转换为base64
                const backgroundImageData = tempCanvas.toDataURL('image/png');

                // 准备发送到服务器的数据
                const saveData = {
                    config_path: node.widgets.find(w => w.name === "config_path").value,
                    config_data: config,
                    background_image: backgroundImageData
                };

                // 调用save_config_file接口
                const response = await fetch('/save_config_file', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(saveData)
                });

                const result = await response.json();
                if (result.success) {
                    alert('配置和背景图片已成功保存到服务器');
                } else {
                    throw new Error(result.error || '保存失败');
                }

                alert('配置已保存');
            } catch (error) {
                console.error('保存配置失败:', error);
                alert('保存配置失败: ' + error.message);
            }
        }
    });

    // 获取控制面板并添加按钮
    const controls = controlPanel.querySelector('.controls.painter-controls');
    if (controls) {
        controls.appendChild(saveConfigButton);
    }
}
// 修改缓存管理
const ImageCache = {
    cache: new Map(),
    
    // 存储图像数据
    set(key, imageData) {
        console.log("Caching image data for key:", key);
        this.cache.set(key, imageData);
    },
    
    // 获取图像数据
    get(key) {
        const data = this.cache.get(key);
        console.log("Retrieved cached data for key:", key, !!data);
        return data;
    },
    
    // 检查是否存在
    has(key) {
        return this.cache.has(key);
    },
    
    // 清除缓存
    clear() {
        console.log("Clearing image cache");
        this.cache.clear();
    }
};
app.registerExtension({
    name: "Comfy.CanvasNode",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeType.comfyClass === "CanvasNode") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = async function() {
                const r = onNodeCreated?.apply(this, arguments);
                
                const widget = this.widgets.find(w => w.name === "canvas_image");
                await createCanvasWidget(this, widget, app);
                
                return r;
            };
        } else if (nodeType.comfyClass === "DiyCanvasNode") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = async function() {
                const r = onNodeCreated?.apply(this, arguments);
                
                const widget = this.widgets.find(w => w.name === "canvas_image");
                const result = await createCanvasWidget(this, widget, app);
                await diyCanvasWidget(this, result.canvas, widget, app, result.panel);
                return r;
            };
        }
    }
});