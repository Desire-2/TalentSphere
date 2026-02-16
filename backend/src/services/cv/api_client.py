"""
CV Builder API Client (Enhanced)
Handles all external API communications with intelligent retry logic
"""
import os
import time
import re
from typing import Optional

class CVAPIClient:
    """Manages API requests to Gemini and OpenRouter with automatic fallback"""
    
    def __init__(self):
        """Initialize API clients and configuration"""
        self._api_key = os.getenv('GEMINI_API_KEY')
        self._openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        self._site_url = os.getenv('SITE_URL', 'https://talentsphere.com')
        self._site_name = os.getenv('SITE_NAME', 'TalentSphere')
        self._last_request_time = 0
        self._min_request_interval = 3  # 3 seconds between requests
        
        # API provider tracking
        self._current_provider = 'openrouter'
        self._openrouter_quota_exhausted = False
        self._gemini_quota_exhausted = False
        
        # Request statistics
        self._request_count = 0
        self._error_count = 0
        
        # Lazy-loaded client
        self.client = None
    
    def _get_gemini_client(self):
        """Lazy initialization of Gemini client"""
        try:
            from google import genai
        except ImportError:
            raise ValueError(
                "Google Gemini package is not installed. "
                "Install it with: pip install google-generativeai"
            )
        
        if self.client is None:
            if not self._api_key:
                raise ValueError(
                    "GEMINI_API_KEY not found in environment variables. "
                    "Please add it to your .env file to use the CV Builder."
                )
            self.client = genai.Client(api_key=self._api_key)
        return self.client
    
    def _rate_limit_wait(self):
        """Ensure we don't exceed rate limits"""
        current_time = time.time()
        time_since_last_request = current_time - self._last_request_time
        
        if time_since_last_request < self._min_request_interval:
            wait_time = self._min_request_interval - time_since_last_request
            time.sleep(wait_time)
        
        self._last_request_time = time.time()
    
    def _extract_retry_delay(self, error_message: str) -> Optional[int]:
        """Extract retry delay from error message if available"""
        patterns = [
            r'retry[_ ]?after[: ]+(\d+)[_ ]?(second|sec|s)',
            r'wait[: ]+(\d+)[_ ]?(second|sec|s)',
            r'retry[_ ]?in[: ]+(\d+)[_ ]?(second|sec|s)',
            r'(\d+)[_ ]?(second|sec|s)[_ ]+(?:before|until)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, error_message.lower())
            if match:
                return int(match.group(1))
        
        # Check for minutes
        match = re.search(r'(\d+)[_ ]?(minute|min|m)(?:\s|$)', error_message.lower())
        if match:
            return int(match.group(1)) * 60
        
        return None
    
    def call_openrouter(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2048) -> str:
        """Call OpenRouter API"""
        if not self._openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY not found. Add it to .env to use fallback.")
        
        import requests
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._openrouter_api_key}",
            "HTTP-Referer": self._site_url,
            "X-Title": self._site_name,
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "openai/gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()
        
        if 'choices' in result and len(result['choices']) > 0:
            self._current_provider = 'openrouter'
            return result['choices'][0]['message']['content']
        else:
            raise Exception("OpenRouter returned empty response")
    
    def call_gemini(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2048) -> str:
        """Direct call to Gemini API"""
        client = self._get_gemini_client()
        
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
            config={
                'temperature': temperature,
                'max_output_tokens': max_tokens,
            }
        )
        
        # Check for blocked content
        if hasattr(response, 'prompt_feedback'):
            feedback = response.prompt_feedback
            if hasattr(feedback, 'block_reason') and feedback.block_reason:
                raise Exception(f"Content blocked by safety filters: {feedback.block_reason}")
        
        # Get text from response
        if hasattr(response, 'text') and response.text:
            self._current_provider = 'gemini'
            return response.text
        
        # Try candidates
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                text = ''.join(part.text for part in candidate.content.parts if hasattr(part, 'text'))
                if text:
                    self._current_provider = 'gemini'
                    return text
        
        raise Exception("Gemini API returned empty response")
    
    def make_request_with_retry(self, prompt: str, max_retries: int = 3) -> str:
        """
        Make API request with intelligent retry logic and automatic fallback
        """
        
        self._request_count += 1
        
        # If OpenRouter quota exhausted, try Gemini directly
        if self._openrouter_quota_exhausted and self._api_key:
            print(f"[CV API] 🔄 Using Gemini (OpenRouter quota exhausted)")
            try:
                response = self.call_gemini(prompt, temperature=0.7, max_tokens=2048)
                print(f"[CV API] ✅ Gemini successful (Request #{self._request_count})")
                return response
            except Exception as e:
                print(f"[CV API] ⚠️ Gemini failed: {str(e)[:100]}")
                self._openrouter_quota_exhausted = False
        
        # Try OpenRouter first
        if self._openrouter_api_key:
            for attempt in range(max_retries):
                try:
                    self._rate_limit_wait()
                    response = self.call_openrouter(prompt, temperature=0.7, max_tokens=2048)
                    print(f"[CV API] ✅ OpenRouter successful (Request #{self._request_count}, Attempt {attempt + 1})")
                    return response
                    
                except Exception as e:
                    self._error_count += 1
                    error_str = str(e)
                    
                    # Detect rate limiting
                    is_rate_limit = any(pattern in error_str for pattern in [
                        '429', 'quota', 'QUOTA', 'rate limit', 'Rate limit',
                        'too many requests', 'requests per minute', 'RESOURCE_EXHAUSTED',
                        'rate_limit_exceeded', 'RateLimitError'
                    ])
                    
                    if is_rate_limit:
                        extracted_delay = self._extract_retry_delay(error_str)
                        
                        if attempt < max_retries - 1:
                            wait_time = extracted_delay if extracted_delay else (2 ** attempt) * 3
                            wait_time = min(wait_time, 60)  # Max 60 seconds
                            print(f"[CV API] ⏳ OpenRouter rate limit. Waiting {wait_time}s (attempt {attempt + 1}/{max_retries})")
                            time.sleep(wait_time)
                            continue
                        else:
                            self._openrouter_quota_exhausted = True
                            print(f"[CV API] ❌ OpenRouter rate limit exhausted after {max_retries} attempts")
                            break
                    else:
                        print(f"[CV API] ⚠️ OpenRouter error: {error_str[:200]}")
                        if attempt < max_retries - 1:
                            time.sleep(2)
                            continue
                        else:
                            break
        
        # Fallback to Gemini
        print(f"[CV API] 🔄 Falling back to Gemini...")
        
        if not self._api_key:
            raise Exception(
                "OpenRouter failed and no Gemini API key found. "
                "Configure at least one API: GEMINI_API_KEY or OPENROUTER_API_KEY in .env"
            )
        
        for attempt in range(max_retries):
            try:
                self._rate_limit_wait()
                response = self.call_gemini(prompt, temperature=0.7, max_tokens=2048)
                print(f"[CV API] ✅ Gemini successful (Request #{self._request_count}, Attempt {attempt + 1})")
                return response
                
            except Exception as e:
                self._error_count += 1
                error_str = str(e)
                
                is_rate_limit = any(pattern in error_str for pattern in [
                    '429', 'RESOURCE_EXHAUSTED', 'quota', 'QUOTA',
                    'rate limit', 'too many requests', 'RateLimitError'
                ])
                
                if is_rate_limit:
                    extracted_delay = self._extract_retry_delay(error_str)
                    
                    if attempt < max_retries - 1:
                        wait_time = extracted_delay if extracted_delay else (2 ** attempt) * 3
                        wait_time = min(wait_time, 60)
                        print(f"[CV API] ⏳ Gemini rate limit. Waiting {wait_time}s (attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        self._gemini_quota_exhausted = True
                        raise Exception(
                            f"⏳ Both API providers rate limited. Please wait a few minutes. "
                            f"Free tier limits: OpenRouter ~200 req/day, Gemini 15 req/min. "
                            f"Total requests: {self._request_count}, Errors: {self._error_count}"
                        )
                else:
                    print(f"[CV API] ⚠️ Gemini error: {error_str[:200]}")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    else:
                        raise Exception(f"CV generation failed: {error_str[:200]}")
        
        raise Exception(f"Max retries exceeded. Total requests: {self._request_count}")
    
    @property
    def current_provider(self) -> str:
        """Get current active API provider"""
        return self._current_provider
    
    def get_statistics(self) -> dict:
        """Get API usage statistics"""
        return {
            'total_requests': self._request_count,
            'total_errors': self._error_count,
            'success_rate': round((1 - self._error_count / max(self._request_count, 1)) * 100, 2),
            'current_provider': self._current_provider,
            'openrouter_exhausted': self._openrouter_quota_exhausted,
            'gemini_exhausted': self._gemini_quota_exhausted
        }
