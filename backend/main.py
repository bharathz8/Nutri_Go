from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import os
import json
import requests
import base64
from datetime import datetime, timedelta
from PIL import Image
import io
from dotenv import load_dotenv
import logging
from contextlib import asynccontextmanager
import re
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Add the required imports for Sarvam translation
from pprint import pprint
from imagine import ChatMessage, ImagineClient

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
QWEN_MODEL = os.getenv("QWEN_MODEL")
QWEN_API_URL = os.getenv("QWEN_API_URL")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
SARVAM_ENDPOINT = os.getenv("SARVAM_ENDPOINT")

SUPPORTED_LANGUAGES = {
    "english": "en", "hindi": "hi", "tamil": "ta", "telugu": "te",
    "kannada": "kn", "malayalam": "ml", "bengali": "bn", "gujarati": "gu",
    "marathi": "mr", "punjabi": "pa", "urdu": "ur"
}

SCIENTIFIC_INGREDIENTS = {
    "ascorbic acid": {
        "simple_name": "Vitamin C",
        "explanation": "A natural antioxidant vitamin that helps boost immunity and heal wounds",
        "advantages": ["Boosts immune system", "Helps iron absorption", "Antioxidant properties", "Wound healing"],
        "disadvantages": ["Can cause stomach upset in large amounts", "May interact with some medications"]
    },
    "tocopherol": {
        "simple_name": "Vitamin E",
        "explanation": "A fat-soluble vitamin that acts as an antioxidant in the body",
        "advantages": ["Protects cells from damage", "Good for skin health", "Supports immune function"],
        "disadvantages": ["Can thin blood in high doses", "May interfere with vitamin K"]
    },
    "sodium benzoate": {
        "simple_name": "Preservative",
        "explanation": "A chemical preservative that prevents bacteria and mold growth",
        "advantages": ["Extends shelf life", "Prevents food spoilage", "Generally safe in small amounts"],
        "disadvantages": ["May cause allergies in some people", "Can form harmful compounds when mixed with vitamin C"]
    },
    "monosodium glutamate": {
        "simple_name": "MSG (Flavor Enhancer)",
        "explanation": "A salt that enhances savory flavors in food",
        "advantages": ["Enhances taste", "Reduces need for salt", "Safe for most people"],
        "disadvantages": ["May cause headaches in sensitive people", "Can mask poor quality ingredients"]
    },
    "carrageenan": {
        "simple_name": "Seaweed Extract Thickener",
        "explanation": "A natural thickener extracted from red seaweed",
        "advantages": ["Natural ingredient", "Good texture enhancer", "Dairy-free option"],
        "disadvantages": ["May cause digestive issues", "Some studies suggest inflammation risk"]
    },
    "xanthan gum": {
        "simple_name": "Natural Thickener",
        "explanation": "A natural thickener produced by fermenting corn sugar",
        "advantages": ["Gluten-free", "Improves texture", "Natural fermentation product"],
        "disadvantages": ["May cause bloating", "Can have laxative effect in large amounts"]
    },
    "potassium sorbate": {
        "simple_name": "Preservative",
        "explanation": "A potassium salt that prevents mold and yeast growth",
        "advantages": ["Effective preservative", "Generally safe", "Prevents spoilage"],
        "disadvantages": ["May cause skin irritation in some people", "Can affect taste in high concentrations"]
    },
    "citric acid": {
        "simple_name": "Natural Acid",
        "explanation": "A natural acid found in citrus fruits, used as preservative and flavor enhancer",
        "advantages": ["Natural ingredient", "Preserves freshness", "Enhances flavor"],
        "disadvantages": ["Can erode tooth enamel", "May cause stomach irritation"]
    },
    "sodium nitrite": {
        "simple_name": "Meat Preservative",
        "explanation": "A salt that preserves meat and maintains pink color",
        "advantages": ["Prevents dangerous bacteria", "Maintains meat color", "Extends shelf life"],
        "disadvantages": ["May form harmful compounds when heated", "Linked to health concerns in large amounts"]
    },
    "lecithin": {
        "simple_name": "Natural Emulsifier",
        "explanation": "A natural fat that helps mix oil and water-based ingredients",
        "advantages": ["Natural ingredient", "Good for brain health", "Helps texture"],
        "disadvantages": ["May cause digestive upset", "Some people are allergic to soy lecithin"]
    }
}

