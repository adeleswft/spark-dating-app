from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .matching.engine import MatchingEngine
from .embeddings.generator import EmbeddingGenerator
from .explanations.generator import ExplanationGenerator
from .moderation.analyzer import ContentModerator

app = FastAPI(title="Spark AI Service")

# CORS — only allow the API server and localhost in dev
import os
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
matching_engine = MatchingEngine()
embedding_generator = EmbeddingGenerator()
explanation_generator = ExplanationGenerator()
content_moderator = ContentModerator()


@app.get("/")
async def root():
    return {"status": "ok", "message": "Spark AI Service is running"}


@app.post("/matching/compatibility")
async def calculate_compatibility(request: Request):
    """Calculate compatibility score between two users.
    
    Expects: { user_a: {...}, user_b: {...} }
    Returns: { score: int, factors: {...} }
    """
    body = await request.json()
    user_a = body.get("user_a", {})
    user_b = body.get("user_b", {})
    
    result = matching_engine.calculate_compatibility(user_a, user_b)
    return result


@app.post("/matching/discover")
async def discover_profiles(request: Request):
    """Get curated discovery profiles for a user.
    
    Expects: { user: {...}, filters: {...}, candidates: [...] }
    Returns: { profiles: [...] }
    """
    body = await request.json()
    user = body.get("user", {})
    filters = body.get("filters", {})
    candidates = body.get("candidates", [])
    
    profiles = matching_engine.get_curated_profiles(user, filters, candidates)
    return {"profiles": profiles}


@app.post("/embeddings/generate")
async def generate_embedding(request: Request):
    """Generate embedding vector for text."""
    body = await request.json()
    text = body.get("text", "")
    embedding = await embedding_generator.generate(text)
    return {"embedding": embedding}


@app.post("/explanations/compatibility")
async def generate_explanation(request: Request):
    """Generate human-readable compatibility explanation.
    
    Expects: { user_a: {...}, user_b: {...} }
    Returns: { explanation: str }
    """
    body = await request.json()
    user_a = body.get("user_a", {})
    user_b = body.get("user_b", {})
    
    explanation = await explanation_generator.generate(user_a, user_b)
    return {"explanation": explanation}


@app.post("/explanations/conversation-starters")
async def generate_conversation_starters(request: Request):
    """Generate personalized conversation starters.
    
    Expects: { user_a: {...}, user_b: {...} }
    Returns: { starters: [str, ...] }
    """
    body = await request.json()
    user_a = body.get("user_a", {})
    user_b = body.get("user_b", {})
    
    starters = await explanation_generator.generate_starters(user_a, user_b)
    return {"starters": starters}


@app.post("/moderation/analyze")
async def moderate_analyze(request: Request):
    """Unified moderation endpoint — analyzes text for safety concerns.
    
    Expects: { text: str, context: str, extra?: {...} }
    Returns: { is_safe, severity, flags, recommendation }
    """
    body = await request.json()
    text = body.get("text", "")
    context = body.get("context", "general")
    
    result = content_moderator.analyze_text(text, context)
    return result


@app.post("/moderation/text")
async def moderate_text(request: Request):
    """Analyze text for scam/harassment patterns."""
    body = await request.json()
    text = body.get("text", "")
    context = body.get("context", "general")
    result = content_moderator.analyze_text(text, context)
    return result


@app.post("/moderation/bio")
async def moderate_bio(request: Request):
    """Analyze profile bio for scam patterns."""
    body = await request.json()
    bio = body.get("bio", "")
    result = content_moderator.analyze_bio(bio)
    return result


@app.post("/moderation/message")
async def moderate_message(request: Request):
    """Analyze message for safety concerns."""
    body = await request.json()
    message = body.get("message", "")
    context = body.get("context", {})
    result = content_moderator.analyze_message(message, context)
    return result
