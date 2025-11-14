#!/usr/bin/env python3
"""
OMR 이미지 처리 스크립트
Node.js에서 호출되어 이미지를 처리하고 결과를 JSON으로 반환합니다.
"""

import sys
import json
from omr_scanner import process_omr_image

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "이미지 경로가 제공되지 않았습니다"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    total_questions = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    
    try:
        # 이미지 파일 읽기
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        # OMR 처리
        answers = process_omr_image(image_data, total_questions)
        
        # 결과를 JSON으로 출력
        result = {
            "success": True,
            "answers": answers,
            "message": f"{len(answers)}개 답안을 인식했습니다"
        }
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "message": f"OMR 처리 중 오류 발생: {str(e)}"
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
