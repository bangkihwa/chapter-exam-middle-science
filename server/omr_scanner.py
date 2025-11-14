import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
import base64
from io import BytesIO
from PIL import Image

class OMRScanner:
    """
    OMR 답안지 이미지를 처리하여 학생이 체크한 답안을 자동으로 인식하는 클래스
    """
    
    def __init__(self, total_questions: int = 30, choices_per_question: int = 5):
        self.total_questions = total_questions
        self.choices_per_question = choices_per_question
        
    def process_image(self, image_data: bytes) -> Dict[int, str]:
        """
        OMR 이미지를 처리하여 답안을 추출합니다.
        
        Args:
            image_data: 이미지 바이트 데이터
            
        Returns:
            Dict[int, str]: {문제번호: 답안} 형식의 딕셔너리
            예: {1: "1", 2: "3", 5: "2,4"}  (복수 정답은 쉼표로 구분)
        """
        try:
            # 이미지 로드
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("이미지를 로드할 수 없습니다")
            
            # 이미지 전처리
            processed = self._preprocess_image(image)
            
            # 답안지 영역 감지 및 변환
            warped = self._detect_and_warp_paper(image, processed)
            
            if warped is None:
                raise ValueError("답안지를 감지할 수 없습니다. 4개 모서리가 모두 보이는지 확인하세요.")
            
            # 버블 감지 및 답안 추출
            answers = self._extract_answers(warped)
            
            return answers
            
        except Exception as e:
            raise Exception(f"OMR 처리 중 오류 발생: {str(e)}")
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """이미지 전처리: 그레이스케일, 블러, 이진화"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edged = cv2.Canny(blurred, 75, 200)
        return edged
    
    def _detect_and_warp_paper(self, image: np.ndarray, edged: np.ndarray) -> Optional[np.ndarray]:
        """
        답안지 영역을 감지하고 원근 변환을 적용하여 정면 뷰를 얻습니다.
        4개 모서리의 검은 마커를 찾아 답안지를 인식합니다.
        """
        # 윤곽선 찾기
        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if len(contours) == 0:
            return None
        
        # 가장 큰 사각형 윤곽선 찾기 (답안지)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        paper_contour = None
        for contour in contours[:10]:
            perimeter = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
            
            # 사각형 (4개 꼭지점) 찾기
            if len(approx) == 4:
                paper_contour = approx
                break
        
        if paper_contour is None:
            return None
        
        # 원근 변환 적용
        warped = self._four_point_transform(image, paper_contour.reshape(4, 2))
        return warped
    
    def _four_point_transform(self, image: np.ndarray, pts: np.ndarray) -> np.ndarray:
        """4점 원근 변환"""
        # 점들을 정렬: [top-left, top-right, bottom-right, bottom-left]
        rect = self._order_points(pts)
        (tl, tr, br, bl) = rect
        
        # 새로운 이미지의 너비 계산
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        
        # 새로운 이미지의 높이 계산
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        
        # 변환될 좌표
        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]
        ], dtype="float32")
        
        # 원근 변환 매트릭스 계산 및 적용
        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
        
        return warped
    
    def _order_points(self, pts: np.ndarray) -> np.ndarray:
        """4개 점을 [top-left, top-right, bottom-right, bottom-left] 순서로 정렬"""
        rect = np.zeros((4, 2), dtype="float32")
        
        # 합이 가장 작은 점이 top-left, 가장 큰 점이 bottom-right
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        
        # 차이가 가장 작은 점이 top-right, 가장 큰 점이 bottom-left
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
        return rect
    
    def _extract_answers(self, warped_image: np.ndarray) -> Dict[int, str]:
        """
        변환된 답안지 이미지에서 버블을 감지하고 답안을 추출합니다.
        """
        # 그레이스케일 및 이진화
        gray = cv2.cvtColor(warped_image, cv2.COLOR_BGR2GRAY)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
        
        # 버블 윤곽선 찾기
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # 버블로 보이는 윤곽선 필터링
        bubble_contours = []
        for contour in contours:
            (x, y, w, h) = cv2.boundingRect(contour)
            aspect_ratio = w / float(h)
            
            # 원형에 가까운 것만 선택 (aspect ratio가 1에 가까움)
            # 크기도 적절한 범위 내에 있어야 함
            if w >= 15 and h >= 15 and w <= 50 and h <= 50 and aspect_ratio >= 0.7 and aspect_ratio <= 1.3:
                bubble_contours.append(contour)
        
        if len(bubble_contours) == 0:
            raise ValueError("버블을 찾을 수 없습니다. 이미지 품질을 확인하세요.")
        
        # 버블을 위에서 아래로, 왼쪽에서 오른쪽으로 정렬
        bubble_contours = self._sort_contours(bubble_contours)
        
        # 답안 추출
        answers = {}
        bubbles_per_question = self.choices_per_question
        
        # 각 문제별로 버블 그룹핑
        for question_idx in range(0, len(bubble_contours), bubbles_per_question):
            if question_idx + bubbles_per_question > len(bubble_contours):
                break
            
            question_bubbles = bubble_contours[question_idx:question_idx + bubbles_per_question]
            question_num = (question_idx // bubbles_per_question) + 1
            
            if question_num > self.total_questions:
                break
            
            # 각 버블의 채워진 정도 확인
            filled_choices = []
            for choice_idx, bubble in enumerate(question_bubbles):
                # 마스크 생성
                mask = np.zeros(thresh.shape, dtype="uint8")
                cv2.drawContours(mask, [bubble], -1, 255, -1)
                
                # 버블 영역 내의 흰색 픽셀 수 계산
                mask = cv2.bitwise_and(thresh, thresh, mask=mask)
                total = cv2.countNonZero(mask)
                
                # 임계값 이상이면 체크된 것으로 판단
                (x, y, w, h) = cv2.boundingRect(bubble)
                bubble_area = w * h
                fill_ratio = total / float(bubble_area) if bubble_area > 0 else 0
                
                # 채움 비율이 25% 이상이면 체크된 것으로 간주
                if fill_ratio > 0.25:
                    filled_choices.append(str(choice_idx + 1))
            
            # 답안 저장 (복수 정답은 쉼표로 구분)
            if filled_choices:
                answers[question_num] = ",".join(filled_choices)
        
        return answers
    
    def _sort_contours(self, contours: List, method: str = "top-to-bottom") -> List:
        """윤곽선을 정렬합니다"""
        # 경계 박스 계산
        bounding_boxes = [cv2.boundingRect(c) for c in contours]
        
        # Y 좌표로 먼저 정렬 (위에서 아래로)
        # 같은 행에 있는 것들은 X 좌표로 정렬 (왼쪽에서 오른쪽으로)
        sorted_items = []
        for i, (x, y, w, h) in enumerate(bounding_boxes):
            sorted_items.append((y, x, contours[i]))
        
        sorted_items.sort(key=lambda item: (item[0] // 30, item[1]))  # Y를 30으로 나눈 몫으로 행 구분
        
        return [item[2] for item in sorted_items]


def process_omr_image(image_data: bytes, total_questions: int = 30) -> Dict[int, str]:
    """
    OMR 이미지를 처리하는 헬퍼 함수
    
    Args:
        image_data: 이미지 바이트 데이터
        total_questions: 전체 문제 수
        
    Returns:
        Dict[int, str]: 문제번호와 답안 딕셔너리
    """
    scanner = OMRScanner(total_questions=total_questions)
    return scanner.process_image(image_data)
