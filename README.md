# Nutrition Tracker API

AI-powered nutrition tracking API with image analysis, health insights, and multi-language support using Qwen AI and Sarvam translations[^1].

## Features

- **Image-based nutrition extraction** using Qwen AI
- **Health analysis** with personalized recommendations
- **Multi-language support** (11 languages)
- **Daily/Weekly tracking** with SQLite database
- **User profiles** with BMI and calorie calculations
- **Translation services** for nutrition information


## Quick Setup

### Installation
```
create a virtual environment
python -m venv venv

```


```bash
pip install -r requirements.txt
```
```
pip install imagine_sdk-0.4.2-py3-none-any.whl
```

### Environment Variables

Create `.env` file:

```env
HUGGINGFACE_TOKEN=*******************
QWEN_MODEL=Qwen/Qwen2.5-VL-7B-Instruct
QWEN_API_URL=https://router.huggingface.co/hyperbolic/v1/chat/completions
SARVAM_API_KEY=***************************
SARVAM_ENDPOINT=http://10.190.147.82:5050/v2
```


### Run Server

```bash
python qwen_backend.py
```

Server runs on `http://localhost:8000`

## API Endpoints

### User Management

- `POST /register` - Register new user with health data
- `GET /user/{user_id}` - Get user profile


### Nutrition Analysis

- `POST /analyze-nutrition` - Analyze food label image
    - Form data: `file`, `user_id`, `quantity`, `meal_type`, `preferred_language`


### Tracking

- `GET /daily-intake/{user_id}?date=YYYY-MM-DD` - Daily nutrition summary
- `GET /weekly-summary/{user_id}?start_date=YYYY-MM-DD` - Weekly overview


### Translation

- `POST /translate` - Translate nutrition text
- `GET /languages` - Supported languages list


## Usage Example

### Register User

```javascript
const userData = {
  user_id: "user123",
  height: 175.0,
  weight: 70.0,
  age: 25,
  gender: "male",
  activity_level: "moderate",
  goal: "maintain"
};

const response = await api.post('/register', userData);
```


### Analyze Nutrition

```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('user_id', 'user123');
formData.append('quantity', 1);
formData.append('meal_type', 'breakfast');

const result = await api.post('/analyze-nutrition', formData);
```


### Get Daily Intake

```javascript
const intake = await api.get(`/daily-intake/user123?date=2024-01-15`);
```


## Response Format

```json
{
  "success": true,
  "extracted_nutrition": {
    "product_name": "Whole Wheat Bread",
    "calories": 160,
    "protein": 8,
    "total_carbohydrates": 30,
    "total_fat": 2,
    "sodium": 300
  },
  "health_analysis": {
    "health_warnings": ["High sodium content"],
    "recommendations": ["Monitor sodium intake"],
    "daily_intake_analysis": "7% of daily calorie needs"
  }
}
```


## Supported Languages

English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi, Urdu

**Language codes:** `en`, `hi`, `ta`, `te`, `kn`, `ml`, `bn`, `gu`, `mr`, `pa`, `ur`

## React Integration

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
});

export default api;
```


## Health Check

- `GET /health` - API health status
- `GET /` - API information and features
