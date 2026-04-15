"""
Custom Advertising System Routes (PHASE 2)
Comprehensive Flask Blueprint for ad campaigns, serving, and moderation
"""

from flask import Blueprint, request, jsonify, current_app, redirect
from datetime import datetime, timedelta, date
from decimal import Decimal
import hashlib
import json
import os
from urllib.parse import urlparse
from sqlalchemy import and_, or_, desc, func
from sqlalchemy.orm import joinedload

from src.models.user import db, User
from src.models.ads import (
    AdCampaign, AdCreative, AdPlacement, AdCampaignPlacement,
    AdImpression, AdClick, AdAnalyticsDaily, AdCredit, AdReview, AdReviewAudit
)
from src.routes.auth import token_required, role_required
from src.services.vercel_blob_storage_service import VercelBlobStorageError, upload_ad_creative_image

ads_bp = Blueprint('ads', __name__)

VALID_OBJECTIVES = {'AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS'}
VALID_BILLING_TYPES = {'CPM', 'CPC', 'FLAT_RATE'}
VALID_AD_FORMATS = {'BANNER_HORIZONTAL', 'BANNER_VERTICAL', 'CARD', 'INLINE_FEED', 'SPONSORED_JOB', 'SPOTLIGHT'}

DEFAULT_PLACEMENTS = [
    {
        'name': 'Job Feed Top Banner',
        'display_name': 'Job Feed Top Banner',
        'description': 'Top placement on job listing feed pages',
        'placement_key': 'job_feed_top',
        'page_context': 'JOB_LISTING',
        'allowed_formats': ['BANNER_HORIZONTAL', 'CARD', 'INLINE_FEED'],
        'max_ads_per_load': 2,
    },
    {
        'name': 'Job Feed Sidebar',
        'display_name': 'Job Feed Sidebar',
        'description': 'Sidebar placement on job listing pages',
        'placement_key': 'job_feed_sidebar',
        'page_context': 'JOB_LISTING',
        'allowed_formats': ['BANNER_VERTICAL', 'CARD'],
        'max_ads_per_load': 1,
    },
    {
        'name': 'Job Detail Inline',
        'display_name': 'Job Detail Inline',
        'description': 'Inline placement within job detail content',
        'placement_key': 'job_detail_inline',
        'page_context': 'JOB_DETAIL',
        'allowed_formats': ['INLINE_FEED', 'CARD', 'SPONSORED_JOB'],
        'max_ads_per_load': 2,
    },
    {
        'name': 'Dashboard Spotlight',
        'display_name': 'Dashboard Spotlight',
        'description': 'Large spotlight placement on dashboards',
        'placement_key': 'dashboard_spotlight',
        'page_context': 'DASHBOARD',
        'allowed_formats': ['SPOTLIGHT', 'BANNER_HORIZONTAL'],
        'max_ads_per_load': 1,
    },
    {
        'name': 'Scholarship Feed Top',
        'display_name': 'Scholarship Feed Top Banner',
        'description': 'Top banner placement on scholarship feed pages',
        'placement_key': 'scholarship_feed_top',
        'page_context': 'SCHOLARSHIP_LISTING',
        'allowed_formats': ['BANNER_HORIZONTAL', 'CARD', 'INLINE_FEED'],
        'max_ads_per_load': 2,
    },
    {
        'name': 'Global Sponsored Slot',
        'display_name': 'Global Sponsored Slot',
        'description': 'Flexible placement available across all major pages',
        'placement_key': 'global_sponsored_slot',
        'page_context': 'ALL',
        'allowed_formats': ['BANNER_HORIZONTAL', 'BANNER_VERTICAL', 'CARD', 'INLINE_FEED', 'SPONSORED_JOB', 'SPOTLIGHT'],
        'max_ads_per_load': 2,
    },
    {
        'name': 'Home Page Banner',
        'display_name': 'Home Page Banner',
        'description': 'Top banner placement on home page',
        'placement_key': 'home_page_banner',
        'page_context': 'ALL',
        'allowed_formats': ['BANNER_HORIZONTAL', 'CARD'],
        'max_ads_per_load': 1,
    },
    {
        'name': 'Home Page Mid Section',
        'display_name': 'Home Page Mid Section',
        'description': 'Middle content placement on home page',
        'placement_key': 'home_page_mid',
        'page_context': 'ALL',
        'allowed_formats': ['CARD', 'INLINE_FEED', 'BANNER_HORIZONTAL'],
        'max_ads_per_load': 2,
    },
    {
        'name': 'Job Feed Mid',
        'display_name': 'Job Feed Mid',
        'description': 'Inline placement inside job feed results',
        'placement_key': 'job_feed_mid',
        'page_context': 'JOB_LISTING',
        'allowed_formats': ['CARD', 'INLINE_FEED', 'BANNER_HORIZONTAL'],
        'max_ads_per_load': 2,
    },
    {
        'name': 'Job Detail Sidebar',
        'display_name': 'Job Detail Sidebar',
        'description': 'Sidebar placement on job detail page',
        'placement_key': 'job_detail_sidebar',
        'page_context': 'JOB_DETAIL',
        'allowed_formats': ['CARD', 'BANNER_VERTICAL', 'INLINE_FEED'],
        'max_ads_per_load': 1,
    },
    {
        'name': 'Scholarship Feed Mid',
        'display_name': 'Scholarship Feed Mid',
        'description': 'Inline placement in scholarship listings',
        'placement_key': 'scholarship_feed_mid',
        'page_context': 'SCHOLARSHIP_LISTING',
        'allowed_formats': ['CARD', 'INLINE_FEED', 'BANNER_HORIZONTAL'],
        'max_ads_per_load': 2,
    },
    {
        'name': 'Companies Feed',
        'display_name': 'Companies Feed',
        'description': 'Placement for companies listing page',
        'placement_key': 'companies_feed',
        'page_context': 'ALL',
        'allowed_formats': ['CARD', 'BANNER_HORIZONTAL', 'INLINE_FEED'],
        'max_ads_per_load': 1,
    },
]

# Backward-compatible aliases used by existing frontend slots.
PLACEMENT_ALIASES = {
    'home_page_banner': 'global_sponsored_slot',
    'home_page_mid': 'global_sponsored_slot',
    'job_feed_mid': 'job_feed_top',
    'job_detail_sidebar': 'job_detail_inline',
    'scholarship_feed_mid': 'scholarship_feed_top',
    'companies_feed': 'global_sponsored_slot',
}

CONTEXT_ALIASES = {
    'home': 'ALL',
    'homepage': 'ALL',
    'home_page': 'ALL',
    'job_listing': 'JOB_LISTING',
    'jobs_listing': 'JOB_LISTING',
    'job_detail': 'JOB_DETAIL',
    'dashboard': 'DASHBOARD',
    'jobseeker_dashboard': 'DASHBOARD',
    'scholarship_listing': 'SCHOLARSHIP_LISTING',
    'companies_listing': 'ALL',
    'company_listing': 'ALL',
}

# ========================
# UTILITY FUNCTIONS
# ========================

def get_ip_hash(req):
    """Hash client IP for frequency capping without storing raw IP"""
    ip = req.headers.get('X-Forwarded-For', req.remote_addr)
    if ',' in ip:
        ip = ip.split(',')[0].strip()
    return hashlib.sha256(ip.encode()).hexdigest()


def safe_decimal(value):
    """Safely convert value to Decimal"""
    try:
        return Decimal(str(value))
    except:
        return Decimal('0')


def _parse_iso_datetime(raw_value, field_name):
    if raw_value in (None, ''):
        return None
    if isinstance(raw_value, datetime):
        return raw_value
    try:
        return datetime.fromisoformat(str(raw_value).replace('Z', '+00:00'))
    except Exception:
        raise ValueError(f'Invalid {field_name} format. Expected ISO datetime string')


def _is_valid_http_url(url):
    if not url:
        return False
    parsed = urlparse(url)
    return parsed.scheme in {'http', 'https'} and bool(parsed.netloc)


def _resolve_placement(value):
    if value is None:
        return None

    if isinstance(value, int):
        return AdPlacement.query.get(value)

    raw = str(value).strip()
    if not raw:
        return None

    if raw.isdigit():
        return AdPlacement.query.get(int(raw))

    return AdPlacement.query.filter_by(placement_key=raw).first()


def _resolve_placement_with_alias(value):
    placement = _resolve_placement(value)
    if placement:
        return placement

    raw = str(value or '').strip().lower()
    if not raw:
        return None

    alias_key = PLACEMENT_ALIASES.get(raw)
    if not alias_key:
        return None

    return AdPlacement.query.filter_by(placement_key=alias_key).first()


def _normalize_context(raw_context):
    if raw_context is None:
        return None

    normalized = str(raw_context).strip()
    if not normalized:
        return None

    normalized = normalized.replace('-', '_').replace(' ', '_').upper()
    return CONTEXT_ALIASES.get(normalized.lower(), normalized)


def _build_sponsor_data(campaign):
    employer = campaign.employer
    company = None

    if employer and employer.employer_profile:
        company = employer.employer_profile.company

    company_name = company.name if company and company.name else None
    company_logo = company.logo_url if company and company.logo_url else None
    company_location = company.get_full_address() if company else None

    employer_name = None
    if employer:
        employer_name = employer.get_full_name() or employer.email

    display_name = company_name or employer_name or 'Company'

    return {
        'display_name': display_name,
        'company_name': company_name,
        'company_logo_url': company_logo,
        'company_location': company_location,
        'employer_name': employer_name,
        'employer_email': employer.email if employer else None,
    }


def _sync_campaign_placements(campaign_id, placement_ids):
    AdCampaignPlacement.query.filter_by(campaign_id=campaign_id).delete(synchronize_session=False)
    for placement_id in placement_ids:
        db.session.add(AdCampaignPlacement(campaign_id=campaign_id, placement_id=placement_id))


def _serialize_campaign_placements(campaign):
    placements = []
    for campaign_placement in campaign.placements.all():
        if campaign_placement.placement:
            placements.append(campaign_placement.placement.to_dict())
    return placements


def _campaign_supports_format(campaign, ad_format):
    placements = campaign.placements.all()
    if not placements:
        return True

    for campaign_placement in placements:
        placement = campaign_placement.placement
        if not placement:
            continue
        if ad_format in set(placement.get_allowed_formats()):
            return True
    return False


