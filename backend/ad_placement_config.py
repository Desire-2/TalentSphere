"""
Ad Placement Configuration & Context
Defines available ad placements and their configurations for PHASE 4
"""

from src.models.user import db
from src.models.ads import AdPlacement

# Ad Placement Configurations
AD_PLACEMENTS = {
    # Home Page
    'home_page_banner': {
        'name': 'Home Page Top Banner',
        'placement_key': 'home_page_banner',
        'page_context': 'HOMEPAGE',
        'allowed_formats': ['BANNER_HORIZONTAL', 'BANNER_VERTICAL'],
        'max_ads_per_load': 1,
        'description': 'Horizontal banner at top of homepage',
        'position': 'Below hero section'
    },
    
    'home_page_mid': {
        'name': 'Home Page Mid Section',
        'placement_key': 'home_page_mid',
        'page_context': 'HOMEPAGE',
        'allowed_formats': ['CARD', 'INLINE_FEED', 'SPONSORED_JOB'],
        'max_ads_per_load': 2,
        'description': 'Ad cards between jobs and scholarships sections',
        'position': 'Between featured jobs and scholarships'
    },
    
    # Job Listing Page
    'job_feed_top': {
        'name': 'Job Feed Top Banner',
        'placement_key': 'job_feed_top',
        'page_context': 'JOB_LISTING',
        'allowed_formats': ['BANNER_HORIZONTAL', 'BANNER_VERTICAL'],
        'max_ads_per_load': 1,
        'description': 'Horizontal banner at top of job listing results',
        'position': 'Above search results'
    },
    
    'job_feed_mid': {
        'name': 'Job Feed Middle',
        'placement_key': 'job_feed_mid',
        'page_context': 'JOB_LISTING',
        'allowed_formats': ['CARD', 'INLINE_FEED', 'SPONSORED_JOB'],
        'max_ads_per_load': 2,
        'description': 'Ad cards injected after every 4 job listings',
        'position': 'Between job cards in main feed'
    },
    
    # Job Detail Page
    'job_detail_sidebar': {
        'name': 'Job Detail Sidebar',
        'placement_key': 'job_detail_sidebar',
        'page_context': 'JOB_DETAIL',
        'allowed_formats': ['CARD', 'BANNER_VERTICAL'],
        'max_ads_per_load': 1,
        'description': 'Sidebar ad card on job detail page',
        'position': 'Right sidebar of job detail'
    },
    
    # Scholarship Listing Page
    'scholarship_feed_mid': {
        'name': 'Scholarship Feed',
        'placement_key': 'scholarship_feed_mid',
        'page_context': 'SCHOLARSHIP_LISTING',
        'allowed_formats': ['CARD', 'INLINE_FEED'],
        'max_ads_per_load': 1,
        'description': 'Ad card in scholarship listing',
        'position': 'Between scholarship cards'
    },

    # Companies Listing Page
    'companies_feed': {
        'name': 'Companies Feed',
        'placement_key': 'companies_feed',
        'page_context': 'COMPANIES_LISTING',
        'allowed_formats': ['CARD', 'INLINE_FEED', 'BANNER_HORIZONTAL'],
        'max_ads_per_load': 1,
        'description': 'Ad in companies listing page',
        'position': 'After company grid/list and pagination'
    },
    
    # Jobseeker Dashboard
    'dashboard_spotlight': {
        'name': 'Dashboard Spotlight',
        'placement_key': 'dashboard_spotlight',
        'page_context': 'DASHBOARD',
        'allowed_formats': ['SPOTLIGHT'],
        'max_ads_per_load': 1,
        'description': 'Full-width spotlight ad on jobseeker dashboard',
        'position': 'Above key metrics section'
    },
}

def initialize_ad_placements():
    """
    Initialize all ad placements in the database
    Call this during application setup or migrations
    """
    import json
    
    for placement_key, config in AD_PLACEMENTS.items():
        # Check if placement already exists
        existing = AdPlacement.query.filter_by(placement_key=placement_key).first()
        
        if not existing:
            placement = AdPlacement(
                name=config['name'],
                placement_key=placement_key,
                page_context=config['page_context'],
                allowed_formats=json.dumps(config['allowed_formats']),
                max_ads_per_load=config['max_ads_per_load'],
                is_active=True
            )
            db.session.add(placement)
            print(f"Created ad placement: {placement_key}")
        else:
            print(f"Ad placement already exists: {placement_key}")
    
    try:
        db.session.commit()
        print("✓ Ad placements initialized successfully")
    except Exception as e:
        db.session.rollback()
        print(f"✗ Error initializing placements: {e}")


def get_placement_config(placement_key):
    """Get configuration for a specific placement"""
    return AD_PLACEMENTS.get(placement_key)


def validate_placement(placement_key):
    """Check if a placement is valid and active"""
    config = AD_PLACEMENTS.get(placement_key)
    if not config:
        return False, f"Unknown placement: {placement_key}"
    
    # Check database
    placement = AdPlacement.query.filter_by(
        placement_key=placement_key,
        is_active=True
    ).first()
    
    if not placement:
        return False, f"Placement not active in database: {placement_key}"
    
    return True, "Placement valid"


def render_ad_slot_context(placement_key, context=''):
    """
    Context helper for rendering ad slots (used by backend templating if needed)
    
    Args:
        placement_key: The ad placement key (e.g., 'job_feed_top')
        context: Additional context (e.g., 'job_listing', 'user_id=123')
    
    Returns:
        dict with ad slot HTML and data attributes
    
    Example:
        {% set ad_context = render_ad_slot_context('job_feed_top', 'job_listing') %}
        <div {{ ad_context.html_attributes }}>
            <!-- Ads load via JavaScript -->
        </div>
    """
    config = AD_PLACEMENTS.get(placement_key)
    
    if not config:
        return {
            'html_attributes': '',
            'placeholder_text': '',
            'valid': False
        }
    
    # Create HTML5 data attributes
    html_attributes = f"""
        data-ad-slot="{placement_key}"
        data-ad-context="{context}"
        data-ad-formats="{','.join(config['allowed_formats'])}"
        data-ad-max="{config['max_ads_per_load']}"
    """.strip()
    
    return {
        'html_attributes': html_attributes,
        'placement_key': placement_key,
        'context': context,
        'allowed_formats': config['allowed_formats'],
        'max_ads': config['max_ads_per_load'],
        'valid': True,
        'placeholder_class': 'ad-slot-container',
        'placeholder_text': 'Ad loading...'
    }


# Example template snippet (if using Jinja2):
TEMPLATE_AD_SLOT_SNIPPET = """
{# Ad Slot Template Include #}
{%- macro render_ad_slot(placement_key, context='') -%}
    {%- set ad_context = render_ad_slot_context(placement_key, context) -%}
    {%- if ad_context.valid -%}
        <div 
            class="{{ ad_context.placeholder_class }}" 
            {{ ad_context.html_attributes }}
        >
            <div class="ad-loading">{{ ad_context.placeholder_text }}</div>
        </div>
    {%- endif -%}
{%- endmacro -%}

{# Usage example in template #}
{{ render_ad_slot('job_feed_top', 'job_listing') }}
"""