# Initialize Sarvam client globally
try:
    sarvam_client = ImagineClient(
        api_key=SARVAM_API_KEY,
        endpoint=SARVAM_ENDPOINT
    )
    logger.info("Sarvam client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Sarvam client: {e}")
    sarvam_client = None

DATABASE_URL = "sqlite:///./nutrition_tracker.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserProfileDB(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    height = Column(Float)
    weight = Column(Float)
    age = Column(Integer)
    gender = Column(String)
    activity_level = Column(String)
    goal = Column(String)
    dietary_restrictions = Column(JSON)
    health_conditions = Column(JSON)
    preferred_language = Column(String, default="english")
    created_at = Column(DateTime, default=datetime.utcnow)

class NutritionEntryDB(Base):
    __tablename__ = "nutrition_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    date = Column(String)
    product_name = Column(String)
    serving_size = Column(String)
    quantity = Column(Float, default=1.0)
    meal_type = Column(String, default="snack")
    calories = Column(Float, default=0)
    protein = Column(Float, default=0)
    total_carbohydrates = Column(Float, default=0)
    total_fat = Column(Float, default=0)
    saturated_fat = Column(Float, default=0)
    trans_fat = Column(Float, default=0)
    dietary_fiber = Column(Float, default=0)
    total_sugars = Column(Float, default=0)
    added_sugars = Column(Float, default=0)
    cholesterol = Column(Float, default=0)
    sodium = Column(Float, default=0)
    vitamins = Column(JSON)
    minerals = Column(JSON)
    ingredients_list = Column(JSON)
    raw_nutrition_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserProfile(BaseModel):
    user_id: str
    height: float
    weight: float
    age: int
    gender: str
    activity_level: str
    goal: str
    dietary_restrictions: List[str] = []
    health_conditions: List[str] = []
    preferred_language: str = "english"

# FIXED: Translation request model to handle JSON body
class TranslationRequest(BaseModel):
    text: str
    target_language: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def calculate_bmi(height_cm: float, weight_kg: float) -> float:
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 2)

def get_bmi_category(bmi: float) -> str:
    if bmi < 18.5:
        return "Underweight"
    elif 18.5 <= bmi < 25:
        return "Normal Weight"
    elif 25 <= bmi < 30:
        return "Overweight"
    else:
        return "Obese"

def calculate_daily_calories(profile: UserProfileDB) -> int:
    if profile.gender.lower() == 'male':
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
    else:
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
    
    activity_multipliers = {
        'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55,
        'active': 1.725, 'very_active': 1.9
    }
    
    daily_calories = int(bmr * activity_multipliers.get(profile.activity_level, 1.55))
    
    if profile.goal == 'lose':
        daily_calories -= 500
    elif profile.goal == 'gain':
        daily_calories += 500
    
    return daily_calories

def preprocess_image(image_data: bytes) -> bytes:
    try:
        image = Image.open(io.BytesIO(image_data))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        max_size = 1024
        if max(image.width, image.height) > max_size:
            image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=85, optimize=True)
        return output.getvalue()
        
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        return image_data

