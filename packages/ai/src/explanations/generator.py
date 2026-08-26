import os


class ExplanationGenerator:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.model = "gpt-4o-mini"

    async def generate(self, user_a: dict, user_b: dict) -> str:
        """Generate human-readable compatibility explanation"""

        shared_interests = list(
            set(user_a.get('interests', [])).intersection(set(user_b.get('interests', [])))
        )
        shared_str = ', '.join(shared_interests[:3]) if shared_interests else 'similar vibes'

        if not self.client:
            name_a = user_a.get('name', 'You')
            name_b = user_b.get('name', 'someone special')
            return f"You and {name_b} share a love for {shared_str}! Great potential for a meaningful connection."

        prompt = f"""You are a dating app AI assistant. Generate a brief, friendly explanation of why these two people might be compatible.

Person A:
- Name: {user_a.get('name', 'Unknown')}
- Bio: {user_a.get('bio', 'No bio')}
- Interests: {', '.join(user_a.get('interests', []))}

Person B:
- Name: {user_b.get('name', 'Unknown')}
- Bio: {user_b.get('bio', 'No bio')}
- Interests: {', '.join(user_b.get('interests', []))}

Generate a 1-2 sentence explanation that highlights their compatibility. Be specific about shared interests and complementary traits. Keep it warm and encouraging."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a friendly dating app assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return f"You and {user_b.get('name', 'someone special')} share a love for {shared_str}! Great potential for a meaningful connection."

    async def generate_starters(self, user_a: dict, user_b: dict) -> list:
        """Generate personalized conversation starters"""

        shared = list(set(user_a.get('interests', [])).intersection(set(user_b.get('interests', []))))
        name_b = user_b.get('name', '')
        interests_b = user_b.get('interests', [])
        interests_a = user_a.get('interests', [])

        if not self.client:
            starters = []
            if shared:
                starters.append(f"Hey {name_b}! I see we both love {shared[0]}. What got you started with that?")
            if interests_b:
                starters.append(f"Your bio is awesome! What's your favorite {interests_b[0]}?")
            if shared and len(shared) > 1:
                starters.append(f"I noticed we both like {', '.join(shared[:2])}. Want to chat about it?")
            else:
                starters.append(f"What's the best thing that happened to you this week, {name_b}?")
            return starters

        prompt = f"""Generate 3 personalized conversation starters for these two people who just matched on a dating app.

Person A:
- Name: {user_a.get('name', 'Unknown')}
- Bio: {user_a.get('bio', 'No bio')}
- Interests: {', '.join(interests_a)}

Person B:
- Name: {name_b}
- Bio: {user_b.get('bio', 'No bio')}
- Interests: {', '.join(interests_b)}

Generate 3 unique conversation starters that:
1. Reference shared interests
2. Are open-ended questions
3. Feel natural and not forced

Return as a JSON array of strings."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a friendly dating app assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.8,
                response_format={"type": "json_object"}
            )
            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error generating starters: {e}")
            return [
                f"Hey {name_b}! I see you're into {', '.join(interests_b[:2])}. What got you started with that?",
                f"Your bio is awesome! What's your favorite {interests_b[0] if interests_b else 'thing'}?",
                f"I noticed we both like {', '.join(shared[:2]) if shared else 'similar things'}. Want to chat about it?"
            ]
