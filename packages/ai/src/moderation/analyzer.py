import os
import re
from typing import Dict, Any
from openai import OpenAI


class ContentModerator:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.model = "gpt-4o-mini"

        # Common scam patterns
        self.scam_patterns = [
            r'crypto.*invest',
            r'bitcoin.*profit',
            r'wire.*transfer',
            r'gift.*card',
            r'military.*overseas',
            r'oil.*rig',
            r'doctor.*abroad',
            r'inheritance.*million',
            r'visa.*fee',
            r'emergency.*money',
        ]

        # Harassment patterns
        self.harassment_patterns = [
            r'kill.*you',
            r'find.*you',
            r'rape',
            r'sexual.*harassment',
            r'explicit.*photos',
        ]

    def analyze_text(self, text: str, context: str = "general") -> Dict[str, Any]:
        """Analyze text for scam/harassment patterns"""
        text_lower = text.lower()

        # Check for scam patterns
        scam_detected = False
        for pattern in self.scam_patterns:
            if re.search(pattern, text_lower):
                scam_detected = True
                break

        # Check for harassment
        harassment_detected = False
        for pattern in self.harassment_patterns:
            if re.search(pattern, text_lower):
                harassment_detected = True
                break

        # Determine severity
        severity = "low"
        if scam_detected:
            severity = "high"
        elif harassment_detected:
            severity = "critical"

        # Check for off-platform requests
        off_platform = bool(re.search(
            r'(whatsapp|telegram|signal|instagram|snapchat|phone|number|email)',
            text_lower
        ))

        return {
            "is_safe": not scam_detected and not harassment_detected,
            "severity": severity,
            "flags": {
                "scam_detected": scam_detected,
                "harassment_detected": harassment_detected,
                "off_platform_request": off_platform,
            },
            "recommendation": self._get_recommendation(severity),
        }

    def analyze_bio(self, bio: str) -> Dict[str, Any]:
        """Analyze profile bio for scam patterns"""
        result = self.analyze_text(bio, "bio")

        # Additional bio-specific checks
        has_contact_info = bool(re.search(r'(phone|email|@|\.com|\.net)', bio.lower()))
        has_link = bool(re.search(r'https?://', bio))

        result["flags"]["has_contact_info"] = has_contact_info
        result["flags"]["has_link"] = has_link

        if has_contact_info:
            result["severity"] = "medium"
            result["is_safe"] = False

        return result

    def analyze_message(self, message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Analyze message for safety concerns"""
        result = self.analyze_text(message, "message")

        # Check for repeated messages (spam)
        if context and context.get("recent_messages"):
            recent = context["recent_messages"]
            if len(recent) > 3 and all(m["content"] == message for m in recent[-3:]):
                result["flags"]["spam_detected"] = True
                result["severity"] = "medium"

        # Check for meeting safety
        if re.search(r'(meet|come over|my place|your address)', message.lower()):
            result["flags"]["meeting_request"] = True

        return result

    async def analyze_with_llm(self, text: str, context: str = "general") -> Dict[str, Any]:
        """Use LLM for more nuanced content analysis"""
        if not self.client:
            return self.analyze_text(text, context)

        prompt = f"""Analyze the following text for safety concerns in a dating app context.

Context: {context}
Text: "{text}"

Check for:
1. Scam patterns (crypto, wire transfer, gift cards, military overseas)
2. Harassment or threats
3. Explicit content
4. Off-platform contact requests
5. Fake/suspicious profiles
6. Potential catfishing

Return a JSON object with:
- is_safe: boolean
- severity: "low" | "medium" | "high" | "critical"
- flags: object with specific concerns found
- confidence: float 0-1
- recommendation: what action to take"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a content moderation expert for a dating app."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Error in LLM moderation: {e}")
            return self.analyze_text(text, context)

    def _get_recommendation(self, severity: str) -> str:
        """Get recommended action based on severity"""
        recommendations = {
            "low": "No action needed",
            "medium": "Issue warning to user",
            "high": "Restrict account and review",
            "critical": "Immediate suspension and human review",
        }
        return recommendations.get(severity, "No action needed")
