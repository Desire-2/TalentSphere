"""
Modern CV Templates with Enhanced Visual Design
"""

class CVTemplates:
    """Collection of modern, professionally designed CV templates"""
    
    @staticmethod
    def get_template_css(style: str) -> str:
        """Get CSS for the specified CV style"""
        templates = {
            'professional': CVTemplates._professional_template(),
            'creative': CVTemplates._creative_template(),
            'modern': CVTemplates._modern_template(),
            'minimal': CVTemplates._minimal_template(),
            'executive': CVTemplates._executive_template(),
            'tech': CVTemplates._tech_template(),
            'artistic': CVTemplates._artistic_template(),
            'corporate': CVTemplates._corporate_template(),
            'elegant': CVTemplates._elegant_template(),
            'bold': CVTemplates._bold_template(),
            'compact': CVTemplates._compact_template(),
            'infographic': CVTemplates._infographic_template()
        }
        return templates.get(style, CVTemplates._professional_template())
    
    @staticmethod
    def get_all_templates_info() -> list:
        """Get information about all available templates"""
        return [
            {
                'id': 'professional',
                'name': 'Professional',
                'description': 'Clean, traditional layout ideal for corporate roles',
                'color_scheme': 'Blue & Gray',
                'best_for': ['Corporate', 'Finance', 'Consulting', 'Legal']
            },
            {
                'id': 'creative',
                'name': 'Creative',
                'description': 'Modern, visually engaging with gradient accents',
                'color_scheme': 'Purple Gradient',
                'best_for': ['Design', 'Marketing', 'Media', 'Creative Industries']
            },
            {
                'id': 'modern',
                'name': 'Modern',
                'description': 'Sleek minimalist design with contemporary elements',
                'color_scheme': 'Teal & White',
                'best_for': ['Tech', 'Startups', 'Digital', 'Product']
            },
            {
                'id': 'minimal',
                'name': 'Minimal',
                'description': 'Ultra-clean, content-focused with maximum white space',
                'color_scheme': 'Black & White',
                'best_for': ['Executive', 'Academic', 'Research', 'Senior Roles']
            },
            {
                'id': 'executive',
                'name': 'Executive',
                'description': 'Sophisticated leadership-focused presentation',
                'color_scheme': 'Navy & Gold',
                'best_for': ['C-Suite', 'VP', 'Director', 'Senior Management']
            },
            {
                'id': 'tech',
                'name': 'Tech',
                'description': 'Code-inspired with monospace accents',
                'color_scheme': 'Green & Dark',
                'best_for': ['Software Engineering', 'DevOps', 'Data Science']
            },
            {
                'id': 'artistic',
                'name': 'Artistic',
                'description': 'Bold typography with vibrant color blocking',
                'color_scheme': 'Pink & Yellow Gradient',
                'best_for': ['Artists', 'Designers', 'Creative Directors']
            },
            {
                'id': 'corporate',
                'name': 'Corporate',
                'description': 'Traditional formal design with serif fonts',
                'color_scheme': 'Charcoal & White',
                'best_for': ['Banking', 'Law', 'Accounting', 'Traditional Firms']
            },
            {
                'id': 'elegant',
                'name': 'Elegant',
                'description': 'Sophisticated with serif typography and subtle accents',
                'color_scheme': 'Rose Gold & Cream',
                'best_for': ['Luxury', 'Fashion', 'Hospitality', 'Client-facing']
            },
            {
                'id': 'bold',
                'name': 'Bold',
                'description': 'High-impact design with strong contrasts',
                'color_scheme': 'Red & Black',
                'best_for': ['Sales', 'Business Development', 'Leadership']
            },
            {
                'id': 'compact',
                'name': 'Compact',
                'description': 'Dense layout for extensive experience',
                'color_scheme': 'Blue & Gray',
                'best_for': ['Senior Professionals', 'Academics', 'Multiple Roles']
            },
            {
                'id': 'infographic',
                'name': 'Infographic',
                'description': 'Visual data-driven with skill charts',
                'color_scheme': 'Multi-color',
                'best_for': ['Data Analysis', 'Product Management', 'Marketing']
            }
        ]
    
    @staticmethod
    def _professional_template() -> str:
        """Classic professional template - Clean and traditional"""
        return """
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
        
        @page {
            size: A4;
            margin: 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.5;
            color: #1e293b;
            background: #ffffff;
            font-size: 11px;
        }
        
        .cv-container {
            max-width: 850px;
            margin: 0 auto;
            padding: 32px;
            background: #ffffff;
        }
        
        .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 3px solid #3b82f6;
            page-break-after: avoid;
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 6px;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        
        .header .title {
            font-size: 16px;
            color: #3b82f6;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .contact-info {
            font-size: 11px;
            color: #475569;
            line-height: 1.8;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
        }
        
        .contact-info > * {
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #e2e8f0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            page-break-after: avoid;
        }
        
        .section-content {
            padding-left: 0;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 16px;
            padding-left: 12px;
            border-left: 3px solid #e2e8f0;
            page-break-inside: avoid;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 6px;
        }
        
        .item-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
        }
        
        .item-duration {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
        }
        
        .item-subtitle {
            font-size: 12px;
            color: #3b82f6;
            margin-bottom: 6px;
            font-weight: 600;
        }
        
        .achievements {
            list-style: none;
            padding-left: 0;
        }
        
        .achievements li {
            position: relative;
            padding-left: 20px;
            margin-bottom: 4px;
            font-size: 11px;
            color: #334155;
            line-height: 1.5;
        }
        
        .achievements li:before {
            content: "→";
            position: absolute;
            left: 0;
            color: #3b82f6;
            font-weight: 700;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        
        .skill-category {
            background: #f8fafc;
            padding: 10px;
            border-radius: 6px;
            border-left: 2px solid #3b82f6;
        }
        
        .skill-category-title {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .skill-list {
            font-size: 10px;
            color: #475569;
            line-height: 1.6;
        }
        
        .core-competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        
        .competency-tag {
            background: #eff6ff;
            color: #1e40af;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            border: 1px solid #bfdbfe;
        }
        
        .competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .competency {
            background: #eff6ff;
            color: #1e40af;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            border: 1px solid #bfdbfe;
        }
        
        .summary {
            font-size: 11px;
            color: #334155;
            line-height: 1.6;
            background: #f8fafc;
            padding: 14px;
            border-radius: 6px;
            border-left: 3px solid #3b82f6;
            margin-bottom: 8px;
        }
        
        .references-section {
            margin-top: 20px;
            margin-bottom: 0;
            page-break-inside: avoid;
        }
        
        .references-text {
            font-size: 11px;
            color: #64748b;
            font-style: italic;
            text-align: center;
            padding: 8px 0;
            border-top: 1px solid #e2e8f0;
        }
        """
    
    @staticmethod
    def _creative_template() -> str:
        """Creative colorful template - Vibrant and modern"""
        return """
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        
        @page {
            size: A4;
            margin: 12mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.4;
            color: #1e293b;
            background: #ffffff;
            font-size: 10px;
        }
        
        .cv-container {
            max-width: 850px;
            margin: 0 auto;
            padding: 0;
            background: #ffffff;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px 32px;
            text-align: center;
            position: relative;
            overflow: hidden;
            page-break-after: avoid;
        }
        
        .header:before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 6px;
            position: relative;
            z-index: 1;
            letter-spacing: -0.5px;
        }
        
        .header .title {
            font-size: 14px;
            margin-bottom: 10px;
            opacity: 0.95;
            font-weight: 400;
            position: relative;
            z-index: 1;
        }
        
        .contact-info {
            font-size: 10px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
        }
        
        .contact-info > * {
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        
        .section {
            margin-bottom: 0;
            padding: 20px 32px;
            page-break-inside: avoid;
        }
        
        .section:nth-child(even) {
            background: #fafafa;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 700;
            page-break-after: avoid;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            position: relative;
            padding-bottom: 8px;
        }
        
        .section-title:after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 50px;
            height: 3px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 14px;
            padding: 12px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 6px rgba(102, 126, 234, 0.1);
            border-left: 3px solid #667eea;
            page-break-inside: avoid;
        }
        
        .section:nth-child(even) .experience-item,
        .section:nth-child(even) .education-item,
        .section:nth-child(even) .project-item {
            background: #fafafa;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 6px;
        }
        
        .item-title {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
        }
        
        .item-duration {
            font-size: 9px;
            color: #64748b;
            background: #f1f5f9;
            padding: 3px 8px;
            border-radius: 10px;
            font-weight: 500;
        }
        
        .item-subtitle {
            font-size: 10px;
            color: #667eea;
            margin-bottom: 6px;
            font-weight: 600;
        }
        
        .achievements {
            list-style: none;
            padding-left: 0;
        }
        
        .achievements li {
            position: relative;
            padding-left: 16px;
            margin-bottom: 4px;
            font-size: 10px;
            color: #334155;
            line-height: 1.5;
        }
        
        .achievements li:before {
            content: "✦";
            position: absolute;
            left: 0;
            color: #667eea;
            font-size: 11px;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        .skill-category {
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 1px 6px rgba(102, 126, 234, 0.1);
            border-top: 2px solid #667eea;
        }
        
        .skill-category-title {
            font-size: 10px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .skill-list {
            font-size: 9px;
            color: #475569;
            line-height: 1.5;
        }
        
        .core-competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
        }
        
        .competency-tag {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 5px 10px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 600;
            box-shadow: 0 1px 4px rgba(102, 126, 234, 0.3);
        }
        
        .competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .competency {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 5px 10px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 600;
            box-shadow: 0 1px 4px rgba(102, 126, 234, 0.3);
        }
        
        .summary {
            font-size: 10px;
            color: #334155;
            line-height: 1.5;
            background: white;
            padding: 12px;
            border-radius: 8px;
            box-shadow: 0 1px 6px rgba(102, 126, 234, 0.1);
            border-left: 3px solid #764ba2;
        }
        
        .references-section {
            margin-top: 16px;
            margin-bottom: 0;
            padding: 12px 32px;
            page-break-inside: avoid;
        }
        
        .references-text {
            font-size: 10px;
            color: #64748b;
            font-style: italic;
            text-align: center;
            padding: 6px 0;
            border-top: 1px solid #e2e8f0;
        }
        """
    
    @staticmethod
    def _modern_template() -> str:
        """Modern minimalist template with clean lines"""
        return """
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
        
        @page {
            size: A4;
            margin: 12mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.4;
            color: #1a1a1a;
            background: #ffffff;
            font-size: 10px;
        }
        
        .cv-container {
            max-width: 850px;
            margin: 0 auto;
            background: #fff;
        }
        
        .header {
            background: #000000;
            color: #fff;
            padding: 24px 32px;
            page-break-after: avoid;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
            letter-spacing: -0.8px;
        }
        
        .header .title {
            font-size: 14px;
            color: #00d4ff;
            margin-bottom: 12px;
            font-weight: 400;
        }
        
        .contact-info {
            font-size: 10px;
            color: #ccc;
            line-height: 1.6;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .section {
            padding: 18px 32px;
            border-bottom: 1px solid #e0e0e0;
            page-break-inside: avoid;
        }
        
        .section:last-child {
            border-bottom: none;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: 700;
            color: #00d4ff;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            page-break-after: avoid;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 14px;
            padding-bottom: 14px;
            border-bottom: 1px solid #f0f0f0;
            page-break-inside: avoid;
        }
        
        .experience-item:last-child, .education-item:last-child, .project-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .item-header {
            margin-bottom: 6px;
        }
        
        .item-title {
            font-size: 12px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 4px;
            letter-spacing: -0.3px;
        }
        
        .item-subtitle {
            font-size: 10px;
            color: #666;
            font-weight: 400;
            margin-bottom: 3px;
        }
        
        .item-duration {
            font-size: 9px;
            color: #999;
            font-weight: 400;
        }
        
        .achievements {
            list-style: none;
            padding-left: 0;
        }
        
        .achievements li {
            position: relative;
            padding-left: 16px;
            margin-bottom: 4px;
            font-size: 10px;
            color: #444;
            line-height: 1.5;
        }
        
        .achievements li:before {
            content: "—";
            position: absolute;
            left: 0;
            color: #00d4ff;
            font-weight: 700;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        
        .skill-category {
            background: #fafafa;
            padding: 10px;
            border-left: 2px solid #00d4ff;
        }
        
        .skill-category-title {
            font-size: 9px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .skill-list {
            font-size: 9px;
            color: #666;
            line-height: 1.5;
        }
        
        .core-competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
        }
        
        .competency-tag {
            background: #000000;
            color: #00d4ff;
            padding: 5px 10px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        
        .competency {
            background: #000000;
            color: #00d4ff;
            padding: 5px 10px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary {
            font-size: 10px;
            color: #444;
            line-height: 1.5;
            background: #fafafa;
            padding: 12px;
            border-left: 3px solid #00d4ff;
        }
        
        .references-section {
            margin-top: 16px;
            margin-bottom: 0;
            padding: 12px 32px;
            page-break-inside: avoid;
        }
        
        .references-text {
            font-size: 10px;
            color: #999;
            font-style: italic;
            text-align: center;
            padding: 6px 0;
            border-top: 1px solid #e0e0e0;
        }
        """
    
    @staticmethod
    def _minimal_template() -> str:
        """Minimal clean template - Less is more"""
        return """
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
        
        @page {
            size: A4;
            margin: 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.5;
            color: #2d3748;
            background: #ffffff;
            font-size: 11px;
        }
        
        .cv-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 32px;
        }
        
        .header {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #cbd5e0;
            page-break-after: avoid;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 6px;
            color: #1a202c;
            letter-spacing: -0.4px;
        }
        
        .header .title {
            font-size: 14px;
            color: #718096;
            margin-bottom: 12px;
            font-weight: 400;
        }
        
        .contact-info {
            font-size: 11px;
            color: #4a5568;
            line-height: 1.7;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }
        
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            page-break-after: avoid;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 14px;
            page-break-inside: avoid;
        }
        
        .item-header {
            margin-bottom: 6px;
        }
        
        .item-title {
            font-size: 13px;
            font-weight: 500;
            color: #1a202c;
            margin-bottom: 3px;
        }
        
        .item-subtitle {
            font-size: 11px;
            color: #4a5568;
            margin-bottom: 4px;
        }
        
        .item-duration {
            font-size: 13px;
            color: #718096;
        }
        
        .achievements {
            list-style: none;
            padding-left: 0;
        }
        
        .achievements li {
            position: relative;
            padding-left: 20px;
            margin-bottom: 8px;
            font-size: 14px;
            color: #4a5568;
            line-height: 1.7;
        }
        
        .achievements li:before {
            content: "·";
            position: absolute;
            left: 0;
            color: #1a202c;
            font-size: 24px;
            line-height: 14px;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
        }
        
        .skill-category {
            padding-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .skill-category-title {
            font-size: 13px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .skill-list {
            font-size: 13px;
            color: #4a5568;
            line-height: 1.8;
        }
        
        .core-competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
        }
        
        .competency-tag {
            color: #2d3748;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: 400;
            border: 1px solid #cbd5e0;
        }
        
        .summary {
            font-size: 14px;
            color: #4a5568;
            line-height: 1.8;
        }
        """
    
    @staticmethod
    def _executive_template() -> str:
        """Executive premium template - Sophisticated and elegant"""
        return """
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Lato', sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: #f9fafb;
        }
        
        .cv-container {
            max-width: 850px;
            margin: 0 auto;
            padding: 0;
            background: #ffffff;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
            color: white;
            padding: 50px;
            text-align: center;
        }
        
        .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 42px;
            font-weight: 700;
            margin-bottom: 12px;
            letter-spacing: 1px;
        }
        
        .header .title {
            font-size: 18px;
            margin-bottom: 24px;
            font-weight: 300;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        
        .contact-info {
            font-size: 13px;
            opacity: 0.95;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 18px;
        }
        
        .section {
            padding: 40px 50px;
        }
        
        .section:nth-child(odd) {
            background: #fafafa;
        }
        
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 24px;
            position: relative;
            padding-bottom: 12px;
        }
        
        .section-title:after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 60px;
            height: 3px;
            background: #1e3a8a;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 28px;
            padding: 24px;
            background: white;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            page-break-inside: avoid;
        }
        
        .section:nth-child(odd) .experience-item,
        .section:nth-child(odd) .education-item,
        .section:nth-child(odd) .project-item {
            background: #ffffff;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 10px;
        }
        
        .item-title {
            font-family: 'Playfair Display', serif;
            font-size: 19px;
            font-weight: 700;
            color: #1e293b;
        }
        
        .item-duration {
            font-size: 13px;
            color: #64748b;
            background: #f1f5f9;
            padding: 5px 14px;
            border-radius: 4px;
            font-weight: 400;
        }
        
        .item-subtitle {
            font-size: 15px;
            color: #1e3a8a;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .achievements {
            list-style: none;
            padding-left: 0;
        }
        
        .achievements li {
            position: relative;
            padding-left: 28px;
            margin-bottom: 10px;
            font-size: 14px;
            color: #334155;
            line-height: 1.7;
        }
        
        .achievements li:before {
            content: "▪";
            position: absolute;
            left: 0;
            color: #3b82f6;
            font-size: 20px;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        
        .skill-category {
            background: white;
            padding: 20px;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .skill-category-title {
            font-family: 'Playfair Display', serif;
            font-size: 16px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 12px;
        }
        
        .skill-list {
            font-size: 14px;
            color: #475569;
            line-height: 1.8;
        }
        
        .core-competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 12px;
        }
        
        .competency-tag {
            background: #1e3a8a;
            color: white;
            padding: 9px 16px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary {
            font-size: 15px;
            color: #334155;
            line-height: 1.9;
            background: white;
            padding: 24px;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        """
    
    @staticmethod
    def _tech_template() -> str:
        """Tech-focused template - Clean and code-inspired"""
        return """
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=Inter:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #e4e4e7;
            background: #18181b;
        }
        
        .cv-container {
            max-width: 850px;
            margin: 0 auto;
            padding: 0;
            background: #27272a;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .header {
            background: #18181b;
            color: #e4e4e7;
            padding: 48px 50px;
            border-bottom: 2px solid #10b981;
        }
        
        .header h1 {
            font-family: 'JetBrains Mono', monospace;
            font-size: 40px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #10b981;
            letter-spacing: -1px;
        }
        
        .header .title {
            font-size: 16px;
            color: #a1a1aa;
            margin-bottom: 20px;
            font-weight: 400;
            font-family: 'JetBrains Mono', monospace;
        }
        
        .header .title:before {
            content: "$ ";
            color: #10b981;
        }
        
        .contact-info {
            font-size: 13px;
            color: #a1a1aa;
            line-height: 2;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .section {
            padding: 36px 50px;
            background: #27272a;
        }
        
        .section-title {
            font-family: 'JetBrains Mono', monospace;
            font-size: 16px;
            font-weight: 700;
            color: #10b981;
            margin-bottom: 24px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .section-title:before {
            content: "// ";
            color: #52525b;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 24px;
            padding: 20px;
            background: #18181b;
            border-left: 3px solid #10b981;
            border-radius: 4px;
            page-break-inside: avoid;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 10px;
        }
        
        .item-title {
            font-size: 17px;
            font-weight: 700;
            color: #fafafa;
        }
        
        .item-duration {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #71717a;
            background: #3f3f46;
            padding: 4px 10px;
            border-radius: 3px;
        }
        
        .item-subtitle {
            font-size: 14px;
            color: #10b981;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .achievements {
            list-style: none;
            padding-left: 0;
        }
        
        .achievements li {
            position: relative;
            padding-left: 24px;
            margin-bottom: 8px;
            font-size: 14px;
            color: #d4d4d8;
            line-height: 1.7;
        }
        
        .achievements li:before {
            content: ">";
            position: absolute;
            left: 0;
            color: #10b981;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }
        
        .skill-category {
            background: #18181b;
            padding: 18px;
            border-radius: 4px;
            border: 1px solid #3f3f46;
        }
        
        .skill-category-title {
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            font-weight: 700;
            color: #10b981;
            margin-bottom: 12px;
            text-transform: uppercase;
        }
        
        .skill-list {
            font-size: 13px;
            color: #a1a1aa;
            line-height: 1.8;
        }
        
        .core-competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
        }
        
        .competency-tag {
            font-family: 'JetBrains Mono', monospace;
            background: #18181b;
            color: #10b981;
            padding: 7px 14px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid #10b981;
        }
        
        .summary {
            font-size: 14px;
            color: #d4d4d8;
            line-height: 1.8;
            background: #18181b;
            padding: 20px;
            border-radius: 4px;
            border-left: 3px solid #10b981;
        }
        """
    
    @staticmethod
    def _artistic_template() -> str:
        """Artistic creative template - Bold and expressive"""
        return """
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Montserrat', sans-serif;
            line-height: 1.6;
            color: #2d3436;
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }
        
        .cv-container {
            max-width: 850px;
            margin: 0 auto;
            padding: 0;
            background: #ffffff;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
        }
        
        .header {
            background: #000000;
            color: white;
            padding: 60px 50px;
            position: relative;
            overflow: hidden;
        }
        
        .header:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #fa709a 0%, #fee140 100%);
        }
        
        .header h1 {
            font-family: 'Bebas Neue', cursive;
            font-size: 56px;
            font-weight: 400;
            margin-bottom: 10px;
            letter-spacing: 3px;
        }
        
        .header .title {
            font-size: 18px;
            color: #fee140;
            margin-bottom: 24px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        
        .contact-info {
            font-size: 13px;
            opacity: 0.9;
            display: flex;
            flex-wrap: wrap;
            gap: 18px;
        }
        
        .section {
            padding: 44px 50px;
        }
        
        .section:nth-child(even) {
            background: #fafafa;
        }
        
        .section-title {
            font-family: 'Bebas Neue', cursive;
            font-size: 32px;
            font-weight: 400;
            color: #2d3436;
            margin-bottom: 28px;
            letter-spacing: 2px;
            position: relative;
            padding-bottom: 12px;
        }
        
        .section-title:after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100px;
            height: 4px;
            background: linear-gradient(90deg, #fa709a 0%, #fee140 100%);
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 28px;
            padding: 24px;
            background: white;
            border-radius: 0;
            box-shadow: -8px 8px 0 #fafafa;
            border-left: 6px solid #fa709a;
            page-break-inside: avoid;
        }
        
        .section:nth-child(even) .experience-item,
        .section:nth-child(even) .education-item,
        .section:nth-child(even) .project-item {
            background: #ffffff;
            box-shadow: -8px 8px 0 #f0f0f0;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 10px;
        }
        
        .item-title {
            font-family: 'Bebas Neue', cursive;
            font-size: 22px;
            font-weight: 400;
            color: #2d3436;
            letter-spacing: 1px;
        }
        
        .item-duration {
            font-size: 12px;
            color: #636e72;
            background: #ffeaa7;
            padding: 5px 14px;
            border-radius: 2px;
            font-weight: 600;
        }
        
        .item-subtitle {
            font-size: 15px;
            color: #fa709a;
            margin-bottom: 12px;
            font-weight: 700;
        }
        
        .achievements {
            list-style: none;
            padding-left: 0;
        }
        
        .achievements li {
            position: relative;
            padding-left: 28px;
            margin-bottom: 10px;
            font-size: 14px;
            color: #2d3436;
            line-height: 1.7;
        }
        
        .achievements li:before {
            content: "★";
            position: absolute;
            left: 0;
            color: #fa709a;
            font-size: 18px;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        
        .skill-category {
            background: white;
            padding: 20px;
            box-shadow: -6px 6px 0 #fafafa;
            border-top: 4px solid #fee140;
        }
        
        .skill-category-title {
            font-family: 'Bebas Neue', cursive;
            font-size: 18px;
            font-weight: 400;
            color: #2d3436;
            margin-bottom: 12px;
            letter-spacing: 1px;
        }
        
        .skill-list {
            font-size: 14px;
            color: #636e72;
            line-height: 1.8;
        }
        
        .core-competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 12px;
        }
        
        .competency-tag {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: #000000;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        
        .summary {
            font-size: 15px;
            color: #2d3436;
            line-height: 1.9;
            background: white;
            padding: 24px;
            box-shadow: -8px 8px 0 #fafafa;
            border-left: 6px solid #fee140;
        }
        """
    
    @staticmethod
    def _corporate_template() -> str:
        """Corporate professional template - Traditional and formal"""
        return """
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Source+Sans+Pro:wght@300;400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Source Sans Pro', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
        }
        
        .cv-container {
            max-width: 850px;
            margin: 0 auto;
            padding: 50px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 3px double #1f2937;
        }
        
        .header h1 {
            font-family: 'Merriweather', serif;
            font-size: 38px;
            font-weight: 700;
            margin-bottom: 10px;
            color: #111827;
            letter-spacing: 0.5px;
        }
        
        .header .title {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 18px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .contact-info {
            font-size: 13px;
            color: #6b7280;
            line-height: 2;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 16px;
        }
        
        .contact-info > * {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .section {
            margin-bottom: 36px;
        }
        
        .section-title {
            font-family: 'Merriweather', serif;
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 18px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1f2937;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        
        .section-content {
            padding-left: 20px;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 24px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e5e7eb;
            page-break-inside: avoid;
        }
        
        .experience-item:last-child, .education-item:last-child, .project-item:last-child {
            border-bottom: none;
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 8px;
        }
        
        .item-title {
            font-family: 'Merriweather', serif;
            font-size: 17px;
            font-weight: 700;
            color: #111827;
        }
        
        .item-duration {
            font-size: 13px;
            color: #6b7280;
            font-weight: 400;
            font-style: italic;
        }
        
        .item-subtitle {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .achievements {
            list-style: none;
            padding-left: 0;
        }
        
        .achievements li {
            position: relative;
            padding-left: 24px;
            margin-bottom: 8px;
            font-size: 14px;
            color: #374151;
            line-height: 1.7;
        }
        
        .achievements li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #1f2937;
            font-size: 20px;
            line-height: 14px;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
        }
        
        .skill-category {
            background: #f9fafb;
            padding: 18px;
            border: 1px solid #e5e7eb;
        }
        
        .skill-category-title {
            font-family: 'Merriweather', serif;
            font-size: 15px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .skill-list {
            font-size: 13px;
            color: #4b5563;
            line-height: 1.8;
        }
        
        .core-competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
        }
        
        .competency-tag {
            background: #1f2937;
            color: #ffffff;
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary {
            font-size: 14px;
            color: #374151;
            line-height: 1.8;
            background: #f9fafb;
            padding: 20px;
            border: 1px solid #e5e7eb;
        }
        """