def _ensure_default_placements():
    """Ensure baseline active placements exist and support expected ad formats."""
    now = datetime.utcnow()
    changed = False

    for placement_data in DEFAULT_PLACEMENTS:
        placement_changed = False
        placement = AdPlacement.query.filter_by(placement_key=placement_data['placement_key']).first()

        if not placement:
            placement = AdPlacement(
                name=placement_data['name'],
                display_name=placement_data['display_name'],
                description=placement_data['description'],
                placement_key=placement_data['placement_key'],
                page_context=placement_data['page_context'],
                is_active=True,
                max_ads_per_load=placement_data['max_ads_per_load'],
                supports_custom_image=True,
                supports_video=False,
                requires_approval=False,
                recommended_image_width=1200,
                recommended_image_height=628,
                max_title_length=80,
                max_description_length=200,
                created_at=now,
                updated_at=now,
            )
            placement.set_allowed_formats(placement_data['allowed_formats'])
            db.session.add(placement)
            changed = True
            continue

        # Keep existing placements healthy for campaign creation flow.
        existing_formats = set(placement.get_allowed_formats() or [])
        required_formats = set(placement_data['allowed_formats'])
        merged_formats = sorted(existing_formats.union(required_formats))

        if not placement.is_active:
            placement.is_active = True
            placement_changed = True

        if existing_formats != set(merged_formats):
            placement.set_allowed_formats(merged_formats)
            placement_changed = True

        if not placement.name:
            placement.name = placement_data['name']
            placement_changed = True
        if not placement.display_name:
            placement.display_name = placement_data['display_name']
            placement_changed = True
        if not placement.page_context:
            placement.page_context = placement_data['page_context']
            placement_changed = True
        if not placement.max_ads_per_load:
            placement.max_ads_per_load = placement_data['max_ads_per_load']
            placement_changed = True

        if placement_changed:
            placement.updated_at = now
            changed = True

    if changed:
        db.session.commit()


def check_campaign_ownership(employer_id, campaign_id):
    """Verify employer owns campaign"""
    campaign = AdCampaign.query.filter_by(
        id=campaign_id,
        employer_id=employer_id
    ).first()
    if not campaign:
        return None
    return campaign


def _log_review_audit(campaign_id, admin_id, action, from_status=None, to_status=None,
                      from_decision=None, to_decision=None, note=None, review_id=None):
    """Store admin moderation action in immutable audit trail."""
    AdReviewAudit.__table__.create(bind=db.engine, checkfirst=True)

    audit = AdReviewAudit(
        campaign_id=campaign_id,
        review_id=review_id,
        admin_id=admin_id,
        action=action,
        from_status=from_status,
        to_status=to_status,
        from_decision=from_decision,
        to_decision=to_decision,
        note=note,
    )
    db.session.add(audit)


# ========================
# EMPLOYER ROUTES
# ========================

