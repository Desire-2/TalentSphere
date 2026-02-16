"""
CV Builder Parser
Parses and repairs AI-generated JSON responses
"""
import json
import re
from typing import Dict, Any, Optional


class CVParser:
    """Parses AI responses with robust error handling"""
    
    def parse_cv_response(self, response_text: str) -> Dict[str, Any]:
        """Parse CV content from AI response with multiple fallback strategies"""
        
        # Strategy 1: Direct JSON parse
        try:
            result = json.loads(response_text)
            print("[CV Parser] ✅ Direct JSON parse successful")
            return result
        except json.JSONDecodeError:
            print("[CV Parser] Direct parse failed, trying extraction...")
            pass
        
        # Strategy 2: Extract JSON from markdown code blocks
        json_text = self._extract_json_from_text(response_text)
        if json_text:
            try:
                result = json.loads(json_text)
                print("[CV Parser] ✅ Extracted JSON parse successful")
                return result
            except json.JSONDecodeError:
                print("[CV Parser] Extracted parse failed, trying repair...")
                pass
        
        # Strategy 3: Fix common JSON formatting issues
        try:
            fixed_json = self._fix_json_formatting(json_text or response_text)
            result = json.loads(fixed_json)
            print("[CV Parser] ✅ Fixed JSON parse successful")
            return result
        except json.JSONDecodeError as e:
            print(f"[CV Parser] JSON repair failed: {str(e)[:100]}")
        
        # Strategy 4: Try json-repair library if available
        try:
            from json_repair import repair_json
            repaired = repair_json(json_text or response_text)
            result = json.loads(repaired)
            print("[CV Parser] ✅ json-repair library successful")
            return result
        except (ImportError, Exception) as e:
            print(f"[CV Parser] json-repair library failed: {str(e)[:100]}")
        
        # Strategy 5: Aggressive manual repair
        try:
            result = self._aggressive_json_repair(json_text or response_text)
            print("[CV Parser] ✅ Aggressive repair successful")
            return result
        except Exception as e:
            print(f"[CV Parser] Aggressive repair failed: {str(e)[:100]}")
        
        # Strategy 6: Return safe default structure
        print("[CV Parser] ⚠️ All parsing failed, returning default structure")
        return self._get_default_cv_structure()
    
    def _extract_json_from_text(self, text: str) -> Optional[str]:
        """Extract JSON from markdown code blocks or surrounding text"""
        
        # Remove markdown code block markers
        patterns = [
            r'```json\s*(.*?)\s*```',  # ```json ... ```
            r'```\s*(.*?)\s*```',       # ``` ... ```
            r'\{.*\}',                  # Raw JSON object
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                json_text = match.group(1) if len(match.groups()) > 0 else match.group(0)
                # Basic validation - should start with { and end with }
                json_text = json_text.strip()
                if json_text.startswith('{') and json_text.endswith('}'):
                    return json_text
        
        return None
    
    def _fix_json_formatting(self, json_str: str) -> str:
        """Fix common JSON formatting issues from AI responses"""
        
        # Remove any leading/trailing whitespace
        json_str = json_str.strip()
        
        # Remove markdown artifacts
        json_str = json_str.replace('```json', '').replace('```', '')
        
        # Fix trailing commas in objects and arrays
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # Fix missing commas between array elements
        json_str = re.sub(r'\"\s*\n\s*\"', '",\n"', json_str)
        
        # Fix unescaped quotes within strings (heuristic)
        # This is tricky - only fix obvious cases
        json_str = re.sub(r':\s*"([^"]*)"([^,}\]]+)"', r': "\1\"\2"', json_str)
        
        # Fix boolean values with quotes
        json_str = re.sub(r':\s*"(true|false|null)"', r': \1', json_str)
        
        # Fix line breaks within string values
        lines = json_str.split('\n')
        fixed_lines = []
        in_string = False
        current_line = ""
        
        for line in lines:
            # Count unescaped quotes
            quote_count = line.count('"') - line.count('\\"')
            
            if in_string:
                current_line += " " + line.strip()
                if quote_count % 2 == 1:  # Closes the string
                    fixed_lines.append(current_line)
                    in_string = False
                    current_line = ""
            else:
                if quote_count % 2 == 1:  # Opens a string
                    in_string = True
                    current_line = line
                else:
                    fixed_lines.append(line)
        
        if current_line:
            fixed_lines.append(current_line)
        
        json_str = '\n'.join(fixed_lines)
        
        return json_str
    
    def _aggressive_json_repair(self, json_str: str) -> Dict:
        """Aggressively repair JSON with multiple techniques"""
        
        json_str = json_str.strip()
        
        # Remove markdown
        json_str = re.sub(r'```json\s*', '', json_str)
        json_str = re.sub(r'```\s*', '', json_str)
        
        # Find the first { and last }
        start = json_str.find('{')
        end = json_str.rfind('}')
        
        if start == -1 or end == -1:
            raise ValueError("No valid JSON object found")
        
        json_str = json_str[start:end+1]
        
        # Fix truncated arrays - add closing brackets
        open_arrays = json_str.count('[') - json_str.count(']')
        if open_arrays > 0:
            json_str = json_str.rstrip(',') + (']' * open_arrays)
        
        # Fix truncated objects - add closing braces
        open_objects = json_str.count('{') - json_str.count('}')
        if open_objects > 0:
            json_str = json_str.rstrip(',') + ('}' * open_objects)
        
        # Remove trailing commas
        json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
        
        # Fix common issues with quotes
        json_str = re.sub(r'([^\\])""', r'\1"', json_str)
        
        # Try to parse
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            # Last resort - try to extract key sections manually
            return self._extract_cv_sections_manually(json_str)
    
    def _extract_cv_sections_manually(self, text: str) -> Dict:
        """Manually extract CV sections from malformed JSON"""
        cv_data = self._get_default_cv_structure()
        
        # Try to extract professional summary
        summary_match = re.search(r'"professional_summary"\s*:\s*"([^"]+)"', text, re.DOTALL)
        if summary_match:
            cv_data['professional_summary'] = summary_match.group(1).strip()
        
        # Try to extract contact info
        email_match = re.search(r'"email"\s*:\s*"([^"]+)"', text)
        if email_match:
            cv_data['contact_information']['email'] = email_match.group(1)
        
        phone_match = re.search(r'"phone"\s*:\s*"([^"]+)"', text)
        if phone_match:
            cv_data['contact_information']['phone'] = phone_match.group(1)
        
        # Extract skills as simple list
        skills_match = re.findall(r'"([\w\s+#\.]+)"(?:\s*,|\s*])', text)
        if skills_match:
            cv_data['technical_skills'] = {'core_skills': skills_match[:15]}
        
        return cv_data
    
    def _get_default_cv_structure(self) -> Dict:
        """Return safe default CV structure when all parsing fails"""
        return {
            'contact_information': {
                'full_name': '',
                'email': '',
                'phone': '',
                'location': ''
            },
            'professional_summary': 'Unable to generate summary. Please try again.',
            'professional_experience': [],
            'education': [],
            'technical_skills': {'core_skills': []},
            'core_competencies': [],
            'certifications': [],
            'projects': [],
            'awards': [],
            'references': [],
            '_parsing_error': True,
            '_error_message': 'CV generation encountered parsing issues. Please regenerate.'
        }
    
    def normalize_cv_structure(self, cv_data: Dict) -> Dict:
        """Normalize CV data structure for consistency"""
        
        # Ensure required sections exist
        if 'contact_information' not in cv_data:
            cv_data['contact_information'] = {}
        
        if 'professional_summary' not in cv_data:
            cv_data['professional_summary'] = ''
        
        if 'professional_experience' not in cv_data:
            cv_data['professional_experience'] = []
        
        if 'education' not in cv_data:
            cv_data['education'] = []
        
        # Normalize skills structure
        if 'technical_skills' not in cv_data:
            cv_data['technical_skills'] = {}
        
        # Handle various skills formats
        if isinstance(cv_data['technical_skills'], list):
            # Convert list to dict
            cv_data['technical_skills'] = {
                'core_skills': cv_data['technical_skills']
            }
        elif isinstance(cv_data['technical_skills'], str):
            # Convert comma-separated string to dict
            skills_list = [s.strip() for s in cv_data['technical_skills'].split(',')]
            cv_data['technical_skills'] = {
                'core_skills': skills_list
            }
        
        # Normalize core competencies
        if 'core_competencies' not in cv_data:
            cv_data['core_competencies'] = []
        elif isinstance(cv_data['core_competencies'], str):
            cv_data['core_competencies'] = [s.strip() for s in cv_data['core_competencies'].split(',')]
        
        # Clean up empty values
        if isinstance(cv_data.get('core_competencies'), list):
            cv_data['core_competencies'] = [c for c in cv_data['core_competencies'] if c]
        
        return cv_data
