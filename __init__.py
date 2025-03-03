from .canvas_node import CanvasNode

# 设置路由
CanvasNode.setup_routes()

NODE_CLASS_MAPPINGS = {
    "CanvasNode": CanvasNode,
    "DiyCanvasNode": CanvasNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "CanvasNode": "Canvas Node"
    "DiyCanvasNode": "DiyCanvasNode"
}

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"] 