@ads_bp.route('/campaigns', methods=['POST'])
@token_required
@role_required('employer')
def create_campaign(current_user):
    """Create a new campaign in DRAFT status"""
    try:
        data = request.get_json(silent=True) or {}
        
        # Validation
        required_fields = ['name', 'objective', 'budget_total', 'billing_type', 'bid_amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate objective enum
        objective = str(data['objective']).upper().strip()
        if objective not in VALID_OBJECTIVES:
            return jsonify({'error': 'Invalid objective'}), 400
        
        # Validate billing_type enum
        billing_type = str(data['billing_type']).upper().strip()
        if billing_type not in VALID_BILLING_TYPES:
            return jsonify({'error': 'Invalid billing_type'}), 400

        budget_total = safe_decimal(data.get('budget_total'))
        bid_amount = safe_decimal(data.get('bid_amount'))
        if budget_total <= 0:
            return jsonify({'error': 'budget_total must be greater than 0'}), 400
        if bid_amount <= 0:
            return jsonify({'error': 'bid_amount must be greater than 0'}), 400
        
        # Parse dates
        start_date = None
        end_date = None
        try:
            start_date = _parse_iso_datetime(data.get('start_date'), 'start_date')
            end_date = _parse_iso_datetime(data.get('end_date'), 'end_date')
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400

        if start_date and end_date and start_date >= end_date:
            return jsonify({'error': 'start_date must be before end_date'}), 400
        
        # Create campaign
        campaign = AdCampaign(
            employer_id=current_user.id,
            name=str(data['name']).strip(),
            objective=objective,
            status='DRAFT',
            budget_total=budget_total,
            budget_spent=Decimal('0'),
            billing_type=billing_type,
            bid_amount=bid_amount,
            start_date=start_date,
            end_date=end_date
        )
        
        # Set targeting if provided
        if data.get('targeting'):
            campaign.set_targeting(data['targeting'])
        
        db.session.add(campaign)
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign created successfully',
            'campaign': campaign.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns', methods=['GET'])
@token_required
@role_required('employer')
def list_campaigns(current_user):
    """List all campaigns for current employer with summary stats"""
    try:
        from sqlalchemy import func
        
        status = (request.args.get('status') or '').strip().upper()
        search_query = (request.args.get('q') or request.args.get('search') or '').strip()
        page = max(request.args.get('page', 1, type=int), 1)
        limit = request.args.get('limit', 20, type=int)
        limit = max(1, min(limit or 20, 200))
        offset = request.args.get('offset', type=int)

        query = AdCampaign.query.filter_by(employer_id=current_user.id)
        if status:
            query = query.filter(AdCampaign.status == status)

        if search_query:
            like_pattern = f"%{search_query}%"
            query = query.filter(
                or_(
                    AdCampaign.name.ilike(like_pattern),
                    AdCampaign.objective.ilike(like_pattern),
                    AdCampaign.status.ilike(like_pattern),
                )
            )

        total_count = query.count()
        query = query.order_by(AdCampaign.created_at.desc())
        if offset is not None and offset >= 0:
            query = query.offset(offset)
        else:
            query = query.offset((page - 1) * limit)
        query = query.limit(limit)

        campaigns = query.all()
        review_map = {
            review.campaign_id: review
            for review in AdReview.query.filter(AdReview.campaign_id.in_([c.id for c in campaigns])).all()
        } if campaigns else {}
        
        # Optimized: Get aggregated stats in single query instead of N+1 queries
        campaign_ids = [c.id for c in campaigns]
        
        if campaign_ids:
            impression_stats = db.session.query(
                AdImpression.campaign_id,
                func.count(AdImpression.id).label('total')
            ).filter(AdImpression.campaign_id.in_(campaign_ids)).group_by(
                AdImpression.campaign_id
            ).all()
            
            click_stats = db.session.query(
                AdClick.campaign_id,
                func.count(AdClick.id).label('total')
            ).filter(AdClick.campaign_id.in_(campaign_ids)).group_by(
                AdClick.campaign_id
            ).all()
            
            # Convert to lookups
            impression_map = {stat[0]: stat[1] for stat in impression_stats}
            click_map = {stat[0]: stat[1] for stat in click_stats}
        else:
            impression_map = {}
            click_map = {}
        
        campaigns_list = []
        for campaign in campaigns:
            total_impressions = impression_map.get(campaign.id, 0)
            total_clicks = click_map.get(campaign.id, 0)
            ctr = 0
            if total_impressions > 0:
                ctr = round((total_clicks / total_impressions) * 100, 2)
            
            campaign_data = campaign.to_dict()
            review = review_map.get(campaign.id)
            actions = {
                'can_pause': campaign.status == 'ACTIVE',
                'can_resume': campaign.status == 'PAUSED',
                'can_submit_review': campaign.status in ('DRAFT', 'NEEDS_CHANGES'),
                'can_edit': campaign.status in ('DRAFT', 'PAUSED', 'NEEDS_CHANGES'),
                'can_delete': campaign.status in ('DRAFT', 'PAUSED', 'REJECTED', 'NEEDS_CHANGES', 'COMPLETED'),
                'can_view_detail': True,
            }
            campaign_data.update({
                'impressions': total_impressions,
                'clicks': total_clicks,
                'ctr': ctr,
                'spend': float(campaign.budget_spent),
                'placements_count': campaign.placements.count(),
                'review': review.to_dict() if review else None,
                'actions': actions,
            })
            campaigns_list.append(campaign_data)

        status_counts_rows = db.session.query(
            AdCampaign.status,
            func.count(AdCampaign.id)
        ).filter(
            AdCampaign.employer_id == current_user.id
        ).group_by(AdCampaign.status).all()
        status_counts = {row[0]: int(row[1]) for row in status_counts_rows}
        total_pages = (total_count + limit - 1) // limit if total_count else 1
        effective_offset = offset if offset is not None and offset >= 0 else (page - 1) * limit
        
        return jsonify({
            'campaigns': campaigns_list,
            'total': total_count,
            'returned': len(campaigns_list),
            'search_query': search_query,
            'status_counts': status_counts,
            'pagination': {
                'page': page,
                'limit': limit,
                'offset': effective_offset,
                'total_items': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1,
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/dashboard/summary', methods=['GET'])
@token_required
@role_required('employer')
def employer_dashboard_summary(current_user):
    """Get employer dashboard summary metrics."""
    try:
        campaign_ids_query = db.session.query(AdCampaign.id).filter(
            AdCampaign.employer_id == current_user.id
        )
        campaign_ids = [row[0] for row in campaign_ids_query.all()]

        if not campaign_ids:
            return jsonify({
                'active_campaigns': 0,
                'total_impressions': 0,
                'monthly_impressions': 0,
                'total_clicks': 0,
                'average_ctr': 0,
            }), 200

        active_campaigns = AdCampaign.query.filter(
            AdCampaign.employer_id == current_user.id,
            AdCampaign.status == 'ACTIVE'
        ).count()

        total_impressions = db.session.query(func.count(AdImpression.id)).filter(
            AdImpression.campaign_id.in_(campaign_ids)
        ).scalar() or 0

        total_clicks = db.session.query(func.count(AdClick.id)).filter(
            AdClick.campaign_id.in_(campaign_ids)
        ).scalar() or 0

        today = date.today()
        month_start = date(today.year, today.month, 1)
        monthly_impressions = db.session.query(func.coalesce(func.sum(AdAnalyticsDaily.impressions), 0)).filter(
            AdAnalyticsDaily.campaign_id.in_(campaign_ids),
            AdAnalyticsDaily.date >= month_start,
            AdAnalyticsDaily.date <= today,
        ).scalar() or 0

        average_ctr = 0
        if total_impressions > 0:
            average_ctr = round((total_clicks / total_impressions) * 100, 2)

        return jsonify({
            'active_campaigns': int(active_campaigns),
            'total_impressions': int(total_impressions),
            'monthly_impressions': int(monthly_impressions),
            'total_clicks': int(total_clicks),
            'average_ctr': float(average_ctr),
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>', methods=['GET'])
@token_required
@role_required('employer')
def get_campaign_detail(current_user, campaign_id):
    """Get full campaign detail with creatives and 30-day analytics"""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        campaign_data = campaign.to_dict()
        
        # Get creatives
        creatives = campaign.creatives.all()
        campaign_data['creatives'] = [c.to_dict() for c in creatives]
        
        # Get 30-day analytics
        thirty_days_ago = date.today() - timedelta(days=30)
        analytics = AdAnalyticsDaily.query.filter(
            AdAnalyticsDaily.campaign_id == campaign_id,
            AdAnalyticsDaily.date >= thirty_days_ago
        ).order_by(AdAnalyticsDaily.date).all()
        
        campaign_data['analytics'] = [a.to_dict() for a in analytics]
        
        # Get placements
        campaign_data['placements'] = _serialize_campaign_placements(campaign)

        review = AdReview.query.filter_by(campaign_id=campaign_id).first()
        campaign_data['review'] = review.to_dict() if review else None

        audits = AdReviewAudit.query.filter_by(campaign_id=campaign_id).order_by(
            AdReviewAudit.created_at.desc()
        ).limit(20).all()
        campaign_data['review_audit_logs'] = [a.to_dict() for a in audits]
        
        return jsonify(campaign_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>', methods=['PUT'])
@token_required
@role_required('employer')
def update_campaign(current_user, campaign_id):
    """Update campaign — only if DRAFT or PAUSED"""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Only DRAFT, PAUSED, or NEEDS_CHANGES can be edited
        if campaign.status not in ('DRAFT', 'PAUSED', 'NEEDS_CHANGES'):
            return jsonify({'error': f'Cannot edit {campaign.status} campaigns'}), 403
        
        data = request.get_json(silent=True) or {}
        
        # Update fields
        if 'name' in data:
            campaign.name = str(data['name']).strip()
        if 'objective' in data:
            objective = str(data['objective']).upper().strip()
            if objective not in VALID_OBJECTIVES:
                return jsonify({'error': 'Invalid objective'}), 400
            campaign.objective = objective

        if 'billing_type' in data:
            billing_type = str(data['billing_type']).upper().strip()
            if billing_type not in VALID_BILLING_TYPES:
                return jsonify({'error': 'Invalid billing_type'}), 400
            campaign.billing_type = billing_type

        if 'bid_amount' in data:
            new_bid_amount = safe_decimal(data['bid_amount'])
            if new_bid_amount <= 0:
                return jsonify({'error': 'bid_amount must be greater than 0'}), 400
            campaign.bid_amount = new_bid_amount
        
        # Budget can only increase, not decrease
        if 'budget_total' in data:
            new_budget = safe_decimal(data['budget_total'])
            if new_budget <= 0:
                return jsonify({'error': 'budget_total must be greater than 0'}), 400
            if new_budget < campaign.budget_spent:
                return jsonify({'error': 'Cannot reduce budget below spent amount'}), 400
            campaign.budget_total = new_budget
        
        # Update dates
        if 'start_date' in data:
            try:
                campaign.start_date = _parse_iso_datetime(data.get('start_date'), 'start_date')
            except ValueError as exc:
                return jsonify({'error': str(exc)}), 400
        if 'end_date' in data:
            try:
                campaign.end_date = _parse_iso_datetime(data.get('end_date'), 'end_date')
            except ValueError as exc:
                return jsonify({'error': str(exc)}), 400

        if campaign.start_date and campaign.end_date and campaign.start_date >= campaign.end_date:
            return jsonify({'error': 'start_date must be before end_date'}), 400
        
        # Update targeting
        if 'targeting' in data:
            campaign.set_targeting(data['targeting'])
        
        campaign.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign updated successfully',
            'campaign': campaign.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>', methods=['DELETE'])
@token_required
@role_required('employer')
def delete_campaign(current_user, campaign_id):
    """Delete an employer campaign if status allows it."""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404

        allowed_statuses = {'DRAFT', 'PAUSED', 'REJECTED', 'NEEDS_CHANGES', 'COMPLETED'}
        if campaign.status not in allowed_statuses:
            return jsonify({'error': f'Cannot delete {campaign.status} campaigns. Pause or complete it first.'}), 400

        # Audits keep campaign_id as NOT NULL, so remove them explicitly before deleting campaign.
        AdReviewAudit.query.filter_by(campaign_id=campaign.id).delete(synchronize_session=False)

        campaign_name = campaign.name
        db.session.delete(campaign)
        db.session.commit()

        return jsonify({
            'message': 'Campaign deleted successfully',
            'campaign_id': campaign_id,
            'campaign_name': campaign_name,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>/submit', methods=['POST'])
@token_required
@role_required('employer')
def submit_campaign_for_review(current_user, campaign_id):
    """Move campaign from DRAFT to PENDING_REVIEW"""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Validate campaign ready
        if campaign.status not in ['DRAFT', 'NEEDS_CHANGES']:
            return jsonify({'error': f'Campaign must be DRAFT or NEEDS_CHANGES, not {campaign.status}'}), 400
        
        active_creatives = campaign.creatives.filter_by(is_active=True).count()
            
        if active_creatives == 0:
            return jsonify({'error': 'Campaign must have at least 1 active creative'}), 400

        selected_placements = campaign.placements.count()
        if selected_placements == 0:
            return jsonify({'error': 'Campaign must have at least 1 placement selected'}), 400

        incompatible_creatives = [
            creative.id
            for creative in campaign.creatives.filter_by(is_active=True).all()
            if not _campaign_supports_format(campaign, creative.ad_format)
        ]
        if incompatible_creatives:
            return jsonify({
                'error': 'Some active creatives are incompatible with selected placements',
                'creative_ids': incompatible_creatives,
            }), 400
        
        # Valid dates
        if not campaign.start_date or not campaign.end_date:
            return jsonify({'error': 'Campaign must have start and end dates'}), 400
        
        if campaign.start_date >= campaign.end_date:
            return jsonify({'error': 'Start date must be before end date'}), 400
        
        if campaign.is_budget_exceeded():
            return jsonify({'error': 'Campaign budget is exhausted'}), 400
        
        campaign.status = 'PENDING_REVIEW'
        
        # Create review record in PENDING status
        review = AdReview.query.filter_by(campaign_id=campaign.id).first()
        if not review:
            review = AdReview(campaign_id=campaign.id)
            db.session.add(review)

        review.decision = 'PENDING'
        review.reviewer_id = None
        review.reviewed_at = None
        review.notes = None
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign submitted for review',
            'campaign': campaign.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception('submit_campaign_for_review failed: %s', e)
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@ads_bp.route('/campaigns/<int:campaign_id>/pause', methods=['POST'])
@token_required
@role_required('employer')
def pause_campaign(current_user, campaign_id):
    """Pause an ACTIVE campaign"""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        if campaign.status != 'ACTIVE':
            return jsonify({'error': 'Only ACTIVE campaigns can be paused'}), 400
        
        campaign.status = 'PAUSED'
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign paused',
            'campaign': campaign.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>/resume', methods=['POST'])
@token_required
@role_required('employer')
def resume_campaign(current_user, campaign_id):
    """Resume a PAUSED campaign"""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        if campaign.status != 'PAUSED':
            return jsonify({'error': 'Only PAUSED campaigns can be resumed'}), 400

        now = datetime.utcnow()
        if campaign.end_date and campaign.end_date < now:
            return jsonify({'error': 'Cannot resume campaign because it has already ended'}), 400
        if campaign.is_budget_exceeded():
            return jsonify({'error': 'Cannot resume campaign because budget is exhausted'}), 400
        
        campaign.status = 'ACTIVE'
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign resumed',
            'campaign': campaign.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>/creatives', methods=['POST'])
@token_required
@role_required('employer')
def create_creative(current_user, campaign_id):
    """Create a new creative for campaign with image upload"""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Accept both JSON and multipart/form-data payloads.
        data = request.get_json(silent=True) or {}
        if request.form:
            data.update(request.form.to_dict())
        
        # Validate required fields
        required_fields = ['title', 'body_text', 'cta_text', 'cta_url', 'ad_format']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate ad_format
        ad_format = str(data['ad_format']).upper().strip()
        if ad_format not in VALID_AD_FORMATS:
            return jsonify({'error': 'Invalid ad_format'}), 400

        if not _is_valid_http_url(data.get('cta_url')):
            return jsonify({'error': 'cta_url must be a valid absolute http(s) URL'}), 400

        if not _campaign_supports_format(campaign, ad_format):
            return jsonify({'error': f'No selected placement supports ad format {ad_format}'}), 400
        
        # Handle image upload if present
        image_url = data.get('image_url')
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file and image_file.filename:
                # Validate file
                allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
                file_ext = image_file.filename.split('.')[-1].lower()
                if file_ext not in allowed_extensions:
                    return jsonify({'error': 'Only jpg, png, webp allowed'}), 400
                
                # Check file size (2MB max)
                image_file.seek(0, 2)  # Seek to end
                file_size = image_file.tell()
                image_file.seek(0)  # Reset
                if file_size > 2 * 1024 * 1024:
                    return jsonify({'error': 'Image must be < 2MB'}), 400

                try:
                    upload_result = upload_ad_creative_image(image_file, campaign_id)
                    image_url = upload_result['url']
                except VercelBlobStorageError as storage_err:
                    current_app.logger.warning(
                        'Vercel Blob upload failed for campaign %s (%s). Falling back to local storage.',
                        campaign_id,
                        storage_err,
                    )

                    # Fallback for resilience when cloud storage is unavailable.
                    upload_dir = os.path.join(current_app.static_folder, 'ad_creatives')
                    os.makedirs(upload_dir, exist_ok=True)

                    timestamp = int(datetime.utcnow().timestamp())
                    filename = f"creative_{campaign_id}_{timestamp}.{file_ext}"
                    filepath = os.path.join(upload_dir, filename)

                    image_file.seek(0)
                    image_file.save(filepath)
                    image_url = f'/static/ad_creatives/{filename}'
                except Exception as upload_err:
                    current_app.logger.exception(
                        'Unexpected upload error for campaign %s: %s',
                        campaign_id,
                        upload_err,
                    )
                    return jsonify({'error': 'Failed to upload creative image'}), 500

        raw_is_active = data.get('is_active', True)
        if isinstance(raw_is_active, str):
            is_active = raw_is_active.lower() in {'1', 'true', 'yes', 'on'}
        else:
            is_active = bool(raw_is_active)
        
        # Create creative
        creative = AdCreative(
            campaign_id=campaign_id,
            title=data['title'][:80],
            body_text=data['body_text'][:200],
            cta_text=data.get('cta_text', 'Learn More')[:30],
            cta_url=data['cta_url'],
            image_url=image_url,
            ad_format=ad_format,
            is_active=is_active
        )
        
        db.session.add(creative)
        db.session.commit()
        
        return jsonify({
            'message': 'Creative created successfully',
            'creative': creative.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>/creatives/<int:creative_id>', methods=['PUT'])
@token_required
@role_required('employer')
def update_creative(current_user, campaign_id, creative_id):
    """Update a creative"""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        creative = AdCreative.query.filter_by(
            id=creative_id,
            campaign_id=campaign_id
        ).first()
        if not creative:
            return jsonify({'error': 'Creative not found'}), 404
        
        data = request.get_json(silent=True) or {}
        
        if 'title' in data:
            creative.title = data['title'][:80]
        if 'body_text' in data:
            creative.body_text = data['body_text'][:200]
        if 'cta_text' in data:
            creative.cta_text = data['cta_text'][:30]
        if 'cta_url' in data:
            if not _is_valid_http_url(data['cta_url']):
                return jsonify({'error': 'cta_url must be a valid absolute http(s) URL'}), 400
            creative.cta_url = data['cta_url']
        if 'ad_format' in data:
            new_format = str(data['ad_format']).upper().strip()
            if new_format not in VALID_AD_FORMATS:
                return jsonify({'error': 'Invalid ad_format'}), 400
            if not _campaign_supports_format(campaign, new_format):
                return jsonify({'error': f'No selected placement supports ad format {new_format}'}), 400
            creative.ad_format = new_format
        if 'image_url' in data:
            creative.image_url = data['image_url']
        if 'is_active' in data:
            creative.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Creative updated',
            'creative': creative.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>/creatives/<int:creative_id>', methods=['DELETE'])
@token_required
@role_required('employer')
def delete_creative(current_user, campaign_id, creative_id):
    """Delete a creative"""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        creative = AdCreative.query.filter_by(
            id=creative_id,
            campaign_id=campaign_id
        ).first()
        if not creative:
            return jsonify({'error': 'Creative not found'}), 404
        
        db.session.delete(creative)
        db.session.commit()
        
        return jsonify({'message': 'Creative deleted'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>/targeting', methods=['POST'])
@token_required
@role_required('employer')
def set_campaign_targeting(current_user, campaign_id):
    """Set targeting configuration for campaign"""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        data = request.get_json(silent=True) or {}
        
        # Create targeting dict with valid fields
        targeting = {
            'locations': data.get('locations', []),
            'job_categories': data.get('job_categories', []),
            'user_type': data.get('user_type', 'all'),
            'min_experience_years': data.get('min_experience_years', 0),
            'keywords': data.get('keywords', [])
        }
        
        campaign.set_targeting(targeting)
        db.session.commit()
        
        return jsonify({
            'message': 'Targeting saved',
            'targeting': targeting
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/placements', methods=['GET'])
@token_required
@role_required('employer')
def list_available_placements(current_user):
    """List active placements available to employer campaigns."""
    try:
        _ensure_default_placements()

        campaign_id = request.args.get('campaign_id', type=int)
        selected_ids = set()
        if campaign_id:
            campaign = check_campaign_ownership(current_user.id, campaign_id)
            if not campaign:
                return jsonify({'error': 'Campaign not found'}), 404
            selected_ids = {p.placement_id for p in campaign.placements.all()}

        placements = AdPlacement.query.filter_by(is_active=True).order_by(AdPlacement.name.asc()).all()
        return jsonify({
            'placements': [
                {
                    **placement.to_dict(),
                    'selected': placement.id in selected_ids
                }
                for placement in placements
            ]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>/placements', methods=['GET'])
@token_required
@role_required('employer')
def get_campaign_placements(current_user, campaign_id):
    """Get placement configuration for a campaign."""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404

        campaign_placements = _serialize_campaign_placements(campaign)
        return jsonify({
            'campaign_id': campaign_id,
            'placements': campaign_placements,
            'placement_ids': [p['id'] for p in campaign_placements]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/campaigns/<int:campaign_id>/placements', methods=['PUT'])
@token_required
@role_required('employer')
def update_campaign_placements(current_user, campaign_id):
    """Replace campaign placements using placement IDs or placement keys."""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404

        if campaign.status not in ('DRAFT', 'PAUSED', 'NEEDS_CHANGES'):
            return jsonify({'error': f'Cannot edit placements for {campaign.status} campaigns'}), 403

        data = request.get_json(silent=True) or {}
        raw_placements = data.get('placements') or data.get('placement_ids')
        if raw_placements is None:
            return jsonify({'error': 'placements or placement_ids is required'}), 400
        if not isinstance(raw_placements, list) or len(raw_placements) == 0:
            return jsonify({'error': 'At least one placement is required'}), 400

        resolved_placements = []
        for raw in raw_placements:
            placement = _resolve_placement(raw)
            if not placement:
                return jsonify({'error': f'Placement not found: {raw}'}), 400
            if not placement.is_active:
                return jsonify({'error': f'Placement is inactive: {placement.placement_key}'}), 400
            resolved_placements.append(placement)

        # Ensure active creatives can render in at least one selected placement.
        active_creatives = campaign.creatives.filter_by(is_active=True).all()
        if active_creatives:
            allowed_formats = set()
            for placement in resolved_placements:
                allowed_formats.update(placement.get_allowed_formats())

            unsupported_formats = sorted({c.ad_format for c in active_creatives if c.ad_format not in allowed_formats})
            if unsupported_formats:
                return jsonify({
                    'error': 'Selected placements do not support all active creative formats',
                    'unsupported_formats': unsupported_formats
                }), 400

        unique_ids = sorted({p.id for p in resolved_placements})
        _sync_campaign_placements(campaign_id, unique_ids)
        campaign.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Campaign placements updated successfully',
            'campaign_id': campaign_id,
            'placement_ids': unique_ids,
            'placements': [p.to_dict() for p in resolved_placements]
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/analytics/<int:campaign_id>', methods=['GET'])
@token_required
@role_required('employer')
def get_campaign_analytics(current_user, campaign_id):
    """Get daily analytics breakdown for campaign"""
    try:
        campaign = check_campaign_ownership(current_user.id, campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Parse date range (default last 30 days)
        start_date = request.args.get('start')
        end_date = request.args.get('end')
        
        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date).date()
            except:
                return jsonify({'error': 'Invalid start date format'}), 400
        else:
            start_date = date.today() - timedelta(days=30)
        
        if end_date:
            try:
                end_date = datetime.fromisoformat(end_date).date()
            except:
                return jsonify({'error': 'Invalid end date format'}), 400
        else:
            end_date = date.today()
        
        # Get analytics
        analytics = AdAnalyticsDaily.query.filter(
            AdAnalyticsDaily.campaign_id == campaign_id,
            AdAnalyticsDaily.date >= start_date,
            AdAnalyticsDaily.date <= end_date
        ).order_by(AdAnalyticsDaily.date).all()
        
        # Calculate totals
        total_impressions = sum(a.impressions for a in analytics)
        total_clicks = sum(a.clicks for a in analytics)
        total_spend = sum(float(a.spend) for a in analytics)
        total_reach = sum(a.reach for a in analytics)
        
        avg_ctr = 0
        if total_impressions > 0:
            avg_ctr = round((total_clicks / total_impressions) * 100, 2)
        
        return jsonify({
            'totals': {
                'impressions': total_impressions,
                'clicks': total_clicks,
                'ctr': avg_ctr,
                'spend': total_spend,
                'reach': total_reach
            },
            'daily': [a.to_dict() for a in analytics]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/credits', methods=['GET'])
@token_required
@role_required('employer')
def get_credits(current_user):
    """Get employer's credit balance and transaction history"""
    try:
        # Calculate balance
        transactions = AdCredit.query.filter_by(employer_id=current_user.id).all()
        
        balance = Decimal('0')
        for txn in transactions:
            if txn.transaction_type in ('PURCHASE', 'BONUS'):
                balance += txn.amount
            elif txn.transaction_type in ('SPEND', 'REFUND'):
                balance -= txn.amount
        
        return jsonify({
            'balance': float(balance),
            'transactions': [t.to_dict() for t in transactions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/credits/purchase', methods=['POST'])
@token_required
@role_required('employer')
def purchase_credits(current_user):
    """Purchase ad credits (stub for Stripe integration)"""
    try:
        data = request.get_json()
        
        if not data.get('amount'):
            return jsonify({'error': 'amount is required'}), 400
        
        amount = safe_decimal(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        # Create credit transaction
        credit = AdCredit(
            employer_id=current_user.id,
            amount=amount,
            transaction_type='PURCHASE',
            reference_id=f"PURCHASE_{datetime.utcnow().timestamp()}",
            note=data.get('note', 'Ad credits purchase')
        )
        
        db.session.add(credit)
        db.session.commit()
        
        return jsonify({
            'message': 'Credits purchased',
            'transaction': credit.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ========================
# PUBLIC AD SERVING ROUTES
# ========================

@ads_bp.route('/serve', methods=['GET'])
def serve_ads():
    """Core ad serving endpoint - called on page load"""
    try:
        placement_key = request.args.get('placement')
        context = _normalize_context(request.args.get('context'))
        limit = request.args.get('limit', 2, type=int)
        
        # Validate inputs
        if not placement_key:
            return jsonify({'error': 'placement is required'}), 400
        
        limit = min(limit, 10)  # Cap at 10
        
        # Get placement
        placement = _resolve_placement_with_alias(placement_key)
        if not placement or not placement.is_active:
            return jsonify({'ads': []}), 200

        if placement.page_context and placement.page_context not in ('ALL', context):
            return jsonify({'ads': []}), 200

        # Honor placement max while respecting caller's limit.
        placement_limit = placement.max_ads_per_load or 10
        limit = min(limit, placement_limit, 10)
        
        # Get current time for active campaign check
        now = datetime.utcnow()
        
        # Query active campaigns with budget remaining
        active_campaigns = AdCampaign.query.filter(
            AdCampaign.status == 'ACTIVE',
            or_(AdCampaign.start_date <= now, AdCampaign.start_date.is_(None)),
            or_(
                AdCampaign.end_date >= now,
                AdCampaign.end_date.is_(None)
            ),
            AdCampaign.budget_spent < AdCampaign.budget_total
        ).all()
        
        if not active_campaigns:
            return jsonify({'ads': []}), 200
        
        # Filter campaigns using this placement
        campaign_placements = AdCampaignPlacement.query.filter_by(
            placement_id=placement.id
        ).all()
        campaign_ids_in_placement = [cp.campaign_id for cp in campaign_placements]
        
        active_campaigns = [c for c in active_campaigns if c.id in campaign_ids_in_placement]
        
        if not active_campaigns:
            return jsonify({'ads': []}), 200
        
        # Frequency cap: check if this IP has seen >5 ads in last 24h
        ip_hash = get_ip_hash(request)
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        frequency_impressions = AdImpression.query.filter(
            AdImpression.ip_hash == ip_hash,
            AdImpression.viewed_at >= cutoff_time
        ).count()
        
        if frequency_impressions >= 5:
            return jsonify({'ads': []}), 200
        
        # Get active creatives for each campaign
        ads_to_serve = []
        allowed_formats = set(placement.get_allowed_formats())
        for campaign in active_campaigns:
            creatives = campaign.creatives.filter_by(is_active=True).all()
            for creative in creatives:
                # Check if format is allowed
                if creative.ad_format not in allowed_formats:
                    continue
                
                ads_to_serve.append({
                    'campaign': campaign,
                    'creative': creative,
                    'bid_amount': float(campaign.bid_amount)
                })
        
        if not ads_to_serve:
            return jsonify({'ads': []}), 200
        
        # Sort by bid amount (highest first), then random
        import random
        ads_to_serve.sort(key=lambda x: x['bid_amount'], reverse=True)
        ads_to_serve = ads_to_serve[:limit]
        
        # Build response
        ads_response = []
        for ad in ads_to_serve:
            campaign = ad['campaign']
            creative = ad['creative']
            sponsor = _build_sponsor_data(campaign)
            
            ads_response.append({
                'id': f"{campaign.id}_{creative.id}",
                'campaign_id': campaign.id,
                'creative_id': creative.id,
                'title': creative.title,
                'body_text': creative.body_text,
                'image_url': creative.image_url,
                'cta_text': creative.cta_text,
                'cta_url': creative.cta_url,
                'ad_format': creative.ad_format,
                'placement_id': placement.id,
                'sponsor': sponsor,
                'company_name': sponsor['company_name'] or sponsor['display_name'],
                'employer_name': sponsor['employer_name'],
                'tracking': {
                    'impression_url': f'/api/ads/impression?c={campaign.id}&cr={creative.id}&p={placement.placement_key}',
                    'click_url': f'/api/ads/click?c={campaign.id}&cr={creative.id}&p={placement.placement_key}'
                }
            })
        
        return jsonify({'ads': ads_response}), 200
        
    except Exception as e:
        current_app.logger.error(f"Ad serving error: {str(e)}")
        return jsonify({'ads': []}), 200


@ads_bp.route('/impression', methods=['POST'])
def record_impression():
    """Record an ad impression (async-friendly)"""
    try:
        data = request.get_json(silent=True) or {}
        
        # Extract fields
        campaign_id = data.get('campaign_id')
        creative_id = data.get('creative_id')
        placement_ref = data.get('placement_id')
        session_id = data.get('session_id')
        
        if not all([campaign_id, creative_id, placement_ref]):
            return '', 400

        placement = _resolve_placement(placement_ref)
        if not placement:
            return '', 400

        campaign = AdCampaign.query.get(campaign_id)
        creative = AdCreative.query.get(creative_id)
        if not campaign or not creative or creative.campaign_id != campaign.id:
            return '', 204

        now = datetime.utcnow()
        if campaign.status != 'ACTIVE':
            return '', 204
        if campaign.start_date and campaign.start_date > now:
            return '', 204
        if campaign.end_date and campaign.end_date < now:
            return '', 204
        if campaign.is_budget_exceeded():
            return '', 204
        
        # Get viewer user_id if logged in (optional)
        viewer_user_id = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            # Parse JWT (simplified)
            pass  # Would decode JWT token here
        
        # Create impression record
        impression = AdImpression(
            campaign_id=campaign_id,
            creative_id=creative_id,
            placement_id=placement.id,
            viewer_user_id=viewer_user_id,
            ip_hash=get_ip_hash(request),
            session_id=session_id,
            viewed_at=datetime.utcnow()
        )
        
        db.session.add(impression)
        
        # Update campaign spend if CPM billing
        if campaign and campaign.billing_type == 'CPM':
            # CPM charges per 1000 impressions
            campaign.budget_spent += (campaign.bid_amount / Decimal('1000'))
            if campaign.budget_spent >= campaign.budget_total:
                campaign.status = 'COMPLETED'
        
        db.session.commit()
        
        return '', 204
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Impression recording error: {str(e)}")
        return '', 204


@ads_bp.route('/click', methods=['GET', 'POST'])
def record_click():
    """Record a click and redirect to destination"""
    try:
        if request.method == 'GET':
            data = {
                'campaign_id': request.args.get('c', type=int),
                'creative_id': request.args.get('cr', type=int),
                'placement_id': request.args.get('p'),
                'session_id': request.args.get('s'),
                'cta_url': request.args.get('cta_url'),
            }
        else:
            data = request.get_json(silent=True) or {}
        
        # Extract fields
        campaign_id = data.get('campaign_id')
        creative_id = data.get('creative_id')
        placement_ref = data.get('placement_id')
        session_id = data.get('session_id')
        
        if not all([campaign_id, creative_id, placement_ref]):
            return jsonify({'error': 'Missing fields'}), 400

        placement = _resolve_placement(placement_ref)
        if not placement:
            if request.method == 'GET':
                return redirect(data.get('cta_url') or '/', code=302)
            return jsonify({'error': 'Invalid placement'}), 400

        campaign = AdCampaign.query.get(campaign_id)
        creative = AdCreative.query.get(creative_id)
        if not campaign or not creative or creative.campaign_id != campaign.id:
            if request.method == 'GET':
                return redirect(data.get('cta_url') or '/', code=302)
            return jsonify({'error': 'Invalid campaign or creative'}), 400
        
        # Get viewer user_id if logged in
        viewer_user_id = None
        
        # Create click record
        click = AdClick(
            campaign_id=campaign_id,
            creative_id=creative_id,
            placement_id=placement.id,
            clicker_user_id=viewer_user_id,
            ip_hash=get_ip_hash(request),
            session_id=session_id,
            clicked_at=datetime.utcnow()
        )
        
        db.session.add(click)
        
        # Update campaign spend if CPC billing
        if campaign and campaign.billing_type == 'CPC':
            # CPC charges per click
            campaign.budget_spent += campaign.bid_amount
            if campaign.budget_spent >= campaign.budget_total:
                campaign.status = 'COMPLETED'
        
        # Get creative to get CTA URL
        cta_url = data.get('cta_url') or (creative.cta_url if creative else None)
        
        db.session.commit()
        
        if request.method == 'GET':
            return redirect(cta_url or '/', code=302)

        return jsonify({'redirect_url': cta_url}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Click recording error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ========================
# ADMIN ROUTES
# ========================

@ads_bp.route('/admin/review-queue', methods=['GET'])
@token_required
@role_required('admin')
def get_review_queue(current_user):
    """Get all campaigns with their review status"""
    try:
        # Get filter parameter (all, pending, approved, rejected, needs_changes)
        filter_status = request.args.get('status', 'all')
        page = max(request.args.get('page', 1, type=int), 1)
        limit = request.args.get('limit', 20, type=int)
        limit = max(1, min(limit, 100))

        base_query = AdCampaign.query.options(joinedload(AdCampaign.employer)).outerjoin(
            AdReview, AdReview.campaign_id == AdCampaign.id
        )

        if filter_status != 'all':
            base_query = base_query.filter(func.lower(func.coalesce(AdReview.decision, 'no_review')) == filter_status.lower())

        total_items = base_query.count()
        total_pages = (total_items + limit - 1) // limit if total_items else 1

        campaigns = base_query.order_by(AdCampaign.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

        campaign_ids = [c.id for c in campaigns]
        review_map = {
            r.campaign_id: r
            for r in AdReview.query.filter(AdReview.campaign_id.in_(campaign_ids)).all()
        } if campaign_ids else {}

        all_creatives = AdCreative.query.filter(AdCreative.campaign_id.in_(campaign_ids)).all() if campaign_ids else []
        creatives_map = {}
        for creative in all_creatives:
            creatives_map.setdefault(creative.campaign_id, []).append(creative)

        review_counts = db.session.query(
            func.coalesce(AdReview.decision, 'NO_REVIEW').label('decision'),
            func.count(AdReview.id)
        ).group_by('decision').all()
        counts_map = {row.decision: row[1] for row in review_counts}

        stats = {
            'total': AdCampaign.query.count(),
            'pending': counts_map.get('PENDING', 0),
            'approved': counts_map.get('APPROVED', 0),
            'rejected': counts_map.get('REJECTED', 0),
            'needs_changes': counts_map.get('NEEDS_CHANGES', 0),
        }

        campaigns_data = []
        for campaign in campaigns:
            review = review_map.get(campaign.id)
            review_status = review.decision if review else 'NO_REVIEW'

            creatives = creatives_map.get(campaign.id, [])
            
            # Determine action buttons based on review status
            can_approve = review_status in ['PENDING', 'REJECTED', 'NEEDS_CHANGES']
            can_reject = review_status in ['PENDING', 'APPROVED', 'NEEDS_CHANGES']
            can_needs_changes = review_status in ['PENDING', 'APPROVED', 'REJECTED']
            can_reset = review_status in ['APPROVED', 'REJECTED', 'NEEDS_CHANGES']
            
            campaign_data = {
                'campaign': campaign.to_dict(),
                'employer': {
                    'id': campaign.employer.id,
                    'name': campaign.employer.get_full_name(),
                    'email': campaign.employer.email
                },
                'creatives': [c.to_dict() for c in creatives],
                'review': {
                    'id': review.id if review else None,
                    'decision': review_status,
                    'reviewer_id': review.reviewer_id if review else None,
                    'reviewer_name': None,  # Will be populated if reviewer exists
                    'reviewed_at': review.reviewed_at.isoformat() if review and review.reviewed_at else None,
                    'notes': review.notes if review else None
                },
                # Action buttons metadata
                'actions': {
                    'can_approve': can_approve,
                    'can_reject': can_reject,
                    'can_needs_changes': can_needs_changes,
                    'can_reset': can_reset,
                    'can_pause': campaign.status == 'ACTIVE',
                    'can_resume': campaign.status in ['PAUSED', 'DRAFT'],
                    'current_status': campaign.status
                }
            }
            
            # Get reviewer name if exists
            if review and review.reviewer_id:
                reviewer = User.query.get(review.reviewer_id)
                if reviewer:
                    campaign_data['review']['reviewer_name'] = reviewer.get_full_name()
            
            campaigns_data.append(campaign_data)
        
        return jsonify({
            'campaigns': campaigns_data,
            'count': total_items,
            'stats': stats,
            'filter': filter_status,
            'pagination': {
                'page': page,
                'limit': limit,
                'total_items': total_items,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1,
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/campaigns/<int:campaign_id>/approve', methods=['POST'])
@token_required
@role_required('admin')
def approve_campaign(current_user, campaign_id):
    """Approve a campaign"""
    try:
        campaign = AdCampaign.query.get(campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404

        previous_status = campaign.status
        if campaign.status not in ['PENDING_REVIEW', 'REJECTED', 'PAUSED', 'DRAFT', 'NEEDS_CHANGES']:
            return jsonify({'error': f'Cannot approve campaign in {campaign.status} status'}), 400
        
        # Update campaign and review
        campaign.status = 'ACTIVE'
        campaign.start_date = datetime.utcnow()  # Start now if not already started
        
        # Ensure all creatives are marked as active
        creatives = AdCreative.query.filter_by(campaign_id=campaign_id).all()
        for creative in creatives:
            creative.is_active = True
        
        review = AdReview.query.filter_by(campaign_id=campaign_id).first()
        if not review:
            review = AdReview(campaign_id=campaign_id)
            db.session.add(review)

        previous_decision = review.decision
        review.decision = 'APPROVED'
        review.reviewer_id = current_user.id
        review.reviewed_at = datetime.utcnow()

        _log_review_audit(
            campaign_id=campaign_id,
            review_id=review.id,
            admin_id=current_user.id,
            action='APPROVED',
            from_status=previous_status,
            to_status='ACTIVE',
            from_decision=previous_decision,
            to_decision='APPROVED',
            note='Campaign approved by admin',
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign approved',
            'campaign': campaign.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/campaigns/<int:campaign_id>/reject', methods=['POST'])
@token_required
@role_required('admin')
def reject_campaign(current_user, campaign_id):
    """Reject a campaign"""
    try:
        campaign = AdCampaign.query.get(campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404

        previous_status = campaign.status
        if campaign.status not in ['PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'DRAFT', 'NEEDS_CHANGES']:
            return jsonify({'error': f'Cannot reject campaign in {campaign.status} status'}), 400

        data = request.get_json() or {}
        notes = data.get('notes', 'No reason provided')
        
        # Update campaign and review
        campaign.status = 'REJECTED'
        
        review = AdReview.query.filter_by(campaign_id=campaign_id).first()
        if not review:
            review = AdReview(campaign_id=campaign_id)
            db.session.add(review)

        previous_decision = review.decision
        review.decision = 'REJECTED'
        review.reviewer_id = current_user.id
        review.reviewed_at = datetime.utcnow()
        review.notes = notes

        _log_review_audit(
            campaign_id=campaign_id,
            review_id=review.id,
            admin_id=current_user.id,
            action='REJECTED',
            from_status=previous_status,
            to_status='REJECTED',
            from_decision=previous_decision,
            to_decision='REJECTED',
            note=notes,
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign rejected',
            'campaign': campaign.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/campaigns/<int:campaign_id>/reset-review', methods=['POST'])
@token_required
@role_required('admin')
def reset_campaign_review(current_user, campaign_id):
    """Reset a campaign review back to PENDING"""
    try:
        campaign = AdCampaign.query.get(campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        previous_status = campaign.status
        if campaign.status not in ['REJECTED', 'ACTIVE', 'NEEDS_CHANGES']:
            return jsonify({'error': 'Can only reset REJECTED, NEEDS_CHANGES, or ACTIVE campaigns'}), 400
        
        # Reset campaign to PENDING_REVIEW
        campaign.status = 'PENDING_REVIEW'
        
        # Reset review to PENDING
        review = AdReview.query.filter_by(campaign_id=campaign_id).first()
        if not review:
            review = AdReview(campaign_id=campaign_id)
            db.session.add(review)

        previous_decision = review.decision
        review.decision = 'PENDING'
        review.reviewer_id = None
        review.reviewed_at = None
        review.notes = None

        _log_review_audit(
            campaign_id=campaign_id,
            review_id=review.id,
            admin_id=current_user.id,
            action='RESET_REVIEW',
            from_status=previous_status,
            to_status='PENDING_REVIEW',
            from_decision=previous_decision,
            to_decision='PENDING',
            note='Review reset to pending',
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign review reset to PENDING',
            'campaign': campaign.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/campaigns/<int:campaign_id>/needs-changes', methods=['POST'])
@token_required
@role_required('admin')
def needs_changes_campaign(current_user, campaign_id):
    """Mark campaign as NEEDS_CHANGES and provide feedback notes."""
    try:
        campaign = AdCampaign.query.get(campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404

        data = request.get_json() or {}
        notes = data.get('notes', 'Please update your campaign and resubmit.')
        previous_status = campaign.status

        if campaign.status not in ['PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'DRAFT', 'PAUSED', 'NEEDS_CHANGES']:
            return jsonify({'error': f'Cannot request changes for campaign in {campaign.status} status'}), 400

        campaign.status = 'NEEDS_CHANGES'

        review = AdReview.query.filter_by(campaign_id=campaign_id).first()
        if not review:
            review = AdReview(campaign_id=campaign_id)
            db.session.add(review)

        previous_decision = review.decision
        review.decision = 'NEEDS_CHANGES'
        review.reviewer_id = current_user.id
        review.reviewed_at = datetime.utcnow()
        review.notes = notes

        _log_review_audit(
            campaign_id=campaign_id,
            review_id=review.id,
            admin_id=current_user.id,
            action='NEEDS_CHANGES',
            from_status=previous_status,
            to_status='NEEDS_CHANGES',
            from_decision=previous_decision,
            to_decision='NEEDS_CHANGES',
            note=notes,
        )

        db.session.commit()

        return jsonify({
            'message': 'Campaign marked as needs changes',
            'campaign': campaign.to_dict(),
            'review': review.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/campaigns/<int:campaign_id>/status', methods=['PUT'])
@token_required
@role_required('admin')
def update_campaign_status_admin(current_user, campaign_id):
    """Update campaign status from admin panel."""
    try:
        campaign = AdCampaign.query.get(campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404

        data = request.get_json() or {}
        new_status = (data.get('status') or '').upper()
        allowed_statuses = {'DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'REJECTED', 'COMPLETED'}

        if new_status not in allowed_statuses:
            return jsonify({'error': 'Invalid status'}), 400

        previous_status = campaign.status
        campaign.status = new_status
        campaign.updated_at = datetime.utcnow()

        _log_review_audit(
            campaign_id=campaign_id,
            admin_id=current_user.id,
            action='STATUS_CHANGED',
            from_status=previous_status,
            to_status=new_status,
            note=f'Status changed from {previous_status} to {new_status}',
        )
        db.session.commit()

        return jsonify({
            'message': f'Campaign status updated to {new_status}',
            'campaign': campaign.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/campaigns', methods=['GET'])
@token_required
@role_required('admin')
def list_all_campaigns(current_user):
    """List all campaigns across all employers with filters"""
    try:
        # Parse filters
        status = request.args.get('status')
        search_query = (request.args.get('q') or '').strip()
        employer_id = request.args.get('employer_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = max(request.args.get('page', 1, type=int), 1)
        limit = request.args.get('limit', 20, type=int)
        limit = max(1, min(limit, 100))
        
        query = AdCampaign.query.options(joinedload(AdCampaign.employer))

        if search_query:
            like_pattern = f"%{search_query}%"
            query = query.join(User, AdCampaign.employer_id == User.id).filter(
                or_(
                    AdCampaign.name.ilike(like_pattern),
                    User.first_name.ilike(like_pattern),
                    User.last_name.ilike(like_pattern),
                    User.email.ilike(like_pattern),
                )
            )
        
        if status:
            query = query.filter_by(status=status)
        if employer_id:
            query = query.filter_by(employer_id=employer_id)
        if start_date:
            start = datetime.fromisoformat(start_date)
            query = query.filter(AdCampaign.created_at >= start)
        if end_date:
            end = datetime.fromisoformat(end_date)
            query = query.filter(AdCampaign.created_at <= end)
        
        campaigns_query = query.order_by(AdCampaign.created_at.desc())
        total_items = campaigns_query.count()
        campaigns = campaigns_query.offset((page - 1) * limit).limit(limit).all()

        result = []
        for campaign in campaigns:
            analytics = db.session.query(
                func.sum(AdAnalyticsDaily.impressions).label('impressions'),
                func.sum(AdAnalyticsDaily.clicks).label('clicks'),
                func.avg(AdAnalyticsDaily.ctr).label('ctr'),
                func.sum(AdAnalyticsDaily.spend).label('spend')
            ).filter(
                AdAnalyticsDaily.campaign_id == campaign.id
            ).first()

            employer_name = 'Unknown'
            if campaign.employer:
                employer_name = campaign.employer.get_full_name() or campaign.employer.email

            result.append({
                'id': campaign.id,
                'name': campaign.name,
                'employer_id': campaign.employer_id,
                'employer_name': employer_name,
                'status': campaign.status,
                'objective': campaign.objective,
                'budget_total': float(campaign.budget_total),
                'budget_spent': float(campaign.budget_spent),
                'billing_type': campaign.billing_type,
                'bid_amount': float(campaign.bid_amount),
                'impressions': int((analytics.impressions or 0) if analytics else 0),
                'clicks': int((analytics.clicks or 0) if analytics else 0),
                'ctr': float((analytics.ctr or 0) if analytics else 0),
                'spend': float((analytics.spend or 0) if analytics else 0),
                'start_date': campaign.start_date.isoformat() if campaign.start_date else None,
                'end_date': campaign.end_date.isoformat() if campaign.end_date else None,
                'created_at': campaign.created_at.isoformat(),
                'updated_at': campaign.updated_at.isoformat() if campaign.updated_at else None,
            })

        return jsonify({
            'campaigns': result,
            'total': total_items,
            'search_query': search_query,
            'pagination': {
                'page': page,
                'limit': limit,
                'total_items': total_items,
                'total_pages': (total_items + limit - 1) // limit if total_items else 1,
                'has_next': page * limit < total_items,
                'has_prev': page > 1,
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/campaigns/<int:campaign_id>', methods=['GET'])
@token_required
@role_required('admin')
def get_admin_campaign_detail(current_user, campaign_id):
    """Get full campaign detail for admin workflows."""
    try:
        campaign = AdCampaign.query.options(joinedload(AdCampaign.employer)).filter_by(id=campaign_id).first()
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404

        campaign_data = campaign.to_dict()
        employer = campaign.employer

        creatives = campaign.creatives.order_by(AdCreative.created_at.desc()).all()
        placements = _serialize_campaign_placements(campaign)

        review = AdReview.query.filter_by(campaign_id=campaign_id).first()
        audits = AdReviewAudit.query.filter_by(campaign_id=campaign_id).order_by(
            AdReviewAudit.created_at.desc()
        ).limit(100).all()

        thirty_days_ago = date.today() - timedelta(days=30)
        analytics = AdAnalyticsDaily.query.filter(
            AdAnalyticsDaily.campaign_id == campaign_id,
            AdAnalyticsDaily.date >= thirty_days_ago
        ).order_by(AdAnalyticsDaily.date.asc()).all()

        total_impressions = sum(item.impressions for item in analytics)
        total_clicks = sum(item.clicks for item in analytics)
        total_spend = sum(float(item.spend or 0) for item in analytics)
        average_ctr = round((total_clicks / total_impressions) * 100, 2) if total_impressions else 0

        return jsonify({
            'campaign': campaign_data,
            'employer': {
                'id': employer.id if employer else None,
                'name': employer.get_full_name() if employer else None,
                'email': employer.email if employer else None,
            },
            'creatives': [creative.to_dict() for creative in creatives],
            'placements': placements,
            'review': review.to_dict() if review else None,
            'review_audit_logs': [audit.to_dict() for audit in audits],
            'analytics': {
                'totals': {
                    'impressions': int(total_impressions),
                    'clicks': int(total_clicks),
                    'ctr': float(average_ctr),
                    'spend': float(total_spend),
                },
                'daily': [item.to_dict() for item in analytics],
            },
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/placements', methods=['GET'])
@token_required
@role_required('admin')
def list_placements(current_user):
    """List all placements"""
    try:
        placements = AdPlacement.query.all()
        return jsonify({
            'placements': [p.to_dict() for p in placements]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/placements', methods=['POST'])
@token_required
@role_required('admin')
def create_placement(current_user):
    """Create a new placement"""
    try:
        data = request.get_json()
        
        required = ['name', 'placement_key', 'page_context']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        placement = AdPlacement(
            name=data['name'],
            placement_key=data['placement_key'],
            page_context=data['page_context'],
            allowed_formats=json.dumps(data.get('allowed_formats', [])),
            max_ads_per_load=data.get('max_ads_per_load', 2),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(placement)
        db.session.commit()
        
        return jsonify({
            'message': 'Placement created',
            'placement': placement.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/placements/<int:placement_id>', methods=['PUT'])
@token_required
@role_required('admin')
def update_placement(current_user, placement_id):
    """Update a placement"""
    try:
        placement = AdPlacement.query.get(placement_id)
        if not placement:
            return jsonify({'error': 'Placement not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            placement.name = data['name']
        if 'page_context' in data:
            placement.page_context = data['page_context']
        if 'allowed_formats' in data:
            placement.set_allowed_formats(data['allowed_formats'])
        if 'max_ads_per_load' in data:
            placement.max_ads_per_load = data['max_ads_per_load']
        if 'is_active' in data:
            placement.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Placement updated',
            'placement': placement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/analytics/overview', methods=['GET'])
@token_required
@role_required('admin')
def get_platform_analytics(current_user):
    """Get platform-wide analytics overview"""
    try:
        # Get today's data
        today = date.today()
        
        total_impressions = AdAnalyticsDaily.query.filter_by(date=today).with_entities(
            func.sum(AdAnalyticsDaily.impressions)
        ).scalar() or 0
        
        total_clicks = AdAnalyticsDaily.query.filter_by(date=today).with_entities(
            func.sum(AdAnalyticsDaily.clicks)
        ).scalar() or 0
        
        total_spend = AdAnalyticsDaily.query.filter_by(date=today).with_entities(
            func.sum(AdAnalyticsDaily.spend)
        ).scalar() or 0
        
        active_campaigns = AdCampaign.query.filter_by(status='ACTIVE').count()
        
        return jsonify({
            'today': {
                'impressions': int(total_impressions),
                'clicks': int(total_clicks),
                'spend': float(total_spend),
                'active_campaigns': active_campaigns
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========================
# UTILITY ENDPOINTS
# ========================

@ads_bp.route('/admin/run-aggregation', methods=['POST'])
@token_required
@role_required('admin')
def run_analytics_aggregation(current_user):
    """Aggregate impressions and clicks into daily analytics"""
    try:
        yesterday = date.today() - timedelta(days=1)
        
        # Get all unique campaign/creative/placement combinations from yesterday
        impressions_query = db.session.query(
            AdImpression.campaign_id,
            AdImpression.creative_id,
            AdImpression.placement_id,
            func.count(AdImpression.id).label('imp_count'),
            func.count(func.distinct(AdImpression.viewer_user_id)).label('reach')
        ).filter(
            func.date(AdImpression.viewed_at) == yesterday
        ).group_by(
            AdImpression.campaign_id,
            AdImpression.creative_id,
            AdImpression.placement_id
        ).all()
        
        for row in impressions_query:
            campaign_id, creative_id, placement_id, imp_count, reach = row
            
            clicks_count = AdClick.query.filter(
                AdClick.campaign_id == campaign_id,
                AdClick.creative_id == creative_id,
                AdClick.placement_id == placement_id,
                func.date(AdClick.clicked_at) == yesterday
            ).count()
            
            ctr = 0
            if imp_count > 0:
                ctr = Decimal((clicks_count / imp_count) * 100)
            
            # Calculate spend
            campaign = AdCampaign.query.get(campaign_id)
            spend = Decimal('0')
            if campaign:
                if campaign.billing_type == 'CPM':
                    spend = (campaign.bid_amount / Decimal('1000')) * Decimal(imp_count)
                elif campaign.billing_type == 'CPC':
                    spend = campaign.bid_amount * Decimal(clicks_count)
            
            # Check if analytics record already exists
            existing = AdAnalyticsDaily.query.filter_by(
                campaign_id=campaign_id,
                creative_id=creative_id,
                placement_id=placement_id,
                date=yesterday
            ).first()
            
            if existing:
                existing.impressions = imp_count
                existing.clicks = clicks_count
                existing.ctr = ctr
                existing.spend = spend
                existing.reach = reach
            else:
                analytics = AdAnalyticsDaily(
                    campaign_id=campaign_id,
                    creative_id=creative_id,
                    placement_id=placement_id,
                    date=yesterday,
                    impressions=imp_count,
                    clicks=clicks_count,
                    ctr=ctr,
                    spend=spend,
                    reach=reach
                )
                db.session.add(analytics)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Aggregation completed for {yesterday}',
            'records_processed': len(impressions_query)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================
# ADMIN ANALYTICS ENDPOINTS
# ============================================

@ads_bp.route('/admin/overview', methods=['GET'])
@token_required
@role_required('admin')
def admin_overview(current_user):
    """Get platform-wide analytics overview for admin dashboard"""
    try:
        from datetime import datetime, timedelta
        
        # Last 30 days
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        # Total impressions and clicks
        total_impressions = AdImpression.query.filter(
            func.date(AdImpression.viewed_at) >= start_date
        ).count()
        
        total_clicks = AdClick.query.filter(
            func.date(AdClick.clicked_at) >= start_date
        ).count()
        
        # Platform CTR
        platform_ctr = 0
        if total_impressions > 0:
            platform_ctr = round((total_clicks / total_impressions) * 100, 2)
        
        # Total spend
        total_spend = db.session.query(func.sum(AdAnalyticsDaily.spend)).filter(
            AdAnalyticsDaily.date >= start_date
        ).scalar() or Decimal('0')
        
        # Active campaigns
        active_campaigns = AdCampaign.query.filter(
            AdCampaign.status == 'ACTIVE'
        ).count()
        
        # Daily breakdown (last 30 days)
        daily_data = db.session.query(
            AdAnalyticsDaily.date,
            func.sum(AdAnalyticsDaily.impressions).label('impressions'),
            func.sum(AdAnalyticsDaily.clicks).label('clicks')
        ).filter(
            AdAnalyticsDaily.date >= start_date
        ).group_by(AdAnalyticsDaily.date).order_by(AdAnalyticsDaily.date).all()
        
        daily_breakdown = [
            {
                'date': str(row.date),
                'impressions': int(row.impressions or 0),
                'clicks': int(row.clicks or 0)
            }
            for row in daily_data
        ]
        
        # Top campaigns by impressions
        top_campaigns_query = db.session.query(
            AdCampaign.id,
            AdCampaign.name,
            User.first_name,
            User.last_name,
            func.sum(AdAnalyticsDaily.impressions).label('impressions'),
            func.sum(AdAnalyticsDaily.clicks).label('clicks'),
            func.avg(AdAnalyticsDaily.ctr).label('ctr'),
            func.sum(AdAnalyticsDaily.spend).label('spend')
        ).join(User, AdCampaign.employer_id == User.id).join(
            AdAnalyticsDaily, AdCampaign.id == AdAnalyticsDaily.campaign_id
        ).filter(
            AdAnalyticsDaily.date >= start_date
        ).group_by(
            AdCampaign.id, AdCampaign.name, User.first_name, User.last_name
        ).order_by(func.sum(AdAnalyticsDaily.impressions).desc()).limit(10).all()
        
        top_campaigns = [
            {
                'id': row.id,
                'name': row.name,
                'employer_name': (row.first_name or '') + ' ' + (row.last_name or ''),
                'impressions': int(row.impressions or 0),
                'clicks': int(row.clicks or 0),
                'ctr': float(row.ctr or 0),
                'spend': float(row.spend or 0)
            }
            for row in top_campaigns_query
        ]
        
        # Credits and revenue
        total_purchased = db.session.query(func.sum(AdCredit.amount)).filter(
            AdCredit.transaction_type.in_(['PURCHASE', 'BONUS'])
        ).scalar() or Decimal('0')

        total_spent_all_time = db.session.query(func.sum(AdAnalyticsDaily.spend)).scalar() or Decimal('0')

        platform_revenue = total_spent_all_time * Decimal('0.2')  # 20% platform cut
        
        return jsonify({
            'total_impressions': total_impressions,
            'total_clicks': total_clicks,
            'platform_ctr': platform_ctr,
            'total_spend': float(total_spend),
            'active_campaigns': active_campaigns,
            'daily_breakdown': daily_breakdown,
            'top_campaigns': top_campaigns,
            'total_purchased': float(total_purchased),
            'total_spent': float(total_spent_all_time),
            'platform_revenue': float(platform_revenue)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/legacy/campaigns', methods=['GET'])
@token_required
@role_required('admin')
def admin_list_campaigns(current_user):
    """List all campaigns with admin filters"""
    try:
        # Optional filters
        status = request.args.get('status', 'ALL')
        
        query = AdCampaign.query
        if status != 'ALL':
            query = query.filter_by(status=status)
        
        campaigns = query.order_by(AdCampaign.created_at.desc()).all()
        
        result = []
        for campaign in campaigns:
            employer = User.query.get(campaign.employer_id)
            
            # Get aggregated analytics
            analytics = db.session.query(
                func.sum(AdAnalyticsDaily.impressions).label('impressions'),
                func.sum(AdAnalyticsDaily.clicks).label('clicks'),
                func.avg(AdAnalyticsDaily.ctr).label('ctr'),
                func.sum(AdAnalyticsDaily.spend).label('spend')
            ).filter(
                AdAnalyticsDaily.campaign_id == campaign.id
            ).first()
            
            result.append({
                'id': campaign.id,
                'name': campaign.name,
                'employer_name': (employer.first_name + ' ' + employer.last_name) if employer else 'Unknown',
                'status': campaign.status,
                'budget_total': float(campaign.budget_total),
                'budget_spent': float(campaign.budget_spent),
                'impressions': int(analytics.impressions or 0),
                'clicks': int(analytics.clicks or 0),
                'created_at': campaign.created_at.isoformat()
            })
        
        return jsonify({'campaigns': result}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/legacy/placements', methods=['GET'])
@token_required
@role_required('admin')
def admin_list_placements(current_user):
    """List all ad placements"""
    try:
        placements = AdPlacement.query.all()
        
        result = [
            {
                'id': p.id,
                'name': p.name,
                'placement_key': p.placement_key,
                'page_context': p.page_context,
                'max_ads_per_load': p.max_ads_per_load,
                'is_active': p.is_active,
                'allowed_formats': p.allowed_formats or []
            }
            for p in placements
        ]
        
        return jsonify({'placements': result}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/legacy/placements/<int:placement_id>', methods=['PUT'])
@token_required
@role_required('admin')
def admin_update_placement(current_user, placement_id):
    """Update placement status (activate/deactivate)"""
    try:
        placement = AdPlacement.query.get(placement_id)
        if not placement:
            return jsonify({'error': 'Placement not found'}), 404
        
        data = request.get_json()
        if 'is_active' in data:
            placement.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Placement updated',
            'placement': {
                'id': placement.id,
                'name': placement.name,
                'is_active': placement.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================
# ADMIN CAMPAIGN MODERATION ENDPOINTS
# ============================================

@ads_bp.route('/admin/legacy/campaigns/<int:campaign_id>/approve', methods=['POST'])
@token_required
@role_required('admin')
def admin_approve_campaign(current_user, campaign_id):
    """Approve a pending campaign"""
    try:
        campaign = AdCampaign.query.get(campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        campaign.status = 'ACTIVE'
        
        # Create review record
        review = AdReview(
            campaign_id=campaign_id,
            admin_id=current_user.id,
            decision='APPROVED',
            notes='Campaign approved by admin'
        )
        
        db.session.add(review)
        db.session.commit()
        
        # Send notification to employer
        from src.services.notification_service import NotificationService
        notif_service = NotificationService()
        employer = User.query.get(campaign.employer_id)
        
        if employer and employer.email:
            notif_service.send_email(
                recipient_email=employer.email,
                subject=f'Your Ad Campaign "{campaign.name}" Has Been Approved!',
                body=f'Your ad campaign has been reviewed and approved. It will now be served to our audience.'
            )
        
        return jsonify({
            'message': 'Campaign approved successfully',
            'campaign_id': campaign_id,
            'status': 'ACTIVE'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/legacy/campaigns/<int:campaign_id>/reject', methods=['POST'])
@token_required
@role_required('admin')
def admin_reject_campaign(current_user, campaign_id):
    """Reject a pending campaign with notes"""
    try:
        campaign = AdCampaign.query.get(campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        data = request.get_json()
        notes = data.get('notes', 'Campaign rejected by admin')
        
        campaign.status = 'REJECTED'
        
        # Create review record
        review = AdReview(
            campaign_id=campaign_id,
            admin_id=current_user.id,
            decision='REJECTED',
            notes=notes
        )
        
        db.session.add(review)
        db.session.commit()
        
        # Send notification to employer
        from src.services.notification_service import NotificationService
        notif_service = NotificationService()
        employer = User.query.get(campaign.employer_id)
        
        if employer and employer.email:
            notif_service.send_email(
                recipient_email=employer.email,
                subject=f'Your Ad Campaign "{campaign.name}" Was Not Approved',
                body=f'Your ad campaign has been reviewed and unfortunately was not approved. Reason: {notes}'
            )
        
        return jsonify({
            'message': 'Campaign rejected successfully',
            'campaign_id': campaign_id,
            'status': 'REJECTED'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================
# EMPLOYER CAMPAIGN ANALYTICS ENDPOINTS
# ============================================

@ads_bp.route('/campaigns/<int:campaign_id>/analytics', methods=['GET'])
@token_required
def campaign_analytics(current_user, campaign_id):
    """Get detailed analytics for a specific campaign"""
    try:
        campaign = AdCampaign.query.get(campaign_id)
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        
        # Verify employer ownership
        if campaign.employer_id != current_user.id and current_user.role != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403
        
        from datetime import timedelta
        
        # Get date range from query params (default 30 days)
        days = request.args.get('days', 30, type=int)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Campaign totals
        analytics = db.session.query(
            func.sum(AdAnalyticsDaily.impressions).label('impressions'),
            func.sum(AdAnalyticsDaily.clicks).label('clicks'),
            func.avg(AdAnalyticsDaily.ctr).label('ctr'),
            func.sum(AdAnalyticsDaily.spend).label('spend'),
            func.sum(AdAnalyticsDaily.reach).label('reach')
        ).filter(
            AdAnalyticsDaily.campaign_id == campaign_id,
            AdAnalyticsDaily.date >= start_date
        ).first()
        
        impressions = int(analytics.impressions or 0)
        clicks = int(analytics.clicks or 0)
        ctr = float(analytics.ctr or 0)
        spend = float(analytics.spend or 0)
        reach = int(analytics.reach or 0)
        
        # Per-creative breakdown
        per_creative = db.session.query(
            AdCreative.id,
            AdCreative.title,
            func.sum(AdAnalyticsDaily.impressions).label('impressions'),
            func.sum(AdAnalyticsDaily.clicks).label('clicks'),
            func.avg(AdAnalyticsDaily.ctr).label('ctr'),
            func.sum(AdAnalyticsDaily.spend).label('spend')
        ).join(AdAnalyticsDaily, AdCreative.id == AdAnalyticsDaily.creative_id).filter(
            AdAnalyticsDaily.campaign_id == campaign_id,
            AdAnalyticsDaily.date >= start_date
        ).group_by(AdCreative.id, AdCreative.title).all()
        
        creatives_breakdown = [
            {
                'id': row.id,
                'title': row.title,
                'impressions': int(row.impressions or 0),
                'clicks': int(row.clicks or 0),
                'ctr': float(row.ctr or 0),
                'spend': float(row.spend or 0)
            }
            for row in per_creative
        ]
        
        # Per-placement breakdown
        per_placement = db.session.query(
            AdPlacement.name,
            AdPlacement.placement_key,
            func.sum(AdAnalyticsDaily.impressions).label('impressions'),
            func.sum(AdAnalyticsDaily.clicks).label('clicks')
        ).join(AdAnalyticsDaily, AdPlacement.id == AdAnalyticsDaily.placement_id).filter(
            AdAnalyticsDaily.campaign_id == campaign_id,
            AdAnalyticsDaily.date >= start_date
        ).group_by(AdPlacement.id, AdPlacement.name, AdPlacement.placement_key).all()
        
        placements_breakdown = [
            {
                'name': row.name,
                'placement_key': row.placement_key,
                'impressions': int(row.impressions or 0),
                'clicks': int(row.clicks or 0)
            }
            for row in per_placement
        ]
        
        # Daily breakdown for chart
        daily_data = db.session.query(
            AdAnalyticsDaily.date,
            AdAnalyticsDaily.impressions,
            AdAnalyticsDaily.clicks
        ).filter(
            AdAnalyticsDaily.campaign_id == campaign_id,
            AdAnalyticsDaily.date >= start_date
        ).order_by(AdAnalyticsDaily.date).all()
        
        daily_breakdown = [
            {
                'date': str(row.date),
                'impressions': int(row.impressions or 0),
                'clicks': int(row.clicks or 0)
            }
            for row in daily_data
        ]
        
        return jsonify({
            'campaign_id': campaign_id,
            'campaign_name': campaign.name,
            'totals': {
                'impressions': impressions,
                'clicks': clicks,
                'ctr': ctr,
                'spend': spend,
                'reach': reach
            },
            'creatives_breakdown': creatives_breakdown,
            'placements_breakdown': placements_breakdown,
            'daily_breakdown': daily_breakdown
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================
# PUBLIC AD SERVING ENDPOINTS (for job seekers)
# ============================================

@ads_bp.route('/public/featured-ads', methods=['GET'])
def get_public_featured_ads():
    """Get active featured ads for public display (no auth required)"""
    try:
        limit = request.args.get('limit', 5, type=int)
        limit = min(limit, 10)  # Cap at 10
        
        now = datetime.utcnow()
        
        # Get ACTIVE campaigns with budget remaining
        active_campaigns = AdCampaign.query.filter(
            AdCampaign.status == 'ACTIVE',
            AdCampaign.start_date <= now,
            or_(
                AdCampaign.end_date >= now,
                AdCampaign.end_date.is_(None)
            ),
            AdCampaign.budget_spent < AdCampaign.budget_total
        ).order_by(
            desc(AdCampaign.created_at)
        ).limit(limit).all()
        
        if not active_campaigns:
            return jsonify({'ads': []}), 200
        
        result = []
        for campaign in active_campaigns:
            # Get creatives for this campaign
            creatives = AdCreative.query.filter_by(
                campaign_id=campaign.id,
                is_active=True
            ).all()
            
            if not creatives:
                continue
            
            # Get employer info
            employer = User.query.get(campaign.employer_id)
            sponsor = _build_sponsor_data(campaign)
            
            campaign_data = {
                'id': campaign.id,
                'name': campaign.name,
                'objective': campaign.objective,
                'budget_total': float(campaign.budget_total),
                'budget_spent': float(campaign.budget_spent),
                'billing_type': campaign.billing_type,
                'start_date': campaign.start_date.isoformat() if campaign.start_date else None,
                'end_date': campaign.end_date.isoformat() if campaign.end_date else None,
                'employer': {
                    'id': employer.id if employer else None,
                    'name': employer.get_full_name() if employer else 'Unknown',
                    'email': employer.email if employer else None
                } if employer else None,
                'sponsor': sponsor,
                'company_name': sponsor['company_name'] or sponsor['display_name'],
                'creatives': [
                    {
                        'id': c.id,
                        'title': c.title,
                        'body_text': c.body_text,
                        'cta_text': c.cta_text,
                        'cta_url': c.cta_url,
                        'image_url': c.image_url,
                        'ad_format': c.ad_format
                    }
                    for c in creatives
                ],
                'status': campaign.status
            }
            result.append(campaign_data)
        
        return jsonify({'ads': result}), 200
        
    except Exception as e:
        print(f"Error serving public ads: {str(e)}")
        return jsonify({'error': str(e), 'ads': []}), 500


@ads_bp.route('/public/ads', methods=['GET'])
def get_public_ads():
    """Get all active ads for public display"""
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)  # Cap at 50
        
        now = datetime.utcnow()
        
        # Get ACTIVE campaigns
        active_campaigns = AdCampaign.query.filter(
            AdCampaign.status == 'ACTIVE',
            AdCampaign.start_date <= now,
            or_(
                AdCampaign.end_date >= now,
                AdCampaign.end_date.is_(None)
            ),
            AdCampaign.budget_spent < AdCampaign.budget_total
        ).limit(limit).all()
        
        result = []
        for campaign in active_campaigns:
            creatives = AdCreative.query.filter_by(
                campaign_id=campaign.id,
                is_active=True
            ).all()
            
            if not creatives:
                continue
            
            employer = User.query.get(campaign.employer_id)
            
            campaign_data = {
                'id': campaign.id,
                'name': campaign.name,
                'creatives': [
                    {
                        'id': c.id,
                        'title': c.title,
                        'body_text': c.body_text,
                        'image_url': c.image_url,
                        'ad_format': c.ad_format,
                        'cta_text': c.cta_text
                    }
                    for c in creatives
                ]
            }
            result.append(campaign_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error serving public ads: {str(e)}")
        return jsonify({'error': str(e)}), 500