def extract_nutrition_from_image_with_qwen(image_data: bytes) -> Dict[str, Any]:
    try:
        b64 = base64.b64encode(image_data).decode()
        data_uri = f"data:image/jpeg;base64,{b64}"
        
        messages = [{
            "role": "user",
            "content": [
                {
                    "type": "text", 
                    "text": """Extract ALL nutrition information and ingredients from this food label image. Return ONLY a valid JSON object with this exact structure:
{
  "product_name": "exact product name from label",
  "serving_size": "serving size information",
  "calories": number_only,
  "protein": number_only,
  "total_carbohydrates": number_only,
  "total_fat": number_only,
  "saturated_fat": number_only,
  "trans_fat": number_only,
  "dietary_fiber": number_only,
  "total_sugars": number_only,
  "added_sugars": number_only,
  "cholesterol": number_only,
  "sodium": number_only,
  "vitamin_a": number_only,
  "vitamin_c": number_only,
  "vitamin_d": number_only,
  "calcium": number_only,
  "iron": number_only,
  "potassium": number_only,
  "ingredients_list": ["ingredient1", "ingredient2", "ingredient3"]
}
Extract ALL visible values. Use 0 for missing values. Return ONLY numbers without units (mg, g, etc)."""
                },
                {"type": "image_url", "image_url": {"url": data_uri}}
            ]
        }]

        payload = {
            "model": QWEN_MODEL, 
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.1
        }
        
        logger.info(f"Sending image extraction request to Qwen API")
        
        response = requests.post(
            QWEN_API_URL,
            headers={
                "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=60,
        )
        
        logger.info(f"Qwen API response status: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            content = response_data["choices"][0]["message"]["content"]
            logger.info(f"Qwen response content: {content[:300]}...")
            
            return clean_and_parse_json(content)
        else:
            logger.error(f"API Error: {response.status_code} - {response.text}")
            return {"error": f"API request failed: {response.status_code}"}
            
    except Exception as e:
        logger.error(f"Image extraction failed: {str(e)}")
        return {"error": f"Analysis failed: {str(e)}"}

def clean_and_parse_json(text: str) -> Dict[str, Any]:
    try:
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if not json_match:
            return create_default_nutrition_data()
        
        json_str = json_match.group()
        json_str = re.sub(r'"([^"]+)":\s*(\d+(?:\.\d+)?)\s*[a-zA-Z%]+', r'"\1": \2', json_str)
        
        parsed_data = json.loads(json_str)
        
        required_fields = [
            "product_name", "serving_size", "calories", "protein", "total_carbohydrates",
            "total_fat", "saturated_fat", "trans_fat", "dietary_fiber", "total_sugars",
            "added_sugars", "cholesterol", "sodium", "vitamin_a", "vitamin_c", "vitamin_d",
            "calcium", "iron", "potassium", "ingredients_list"
        ]
        
        for field in required_fields:
            if field not in parsed_data:
                if field == "ingredients_list":
                    parsed_data[field] = []
                elif field in ["product_name", "serving_size"]:
                    parsed_data[field] = "Unknown" if field == "product_name" else "1 serving"
                else:
                    parsed_data[field] = 0
        
        return parsed_data
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {e}")
        return create_default_nutrition_data()

def create_default_nutrition_data() -> Dict[str, Any]:
    return {
        "product_name": "Unknown Product",
        "serving_size": "1 serving",
        "calories": 0, "protein": 0, "total_carbohydrates": 0, "total_fat": 0,
        "saturated_fat": 0, "trans_fat": 0, "dietary_fiber": 0, "total_sugars": 0,
        "added_sugars": 0, "cholesterol": 0, "sodium": 0, "vitamin_a": 0,
        "vitamin_c": 0, "vitamin_d": 0, "calcium": 0, "iron": 0, "potassium": 0,
        "ingredients_list": []
    }

def analyze_stored_nutrition_with_qwen(nutrition_entry: NutritionEntryDB, user_history: List[NutritionEntryDB], user_profile: UserProfileDB) -> Dict[str, Any]:
    try:
        daily_calories = calculate_daily_calories(user_profile)
        
        recent_entries_data = []
        for entry in user_history[-7:]:
            recent_entries_data.append({
                "date": entry.date,
                "product": entry.product_name,
                "calories": entry.calories,
                "sodium": entry.sodium,
                "sugar": entry.total_sugars,
                "fat": entry.total_fat
            })
        
        current_nutrition = {
            "product_name": nutrition_entry.product_name,
            "calories": nutrition_entry.calories,
            "protein": nutrition_entry.protein,
            "carbs": nutrition_entry.total_carbohydrates,
            "fat": nutrition_entry.total_fat,
            "sodium": nutrition_entry.sodium,
            "sugar": nutrition_entry.total_sugars,
            "ingredients": nutrition_entry.ingredients_list or []
        }
        
        analysis_prompt = f"""Analyze this nutrition data for health implications:

CURRENT PRODUCT: {json.dumps(current_nutrition, indent=2)}

USER PROFILE:
- Age: {user_profile.age}, Gender: {user_profile.gender}
- Daily calorie target: {daily_calories}
- Health conditions: {user_profile.health_conditions}
- Activity level: {user_profile.activity_level}

RECENT INTAKE (last 7 entries): {json.dumps(recent_entries_data, indent=2)}

Please provide analysis in this JSON format:
{{
  "health_warnings": ["warning1", "warning2"],
  "nutritional_assessment": "detailed assessment",
  "ingredient_explanations": {{
    "ingredient_name": {{
      "simple_name": "simple term",
      "explanation": "what it does",
      "health_impact": "positive/negative/neutral"
    }}
  }},
  "recommendations": ["recommendation1", "recommendation2"],
  "daily_intake_analysis": "analysis of how this fits daily needs"
}}

Focus on scientific ingredients and provide simple explanations."""

        messages = [{
            "role": "user",
            "content": analysis_prompt
        }]

        payload = {
            "model": QWEN_MODEL,
            "messages": messages,
            "max_tokens": 1500,
            "temperature": 0.3
        }
        
        logger.info(f"Sending nutrition analysis request to Qwen API")
        
        response = requests.post(
            QWEN_API_URL,
            headers={
                "Authorization": f"Bearer {HUGGINGFACE_TOKEN}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=60,
        )
        
        if response.status_code == 200:
            response_data = response.json()
            content = response_data["choices"][0]["message"]["content"]
            logger.info(f"Nutrition analysis response: {content[:200]}...")
            
            try:
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group())
                    return analysis_data
                else:
                    return create_default_analysis()
            except json.JSONDecodeError:
                return create_default_analysis()
        else:
            logger.error(f"Analysis API Error: {response.status_code}")
            return create_default_analysis()
            
    except Exception as e:
        logger.error(f"Nutrition analysis failed: {str(e)}")
        return create_default_analysis()

def create_default_analysis() -> Dict[str, Any]:
    return {
        "health_warnings": [],
        "nutritional_assessment": "Unable to analyze nutrition data at this time",
        "ingredient_explanations": {},
        "recommendations": ["Maintain a balanced diet", "Stay hydrated"],
        "daily_intake_analysis": "Please consult with a healthcare professional"
    }

# FIXED TRANSLATION FUNCTION using ImagineClient
def translate_with_sarvam(text: str, target_language: str) -> str:
    try:
        if target_language.lower() == "english":
            return text
            
        if sarvam_client is None:
            logger.error("Sarvam client not initialized")
            return text
        
        # Log the translation request
        logger.info(f"🌐 Translating text to {target_language}")
        logger.info(f"📝 Text length: {len(text)} characters")
        logger.info(f"📝 Text preview: {text[:100]}...")
        
        prompt = f"Translate the following nutrition and health information to {target_language} language. Keep it simple and easy to understand:\n\n{text}"
        
        # Use ChatMessage and client.chat() as per your syntax
        response = sarvam_client.chat(
            messages=[
                ChatMessage(role="user", content=prompt)
            ],
            model="Sarvam-m"
        )
        
        # Get the translated content using first_content
        translated = response.first_content
        logger.info(f"✅ Translation successful to {target_language}")
        logger.info(f"📝 Translated length: {len(translated)} characters")
        return translated
            
    except Exception as e:
        logger.error(f"❌ Translation failed: {e}")
        return text

def store_nutrition_entry(db: Session, nutrition_data: Dict[str, Any], user_id: str, quantity: float, meal_type: str) -> NutritionEntryDB:
    vitamins_data = {
        "vitamin_a": nutrition_data.get("vitamin_a", 0),
        "vitamin_c": nutrition_data.get("vitamin_c", 0),
        "vitamin_d": nutrition_data.get("vitamin_d", 0)
    }
    
    minerals_data = {
        "calcium": nutrition_data.get("calcium", 0),
        "iron": nutrition_data.get("iron", 0),
        "potassium": nutrition_data.get("potassium", 0)
    }
    
    entry = NutritionEntryDB(
        user_id=user_id,
        date=datetime.now().strftime("%Y-%m-%d"),
        product_name=nutrition_data.get("product_name", "Unknown"),
        serving_size=nutrition_data.get("serving_size", "1 serving"),
        quantity=quantity,
        meal_type=meal_type,
        calories=nutrition_data.get("calories", 0) * quantity,
        protein=nutrition_data.get("protein", 0) * quantity,
        total_carbohydrates=nutrition_data.get("total_carbohydrates", 0) * quantity,
        total_fat=nutrition_data.get("total_fat", 0) * quantity,
        saturated_fat=nutrition_data.get("saturated_fat", 0) * quantity,
        trans_fat=nutrition_data.get("trans_fat", 0) * quantity,
        dietary_fiber=nutrition_data.get("dietary_fiber", 0) * quantity,
        total_sugars=nutrition_data.get("total_sugars", 0) * quantity,
        added_sugars=nutrition_data.get("added_sugars", 0) * quantity,
        cholesterol=nutrition_data.get("cholesterol", 0) * quantity,
        sodium=nutrition_data.get("sodium", 0) * quantity,
        vitamins=vitamins_data,
        minerals=minerals_data,
        ingredients_list=nutrition_data.get("ingredients_list", []),
        raw_nutrition_data=nutrition_data
    )
    
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    logger.info("Starting Comprehensive Nutrition Tracker API with SQL Database")
    yield
    logger.info("Shutting down Comprehensive Nutrition Tracker API")

app = FastAPI(
    title="Comprehensive Nutrition Tracker API",
    version="3.0.0",
    description="AI-powered nutrition analysis with SQL database, Qwen image extraction, and Sarvam translation",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Comprehensive Nutrition Tracker API",
        "version": "3.0.0",
        "supported_languages": list(SUPPORTED_LANGUAGES.keys()),
        "features": [
            "SQL database storage",
            "Qwen image-based nutrition extraction",
            "Qwen health analysis with historical data",
            "Scientific terminology explanation",
            "Multi-language support with Sarvam",
            "Daily and weekly intake tracking",
            "Personalized health warnings"
        ]
    }

@app.get("/languages")
async def get_supported_languages():
    return {
        "supported_languages": SUPPORTED_LANGUAGES,
        "default": "english"
    }

@app.post("/register")
async def register_user(profile: UserProfile, db: Session = Depends(get_db)):
    existing_user = db.query(UserProfileDB).filter(UserProfileDB.user_id == profile.user_id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    if profile.preferred_language not in SUPPORTED_LANGUAGES:
        profile.preferred_language = "english"
    
    db_profile = UserProfileDB(
        user_id=profile.user_id,
        height=profile.height,
        weight=profile.weight,
        age=profile.age,
        gender=profile.gender,
        activity_level=profile.activity_level,
        goal=profile.goal,
        dietary_restrictions=profile.dietary_restrictions,
        health_conditions=profile.health_conditions,
        preferred_language=profile.preferred_language
    )
    
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    
    bmi = calculate_bmi(profile.height, profile.weight)
    daily_calories = calculate_daily_calories(db_profile)
    
    return {
        "message": "User registered successfully",
        "user_id": profile.user_id,
        "bmi": bmi,
        "bmi_category": get_bmi_category(bmi),
        "daily_calorie_target": daily_calories,
        "preferred_language": profile.preferred_language
    }

@app.get("/user/{user_id}")
async def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    bmi = calculate_bmi(profile.height, profile.weight)
    daily_calories = calculate_daily_calories(profile)
    
    return {
        "profile": {
            "user_id": profile.user_id,
            "height": profile.height,
            "weight": profile.weight,
            "age": profile.age,
            "gender": profile.gender,
            "activity_level": profile.activity_level,
            "goal": profile.goal,
            "dietary_restrictions": profile.dietary_restrictions,
            "health_conditions": profile.health_conditions,
            "preferred_language": profile.preferred_language
        },
        "bmi": bmi,
        "bmi_category": get_bmi_category(bmi),
        "daily_calorie_target": daily_calories
    }

@app.post("/analyze-nutrition")
async def analyze_nutrition_label(
    file: UploadFile = File(...),
    user_id: str = Form(""),
    quantity: float = Form(1.0),
    meal_type: str = Form("snack"),
    preferred_language: str = Form("english"),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Please upload an image file")
    
    try:
        image_data = await file.read()
        
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
        
        processed_image_data = preprocess_image(image_data)
        nutrition_data = extract_nutrition_from_image_with_qwen(processed_image_data)
        
        if "error" in nutrition_data:
            logger.error(f"Nutrition extraction error: {nutrition_data['error']}")
            nutrition_data = create_default_nutrition_data()
        
        user_profile = None
        language_to_use = preferred_language
        
        if user_id:
            user_profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user_id).first()
            if user_profile:
                language_to_use = user_profile.preferred_language
                
                stored_entry = store_nutrition_entry(db, nutrition_data, user_id, quantity, meal_type)
                
                user_history = db.query(NutritionEntryDB).filter(
                    NutritionEntryDB.user_id == user_id
                ).order_by(NutritionEntryDB.created_at.desc()).limit(30).all()
                
                health_analysis = analyze_stored_nutrition_with_qwen(stored_entry, user_history, user_profile)
            else:
                health_analysis = create_default_analysis()
        else:
            health_analysis = create_default_analysis()
        
        if language_to_use not in SUPPORTED_LANGUAGES:
            language_to_use = "english"
        
        comprehensive_summary = f"""
Product: {nutrition_data.get('product_name', 'Unknown')}
Serving Size: {nutrition_data.get('serving_size', '1 serving')}
Quantity: {quantity}

NUTRITION (per {quantity} serving):
- Calories: {nutrition_data.get('calories', 0) * quantity}
- Protein: {nutrition_data.get('protein', 0) * quantity}g
- Carbohydrates: {nutrition_data.get('total_carbohydrates', 0) * quantity}g
- Fat: {nutrition_data.get('total_fat', 0) * quantity}g
- Sodium: {nutrition_data.get('sodium', 0) * quantity}mg

HEALTH ANALYSIS:
{health_analysis.get('nutritional_assessment', 'No analysis available')}

DAILY INTAKE ANALYSIS:
{health_analysis.get('daily_intake_analysis', 'No analysis available')}
"""
        
        ingredient_explanation = ""
        if health_analysis.get('ingredient_explanations'):
            ingredient_explanation = "\n\nINGREDIENT EXPLANATIONS:\n"
            for ingredient, info in health_analysis['ingredient_explanations'].items():
                ingredient_explanation += f"\n{ingredient}: {info.get('simple_name', ingredient)}\n"
                ingredient_explanation += f"What it is: {info.get('explanation', 'Common food ingredient')}\n"
                ingredient_explanation += f"Health impact: {info.get('health_impact', 'Neutral')}\n"
        
        if language_to_use != "english":
            comprehensive_summary = translate_with_sarvam(comprehensive_summary, language_to_use)
            if ingredient_explanation:
                ingredient_explanation = translate_with_sarvam(ingredient_explanation, language_to_use)
            
            translated_warnings = []
            for warning in health_analysis.get('health_warnings', []):
                translated_warnings.append(translate_with_sarvam(warning, language_to_use))
            health_analysis['health_warnings'] = translated_warnings
            
            translated_recommendations = []
            for rec in health_analysis.get('recommendations', []):
                translated_recommendations.append(translate_with_sarvam(rec, language_to_use))
            health_analysis['recommendations'] = translated_recommendations
        
        return {
            "success": True,
            "extracted_nutrition": nutrition_data,
            "quantity": quantity,
            "health_analysis": health_analysis,
            "comprehensive_summary": comprehensive_summary,
            "ingredient_explanation": ingredient_explanation,
            "language_used": language_to_use,
            "user_context": {
                "bmi": calculate_bmi(user_profile.height, user_profile.weight) if user_profile else None,
                "daily_calorie_target": calculate_daily_calories(user_profile) if user_profile else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/daily-intake/{user_id}")
async def get_daily_intake(user_id: str, date: Optional[str] = None, db: Session = Depends(get_db)):
    user_profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    
    daily_entries = db.query(NutritionEntryDB).filter(
        NutritionEntryDB.user_id == user_id,
        NutritionEntryDB.date == target_date
    ).all()
    
    total_calories = sum(entry.calories for entry in daily_entries)
    total_protein = sum(entry.protein for entry in daily_entries)
    total_carbs = sum(entry.total_carbohydrates for entry in daily_entries)
    total_fat = sum(entry.total_fat for entry in daily_entries)
    
    daily_target = calculate_daily_calories(user_profile)
    
    return {
        "date": target_date,
        "total_calories": total_calories,
        "total_protein": total_protein,
        "total_carbs": total_carbs,
        "total_fat": total_fat,
        "daily_calorie_target": daily_target,
        "calories_remaining": daily_target - total_calories,
        "completion_percentage": min(100, (total_calories / daily_target) * 100),
        "entries_count": len(daily_entries),
        "entries": [
            {
                "id": entry.id,
                "product_name": entry.product_name,
                "calories": entry.calories,
                "meal_type": entry.meal_type,
                "quantity": entry.quantity
            } for entry in daily_entries
        ]
    }

@app.get("/weekly-summary/{user_id}")
async def get_weekly_summary(user_id: str, start_date: Optional[str] = None, db: Session = Depends(get_db)):
    user_profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")
    
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        start = datetime.now() - timedelta(days=6)
    
    weekly_data = []
    for i in range(7):
        current_date = (start + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_entries = db.query(NutritionEntryDB).filter(
            NutritionEntryDB.user_id == user_id,
            NutritionEntryDB.date == current_date
        ).all()
        
        daily_calories = sum(entry.calories for entry in daily_entries)
        daily_protein = sum(entry.protein for entry in daily_entries)
        
        weekly_data.append({
            "date": current_date,
            "calories": daily_calories,
            "protein": daily_protein,
            "entries_count": len(daily_entries)
        })
    
    total_week_calories = sum(day["calories"] for day in weekly_data)
    avg_daily_calories = total_week_calories / 7
    
    daily_target = calculate_daily_calories(user_profile)
    
    return {
        "week_start": start.strftime("%Y-%m-%d"),
        "week_end": (start + timedelta(days=6)).strftime("%Y-%m-%d"),
        "daily_data": weekly_data,
        "weekly_total_calories": total_week_calories,
        "average_daily_calories": avg_daily_calories,
        "daily_target": daily_target,
        "weekly_target": daily_target * 7
    }

# FIXED: Translation endpoint to handle JSON body properly
@app.post("/translate")
async def translate_text(request: TranslationRequest):
    """
    Translate text to target language using Sarvam API
    
    Request body should contain:
    {
        "text": "text to translate",
        "target_language": "target language code"
    }
    """
    if request.target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Language {request.target_language} not supported")
    
    logger.info(f"🌐 Translation request received:")
    logger.info(f"📝 Text length: {len(request.text)} characters")
    logger.info(f"🎯 Target language: {request.target_language}")
    logger.info(f"📝 Text preview: {request.text[:100]}...")
    
    try:
        translated = translate_with_sarvam(request.text, request.target_language)
        
        logger.info(f"✅ Translation completed successfully")
        logger.info(f"📝 Translated length: {len(translated)} characters")
        
        return {
            "original_text": request.text,
            "translated_text": translated,
            "target_language": request.target_language,
            "source_language": "english"
        }
    except Exception as e:
        logger.error(f"❌ Translation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "SQLite connected",
        "services": {
            "qwen_model": QWEN_MODEL,
            "sarvam_translation": "available" if sarvam_client else "unavailable"
        },
        "supported_languages": list(SUPPORTED_LANGUAGES.keys())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)