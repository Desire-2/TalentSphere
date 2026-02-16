"""
CV Builder Service (Refactored)
Main orchestration service for AI-powered CV generation
Simplified from 2667 lines to ~300 lines by using modular components
"""
from datetime import datetime
from typing import Dict, List, Optional, Any

from src.services.cv_builder_enhancements import CVBuilderEnhancements
from .api_client import CVAPIClient
from .data_formatter import CVDataFormatter
from .job_matcher import CVJobMatcher
from .parser import CVParser
from .prompt_builder import CVPromptBuilder
from .validator import CVValidator


class CVBuilderService:
    """
    Main CV Builder service orchestrating all components
    Reduced from 2667 lines to clean modular architecture
    """
    
    def __init__(self):
        """Initialize all service components"""
        self.api_client = CVAPIClient()
        self.formatter = CVDataFormatter()
        self.job_matcher = CVJobMatcher()
        self.parser = CVParser()
        self.prompt_builder = CVPromptBuilder()
        self.validator = CVValidator()
        
        # Progress tracking
        self.generation_progress = []
        self.section_todos = []
    
    def generate_cv_content(
        self,
        user_data: Dict[str, Any],
        job_data: Optional[Dict[str, Any]] = None,
        cv_style: str = "professional",
        include_sections: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate AI-optimized CV content with deep job matching
        
        Args:
            user_data: Complete user profile data
            job_data: Optional target job information
            cv_style: Style preference (professional, creative, modern, etc.)
            include_sections: Sections to include
            
        Returns:
            Dictionary with structured CV content and metadata
        """
        if include_sections is None:
            include_sections = ['summary', 'work', 'education', 'skills', 'projects', 'certifications']
        
        print(f"[CV Builder] Generating CV - Style: {cv_style}, Sections: {include_sections}")
        if job_data:
            print(f"[CV Builder] 🎯 Job targeting: {job_data.get('title')} at {job_data.get('company_name', 'N/A')}")
        
        try:
            # Pre-analyze job match if job data provided
            matching_analysis = None
            if job_data:
                matching_analysis = self.job_matcher.analyze_match(user_data, job_data)
                print(f"[CV Builder] Match analysis: score={matching_analysis['relevance_score']}/100, "
                      f"matched={len(matching_analysis['matching_skills'])}, "
                      f"gaps={len(matching_analysis['skill_gaps'])}")
                
                # Reorder work experiences by job relevance (keeps ALL experiences)
                relevant_exps = self.job_matcher.filter_relevant_experiences(
                    user_data.get('work_experiences', []), job_data
                )
                if relevant_exps:
                    user_data['work_experiences'] = relevant_exps
                    print(f"[CV Builder] Reordered {len(relevant_exps)} experiences by relevance (all kept)")
            
            # Build comprehensive prompt
            prompt = self.prompt_builder.build_full_cv_prompt(
                user_data=user_data,
                job_data=job_data,
                cv_style=cv_style,
                include_sections=include_sections
            )
            
            print(f"[CV Builder] Prompt length: {len(prompt)} characters")
            
            # Generate CV content using AI
            response_text = self.api_client.make_request_with_retry(prompt)
            print(f"[CV Builder] ✅ AI response received ({len(response_text)} chars)")
            
            # Parse AI response
            cv_content = self.parser.parse_cv_response(response_text)
            
            # Normalize data structure
            cv_content = self.parser.normalize_cv_structure(cv_content)
            print("[CV Builder] Data normalized")
            
            # Validate and enhance content
            cv_content = self.validator.validate_content_quality(cv_content)
            
            # Check for missing sections
            missing_sections = self.validator.validate_sections_present(cv_content, include_sections)
            if missing_sections:
                print(f"[CV Builder] ⚠️  Missing sections: {missing_sections}")
                for section in missing_sections:
                    cv_content = self.validator.add_missing_section(cv_content, section, user_data)
            
            # Calculate ATS score with job data
            ats_result = CVBuilderEnhancements.calculate_ats_score(cv_content, job_data)
            cv_content['ats_score'] = ats_result
            score = ats_result.get('total_score', 0)
            print(f"[CV Builder] ATS Score: {score}/100 (Grade: {ats_result.get('grade', 'N/A')})")
            
            # Generate optimization tips
            cv_content['optimization_tips'] = CVBuilderEnhancements.generate_optimization_tips(cv_content, job_data)
            print(f"[CV Builder] Generated {len(cv_content['optimization_tips'])} tips")
            
            # Add metadata with matching analysis
            cv_content['metadata'] = {
                'generated_at': datetime.utcnow().isoformat(),
                'style': cv_style,
                'tailored_for_job': job_data.get('title') if job_data else None,
                'company': job_data.get('company_name') if job_data else None,
                'sections_included': include_sections,
                'user_id': user_data.get('id'),
                'version': '5.0-enhanced',
                'api_provider': self.api_client.current_provider
            }
            
            # Add job matching data to metadata if available
            if matching_analysis:
                cv_content['metadata']['job_match'] = {
                    'relevance_score': matching_analysis['relevance_score'],
                    'matching_skills_count': len(matching_analysis['matching_skills']),
                    'skill_gaps_count': len(matching_analysis['skill_gaps']),
                    'experience_level': matching_analysis['experience_match'].get('level', 'unknown') if isinstance(matching_analysis['experience_match'], dict) else 'unknown',
                    'approach': matching_analysis.get('tailoring_strategy', {}).get('approach', 'general'),
                }
                cv_content['job_match_analysis'] = {
                    'matching_skills': matching_analysis['matching_skills'][:15],
                    'skill_gaps': matching_analysis['skill_gaps'][:10],
                    'transferable_skills': matching_analysis.get('transferable_skills', []),
                    'experience_match': matching_analysis['experience_match'],
                    'relevance_score': matching_analysis['relevance_score'],
                }
            
            # Calculate quality score
            quality_score = self.validator.calculate_quality_score(cv_content, include_sections)
            cv_content['metadata']['quality_score'] = quality_score
            print(f"[CV Builder] Quality score: {quality_score}/100")
            
            return cv_content
            
        except Exception as e:
            print(f"[CV Builder] ❌ Generation failed: {str(e)}")
            raise Exception(f"CV generation failed: {str(e)}")
    
    def generate_cv_section_by_section(
        self,
        user_data: Dict,
        job_data: Optional[Dict] = None,
        cv_style: str = 'professional',
        include_sections: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate CV sections individually (better for rate limits)
        
        Args:
            user_data: Complete user profile data
            job_data: Optional job posting data
            cv_style: CV style template
            include_sections: Sections to generate
            
        Returns:
            Complete CV content with progress tracking
        """
        print(f"[CV Builder] Starting section-by-section generation")
        
        # Reset progress
        self.generation_progress = []
        self.section_todos = []
        
        if include_sections is None:
            include_sections = ['summary', 'work', 'education', 'skills', 'certifications']
        
        # Pre-sort work experiences by job relevance (keeps ALL experiences)
        if job_data and user_data.get('work_experiences'):
            relevant_exps = self.job_matcher.filter_relevant_experiences(
                user_data.get('work_experiences', []), job_data
            )
            if relevant_exps:
                user_data['work_experiences'] = relevant_exps
                print(f"[CV Builder] Reordered {len(relevant_exps)} experiences by relevance (all kept)")
        
        # Initialize CV structure
        cv_content = {
            'contact_information': self.formatter.extract_contact_info(user_data),
            'professional_summary': '',
            'professional_experience': [],
            'education': [],
            'technical_skills': {},
            'core_competencies': [],
            'certifications': [],
            'projects': [],
            'awards': [],
            'references': []
        }
        
        # Generate each section
        for section in include_sections:
            try:
                print(f"[CV Builder] 📝 Generating: {section}")
                
                # Validate data availability
                if not self._has_data_for_section(section, user_data):
                    print(f"[CV Builder] ⚠️  Insufficient data for: {section}")
                    self.section_todos.append({
                        'section': section,
                        'reason': 'insufficient_data',
                        'suggestion': f'Add {section} information to your profile'
                    })
                    continue
                
                # Build section prompt
                prompt = self.prompt_builder.build_section_prompt(
                    section=section,
                    user_data=user_data,
                    job_data=job_data,
                    cv_style=cv_style
                )
                
                # Generate section content
                response = self.api_client.make_request_with_retry(prompt)
                section_content = self.parser.parse_cv_response(response)
                
                # Merge into CV
                cv_content = self._merge_section(cv_content, section, section_content)
                
                # Track progress
                self.generation_progress.append({
                    'section': section,
                    'status': 'completed',
                    'timestamp': datetime.utcnow().isoformat()
                })
                
                print(f"[CV Builder] ✅ Completed: {section}")
                
            except Exception as e:
                print(f"[CV Builder] ⚠️  Error in {section}: {str(e)}")
                self.generation_progress.append({
                    'section': section,
                    'status': 'failed',
                    'error': str(e)[:100]
                })
        
        # Add ATS score and metadata
        ats_result = CVBuilderEnhancements.calculate_ats_score(cv_content, job_data)
        cv_content['ats_score'] = ats_result
        cv_content['optimization_tips'] = CVBuilderEnhancements.generate_optimization_tips(cv_content, job_data)
        
        # Add job matching analysis if job data provided
        if job_data:
            matching_analysis = self.job_matcher.analyze_match(user_data, job_data)
            cv_content['job_match_analysis'] = {
                'relevance_score': matching_analysis.get('relevance_score', 0),
                'matching_skills': matching_analysis.get('matching_skills', [])[:15],
                'skill_gaps': matching_analysis.get('skill_gaps', [])[:10],
                'transferable_skills': matching_analysis.get('transferable_skills', []),
                'experience_match': matching_analysis.get('experience_match', {}),
            }
        
        cv_content['metadata'] = {
            'generated_at': datetime.utcnow().isoformat(),
            'style': cv_style,
            'generation_method': 'section_by_section',
            'version': '5.0-enhanced',
            'sections_generated': len([p for p in self.generation_progress if p['status'] == 'completed']),
            'todos': self.section_todos,
            'tailored_for_job': job_data.get('title') if job_data else None,
            'company': job_data.get('company_name') if job_data else None,
        }
        
        print(f"[CV Builder] ✅ Section-by-section complete (ATS: {ats_result.get('total_score', 0)}/100)")
        return cv_content
    
    def _has_data_for_section(self, section: str, user_data: Dict) -> bool:
        """Check if user has data for a section"""
        data_map = {
            'summary': user_data.get('job_seeker_profile') or user_data.get('work_experiences'),
            'work': user_data.get('work_experiences'),
            'education': user_data.get('educations'),
            'skills': user_data.get('job_seeker_profile', {}).get('skills'),
            'certifications': user_data.get('certifications'),
            'projects': user_data.get('projects'),
            'awards': user_data.get('awards'),
            'references': user_data.get('references')
        }
        return bool(data_map.get(section))
    
    def _merge_section(self, cv_content: Dict, section: str, section_data: Any) -> Dict:
        """Merge section data into CV content"""
        section_mapping = {
            'summary': 'professional_summary',
            'work': 'professional_experience',
            'education': 'education',
            'skills': ['technical_skills', 'core_competencies'],
            'certifications': 'certifications',
            'projects': 'projects',
            'awards': 'awards',
            'references': 'references'
        }
        
        if section == 'skills' and isinstance(section_data, dict):
            if 'technical' in section_data:
                cv_content['technical_skills'] = section_data['technical']
            if 'competencies' in section_data:
                cv_content['core_competencies'] = section_data['competencies']
        elif section in section_mapping:
            target = section_mapping[section]
            if isinstance(target, list):
                cv_content[target[0]] = section_data
            else:
                cv_content[target] = section_data
        
        return cv_content
    
    def get_style_metadata(self) -> List[Dict]:
        """Get available CV styles with descriptions"""
        return [
            {
                'id': 'professional',
                'name': 'Professional',
                'description': 'Clean, traditional layout for corporate roles',
                'colorScheme': 'Blue & Gray',
                'bestFor': ['Corporate', 'Finance', 'Legal', 'Consulting']
            },
            {
                'id': 'creative',
                'name': 'Creative',
                'description': 'Modern, visually engaging design',
                'colorScheme': 'Purple Gradient',
                'bestFor': ['Design', 'Marketing', 'Media', 'Creative']
            },
            {
                'id': 'modern',
                'name': 'Modern',
                'description': 'Sleek minimalist with contemporary elements',
                'colorScheme': 'Teal & White',
                'bestFor': ['Tech', 'Startups', 'Digital', 'Product']
            },
            {
                'id': 'minimal',
                'name': 'Minimal',
                'description': 'Ultra-clean, content-focused layout',
                'colorScheme': 'Black & White',
                'bestFor': ['Executive', 'Academic', 'Research', 'Senior']
            },
            {
                'id': 'executive',
                'name': 'Executive',
                'description': 'Sophisticated leadership-focused design',
                'colorScheme': 'Navy & Gold',
                'bestFor': ['C-Suite', 'VP', 'Director', 'Management']
            }
        ]
