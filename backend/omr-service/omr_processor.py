"""
OMR (Optical Mark Recognition) Processor using OpenCV
Processes scanned optical forms and extracts marked answers
"""

import cv2
import numpy as np
from imutils import perspective
from imutils import contours
import imutils

class OMRProcessor:
    def __init__(self):
        # OMR form configuration
        self.QUESTIONS = 15  # Total questions (Updated)
        self.CHOICES = 4     # A, B, C, D
        self.GRID_ROWS = 15 # Updated to 15 rows
        self.GRID_COLS = 4  # A, B, C, D
        
    def process_image(self, image_path):
        """
        Main processing pipeline using Grid Slicing
        """
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError("Could not read image")
            
            # Preprocessing
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edged = cv2.Canny(blurred, 75, 200)
            
            # Find paper contour
            paper_cnt = self.find_paper_contour(edged)
            if paper_cnt is None:
                # Fallback: use entire image if no paper found (assume cropped)
                warped = gray
                thresh = cv2.threshold(warped, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
            else:
                # Apply perspective transform
                warped = self.four_point_transform(gray, paper_cnt)
                thresh = cv2.threshold(warped, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
            
            # GRID BASED PROCESSING (The user "5 boxes" logic)
            # We divide the warped image into 50 rows (questions) and 5 cols (A,B,C,D,E)
            
            # Resize warped image to fixed size to handle grid easily
            # 500 width (100px per option), 2500 height (50px per question) roughly
            target_w = 500
            target_h = 2500 
            warped_resized = cv2.resize(thresh, (target_w, target_h))
            
            answers = {}
            bubble_details = {}
            
            # Calculate cell dimensions
            cell_h = target_h // self.QUESTIONS # 50 rows
            cell_w = target_w // self.CHOICES   # 5 cols
            
            for q in range(self.QUESTIONS):
                ques_answers = []
                for c in range(self.CHOICES):
                    # Extract ROI for this cell
                    x_start = c * cell_w
                    y_start = q * cell_h
                    x_end = (c + 1) * cell_w
                    y_end = (q + 1) * cell_h
                    
                    # Add margin to look at center of box (avoid borders)
                    margin_x = int(cell_w * 0.2)
                    margin_y = int(cell_h * 0.2)
                    
                    cell = warped_resized[y_start+margin_y : y_end-margin_y, x_start+margin_x : x_end-margin_x]
                    
                    # Count non-zero pixels (white pixels in thresholded image)
                    total_pixels = cv2.countNonZero(cell)
                    cell_area = cell.shape[0] * cell.shape[1]
                    
                    fill_percentage = (total_pixels / cell_area) * 100
                    
                    # Threshold for being marked (e.g., > 30% filled)
                    if fill_percentage > 30:
                        bubble_idx = q * self.CHOICES + c
                        confidence = min(100, int(fill_percentage))
                        
                        # Store result
                        # Mobile format: Bubble Index -> Fill Percentage
                        answers[q + 1] = {
                            "option": ['A','B','C','D','E'][c],
                            "fill": round(fill_percentage, 1)
                        }
                        
                        bubble_details[q + 1] = {
                            'marked': True,
                            'option_index': c,
                            'fill_percentage': round(fill_percentage, 2)
                        }
            
            return {
                "success": True,
                "answers": answers, # Format: {1: {'option': 'A', 'fill': 85}, ...}
                "bubble_details": bubble_details,
                "total_detected": len(answers)
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def find_paper_contour(self, edged):
        """Find the largest rectangular contour (the paper)"""
        cnts = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, 
                                cv2.CHAIN_APPROX_SIMPLE)
        cnts = imutils.grab_contours(cnts)
        
        if len(cnts) == 0:
            return None
        
        # Sort by area and get the largest
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
        
        for c in cnts:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            
            # If 4 points (rectangle), this is likely the paper
            if len(approx) == 4:
                return approx
        
        return None
    
    def four_point_transform(self, image, pts):
        """Apply perspective transform to get bird's eye view"""
        rect = self.order_points(pts.reshape(4, 2))
        (tl, tr, br, bl) = rect
        
        # Compute width
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        
        # Compute height
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        
        # Destination points
        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]
        ], dtype="float32")
        
        # Compute perspective transform
        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
        
        return warped
    
    def order_points(self, pts):
        """Order points in top-left, top-right, bottom-right, bottom-left"""
        rect = np.zeros((4, 2), dtype="float32")
        
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        
        return rect
    
    def find_bubbles(self, thresh):
        """Find all bubble contours"""
        cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
                                cv2.CHAIN_APPROX_SIMPLE)
        cnts = imutils.grab_contours(cnts)
        
        bubble_cnts = []
        
        for c in cnts:
            (x, y, w, h) = cv2.boundingRect(c)
            ar = w / float(h)
            
            # Filter by aspect ratio and size to find circles
            if w >= 15 and h >= 15 and ar >= 0.7 and ar <= 1.3:
                bubble_cnts.append(c)
        
        # Sort bubbles top-to-bottom
        if len(bubble_cnts) > 0:
            bubble_cnts = contours.sort_contours(bubble_cnts, 
                                                  method="top-to-bottom")[0]
        
        return bubble_cnts
    
    def extract_answers(self, thresh, bubble_cnts):
        """
        Extract ALL marked bubbles dynamically
        Returns bubble indices that are marked (simple format for mobile)
        """
        answers = {}
        bubble_details = {}
        
        if len(bubble_cnts) == 0:
            return answers, bubble_details
        
        # Process each bubble individually and check if it's marked
        for (bubble_idx, c) in enumerate(bubble_cnts):
            # Create mask for this bubble
            mask = np.zeros(thresh.shape, dtype="uint8")
            cv2.drawContours(mask, [c], -1, 255, -1)
            
            # Apply mask and count filled pixels
            mask = cv2.bitwise_and(thresh, thresh, mask=mask)
            filled_pixels = cv2.countNonZero(mask)
            
            # Calculate bubble area
            bubble_area = cv2.contourArea(c)
            
            # Determine if bubble is marked (more than 40% filled)
            if bubble_area > 0:
                fill_percentage = (filled_pixels / bubble_area) * 100
                threshold_percentage = 40  # 40% filled = marked
                
                if fill_percentage > threshold_percentage:
                    # This bubble is marked!
                    confidence = min(100, int(fill_percentage))
                    
                    # Simple format: bubble number mapped to fill percentage
                    # Mobile can display: "Bubble 23: 85% filled"
                    answers[bubble_idx + 1] = round(fill_percentage, 1)
                    
                    bubble_details[bubble_idx + 1] = {
                        'marked': True,
                        'confidence': confidence,
                        'fill_percentage': round(fill_percentage, 2),
                        'bubble_index': bubble_idx
                    }
        
        return answers, bubble_details
    
    def calculate_score(self, detected_answers, answer_key):
        """Calculate score based on answer key"""
        correct = 0
        total = len(answer_key)
        
        for question_num, correct_answer in answer_key.items():
            if question_num in detected_answers:
                if detected_answers[question_num] == correct_answer:
                    correct += 1
        
        score = (correct / total) * 100 if total > 0 else 0
        
        return {
            "correct": correct,
            "total": total,
            "score": round(score, 2),
            "percentage": f"{score:.1f}%"
        }
