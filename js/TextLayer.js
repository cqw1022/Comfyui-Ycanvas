// TextLayer.js - 文字图层功能实现

/**
 * 文字图层类 - 处理文字图层的创建、编辑和渲染
 */
export class TextLayer {
    constructor() {
        // 可用字体列表
        this.availableFonts = [
            { name: 'Arial', family: 'Arial, sans-serif' },
            { name: '宋体', family: '宋体, SimSun, serif' },
            { name: '黑体', family: '黑体, SimHei, sans-serif' },
            { name: '微软雅黑', family: '微软雅黑, Microsoft YaHei, sans-serif' },
            { name: 'Times New Roman', family: 'Times New Roman, serif' },
            { name: 'Courier New', family: 'Courier New, monospace' },
            { name: 'Georgia', family: 'Georgia, serif' },
            { name: 'Verdana', family: 'Verdana, sans-serif' }
        ];
        
        // 默认文字样式
        this.defaultStyle = {
            fontFamily: '微软雅黑, Microsoft YaHei, sans-serif',
            fontSize: 24,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left',
            textBaseline: 'top',
            fillStyle: '#ffffff',
            strokeStyle: '',
            strokeWidth: 0,
            lineHeight: 1.2,
            padding: 10,
            backgroundColor: '',
            borderColor: '',
            borderWidth: 0,
            borderRadius: 0,
            shadowColor: '',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0
        };
        
        // 自定义字体加载状态
        this.customFonts = [];
        this.loadedFonts = new Set();
    }
    
    /**
     * 创建新的文字图层
     * @param {Object} options - 文字图层选项
     * @returns {Object} 文字图层对象
     */
    createTextLayer(options = {}) {
        const defaultOptions = {
            text: '双击编辑文字',
            x: options.x || 0,  // 默认位置将由Canvas.js中的addTextLayer设置
            y: options.y || 0,  // 默认位置将由Canvas.js中的addTextLayer设置
            width: 200,
            height: 100,
            rotation: 0,
            zIndex: 1000,
            blendMode: 'normal',
            opacity: 1,
            isEditing: false,
            style: { ...this.defaultStyle }
        };
        
        return { ...defaultOptions, ...options, type: 'text' };
    }
    
