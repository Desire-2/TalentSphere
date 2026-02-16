"""
CV Builder Enhancements (Enhanced)
Provides utility methods for CV optimization, ATS scoring with deep
job-keyword analysis, and quality checks
"""
from typing import Dict, List, Any, Optional
import re


class CVBuilderEnhancements:
    """Utility class for CV enhancement and optimization"""
    
    @staticmethod
    def normalize_cv_data(cv_content: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize and clean CV data"""
        defaults = {
            'contact_information': {},
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
        for key, default in defaults.items():
            if key not in cv_content:
                cv_content[key] = default
        
        if isinstance(cv_content.get('core_competencies'), list):
            cv_content['core_competencies'] = [c for c in cv_content['core_competencies'] if c]
        
        return cv_content
    
    @staticmethod
    def calculate_ats_score(cv_content: Dict[str, Any], job_data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Calculate ATS optimization score with deep job-keyword analysis
        100-point scale with detailed breakdown
        """
        score = 0
        max_score = 100
        breakdown = {}
        missing_keywords = []
        strengths = []
        improvements = []
        
        # ─── 1. Contact Information (15 points) ───
        contact = cv_content.get('contact_information', {})
        contact_score = 0
        if contact.get('email'):
            contact_score += 4
        else:
            improvements.append("Add professional email address")
        if contact.get('phone'):
            contact_score += 4
        else:
            improvements.append("Add phone number")
        if contact.get('full_name'):
            contact_score += 3
        elif contact.get('location'):
            contact_score += 3
        
        has_online = bool(contact.get('linkedin') or contact.get('github') or contact.get('portfolio'))
        if has_online:
            contact_score += 4
            strengths.append("Professional online presence included")
        else:
            improvements.append("Add LinkedIn or portfolio URL")
        
        score += contact_score
        breakdown['contact_information'] = {
            'score': contact_score, 'max': 15,
            'percentage': round((contact_score / 15) * 100),
            'status': 'excellent' if contact_score >= 12 else 'good' if contact_score >= 9 else 'needs_improvement'
        }
        
        # ─── 2. Professional Summary (15 points) ───
        summary = cv_content.get('professional_summary', '')
        summary_score = 0
        word_count = len(summary.split()) if summary else 0
        
        if 40 <= word_count <= 80:
            summary_score = 10
            strengths.append("Professional summary is well-sized")
        elif 30 <= word_count < 40:
            summary_score = 8
            improvements.append("Professional summary could be slightly longer (aim 50-80 words)")
        elif word_count > 80:
            summary_score = 7
            improvements.append("Professional summary is too long — aim for 50-80 words")
        elif word_count >= 20:
            summary_score = 5
            improvements.append("Professional summary is too short — expand to 50-80 words")
        else:
            improvements.append("Add a professional summary (50-80 words)")
        
        # Check for quantified achievements in summary
        if summary and any(c.isdigit() for c in summary):
            summary_score += 3
            strengths.append("Summary includes quantified achievements")
        elif summary:
            improvements.append("Add quantified achievements to your summary (numbers, percentages)")
        
        # Check for job title keyword in summary
        if job_data and summary:
            job_title = str(job_data.get('title', '')).lower()
            if job_title and any(word in summary.lower() for word in job_title.split() if len(word) > 3):
                summary_score += 2
                strengths.append("Summary mentions target job title keywords")
            else:
                improvements.append(f"Include target job title keywords in your summary")
        
        score += summary_score
        breakdown['professional_summary'] = {
            'score': summary_score, 'max': 15,
            'percentage': round((summary_score / 15) * 100),
            'word_count': word_count,
            'status': 'excellent' if summary_score >= 13 else 'good' if summary_score >= 10 else 'needs_improvement'
        }
        
        # ─── 3. Work Experience (25 points) ───
        experiences = cv_content.get('professional_experience', [])
        exp_score = 0
        
        if len(experiences) >= 3:
            exp_score += 8
            strengths.append(f"{len(experiences)} work experiences listed")
        elif len(experiences) >= 1:
            exp_score += 5
        else:
            improvements.append("Add work experience section")
        
        # Quantifiable achievements analysis
        quantifiable = 0
        total_achievements = 0
        action_verb_count = 0
        strong_verbs = {'led', 'developed', 'achieved', 'implemented', 'optimized', 'spearheaded',
                        'launched', 'streamlined', 'mentored', 'delivered', 'architected', 'designed',
                        'managed', 'increased', 'reduced', 'improved', 'built', 'created', 'transformed',
                        'established', 'drove', 'generated', 'negotiated', 'orchestrated', 'pioneered'}
        
        for exp in experiences:
            achievements = exp.get('achievements', [])
            total_achievements += len(achievements)
            for ach in achievements:
                ach_str = str(ach)
                if any(c.isdigit() for c in ach_str) or any(w in ach_str.lower() for w in ['%', '$', 'increased', 'reduced', 'improved', 'grew', 'saved']):
                    quantifiable += 1
                first_word = ach_str.split()[0].lower().rstrip('ed').rstrip('d') if ach_str.split() else ''
                if any(v.startswith(first_word) for v in strong_verbs) or ach_str.split()[0].lower() in strong_verbs:
                    action_verb_count += 1
        
        if quantifiable >= 8:
            exp_score += 12
            strengths.append(f"{quantifiable} quantifiable achievements with metrics")
        elif quantifiable >= 5:
            exp_score += 9
            strengths.append(f"{quantifiable} quantifiable achievements")
        elif quantifiable >= 3:
            exp_score += 6
            improvements.append("Add more quantifiable achievements with specific metrics")
        elif quantifiable >= 1:
            exp_score += 3
            improvements.append("Include more quantifiable achievements with numbers and percentages")
        else:
            improvements.append("Add quantifiable achievements to every work experience")
        
        # Action verbs bonus
        if total_achievements > 0:
            verb_ratio = action_verb_count / total_achievements
            if verb_ratio >= 0.7:
                exp_score += 5
                strengths.append("Strong action verbs used throughout")
            elif verb_ratio >= 0.4:
                exp_score += 3
            else:
                improvements.append("Start achievement bullets with strong action verbs (Led, Developed, Achieved)")
        
        score += exp_score
        breakdown['work_experience'] = {
            'score': exp_score, 'max': 25,
            'percentage': round((exp_score / 25) * 100),
            'total_positions': len(experiences),
            'total_achievements': total_achievements,
            'quantifiable_achievements': quantifiable,
            'action_verb_usage': f"{action_verb_count}/{total_achievements}",
            'status': 'excellent' if exp_score >= 20 else 'good' if exp_score >= 15 else 'needs_improvement'
        }
        
        # ─── 4. Education (10 points) ───
        education = cv_content.get('education', [])
        edu_score = 0
        
        if len(education) >= 1:
            edu_score = 7
            # Bonus for relevant coursework
            has_coursework = any(e.get('relevant_coursework') for e in education)
            if has_coursework:
                edu_score += 3
                strengths.append("Relevant coursework included")
            elif job_data:
                improvements.append("Add relevant coursework that matches job requirements")
            strengths.append("Education section complete")
        else:
            improvements.append("Add education information")
        
        score += edu_score
        breakdown['education'] = {
            'score': edu_score, 'max': 10,
            'percentage': round((edu_score / 10) * 100),
            'entries': len(education),
            'status': 'complete' if edu_score >= 7 else 'missing'
        }
        
        # ─── 5. Skills (20 points) ───
        skills = cv_content.get('technical_skills', {})
        competencies = cv_content.get('core_competencies', [])
        skills_score = 0
        total_skills_count = 0
        
        if isinstance(skills, dict):
            total_skills_count = sum(len(v) for v in skills.values() if isinstance(v, list))
        elif isinstance(skills, list):
            total_skills_count = len(skills)
        
        if total_skills_count >= 15:
            skills_score = 10
            strengths.append(f"{total_skills_count} technical skills listed")
        elif total_skills_count >= 10:
            skills_score = 8
        elif total_skills_count >= 6:
            skills_score = 6
            improvements.append("Add more relevant technical skills (aim for 15+)")
        elif total_skills_count >= 3:
            skills_score = 4
            improvements.append("Expand skills section significantly")
        else:
            improvements.append("Add comprehensive skills section (aim for 12-20 skills)")
        
        # Skills categorization bonus
        if isinstance(skills, dict) and len(skills) >= 3:
            skills_score += 3
            strengths.append("Skills well-categorized")
        elif isinstance(skills, dict) and len(skills) >= 2:
            skills_score += 2
        else:
            improvements.append("Categorize skills (Programming, Frameworks, Databases, Cloud, etc.)")
        
        # Core competencies bonus
        if isinstance(competencies, list) and len(competencies) >= 6:
            skills_score += 3
            strengths.append(f"{len(competencies)} core competencies listed")
        elif isinstance(competencies, list) and len(competencies) >= 3:
            skills_score += 2
        else:
            improvements.append("Add core competencies (soft skills, leadership abilities)")
        
        # ─── Job keyword matching (skills bonus up to +4) ───
        if job_data:
            job_text = f"{job_data.get('requirements', '')} {job_data.get('description', '')} {job_data.get('required_skills', '')}".lower()
            cv_text = f"{str(skills).lower()} {str(competencies).lower()} {summary.lower()}"
            
            # Comprehensive keyword extraction from job
            all_keywords = set()
            # Extract from known tech keywords
            tech_keywords = [
                'python', 'javascript', 'java', 'react', 'node', 'sql', 'aws', 'docker',
                'kubernetes', 'git', 'agile', 'scrum', 'ci/cd', 'rest', 'api', 'mongodb',
                'typescript', 'angular', 'vue', 'django', 'flask', 'postgresql', 'redis',
                'machine learning', 'ai', 'data analysis', 'tensorflow', 'excel', 'tableau',
                'spring', 'docker', 'linux', 'ubuntu', 'windows', 'macos', 'figma',
                'jira', 'confluence', 'slack', 'trello', 'notion', 'github', 'gitlab',
                'nextjs', 'fastapi', 'graphql', 'firebase', 'supabase', 'terraform',
                'gcp', 'azure', 'heroku', 'vercel', 'nginx', 'apache', 'celery',
                'rabbitmq', 'kafka', 'spark', 'hadoop', 'airflow', 'dbt', 'snowflake',
                'pandas', 'numpy', 'scikit-learn', 'pytorch', 'keras', 'matplotlib',
                'sass', 'tailwind', 'bootstrap', 'webpack', 'vite', 'rollup',
                'communication', 'leadership', 'teamwork', 'problem-solving',
                'project management', 'stakeholder management', 'strategic planning',
            ]
            
            for kw in tech_keywords:
                if kw in job_text:
                    all_keywords.add(kw)
            
            # Also extract significant words from job requirements
            req_words = re.findall(r'[a-z0-9\+\#\.\-/]{3,}', job_text)
            stop_words = {'the', 'and', 'for', 'with', 'that', 'this', 'will', 'are', 'from',
                         'have', 'been', 'our', 'your', 'they', 'you', 'not', 'but', 'can',
                         'all', 'each', 'which', 'when', 'what', 'how', 'who', 'may', 'also',
                         'work', 'working', 'role', 'position', 'job', 'company', 'team',
                         'able', 'ability', 'strong', 'good', 'excellent', 'ideal', 'preferred',
                         'required', 'requirements', 'looking', 'seeking', 'join', 'including'}
            for word in req_words:
                if word not in stop_words and len(word) > 3:
                    all_keywords.add(word)
            
            # Score keyword presence
            matched_kw = 0
            for kw in all_keywords:
                if kw in cv_text:
                    matched_kw += 1
                else:
                    if len(kw) > 3:  # Only report meaningful missing keywords
                        missing_keywords.append(kw)
            
            if all_keywords:
                kw_ratio = matched_kw / len(all_keywords)
                if kw_ratio >= 0.7:
                    skills_score += 4
                    strengths.append(f"Excellent keyword match: {matched_kw}/{len(all_keywords)} job keywords found")
                elif kw_ratio >= 0.5:
                    skills_score += 3
                    strengths.append(f"Good keyword match: {matched_kw}/{len(all_keywords)} job keywords found")
                elif kw_ratio >= 0.3:
                    skills_score += 2
                    improvements.append(f"Improve keyword match: only {matched_kw}/{len(all_keywords)} job keywords found")
                else:
                    skills_score += 1
                    improvements.append(f"Low keyword match: {matched_kw}/{len(all_keywords)} — add more job-relevant keywords")
            
            # Limit and sort missing keywords by relevance
            missing_keywords = sorted(set(missing_keywords), key=lambda x: len(x), reverse=True)[:15]
        
        skills_score = min(20, skills_score)
        score += skills_score
        breakdown['skills'] = {
            'score': skills_score, 'max': 20,
            'percentage': round((skills_score / 20) * 100),
            'total_skills': total_skills_count,
            'competencies_count': len(competencies) if isinstance(competencies, list) else 0,
            'categories': len(skills) if isinstance(skills, dict) else 0,
            'status': 'excellent' if skills_score >= 18 else 'good' if skills_score >= 14 else 'needs_improvement'
        }
        
        # ─── 6. Additional Sections (15 points) ───
        additional_score = 0
        certs = cv_content.get('certifications', [])
        projects = cv_content.get('projects', [])
        awards = cv_content.get('awards', [])
        
        if len(certs) >= 1:
            additional_score += 5
            strengths.append(f"{len(certs)} certification(s) listed")
        else:
            improvements.append("Consider adding relevant certifications")
        
        if len(projects) >= 1:
            additional_score += 5
            # Bonus for projects with technologies listed
            projects_with_tech = sum(1 for p in projects if p.get('technologies'))
            if projects_with_tech >= 1:
                additional_score += 1
            strengths.append(f"{len(projects)} project(s) showcased")
        else:
            improvements.append("Showcase relevant projects or portfolio work")
        
        if len(awards) >= 1:
            additional_score += 4
            strengths.append("Awards and recognition included")
        
        additional_score = min(15, additional_score)
        score += additional_score
        breakdown['additional_sections'] = {
            'score': additional_score, 'max': 15,
            'percentage': round((additional_score / 15) * 100),
            'certifications': len(certs),
            'projects': len(projects),
            'awards': len(awards),
            'status': 'excellent' if additional_score >= 12 else 'good' if additional_score >= 8 else 'basic'
        }
        
        # ─── Calculate final score ───
        final_score = min(100, score)
        
        return {
            'total_score': final_score,
            'estimated_score': final_score,
            'max_score': max_score,
            'percentage': round((final_score / max_score) * 100),
            'grade': CVBuilderEnhancements._get_grade(final_score),
            'breakdown': breakdown,
            'strengths': strengths[:7],
            'improvements': improvements[:8],
            'missing_keywords': missing_keywords[:15] if missing_keywords else [],
            'keyword_match_rate': round((1 - min(len(missing_keywords), 15) / 15) * 100) if job_data else None
        }
    
    @staticmethod
    def generate_optimization_tips(cv_content: Dict[str, Any], job_data: Optional[Dict] = None) -> List[str]:
        """Generate actionable optimization tips for improving CV"""
        tips = []
        
        # Summary analysis
        summary = cv_content.get('professional_summary', '')
        word_count = len(summary.split()) if summary else 0
        
        if not summary:
            tips.append("Add a professional summary to introduce yourself and highlight key achievements")
        else:
            if word_count < 40:
                tips.append(f"Expand your professional summary (currently {word_count} words, aim for 50-80 words)")
            elif word_count > 80:
                tips.append(f"Condense your professional summary (currently {word_count} words, aim for 50-80 words)")
            
            if not any(c.isdigit() for c in summary):
                tips.append("Add quantified metrics to your summary (e.g., percentages, dollar amounts, team sizes)")
        
        # Experience analysis
        experiences = cv_content.get('professional_experience', [])
        if not experiences:
            tips.append("Add work experience to showcase your professional background")
        else:
            total_achievements = 0
            quantified = 0
            weak_verbs_found = False
            weak_verbs = ['responsible for', 'worked on', 'helped with', 'duties included', 'tasked with', 'assisted with']
            
            for exp in experiences:
                achievements = exp.get('achievements', [])
                total_achievements += len(achievements)
                for ach in achievements:
                    ach_str = str(ach)
                    if any(c.isdigit() for c in ach_str):
                        quantified += 1
                    if any(wv in ach_str.lower() for wv in weak_verbs):
                        weak_verbs_found = True
            
            if total_achievements == 0:
                tips.append("Add 3-5 achievement bullets to each work experience")
            elif quantified < total_achievements * 0.5:
                tips.append(f"Quantify more achievements — only {quantified}/{total_achievements} have metrics. Aim for 70%+")
            
            if weak_verbs_found:
                tips.append("Replace weak verbs ('responsible for', 'helped with') with strong action verbs ('Led', 'Developed', 'Achieved', 'Implemented')")
        
        # Skills analysis
        skills = cv_content.get('technical_skills', {})
        skills_count = sum(len(v) for v in skills.values() if isinstance(v, list)) if isinstance(skills, dict) else len(skills) if isinstance(skills, list) else 0
        
        if skills_count < 10:
            tips.append(f"Add more technical skills (currently {skills_count}, aim for 12-20)")
        
        if isinstance(skills, dict) and len(skills) < 3:
            tips.append("Categorize skills into groups (Programming Languages, Frameworks, Databases, Cloud/DevOps)")
        
        # Competencies
        competencies = cv_content.get('core_competencies', [])
        if not competencies:
            tips.append("Add core competencies section to highlight soft skills and leadership abilities")
        elif len(competencies) < 6:
            tips.append(f"Expand competencies (currently {len(competencies)}, aim for 8-10)")
        
        # Contact info
        contact = cv_content.get('contact_information', {})
        if not contact.get('linkedin') and not contact.get('github') and not contact.get('portfolio'):
            tips.append("Add professional profiles (LinkedIn, GitHub, or portfolio URL)")
        
        # Additional sections
        if not cv_content.get('certifications') and not cv_content.get('awards'):
            tips.append("Add certifications or awards to stand out from other candidates")
        
        if not cv_content.get('projects'):
            tips.append("Showcase relevant projects to demonstrate practical skills")
        
        # Job-specific tips
        if job_data:
            job_title = str(job_data.get('title', ''))
            if job_title and job_title.lower() not in summary.lower():
                tips.append(f"Include the target job title '{job_title}' in your professional summary")
            
            # Check missing keywords
            ats_data = CVBuilderEnhancements.calculate_ats_score(cv_content, job_data)
            missing = ats_data.get('missing_keywords', [])
            if missing and len(missing) <= 8:
                tips.append(f"Add these job-relevant keywords if applicable: {', '.join(missing[:5])}")
            elif missing:
                tips.append(f"Your CV is missing {len(missing)} job keywords — review job requirements and add matching skills")
            
            kw_rate = ats_data.get('keyword_match_rate')
            if kw_rate is not None and kw_rate < 50:
                tips.append("Low keyword match with job posting — review the job description and mirror its exact terminology")
        
        # General best practices
        if len(tips) < 3:
            tips.append("Use consistent formatting and clear section headers for ATS compatibility")
            tips.append("Keep CV to 1-2 pages for optimal readability")
        
        return tips[:10]
    
    @staticmethod
    def _get_grade(score: int) -> str:
        """Get letter grade from score"""
        if score >= 90:
            return 'A'
        elif score >= 80:
            return 'B'
        elif score >= 70:
            return 'C'
        elif score >= 60:
            return 'D'
        else:
            return 'F'
