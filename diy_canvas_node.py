
import os
import json
import base64
from io import BytesIO
from aiohttp import web
from server import PromptServer
from .canvas_node import CanvasNode

class DiyCanvasNode(CanvasNode):
    
    def __init__(self):
        super().__init__()

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "canvas_image": ("STRING", {"default": "canvas_image.png"}),
                "canvas_width": ("INT", {"default": 512, "min": 64, "max": 8192, "step": 8}),
                "canvas_height": ("INT", {"default": 512, "min": 64, "max": 8192, "step": 8}),
                "config_path": ("STRING", {"default": "", "label": "Config Path"}),
                "trigger": ("INT", {"default": 0, "min": 0, "max": 99999999, "step": 1, "hidden": True}),
                "output_switch": ("BOOLEAN", {"default": True}),
                "cache_enabled": ("BOOLEAN", {"default": True, "label": "Enable Cache"}),
            },
            "optional": {
                "input_image": ("IMAGE",),
                "input_mask": ("MASK",)
            }
        }
    
    RETURN_TYPES = ("IMAGE", "MASK")
    RETURN_NAMES = ("image", "mask")
    FUNCTION = "process_canvas_image_diy"
    CATEGORY = "Ycanvas"

    def process_canvas_image_diy(self, canvas_image, canvas_width, canvas_height, config_path, trigger, output_switch, cache_enabled, input_image=None, input_mask=None):
        result = super().process_canvas_image(canvas_image, canvas_width, canvas_height, trigger, output_switch, cache_enabled, input_image, input_mask)
        return result
        # (processed_image, processed_mask)


@PromptServer.instance.routes.post("/save_config_file")
async def save_config_file(request):
    try:
        data = await request.json()
        
        # 获取配置路径和图片数据
        config_path = data.get('config_path', '')
        config_data = data.get('config_data', {})
        background_image = data.get('background_image', '')
        
        if not config_path:
            return web.json_response({'success': False, 'error': '配置路径不能为空'})
        
        # 确保目录存在
        config_dir = os.path.dirname(config_path)
        if not os.path.exists(config_dir):
            os.makedirs(config_dir, exist_ok=True)
        
        # 保存配置文件
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, ensure_ascii=False, indent=2)
        
        # 如果有背景图片，保存到相同目录
        if background_image and background_image.startswith('data:image'):
            # 从base64数据中提取图片
            image_data = background_image.split(',')[1]
            image_bytes = base64.b64decode(image_data)
            
            # 构建图片保存路径
            image_filename = os.path.splitext(os.path.basename(config_path))[0] + '_bg.png'
            image_path = os.path.join(config_dir, image_filename)
            
            # 保存图片
            with open(image_path, 'wb') as f:
                f.write(image_bytes)
            
            print(f"背景图片已保存到: {image_path}")
        
        print(f"配置文件已保存到: {config_path}")
        return web.json_response({'success': True, 'message': '配置和背景图片已保存'})
    except Exception as e:
        print("Error saving config file:", str(e))
        traceback.print_exc()
        return web.json_response({'success': False, 'error': str(e)})