    /**
     * 渲染文字图层到画布
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} layer - 文字图层对象
     */
    renderTextLayer(ctx, layer) {
        ctx.save();
        
        // 应用混合模式和透明度
        ctx.globalCompositeOperation = layer.blendMode || 'normal';
        ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;
        
        // 应用变换
        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        ctx.rotate(layer.rotation * Math.PI / 180);
        
        const style = layer.style || this.defaultStyle;
        const padding = style.padding || 10;
        
        // 绘制背景和边框（如果有）
        if (style.backgroundColor) {
            ctx.fillStyle = style.backgroundColor;
            if (style.borderRadius > 0) {
                this.roundRect(
                    ctx, 
                    -layer.width / 2, 
                    -layer.height / 2, 
                    layer.width, 
                    layer.height, 
                    style.borderRadius
                );
                ctx.fill();
            } else {
                ctx.fillRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
            }
        }
        
        if (style.borderWidth > 0 && style.borderColor) {
            ctx.lineWidth = style.borderWidth;
            ctx.strokeStyle = style.borderColor;
            if (style.borderRadius > 0) {
                this.roundRect(
                    ctx, 
                    -layer.width / 2, 
                    -layer.height / 2, 
                    layer.width, 
                    layer.height, 
                    style.borderRadius
                );
                ctx.stroke();
            } else {
                ctx.strokeRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
            }
        }
        
        // 设置文字样式
        ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
        ctx.textAlign = style.textAlign || 'left';
        ctx.textBaseline = style.textBaseline || 'top';
        
        // 应用阴影（如果有）
        if (style.shadowColor && style.shadowBlur > 0) {
            ctx.shadowColor = style.shadowColor;
            ctx.shadowBlur = style.shadowBlur;
            ctx.shadowOffsetX = style.shadowOffsetX || 0;
            ctx.shadowOffsetY = style.shadowOffsetY || 0;
        }
        
        // 计算文本位置
        let textX = -layer.width / 2 + padding;
        if (style.textAlign === 'center') {
            textX = 0;
        } else if (style.textAlign === 'right') {
            textX = layer.width / 2 - padding;
        }
        
        const textY = -layer.height / 2 + padding;
        
        // 处理多行文本
        const lineHeight = style.fontSize * (style.lineHeight || 1.2);
        const lines = layer.text.split('\n');
        
        // 绘制文本
        ctx.fillStyle = style.fillStyle || '#FFFFFF';
        lines.forEach((line, index) => {
            const y = textY + index * lineHeight;
            
            // 如果有描边
            if (style.strokeStyle && style.strokeWidth > 0) {
                ctx.lineWidth = style.strokeWidth;
                ctx.strokeStyle = style.strokeStyle;
                ctx.strokeText(line, textX, y);
            }
            
            ctx.fillText(line, textX, y);
        });
        
        // 如果处于编辑状态，绘制编辑指示器
        if (layer.isEditing) {
            ctx.strokeStyle = '#0078d7';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(
                -layer.width / 2 - 2, 
                -layer.height / 2 - 2, 
                layer.width + 4, 
                layer.height + 4
            );
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制圆角矩形
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    /**
     * 计算文本尺寸
     * @param {string} text - 文本内容
     * @param {Object} style - 文本样式
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @returns {Object} 文本尺寸 {width, height}
     */
    calculateTextSize(text, style, ctx) {
        ctx.save();
        ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
        
        const lines = text.split('\n');
        const lineHeight = style.fontSize * (style.lineHeight || 1.2);
        
        let maxWidth = 0;
        lines.forEach(line => {
            const metrics = ctx.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
        });
        
        const height = lines.length * lineHeight;
        const padding = style.padding || 10;
        
        ctx.restore();
        
        return {
            width: maxWidth + padding * 2,
            height: height + padding * 2
        };
    }
    
    /**
     * 加载自定义字体
     * @param {string} fontUrl - 字体文件URL
     * @param {string} fontFamily - 字体名称
     * @returns {Promise} 加载完成的Promise
     */
    async loadCustomFont(fontUrl, fontFamily) {
        if (this.loadedFonts.has(fontFamily)) {
            return Promise.resolve();
        }
        
        try {
            const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
            const loadedFont = await fontFace.load();
            
            // 添加到字体列表
            document.fonts.add(loadedFont);
            this.loadedFonts.add(fontFamily);
            
            // 添加到可用字体列表
            this.availableFonts.push({
                name: fontFamily,
                family: fontFamily
            });
            
            return Promise.resolve();
        } catch (error) {
            console.error(`Failed to load font: ${fontFamily}`, error);
            return Promise.reject(error);
        }
    }
    
    /**
     * 创建文本编辑器
     * @param {Object} layer - 文字图层
     * @param {HTMLElement} container - 容器元素
     * @param {Function} onUpdate - 更新回调
     * @returns {HTMLElement} 编辑器元素
     */
    createTextEditor(layer, container, onUpdate) {
        // 创建编辑器元素
        const editor = document.createElement('div');
        editor.className = 'text-layer-editor';
        editor.contentEditable = 'true';
        editor.spellcheck = false;
        
        // 设置样式
        const style = layer.style || this.defaultStyle;
        editor.style.position = 'absolute';
        editor.style.left = `${layer.x}px`;
        editor.style.top = `${layer.y}px`;
        editor.style.width = `${layer.width}px`;
        editor.style.height = `${layer.height}px`;
        editor.style.transform = `rotate(${layer.rotation}deg)`;
        editor.style.transformOrigin = 'center center';
        editor.style.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
        editor.style.color = style.fillStyle || '#ffffff';
        editor.style.textAlign = style.textAlign || 'left';
        editor.style.padding = `${style.padding || 10}px`;
        editor.style.lineHeight = style.lineHeight || 1.2;
        editor.style.backgroundColor = style.backgroundColor || 'transparent';
        editor.style.border = style.borderWidth > 0 ? 
            `${style.borderWidth}px ${style.borderColor} solid` : 'none';
        editor.style.borderRadius = `${style.borderRadius || 0}px`;
        editor.style.boxSizing = 'border-box';
        editor.style.overflow = 'hidden';
        editor.style.zIndex = '1000';
        editor.style.boxShadow = style.shadowColor ? 
            `${style.shadowOffsetX || 0}px ${style.shadowOffsetY || 0}px ${style.shadowBlur || 0}px ${style.shadowColor}` : 'none';
        editor.style.textDecoration = style.textDecoration || 'none';
        editor.style.fontStyle = style.fontStyle || 'normal';
        editor.style.fontWeight = style.fontWeight || 'normal';
        
        // 设置内容
        editor.textContent = layer.text;
        
        // 添加到容器
        container.appendChild(editor);
        
        // 聚焦并选中所有文本
        setTimeout(() => {
            editor.focus();
            document.execCommand('selectAll', false, null);
        }, 0);
        
        // 添加事件监听器
        editor.addEventListener('input', () => {
            layer.text = editor.textContent;
            onUpdate();
        });
        
        editor.addEventListener('blur', () => {
            layer.isEditing = false;
            container.removeChild(editor);
            onUpdate();
        });
        
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                editor.blur();
            }
        });

