import os
from typing import List


class EmbeddingGenerator:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.model = "text-embedding-3-small"

    async def generate(self, text: str) -> List[float]:
        """Generate embedding vector for text"""
        if not self.client:
            # No API key — return a deterministic pseudo-embedding from text hash
            import hashlib
            import struct
            h = hashlib.sha256(text.encode()).digest()
            # Expand to 1536 floats via repeated hashing
            embedding = []
            for i in range(1536 // 16):
                chunk = hashlib.sha256(h + struct.pack('<I', i)).digest()
                embedding.extend(struct.unpack('<16f', chunk))
            return embedding

        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            # Fall back to deterministic pseudo-embedding
            import hashlib
            import struct
            h = hashlib.sha256(text.encode()).digest()
            embedding = []
            for i in range(1536 // 16):
                chunk = hashlib.sha256(h + struct.pack('<I', i)).digest()
                embedding.extend(struct.unpack('<16f', chunk))
            return embedding

    def profile_to_text(self, profile: dict) -> str:
        """Convert profile to text for embedding"""
        parts = []

        if profile.get('name'):
            parts.append(f"Name: {profile['name']}")
        if profile.get('bio'):
            parts.append(f"Bio: {profile['bio']}")
        if profile.get('interests'):
            parts.append(f"Interests: {', '.join(profile['interests'])}")
        if profile.get('gender'):
            parts.append(f"Gender: {profile['gender']}")
        if profile.get('age'):
            parts.append(f"Age: {profile['age']}")

        return ' '.join(parts)

    async def generate_profile_embedding(self, profile: dict) -> List[float]:
        """Generate embedding for a user profile"""
        text = self.profile_to_text(profile)
        return await self.generate(text)
