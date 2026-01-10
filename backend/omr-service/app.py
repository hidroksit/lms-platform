"""
Flask REST API for OMR Processing
Receives images and returns detected answers
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
import os
from omr_processor import OMRProcessor

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize OMR processor
omr = OMRProcessor()

# Upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'OMR Processing Service',
        'version': '1.0.0'
    })

@app.route('/process', methods=['POST'])
def process_omr():
    """
    Process OMR image
    
    Request JSON:
    {
        "image": "base64_encoded_image",
        "answer_key": {
            "1": "A",
            "2": "B",
            ...
        }
    }
    
    Response JSON:
    {
        "success": true,
        "detected_answers": {...},
        "score": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode base64 image
        image_data = data['image']
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Save temporarily
        temp_path = os.path.join(UPLOAD_FOLDER, 'temp_omr.jpg')
        cv2.imwrite(temp_path, image)
        
        # Process image
        result = omr.process_image(temp_path)
        
        if 'error' in result:
            return jsonify(result), 400
        
        # Calculate score if answer key provided
        if 'answer_key' in data and data['answer_key']:
            # Convert string keys to integers
            answer_key = {int(k): v for k, v in data['answer_key'].items()}
            score = omr.calculate_score(result['answers'], answer_key)
            result['score'] = score
        
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/test', methods=['GET'])
def test():
    """Test endpoint to verify service is running"""
    return jsonify({
        'message': 'OMR Service is running!',
        'endpoints': {
            'health': '/health',
            'process': '/process (POST)',
            'test': '/test'
        }
    })

if __name__ == '__main__':
    print("=" * 50)
    print("OMR Processing Service Starting...")
    print("=" * 50)
    print("Port: 5000")
    print("Endpoints:")
    print("  - GET  /health  - Health check")
    print("  - POST /process - Process OMR image")
    print("  - GET  /test    - Test endpoint")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
