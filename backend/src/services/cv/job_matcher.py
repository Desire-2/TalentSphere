"""
CV Builder Job Matcher (Enhanced)
Advanced job-candidate matching with deep keyword analysis,
skill gap detection, and experience relevance scoring
"""
from typing import Dict, List, Tuple, Set
import re
from collections import Counter
from datetime import datetime


class CVJobMatcher:
    """Advanced job requirements vs candidate profile analysis"""
    
    # Common stop words to filter out
    STOP_WORDS = frozenset({
        'the', 'and', 'for', 'with', 'that', 'this', 'will', 'are', 'from',
        'have', 'has', 'been', 'being', 'were', 'was', 'our', 'your', 'they',
        'their', 'you', 'not', 'but', 'can', 'all', 'each', 'which', 'when',
        'what', 'how', 'who', 'may', 'also', 'its', 'about', 'into', 'more',
        'other', 'than', 'then', 'some', 'such', 'only', 'over', 'new', 'well',
        'should', 'would', 'could', 'must', 'shall', 'might', 'need', 'want',
        'work', 'working', 'role', 'position', 'job', 'company', 'team',
        'able', 'ability', 'strong', 'good', 'excellent', 'ideal', 'preferred',
        'required', 'requirements', 'looking', 'seeking', 'join', 'part',
        'including', 'include', 'includes', 'etc', 'per', 'using', 'used',
        'experience', 'experienced', 'proficient', 'proficiency', 'knowledge',
        'expertise', 'skilled', 'familiar', 'familiarity', 'comfortable',
        'understanding', 'background', 'senior', 'junior', 'mid', 'level',
        'plus', 'bonus', 'minimum', 'years', 'year', 'least', 'various',
        'like', 'help', 'take', 'make', 'ensure', 'provide', 'develop',
        'create', 'build', 'implement', 'maintain', 'manage', 'support',
        'drive', 'deliver', 'lead', 'own', 'across', 'within', 'both',
        'through', 'based', 'related', 'relevant', 'desired', 'nice',
        'developer', 'developers', 'engineer', 'engineers', 'analyst',
        'specialist', 'coordinator', 'associate', 'consultant',
        'learning', 'machine', 'stack', 'full', 'end', 'applications',
    })
    
    # Multi-word technical terms to detect as single tokens
    COMPOUND_TERMS = [
        'machine learning', 'deep learning', 'natural language processing',
        'computer vision', 'data science', 'data engineering', 'data analysis',
        'cloud computing', 'web development', 'mobile development',
        'full stack', 'front end', 'back end', 'frontend', 'backend',
        'project management', 'product management', 'supply chain',
        'business intelligence', 'quality assurance', 'user experience',
        'user interface', 'devops', 'ci/cd', 'continuous integration',
        'version control', 'test driven', 'object oriented',
        'agile methodology', 'scrum master', 'software engineering',
        'systems design', 'distributed systems', 'microservices',
        'rest api', 'graphql', 'real time', 'big data', 'power bi',
        'google cloud', 'amazon web services', 'microsoft azure',
        'problem solving', 'critical thinking', 'decision making',
        'time management', 'cross functional', 'stakeholder management',
        'financial analysis', 'market research', 'digital marketing',
        'social media', 'content management', 'search engine optimization',
        'human resources', 'talent acquisition', 'customer service',
        'technical writing', 'public speaking', 'business development',
        'risk management', 'change management', 'process improvement',
    ]
    
    # Industry / role keyword clusters
    SKILL_CLUSTERS = {
        'programming': {'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'php', 'scala', 'r', 'matlab', 'perl', 'dart', 'lua'},
        'web_frontend': {'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery', 'webpack', 'vite'},
        'web_backend': {'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails', 'laravel', 'asp.net', 'gin', 'nestjs'},
        'databases': {'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'oracle', 'sqlite', 'firebase', 'supabase'},
        'cloud': {'aws', 'azure', 'gcp', 'heroku', 'vercel', 'netlify', 'digitalocean', 'terraform', 'cloudformation'},
        'devops': {'docker', 'kubernetes', 'jenkins', 'github actions', 'gitlab ci', 'ansible', 'puppet', 'chef', 'prometheus', 'grafana', 'nginx'},
        'data_science': {'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'spark', 'hadoop', 'tableau', 'power bi', 'jupyter', 'matplotlib'},
        'mobile': {'react native', 'flutter', 'swift', 'kotlin', 'android', 'ios', 'xamarin', 'ionic'},
        'soft_skills': {'leadership', 'communication', 'teamwork', 'collaboration', 'problem-solving', 'analytical', 'strategic', 'mentoring', 'presentation', 'negotiation'},
        'methodologies': {'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'six sigma', 'design thinking', 'test-driven development'},
    }
    
    def analyze_match(self, user_data: Dict, job_data: Dict) -> Dict:
        """Comprehensive matching analysis with deep keyword and skill gap analysis"""
        
        job_keywords = self._extract_job_keywords(job_data)
        profile_keywords = self._extract_profile_keywords(user_data)
        
        matching_skills = self._analyze_skill_match(job_keywords, profile_keywords)
        skill_gaps = self._identify_skill_gaps(job_keywords, profile_keywords)
        experience_match = self._analyze_experience_match(
            user_data.get('work_experiences', []), job_data
        )
        relevance_score = self._calculate_relevance_score(
            matching_skills, skill_gaps, experience_match, job_keywords, profile_keywords
        )
        
        required_skills, preferred_skills = self._classify_requirements(job_data)
        transferable = self._find_transferable_skills(user_data, job_data)
        
        strategy = self._generate_tailoring_strategy(
            matching_skills, skill_gaps, experience_match, job_data, relevance_score
        )
        
        return {
            'matching_skills': list(matching_skills),
            'skill_gaps': list(skill_gaps),
            'required_skills': required_skills,
            'preferred_skills': preferred_skills,
            'transferable_skills': transferable,
            'experience_match': experience_match,
            'relevance_score': relevance_score,
            'job_keywords': list(job_keywords)[:30],
            'candidate_keywords': list(profile_keywords)[:30],
            'tailoring_strategy': strategy,
            'keyword_density': self._calculate_keyword_density(job_data),
            'experience_relevance': self._score_experience_relevance(
                user_data.get('work_experiences', []), job_data
            )
        }
    
    def _extract_job_keywords(self, job_data: Dict) -> Set[str]:
        """Extract meaningful keywords from job posting with NLP-style processing"""
        keywords = set()
        
        # Helper: convert field value to string (handles lists, strings, None)
        def _to_str(val):
            if isinstance(val, list):
                return ', '.join(str(v) for v in val)
            return str(val) if val else ''
        
        texts = {
            'title': (_to_str(job_data.get('title', '')), 3.0),
            'requirements': (_to_str(job_data.get('requirements', '')), 2.5),
            'required_skills': (_to_str(job_data.get('required_skills', '')), 2.5),
            'preferred_skills': (_to_str(job_data.get('preferred_skills', '')), 1.5),
            'description': (_to_str(job_data.get('description', '')), 1.0),
            'keywords': (_to_str(job_data.get('keywords', '')), 2.0),
            'full_posting': (_to_str(job_data.get('full_posting', '')), 0.8),
        }
        
        combined_text = ' '.join(t for t, _ in texts.values()).lower()
        
        # 1. Extract compound terms first
        for term in self.COMPOUND_TERMS:
            if term in combined_text:
                keywords.add(term)
        
        # 2. Extract with regex patterns
        skill_patterns = [
            r'(?:experience|proficient|proficiency|knowledge|expertise|skilled|familiar)\s+(?:with|in|of|using)\s+([a-z0-9\+\#\.\-/]+(?:\s*(?:,|and)\s*[a-z0-9\+\#\.\-/]+)*)',
            r'(?:strong|solid|deep|good)\s+(?:understanding|knowledge|skills?)\s+(?:of|in|with)\s+([a-z0-9\+\#\.\-/\s]+?)(?:\.|,|;|\n)',
            r'(?:familiarity|comfortable)\s+with\s+([a-z0-9\+\#\.\-/\s]+?)(?:\.|,|;|\n)',
            r'(?:must|should)\s+(?:have|know|understand)\s+([a-z0-9\+\#\.\-/\s]+?)(?:\.|,|;|\n)',
        ]
        
        for pattern in skill_patterns:
            matches = re.findall(pattern, combined_text)
            for match in matches:
                parts = re.split(r'\s*[,;]\s*|\s+and\s+', match)
                for part in parts:
                    part = part.strip()
                    if part and len(part) > 1 and part not in self.STOP_WORDS:
                        keywords.add(part)
        
        # 3. Extract individual meaningful words
        for source, (text, _weight) in texts.items():
            if not text:
                continue
            words = re.findall(r'[a-z0-9\+\#\.\-/]{2,}', text.lower())
            for word in words:
                # Strip trailing punctuation
                word = word.rstrip('.,;:!?')
                if word and word not in self.STOP_WORDS and len(word) > 2:
                    keywords.add(word)
        
        # 4. Check against known skill clusters (with word boundary for short terms)
        for cluster_name, cluster_skills in self.SKILL_CLUSTERS.items():
            for skill in cluster_skills:
                if len(skill) <= 2:
                    # Short skills need word boundary match to avoid false positives
                    if re.search(r'\b' + re.escape(skill) + r'\b', combined_text):
                        keywords.add(skill)
                elif skill in combined_text:
                    keywords.add(skill)
        
        # 5. Extract years of experience requirements
        exp_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)', combined_text)
        if exp_match:
            keywords.add(f"{exp_match.group(1)}+ years experience")
        
        # 6. Extract education requirements
        edu_patterns = [
            r"(bachelor'?s?|master'?s?|phd|doctorate|mba|associate'?s?)\s*(?:degree|'s)?\s*(?:in\s+([a-z\s]+?))?(?:\.|,|;|or|\n)",
        ]
        for pattern in edu_patterns:
            matches = re.findall(pattern, combined_text)
            for match in matches:
                if isinstance(match, tuple):
                    keywords.add(match[0])
                    if match[1].strip():
                        keywords.add(match[1].strip())
                else:
                    keywords.add(match)
        
        return keywords
    
    def _extract_profile_keywords(self, user_data: Dict) -> Set[str]:
        """Extract keywords from candidate profile with deep analysis"""
        keywords = set()
        profile = user_data.get('job_seeker_profile', {})
        
        # Skills
        if profile.get('skills'):
            for skill in re.split(r'[,;|]+', str(profile['skills'])):
                skill = skill.strip().lower()
                if skill and skill not in self.STOP_WORDS:
                    keywords.add(skill)
        
        # Soft skills
        if profile.get('soft_skills'):
            for skill in re.split(r'[,;|]+', str(profile['soft_skills'])):
                skill = skill.strip().lower()
                if skill:
                    keywords.add(skill)
        
        # Professional title
        if profile.get('professional_title'):
            for word in profile['professional_title'].lower().split():
                if word not in self.STOP_WORDS:
                    keywords.add(word)
            keywords.add(profile['professional_title'].lower())
        
        # Professional summary
        if profile.get('professional_summary'):
            text = profile['professional_summary'].lower()
            for term in self.COMPOUND_TERMS:
                if term in text:
                    keywords.add(term)
            for cluster_skills in self.SKILL_CLUSTERS.values():
                for skill in cluster_skills:
                    if skill in text:
                        keywords.add(skill)
        
        # Work experience
        for exp in user_data.get('work_experiences', []):
            if exp.get('job_title'):
                keywords.add(exp['job_title'].lower())
                for word in exp['job_title'].lower().split():
                    if word not in self.STOP_WORDS:
                        keywords.add(word)
            
            if exp.get('description'):
                desc = exp['description'].lower()
                for term in self.COMPOUND_TERMS:
                    if term in desc:
                        keywords.add(term)
                for cluster_skills in self.SKILL_CLUSTERS.values():
                    for skill in cluster_skills:
                        if skill in desc:
                            keywords.add(skill)
            
            techs = exp.get('technologies_used', [])
            if isinstance(techs, list):
                for tech in techs:
                    keywords.add(str(tech).lower().strip())
            elif isinstance(techs, str):
                for tech in re.split(r'[,;|]+', techs):
                    tech = tech.strip().lower()
                    if tech:
                        keywords.add(tech)
            
            for ach in exp.get('achievements', []) or []:
                text = str(ach).lower()
                for cluster_skills in self.SKILL_CLUSTERS.values():
                    for skill in cluster_skills:
                        if skill in text:
                            keywords.add(skill)
        
        # Education
        for edu in user_data.get('educations', []):
            if edu.get('field_of_study'):
                keywords.add(edu['field_of_study'].lower())
            if edu.get('degree_title'):
                keywords.add(edu['degree_title'].lower())
        
        # Certifications
        for cert in user_data.get('certifications', []):
            if cert.get('name'):
                keywords.add(cert['name'].lower())
        
        # Languages
        if profile.get('languages'):
            langs = profile['languages']
            if isinstance(langs, list):
                keywords.update(l.lower() for l in langs)
            elif isinstance(langs, str):
                keywords.update(l.strip().lower() for l in langs.split(','))
        
        return keywords
    
    def _analyze_skill_match(self, job_keywords: Set[str], profile_keywords: Set[str]) -> Set[str]:
        """Find matching skills with fuzzy matching and cluster awareness"""
        direct_matches = job_keywords & profile_keywords
        
        fuzzy_matches = set()
        for jk in job_keywords:
            for pk in profile_keywords:
                if jk == pk:
                    continue
                if len(jk) > 3 and len(pk) > 3:
                    if jk in pk or pk in jk:
                        fuzzy_matches.add(jk)
                jk_norm = re.sub(r'[\.\-\s/]', '', jk)
                pk_norm = re.sub(r'[\.\-\s/]', '', pk)
                if jk_norm == pk_norm and len(jk_norm) > 2:
                    fuzzy_matches.add(jk)
        
        cluster_matches = set()
        for cluster_name, cluster_skills in self.SKILL_CLUSTERS.items():
            job_in_cluster = job_keywords & cluster_skills
            profile_in_cluster = profile_keywords & cluster_skills
            if job_in_cluster and profile_in_cluster:
                cluster_matches.update(profile_in_cluster & job_keywords)
        
        return direct_matches | fuzzy_matches | cluster_matches
    
    def _identify_skill_gaps(self, job_keywords: Set[str], profile_keywords: Set[str]) -> Set[str]:
        """Identify skills the job requires that the candidate lacks"""
        meaningful_gaps = set()
        raw_gaps = job_keywords - profile_keywords
        
        for gap in raw_gaps:
            is_known_skill = any(gap in cluster for cluster in self.SKILL_CLUSTERS.values())
            is_compound = gap in self.COMPOUND_TERMS
            is_substantive = len(gap) > 3 and gap not in self.STOP_WORDS
            
            if is_known_skill or is_compound or is_substantive:
                has_fuzzy_match = any(
                    gap in pk or pk in gap
                    for pk in profile_keywords
                    if len(pk) > 3
                )
                if not has_fuzzy_match:
                    meaningful_gaps.add(gap)
        
        return meaningful_gaps
    
    def _classify_requirements(self, job_data: Dict) -> Tuple[List[str], List[str]]:
        """Separate required vs preferred/nice-to-have skills"""
        required = []
        preferred = []
        
        req_text = str(job_data.get('requirements', '')).lower()
        desc_text = str(job_data.get('description', '')).lower()
        
        required_section = ''
        preferred_section = ''
        
        for text in [req_text, desc_text]:
            req_match = re.search(r'(?:required|must have|minimum|essential)[:\s]*(.+?)(?:preferred|nice to have|bonus|desired|$)', text, re.DOTALL)
            if req_match:
                required_section += ' ' + req_match.group(1)
            
            pref_match = re.search(r'(?:preferred|nice to have|bonus|desired|plus)[:\s]*(.+?)(?:$)', text, re.DOTALL)
            if pref_match:
                preferred_section += ' ' + pref_match.group(1)
        
        for cluster_skills in self.SKILL_CLUSTERS.values():
            for skill in cluster_skills:
                if skill in required_section:
                    required.append(skill)
                elif skill in preferred_section:
                    preferred.append(skill)
                elif skill in req_text and not preferred_section:
                    required.append(skill)
        
        return required[:15], preferred[:10]
    
    def _find_transferable_skills(self, user_data: Dict, job_data: Dict) -> List[str]:
        """Identify transferable skills relevant but not directly listed"""
        transferable = []
        profile = user_data.get('job_seeker_profile', {})
        job_text = f"{job_data.get('description', '')} {job_data.get('requirements', '')}".lower()
        
        for exp in user_data.get('work_experiences', []):
            title = str(exp.get('job_title', '')).lower()
            desc = str(exp.get('description', '')).lower()
            
            if any(w in title for w in ['lead', 'senior', 'manager', 'head', 'director', 'principal']):
                if 'leadership' in job_text or 'management' in job_text or 'lead' in job_text:
                    transferable.append('leadership experience')
            
            if any(w in desc for w in ['mentored', 'coached', 'trained', 'supervised']):
                transferable.append('mentoring and training')
            
            if any(w in desc for w in ['cross-functional', 'stakeholder', 'client-facing']):
                transferable.append('cross-functional collaboration')
            
            if any(w in desc for w in ['budget', 'revenue', 'cost', 'profit']):
                if 'business' in job_text or 'financial' in job_text:
                    transferable.append('business acumen')
        
        soft_skills = str(profile.get('soft_skills', '')).lower()
        if soft_skills:
            for skill in ['communication', 'problem-solving', 'analytical', 'strategic thinking']:
                if skill in soft_skills and skill in job_text:
                    transferable.append(skill)
        
        return list(set(transferable))[:8]
    
    def _analyze_experience_match(self, work_experiences: List[Dict], job_data: Dict) -> Dict:
        """Deep analysis of experience alignment with job requirements"""
        if not work_experiences:
            return {
                'level': 'entry',
                'summary': 'Entry level - emphasize education, projects, and transferable skills',
                'years_total': 0,
                'relevant_years': 0,
                'title_match': False,
                'industry_match': False
            }
        
        job_title = job_data.get('title', '').lower()
        job_text = f"{job_data.get('description', '')} {job_data.get('requirements', '')}".lower()
        
        total_years = 0
        relevant_years = 0
        title_match = False
        industry_match = False
        
        for exp in work_experiences:
            exp_title = str(exp.get('job_title', '')).lower()
            years = self._estimate_years(exp.get('start_date'), exp.get('end_date'), exp.get('is_current', False))
            total_years += years
            
            title_words = set(job_title.split()) - self.STOP_WORDS
            exp_title_words = set(exp_title.split()) - self.STOP_WORDS
            if title_words & exp_title_words or job_title in exp_title or exp_title in job_title:
                title_match = True
                relevant_years += years
            elif self._titles_in_same_domain(job_title, exp_title):
                industry_match = True
                relevant_years += years * 0.7
        
        req_years_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)', job_text)
        required_years = job_data.get('years_experience_min') or (int(req_years_match.group(1)) if req_years_match else 0)
        
        if title_match and total_years >= required_years:
            level = 'strong'
            summary = f"Strong match - {total_years:.0f} years total, direct title alignment"
        elif industry_match and total_years >= required_years:
            level = 'good'
            summary = f"Good match - {total_years:.0f} years in related roles"
        elif total_years >= required_years:
            level = 'moderate'
            summary = f"Moderate match - {total_years:.0f} years experience, emphasize transferable skills"
        elif total_years >= max(1, required_years - 2):
            level = 'developing'
            summary = f"Developing match - {total_years:.0f} years (job asks {required_years}+)"
        else:
            level = 'pivot'
            summary = "Career pivot - focus on adaptability and transferable achievements"
        
        return {
            'level': level,
            'summary': summary,
            'years_total': round(total_years, 1),
            'relevant_years': round(relevant_years, 1),
            'required_years': required_years,
            'title_match': title_match,
            'industry_match': industry_match
        }
    
    def _estimate_years(self, start_date, end_date, is_current: bool) -> float:
        """Estimate years of experience from dates"""
        if not start_date:
            return 1.0
        try:
            for fmt in ('%Y-%m-%d', '%Y-%m', '%Y', '%b %Y', '%B %Y'):
                try:
                    start = datetime.strptime(str(start_date), fmt)
                    break
                except ValueError:
                    continue
            else:
                return 1.0
            
            if is_current or not end_date:
                end = datetime.utcnow()
            else:
                for fmt in ('%Y-%m-%d', '%Y-%m', '%Y', '%b %Y', '%B %Y'):
                    try:
                        end = datetime.strptime(str(end_date), fmt)
                        break
                    except ValueError:
                        continue
                else:
                    end = datetime.utcnow()
            
            return max(0.5, (end - start).days / 365.25)
        except Exception:
            return 1.0
    
    def _titles_in_same_domain(self, title1: str, title2: str) -> bool:
        """Check if two job titles are in the same professional domain"""
        domain_groups = [
            {'software', 'developer', 'engineer', 'programmer', 'coder', 'architect', 'devops', 'sre', 'fullstack', 'frontend', 'backend'},
            {'data', 'analyst', 'scientist', 'analytics', 'intelligence', 'statistician', 'ml', 'ai'},
            {'design', 'designer', 'ux', 'ui', 'graphic', 'creative', 'visual'},
            {'manager', 'management', 'director', 'head', 'lead', 'vp', 'chief', 'officer'},
            {'marketing', 'growth', 'brand', 'content', 'seo', 'digital'},
            {'sales', 'account', 'business development', 'revenue', 'partnership'},
            {'finance', 'accounting', 'financial', 'treasury', 'audit', 'tax'},
            {'hr', 'recruiter', 'talent', 'people', 'culture'},
            {'product', 'scrum', 'agile'},
            {'support', 'customer', 'service', 'helpdesk'},
            {'operations', 'logistics', 'supply chain', 'procurement'},
            {'security', 'cybersecurity', 'infosec', 'compliance', 'risk'},
        ]
        
        t1_words = set(title1.split())
        t2_words = set(title2.split())
        
        for group in domain_groups:
            if (t1_words & group) and (t2_words & group):
                return True
        return False
    
    def _calculate_relevance_score(
        self, matching_skills, skill_gaps, experience_match, job_keywords, profile_keywords
    ) -> int:
        """Calculate weighted relevance score (0-100)"""
        if not job_keywords:
            return 50
        
        total_job_skills = len(job_keywords)
        matched = len(matching_skills)
        skill_score = min(100, (matched / max(total_job_skills, 1)) * 100)
        
        exp_level = experience_match.get('level', 'entry') if isinstance(experience_match, dict) else 'entry'
        exp_score_map = {'strong': 100, 'good': 80, 'moderate': 60, 'developing': 40, 'pivot': 25, 'entry': 20}
        exp_score = exp_score_map.get(exp_level, 30)
        
        gap_ratio = len(skill_gaps) / max(total_job_skills, 1)
        gap_score = max(0, 100 - (gap_ratio * 150))
        
        breadth_score = min(100, len(profile_keywords) * 3)
        
        final = (skill_score * 0.40) + (exp_score * 0.35) + (gap_score * 0.15) + (breadth_score * 0.10)
        return min(100, max(0, int(final)))
    
    def _calculate_keyword_density(self, job_data: Dict) -> Dict:
        """Analyze keyword frequency and priority in job posting"""
        text = f"{job_data.get('title', '')} {job_data.get('requirements', '')} {job_data.get('description', '')}".lower()
        words = re.findall(r'[a-z0-9\+\#\.\-/]{3,}', text)
        filtered = [w for w in words if w not in self.STOP_WORDS]
        
        counter = Counter(filtered)
        top_keywords = counter.most_common(20)
        
        return {
            'top_keywords': [{'keyword': kw, 'count': count} for kw, count in top_keywords],
            'total_unique': len(set(filtered)),
            'emphasis_keywords': [kw for kw, count in top_keywords if count >= 3]
        }
    
    def _score_experience_relevance(self, work_experiences: List[Dict], job_data: Dict) -> List[Dict]:
        """Score each work experience by relevance to job"""
        if not job_data or not work_experiences:
            return [{'index': i, 'score': 50, 'relevance': 'neutral'} for i in range(len(work_experiences))]
        
        job_keywords = self._extract_job_keywords(job_data)
        scored = []
        
        for i, exp in enumerate(work_experiences):
            score = self._score_single_experience(exp, job_data, job_keywords)
            relevance = 'high' if score >= 70 else 'medium' if score >= 40 else 'low'
            scored.append({
                'index': i,
                'title': exp.get('job_title', ''),
                'company': exp.get('company_name', ''),
                'score': score,
                'relevance': relevance
            })
        
        scored.sort(key=lambda x: x['score'], reverse=True)
        return scored
    
    def _score_single_experience(self, exp: Dict, job_data: Dict, job_keywords: Set[str]) -> float:
        """Score a single experience against job requirements with comprehensive analysis.
        
        Scoring factors (total 100):
        - Title match: 0-25
        - Content keyword overlap (description + responsibilities + achievements): 0-25
        - Technology overlap: 0-15
        - Quantified achievements: 0-10
        - Recency bonus: 0-10
        - Duration/seniority: 0-10
        - Current position: 0-5
        """
        score = 0.0
        job_title = str(job_data.get('title', '')).lower()
        exp_title = str(exp.get('job_title', '')).lower()
        desc = str(exp.get('description', '')).lower()
        achievements = exp.get('achievements', []) or []
        techs = exp.get('technologies_used', []) or []
        responsibilities = exp.get('key_responsibilities', []) or []
        if isinstance(techs, str):
            techs = [t.strip() for t in techs.split(',')]
        if isinstance(responsibilities, str):
            responsibilities = [r.strip() for r in responsibilities.split(',')]
        
        # 1. Title match (0-25)
        if job_title in exp_title or exp_title in job_title:
            score += 25
        elif self._titles_in_same_domain(job_title, exp_title):
            score += 12
        else:
            # Partial word overlap in titles
            title_words = set(job_title.split()) - self.STOP_WORDS
            exp_words = set(exp_title.split()) - self.STOP_WORDS
            if title_words and exp_words:
                overlap_ratio = len(title_words & exp_words) / max(len(title_words), 1)
                score += min(8, overlap_ratio * 10)
        
        # 2. Content keyword overlap across ALL text fields (0-25)
        all_text = desc
        for resp in responsibilities:
            all_text += ' ' + str(resp).lower()
        for ach in achievements:
            all_text += ' ' + str(ach).lower()
        content_words = set(re.findall(r'[a-z0-9\+\#\.\-/]{2,}', all_text))
        overlap = len(job_keywords & content_words)
        score += min(25, overlap * 2.0)
        
        # 3. Technology overlap (0-15)
        tech_set = set(t.lower().strip() for t in techs if t)
        tech_overlap = len(job_keywords & tech_set)
        score += min(15, tech_overlap * 4)
        
        # 4. Quantified achievements (0-10)
        quantified = sum(1 for a in achievements if any(c.isdigit() for c in str(a)))
        score += min(10, quantified * 3)
        
        # 5. Recency bonus (0-10) - recent experience is more valuable
        years_ago = self._estimate_years_ago(exp.get('end_date'), exp.get('is_current', False))
        if years_ago <= 1:
            score += 10
        elif years_ago <= 3:
            score += 7
        elif years_ago <= 5:
            score += 4
        elif years_ago <= 8:
            score += 2
        
        # 6. Duration/seniority (0-10) - longer tenure = deeper experience
        duration = self._estimate_years(exp.get('start_date'), exp.get('end_date'), exp.get('is_current', False))
        if duration >= 3:
            score += 10
        elif duration >= 2:
            score += 7
        elif duration >= 1:
            score += 5
        elif duration >= 0.5:
            score += 3
        
        # 7. Current position bonus (0-5)
        if exp.get('is_current'):
            score += 5
        
        return min(100, score)
    
    def _estimate_years_ago(self, end_date, is_current: bool) -> float:
        """Estimate how many years ago an experience ended"""
        if is_current:
            return 0
        if not end_date:
            return 5  # Unknown defaults to moderately old
        try:
            from datetime import datetime
            if isinstance(end_date, str):
                for fmt in ['%Y-%m-%d', '%Y-%m', '%Y', '%m/%d/%Y', '%d/%m/%Y']:
                    try:
                        end = datetime.strptime(end_date[:len(fmt.replace('%', '0'))], fmt)
                        return max(0, (datetime.utcnow() - end).days / 365.25)
                    except ValueError:
                        continue
            return 5
        except Exception:
            return 5
    
    def _generate_tailoring_strategy(
        self, matching_skills, skill_gaps, experience_match, job_data, relevance_score
    ) -> Dict:
        """Generate a comprehensive tailoring strategy for the AI prompt"""
        
        exp_level = experience_match.get('level', 'entry') if isinstance(experience_match, dict) else 'entry'
        
        if relevance_score >= 75:
            approach = 'direct_match'
            focus = 'Highlight direct alignment - mirror job language exactly'
        elif relevance_score >= 50:
            approach = 'bridge_skills'
            focus = 'Bridge transferable skills - connect past experience to job requirements'
        elif relevance_score >= 25:
            approach = 'reframe'
            focus = 'Reframe experience - emphasize adaptability and learning ability'
        else:
            approach = 'potential'
            focus = 'Lead with potential - emphasize projects, education, and growth trajectory'
        
        must_include = list(matching_skills)[:10]
        should_include = list(skill_gaps)[:5]
        
        return {
            'approach': approach,
            'focus': focus,
            'must_include_keywords': must_include,
            'keywords_to_weave_in': should_include,
            'experience_level': exp_level,
            'summary_focus': self._get_summary_strategy(exp_level, job_data),
            'achievement_focus': self._get_achievement_strategy(exp_level, job_data),
            'skills_focus': self._get_skills_strategy(matching_skills, skill_gaps),
        }
    
    def _get_summary_strategy(self, exp_level: str, job_data: Dict) -> str:
        job_title = job_data.get('title', 'the role')
        strategies = {
            'strong': f"Open with exact job title '{job_title}', state years of directly relevant experience, include 2 quantified achievements mirroring the job's key requirements",
            'good': f"Open with professional title positioned toward '{job_title}', emphasize overlapping industry experience and transferable accomplishments",
            'moderate': f"Lead with total years of experience, bridge background to '{job_title}' requirements through transferable skills",
            'developing': f"Lead with strongest relevant qualification, express trajectory toward '{job_title}', highlight learning and impactful projects",
            'pivot': f"Lead with unique value proposition for '{job_title}', emphasize diverse perspective and demonstrated adaptability",
            'entry': f"Lead with education and relevant projects for '{job_title}', emphasize technical skills and eagerness to contribute",
        }
        return strategies.get(exp_level, strategies['moderate'])
    
    def _get_achievement_strategy(self, exp_level: str, job_data: Dict) -> str:
        strategies = {
            'strong': 'Mirror job description language. Quantify every achievement. Use same metrics the job mentions.',
            'good': 'Reframe achievements using job posting terminology. Connect accomplishments to target role.',
            'moderate': 'Translate achievements into job domain language. Emphasize scale, impact, and transferable skills.',
            'developing': 'Focus on growth trajectory and impact relative to experience level.',
            'pivot': 'Emphasize universal impact metrics. Draw explicit parallels to new role requirements.',
            'entry': 'Highlight academic achievements, project outcomes, and internship impact.',
        }
        return strategies.get(exp_level, strategies['moderate'])
    
    def _get_skills_strategy(self, matching_skills, skill_gaps) -> str:
        matched_count = len(matching_skills)
        if matched_count >= 10:
            return f"Lead with {matched_count} directly matching skills. Organize by relevance."
        elif matched_count >= 5:
            return f"Group {matched_count} matching skills prominently. Add related skills for breadth."
        elif matched_count >= 2:
            return f"Feature {matched_count} matching skills first. Supplement with transferable skills."
        else:
            return "Organize by category. Lead with most relevant skills even if not exact matches."
    
    def filter_relevant_experiences(
        self, work_experiences: List[Dict], job_data: Dict, max_results: int = None
    ) -> List[Dict]:
        """Rank ALL experiences by relevance to job. Never drops experiences.
        
        Each experience is annotated with a _relevance_score and _relevance_label
        for downstream use in prompts. All experiences are returned, ordered
        most-relevant first.
        """
        if not job_data or not work_experiences:
            return work_experiences or []
        
        job_keywords = self._extract_job_keywords(job_data)
        scored_exps = []
        for exp in work_experiences:
            score = self._score_single_experience(exp, job_data, job_keywords)
            # Annotate each experience with relevance metadata
            exp_copy = dict(exp)
            exp_copy['_relevance_score'] = round(score, 1)
            exp_copy['_relevance_label'] = (
                'highly relevant' if score >= 70 else
                'relevant' if score >= 50 else
                'moderately relevant' if score >= 30 else
                'transferable value'
            )
            scored_exps.append((exp_copy, score))
        
        scored_exps.sort(key=lambda x: x[1], reverse=True)
        
        # Return ALL experiences (never truncate)
        result = [exp for exp, score in scored_exps]
        if max_results and len(result) > max_results:
            result = result[:max_results]
        
        return result
