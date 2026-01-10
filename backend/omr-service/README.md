# OMR Processing Service - Setup Guide

## Installation

1. Install Python dependencies:
```bash
cd backend/omr-service
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

## Running the Service

```bash
python app.py
```

The service will start on `http://localhost:5000`

## Endpoints

- `GET /health` - Health check
- `POST /process` - Process OMR image
- `GET /test` - Test endpoint

## Testing

Send POST request to `/process` with base64 encoded image:

```json
{
  "image": "base64_encoded_image_data",
  "answer_key": {
    "1": "A",
    "2": "B",
    "3": "C"
  }
}
```

Response:
```json
{
  "success": true,
  "detected_answers": {
    "1": "A",
    "2": "B",
    "3": "C"
  },
  "score": {
    "correct": 3,
    "total": 3,
    "score": 100,
    "percentage": "100.0%"
  }
}
```
