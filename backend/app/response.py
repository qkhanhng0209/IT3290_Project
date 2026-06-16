from flask import jsonify

def success(data=None, message=None, status=200):
    """
    Trả response thành công theo chuẩn chung của project
    
    Format:
    {
        "success": true,
        "data": ...
    }
    
    Nếu có message: 
    {
        "success": true,
        "message": "...",
        "data": ...
    }
    """
    
    response = {
        "success": True
    }
    
    if message is not None:
        response["message"] = message
        
    if data is not None:
        response["data"] = data
    else:
        response["data"] = None
        
    return jsonify(response), status

def error(message="Có lỗi xảy ra", status=400, details=None):
    """
    Trả response lỗi theo chuẩn chung của project.

    Format:
    {
        "success": false,
        "message": "..."
    }

    details chỉ dùng khi cần debug hoặc trả lỗi chi tiết.
    """
    response = {
        "success": False,
        "message": message
    }

    if details is not None:
        response["details"] = details

    return jsonify(response), status