        // 添加拖拽功能
        let isDragging = false;
        let startX, startY;
        let originalX, originalY;

        editor.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // 左键点击
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                originalX = layer.x;
                originalY = layer.y;
                editor.style.cursor = 'move';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                layer.x = originalX + deltaX;
                layer.y = originalY + deltaY;
                editor.style.left = `${layer.x}px`;
                editor.style.top = `${layer.y}px`;
                onUpdate();
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                editor.style.cursor = 'text';
            }
        });

        // 添加右键菜单
        editor.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const styleEditor = this.createStyleEditor(layer, onUpdate);
            styleEditor.style.left = `${e.clientX}px`;
            styleEditor.style.top = `${e.clientY}px`;
            document.body.appendChild(styleEditor);
        });
        
        return editor;
    }
    
    /**
     * 创建文字样式编辑器
     * @param {Object} layer - 文字图层
     * @param {Function} onUpdate - 更新回调
     * @returns {HTMLElement} 样式编辑器元素
     */
    createStyleEditor(layer, onUpdate) {
        const editor = document.createElement('div');
        editor.className = 'text-style-editor';
        editor.style.position = 'absolute';
        editor.style.zIndex = '1001';
        editor.style.backgroundColor = '#404040';
        editor.style.borderRadius = '8px';
        editor.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        editor.style.padding = '15px';
        editor.style.color = '#ffffff';
        editor.style.width = '280px';
        
        // 创建样式编辑器内容
        const content = document.createElement('div');
        content.className = 'text-style-content';
        
        // 字体选择
        const fontFamilyGroup = this.createFormGroup('字体');
        const fontSelect = document.createElement('select');
        fontSelect.className = 'text-style-select';
        fontSelect.style.width = '100%';
        fontSelect.style.padding = '5px';
        fontSelect.style.backgroundColor = '#303030';
        fontSelect.style.color = '#ffffff';
        fontSelect.style.border = '1px solid #505050';
        fontSelect.style.borderRadius = '4px';
        
        this.availableFonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font.family;
            option.textContent = font.name;
            option.style.fontFamily = font.family;
            if (layer.style.fontFamily === font.family) {
                option.selected = true;
            }
            fontSelect.appendChild(option);
        });
        
        fontSelect.addEventListener('change', () => {
            layer.style.fontFamily = fontSelect.value;
            onUpdate();
        });
        
        fontFamilyGroup.appendChild(fontSelect);
        content.appendChild(fontFamilyGroup);
        
        // 字体大小
        const fontSizeGroup = this.createFormGroup('字号');
        const fontSizeInput = document.createElement('input');
        fontSizeInput.type = 'number';
        fontSizeInput.min = '8';
        fontSizeInput.max = '200';
        fontSizeInput.value = layer.style.fontSize;
        fontSizeInput.className = 'text-style-input';
        fontSizeInput.style.width = '60px';
        fontSizeInput.style.padding = '5px';
        fontSizeInput.style.backgroundColor = '#303030';
        fontSizeInput.style.color = '#ffffff';
        fontSizeInput.style.border = '1px solid #505050';
        fontSizeInput.style.borderRadius = '4px';
        
        fontSizeInput.addEventListener('change', () => {
            layer.style.fontSize = parseInt(fontSizeInput.value, 10);
            onUpdate();
        });
        
        fontSizeGroup.appendChild(fontSizeInput);
        content.appendChild(fontSizeGroup);
        
        // 文字颜色
        const colorGroup = this.createFormGroup('颜色');
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = layer.style.fillStyle || '#ffffff';
        colorInput.className = 'text-style-color';
        colorInput.style.width = '40px';
        colorInput.style.height = '30px';
        colorInput.style.border = 'none';
        colorInput.style.padding = '0';
        colorInput.style.backgroundColor = 'transparent';
        
        colorInput.addEventListener('change', () => {
            layer.style.fillStyle = colorInput.value;
            onUpdate();
        });
        
        colorGroup.appendChild(colorInput);
        content.appendChild(colorGroup);
        
        // 文字样式控制（加粗、斜体、下划线）
        const styleControlsGroup = this.createFormGroup('文字样式');
        const styleControls = document.createElement('div');
        styleControls.style.display = 'flex';
        styleControls.style.gap = '10px';
        
        // 加粗按钮
        const boldButton = document.createElement('button');
        boldButton.type = 'button';
        boldButton.textContent = 'B';
        boldButton.title = '加粗';
        boldButton.style.fontWeight = 'bold';
        boldButton.style.width = '30px';
        boldButton.style.height = '30px';
        boldButton.style.backgroundColor = layer.style.fontWeight === 'bold' ? '#505050' : '#303030';
        boldButton.style.color = '#ffffff';
        boldButton.style.border = '1px solid #505050';
        boldButton.style.borderRadius = '4px';
        boldButton.style.cursor = 'pointer';
        
        boldButton.addEventListener('click', () => {
            layer.style.fontWeight = layer.style.fontWeight === 'bold' ? 'normal' : 'bold';
            boldButton.style.backgroundColor = layer.style.fontWeight === 'bold' ? '#505050' : '#303030';
            onUpdate();
        });
        
        // 斜体按钮
        const italicButton = document.createElement('button');
        italicButton.type = 'button';
        italicButton.textContent = 'I';
        italicButton.title = '斜体';
        italicButton.style.fontStyle = 'italic';
        italicButton.style.width = '30px';
        italicButton.style.height = '30px';
        italicButton.style.backgroundColor = layer.style.fontStyle === 'italic' ? '#505050' : '#303030';
        italicButton.style.color = '#ffffff';
        italicButton.style.border = '1px solid #505050';
        italicButton.style.borderRadius = '4px';
        italicButton.style.cursor = 'pointer';
        
        italicButton.addEventListener('click', () => {
            layer.style.fontStyle = layer.style.fontStyle === 'italic' ? 'normal' : 'italic';
            italicButton.style.backgroundColor = layer.style.fontStyle === 'italic' ? '#505050' : '#303030';
            onUpdate();
        });
        
        // 下划线按钮
        const underlineButton = document.createElement('button');
        underlineButton.type = 'button';
        underlineButton.textContent = 'U';
        underlineButton.title = '下划线';
        underlineButton.style.textDecoration = 'underline';
        underlineButton.style.width = '30px';
        underlineButton.style.height = '30px';
        underlineButton.style.backgroundColor = layer.style.textDecoration === 'underline' ? '#505050' : '#303030';
        underlineButton.style.color = '#ffffff';
        underlineButton.style.border = '1px solid #505050';
        underlineButton.style.borderRadius = '4px';
        underlineButton.style.cursor = 'pointer';
        
        underlineButton.addEventListener('click', () => {
            layer.style.textDecoration = layer.style.textDecoration === 'underline' ? 'none' : 'underline';
            underlineButton.style.backgroundColor = layer.style.textDecoration === 'underline' ? '#505050' : '#303030';
            onUpdate();
        });
        
        styleControls.appendChild(boldButton);
        styleControls.appendChild(italicButton);
        styleControls.appendChild(underlineButton);
        styleControlsGroup.appendChild(styleControls);
        content.appendChild(styleControlsGroup);
        
        // 添加关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '关闭';
        closeButton.style.marginTop = '15px';
        closeButton.style.padding = '5px 10px';
        closeButton.style.backgroundColor = '#505050';
        closeButton.style.color = '#ffffff';
        closeButton.style.border = '1px solid #606060';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.width = '100%';
        
        closeButton.addEventListener('click', () => {
            if (editor.parentNode) {
                editor.parentNode.removeChild(editor);
            }
        });
        
        content.appendChild(closeButton);
        editor.appendChild(content);
        
        return editor;
    }
    
    /**
     * 创建表单组
     * @param {string} label - 标签文本
     * @returns {HTMLElement} 表单组元素
     */
    createFormGroup(label) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.style.marginBottom = '10px';
        
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.style.display = 'block';
        labelElement.style.marginBottom = '5px';
        labelElement.style.fontSize = '12px';
        
        group.appendChild(labelElement);
        return group;
    }
}