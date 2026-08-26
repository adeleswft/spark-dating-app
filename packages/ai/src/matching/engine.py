import numpy as np
from typing import List, Dict, Any
from ..embeddings.generator import EmbeddingGenerator
from ..explanations.generator import ExplanationGenerator

class MatchingEngine:
    def __init__(self):
        self.embedding_generator = EmbeddingGenerator()
        self.explanation_generator = ExplanationGenerator()
        
        # Matching weights from the plan
        self.weights = {
            'vector_similarity': 0.35,
            'collaborative_filtering': 0.25,
            'preference_match': 0.20,
            'activity_recency': 0.10,
            'profile_quality': 0.10,
        }
    
    def calculate_compatibility(self, user_a: Dict[str, Any], user_b: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate compatibility score between two users"""
        
        # 1. Vector similarity (from embeddings)
        vector_score = self._calculate_vector_similarity(user_a, user_b)
        
        # 2. Collaborative filtering (simplified)
        collab_score = self._calculate_collaborative_score(user_a, user_b)
        
        # 3. Preference match
        pref_score = self._calculate_preference_match(user_a, user_b)
        
        # 4. Activity recency
        activity_score = self._calculate_activity_score(user_a, user_b)
        
        # 5. Profile quality
        quality_score = self._calculate_profile_quality(user_a, user_b)
        
        # Weighted total
        total_score = (
            vector_score * self.weights['vector_similarity'] +
            collab_score * self.weights['collaborative_filtering'] +
            pref_score * self.weights['preference_match'] +
            activity_score * self.weights['activity_recency'] +
            quality_score * self.weights['profile_quality']
        )
        
        # Convert to percentage (0-100)
        compatibility_score = round(total_score * 100)
        
        return {
            'score': compatibility_score,
            'factors': {
                'vector_similarity': vector_score,
                'collaborative_filtering': collab_score,
                'preference_match': pref_score,
                'activity_recency': activity_score,
                'profile_quality': quality_score,
            }
        }
    
    def _calculate_vector_similarity(self, user_a: Dict, user_b: Dict) -> float:
        """Calculate cosine similarity between user embeddings"""
        # In production, fetch embeddings from database
        # For demo, generate on the fly
        text_a = self._profile_to_text(user_a)
        text_b = self._profile_to_text(user_b)
        
        # For demo, return a simulated score
        # In production: embedding_a = await self.embedding_generator.generate(text_a)
        #                 embedding_b = await self.embedding_generator.generate(text_b)
        #                 return cosine_similarity(embedding_a, embedding_b)
        
        return 0.75  # Simulated
    
    def _calculate_collaborative_score(self, user_a: Dict, user_b: Dict) -> float:
        """Calculate collaborative filtering score"""
        # In production, analyze swipe patterns:
        # - Users who swiped right on similar profiles
        # - Mutual connections
        # - Behavioral patterns
        
        # Simplified: check for shared interests
        interests_a = set(user_a.get('interests', []))
        interests_b = set(user_b.get('interests', []))
        
        if not interests_a or not interests_b:
            return 0.5
        
        overlap = len(interests_a.intersection(interests_b))
        total = len(interests_a.union(interests_b))
        
        return overlap / total if total > 0 else 0.5
    
    def _calculate_preference_match(self, user_a: Dict, user_b: Dict) -> float:
        """Calculate how well users match each other's preferences"""
        score = 0.5  # Base score
        
        # Age preference match
        prefs_a = user_a.get('preferences', {})
        prefs_b = user_b.get('preferences', {})
        
        age_a = user_a.get('age', 25)
        age_b = user_b.get('age', 25)
        
        # Check if ages fall within preferences
        if (prefs_a.get('minAge', 18) <= age_b <= prefs_a.get('maxAge', 50)):
            score += 0.15
        if (prefs_b.get('minAge', 18) <= age_a <= prefs_b.get('maxAge', 50)):
            score += 0.15
        
        # Gender preference match
        gender_a = user_a.get('gender', 'other')
        gender_b = user_b.get('gender', 'other')
        
        if gender_b in prefs_a.get('genderPreference', []):
            score += 0.1
        if gender_a in prefs_b.get('genderPreference', []):
            score += 0.1
        
        return min(score, 1.0)
    
    def _calculate_activity_score(self, user_a: Dict, user_b: Dict) -> float:
        """Calculate activity recency score"""
        # In production, compare lastActiveAt timestamps
        # For demo, return based on a simple heuristic
        
        last_active_a = user_a.get('lastActiveAt')
        last_active_b = user_b.get('lastActiveAt')
        
        if last_active_a and last_active_b:
            # Both active recently
            return 0.9
        
        return 0.5
    
    def _calculate_profile_quality(self, user_a: Dict, user_b: Dict) -> float:
        """Calculate profile quality score"""
        scores = []
        
        for user in [user_a, user_b]:
            quality = 0.5  # Base
            
            # Photos
            photos = user.get('photos', [])
            if len(photos) >= 3:
                quality += 0.15
            elif len(photos) >= 1:
                quality += 0.05
            
            # Bio
            bio = user.get('bio', '')
            if len(bio) >= 50:
                quality += 0.15
            
            # Interests
            interests = user.get('interests', [])
            if len(interests) >= 3:
                quality += 0.1
            
            # Verification
            if user.get('photoVerified'):
                quality += 0.1
            
            scores.append(min(quality, 1.0))
        
        return sum(scores) / len(scores)
    
    def _profile_to_text(self, user: Dict) -> str:
        """Convert profile to text for embedding"""
        parts = []
        
        if user.get('name'):
            parts.append(f"Name: {user['name']}")
        if user.get('bio'):
            parts.append(f"Bio: {user['bio']}")
        if user.get('interests'):
            parts.append(f"Interests: {', '.join(user['interests'])}")
        if user.get('gender'):
            parts.append(f"Gender: {user['gender']}")
        
        return ' '.join(parts)
    
    def get_curated_profiles(self, user: Dict, filters: Dict, candidates: List[Dict] = None) -> List[Dict]:
        """Get curated discovery profiles for a user"""
        if not candidates:
            return []
        
        # Score each candidate
        scored = []
        for candidate in candidates:
            result = self.calculate_compatibility(user, candidate)
            scored.append({**candidate, 'compatibilityScore': result['score']})
        
        # Sort by score descending
        scored.sort(key=lambda x: x['compatibilityScore'], reverse=True)
        
        return scored
