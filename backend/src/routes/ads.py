"""
Custom Advertising System Routes (PHASE 2)
Comprehensive Flask Blueprint for ad campaigns, serving, and moderation
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta, date
from decimal import Decimal
from functools import wraps
import hashlib
import json
import os
from sqlalchemy import and_, or_, desc, func
from sqlalchemy.orm import joinedload

from src.models.user import db, User
from src.models.ads import (
    AdCampaign, AdCreative, AdPlacement, AdCampaignPlacement,
    AdImpression, AdClick, AdAnalyticsDaily, AdCredit, AdReview
)
from src.routes.auth import token_required, role_required

ads_bp = Blueprint('ads', __name__)

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


def check_campaign_ownership(employer_id, campaign_id):
    """Verify employer owns campaign"""
    campaign = AdCampaign.query.filter_by(
        id=campaign_id,
        employer_id=employer_id
    ).first()
    if not campaign:
        return None
    return campaign


# ========================
# EMPLOYER ROUTES
# ========================

@ads_bp.route('/campaigns', methods=['POST'])
@token_required
@role_required('employer')
def create_campaign(current_user):
    """Create a new campaign in DRAFT status"""
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['name', 'objective', 'budget_total', 'billing_type', 'bid_amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate objective enum
        valid_objectives = ['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS']
        if data['objective'] not in valid_objectives:
            return jsonify({'error': 'Invalid objective'}), 400
        
        # Validate billing_type enum
        valid_billing = ['CPM', 'CPC', 'FLAT_RATE']
        if data['billing_type'] not in valid_billing:
            return jsonify({'error': 'Invalid billing_type'}), 400
        
        # Parse dates
        start_date = None
        end_date = None
        try:
            if data.get('start_date'):
                start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            if data.get('end_date'):
                end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        except:
            return jsonify({'error': 'Invalid date format'}), 400
        
        # Create campaign
        campaign = AdCampaign(
            employer_id=current_user.id,
            name=data['name'],
            objective=data['objective'],
            status='DRAFT',
            budget_total=safe_decimal(data['budget_total']),
            budget_spent=Decimal('0'),
            billing_type=data['billing_type'],
            bid_amount=safe_decimal(data['bid_amount']),
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
        
        campaigns = AdCampaign.query.filter_by(employer_id=current_user.id).all()
        
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
            campaign_data.update({
                'impressions': total_impressions,
                'clicks': total_clicks,
                'ctr': ctr,
                'spend': float(campaign.budget_spent)
            })
            campaigns_list.append(campaign_data)
        
        return jsonify({
            'campaigns': campaigns_list,
            'total': len(campaigns_list)
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
        placements = campaign.placements.all()
        campaign_data['placements'] = [p.to_dict() for p in placements]
        
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
        
        # Only DRAFT or PAUSED can be edited
        if campaign.status not in ('DRAFT', 'PAUSED'):
            return jsonify({'error': f'Cannot edit {campaign.status} campaigns'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            campaign.name = data['name']
        if 'objective' in data:
            if data['objective'] in ['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS']:
                campaign.objective = data['objective']
        
        # Budget can only increase, not decrease
        if 'budget_total' in data:
            new_budget = safe_decimal(data['budget_total'])
            if new_budget < campaign.budget_spent:
                return jsonify({'error': 'Cannot reduce budget below spent amount'}), 400
            campaign.budget_total = new_budget
        
        # Update dates
        if 'start_date' in data and data['start_date']:
            campaign.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        if 'end_date' in data and data['end_date']:
            campaign.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        
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
        if campaign.status != 'DRAFT':
            return jsonify({'error': f'Campaign must be DRAFT, not {campaign.status}'}), 400
        
        # At least 1 active creative
        try:
            active_creatives = campaign.creatives.filter_by(is_active=True).count()
            print(f"DEBUG: Campaign {campaign_id} has {active_creatives} active creatives")
        except Exception as e:
            print(f"ERROR checking creatives: {e}")
            return jsonify({'error': f'Error checking creatives: {str(e)}'}), 500
            
        if active_creatives == 0:
            return jsonify({'error': 'Campaign must have at least 1 active creative'}), 400
        
        # Valid dates
        if not campaign.start_date or not campaign.end_date:
            return jsonify({'error': 'Campaign must have start and end dates'}), 400
        
        if campaign.start_date >= campaign.end_date:
            return jsonify({'error': 'Start date must be before end date'}), 400
        
        # TODO: Check employer has sufficient credits
        # For now, assume sufficient
        
        campaign.status = 'PENDING_REVIEW'
        
        # Create review record in PENDING status
        try:
            review = AdReview(
                campaign_id=campaign.id,
                decision='PENDING'  # Initial status
            )
            db.session.add(review)
            db.session.commit()
            print(f"DEBUG: Campaign {campaign_id} submitted for review with review id {review.id}")
        except Exception as e:
            db.session.rollback()
            print(f"ERROR creating review: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error submitting for review: {str(e)}'}), 500
        
        return jsonify({
            'message': 'Campaign submitted for review',
            'campaign': campaign.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"ERROR in submit_campaign_for_review: {e}")
        import traceback
        traceback.print_exc()
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
        
        # Get JSON data
        data = request.get_json() or {}
        
        # Validate required fields
        required_fields = ['title', 'body_text', 'cta_text', 'cta_url', 'ad_format']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate ad_format
        valid_formats = ['BANNER_HORIZONTAL', 'BANNER_VERTICAL', 'CARD', 'INLINE_FEED', 'SPONSORED_JOB', 'SPOTLIGHT']
        if data['ad_format'] not in valid_formats:
            return jsonify({'error': 'Invalid ad_format'}), 400
        
        # Handle image upload if present
        image_url = data.get('image_url')
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file:
                # Validate file
                allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
                if not image_file.filename or image_file.filename.split('.')[-1].lower() not in allowed_extensions:
                    return jsonify({'error': 'Only jpg, png, webp allowed'}), 400
                
                # Check file size (2MB max)
                image_file.seek(0, 2)  # Seek to end
                file_size = image_file.tell()
                image_file.seek(0)  # Reset
                if file_size > 2 * 1024 * 1024:
                    return jsonify({'error': 'Image must be < 2MB'}), 400
                
                # Save file (in production, use object storage like S3)
                os.makedirs('static/ad_creatives', exist_ok=True)
                filename = f"creative_{campaign_id}_{datetime.utcnow().timestamp()}.{image_file.filename.split('.')[-1]}"
                filepath = os.path.join('static/ad_creatives', filename)
                image_file.save(filepath)
                image_url = f'/static/ad_creatives/{filename}'
        
        # Create creative
        creative = AdCreative(
            campaign_id=campaign_id,
            title=data['title'][:80],
            body_text=data['body_text'][:200],
            cta_text=data.get('cta_text', 'Learn More')[:30],
            cta_url=data['cta_url'],
            image_url=image_url,
            ad_format=data['ad_format'],
            is_active=data.get('is_active', True)
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
        
        data = request.get_json()
        
        if 'title' in data:
            creative.title = data['title'][:80]
        if 'body_text' in data:
            creative.body_text = data['body_text'][:200]
        if 'cta_text' in data:
            creative.cta_text = data['cta_text'][:30]
        if 'cta_url' in data:
            creative.cta_url = data['cta_url']
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
        
        data = request.get_json()
        
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
        context = request.args.get('context')
        limit = request.args.get('limit', 2, type=int)
        
        # Validate inputs
        if not placement_key:
            return jsonify({'error': 'placement is required'}), 400
        
        limit = min(limit, 10)  # Cap at 10
        
        # Get placement
        placement = AdPlacement.query.filter_by(placement_key=placement_key).first()
        if not placement or not placement.is_active:
            return jsonify({'ads': []}), 200
        
        # Get current time for active campaign check
        now = datetime.utcnow()
        
        # Query active campaigns with budget remaining
        active_campaigns = AdCampaign.query.filter(
            AdCampaign.status == 'ACTIVE',
            AdCampaign.start_date <= now,
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
        for campaign in active_campaigns:
            creatives = campaign.creatives.filter_by(is_active=True).all()
            for creative in creatives:
                # Check if format is allowed
                allowed_formats = placement.get_allowed_formats()
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
                'tracking': {
                    'impression_url': f'/ads/impression?c={campaign.id}&cr={creative.id}&p={placement.id}',
                    'click_url': f'/ads/click?c={campaign.id}&cr={creative.id}&p={placement.id}'
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
        data = request.get_json()
        
        # Extract fields
        campaign_id = data.get('campaign_id')
        creative_id = data.get('creative_id')
        placement_id = data.get('placement_id')
        session_id = data.get('session_id')
        
        if not all([campaign_id, creative_id, placement_id]):
            return '', 400
        
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
            placement_id=placement_id,
            viewer_user_id=viewer_user_id,
            ip_hash=get_ip_hash(request),
            session_id=session_id,
            viewed_at=datetime.utcnow()
        )
        
        db.session.add(impression)
        
        # Update campaign spend if CPM billing
        campaign = AdCampaign.query.get(campaign_id)
        if campaign and campaign.billing_type == 'CPM':
            # CPM charges per 1000 impressions
            campaign.budget_spent += (campaign.bid_amount / Decimal('1000'))
        
        db.session.commit()
        
        return '', 204
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Impression recording error: {str(e)}")
        return '', 204


@ads_bp.route('/click', methods=['POST'])
def record_click():
    """Record a click and redirect to destination"""
    try:
        data = request.get_json()
        
        # Extract fields
        campaign_id = data.get('campaign_id')
        creative_id = data.get('creative_id')
        placement_id = data.get('placement_id')
        session_id = data.get('session_id')
        
        if not all([campaign_id, creative_id, placement_id]):
            return jsonify({'error': 'Missing fields'}), 400
        
        # Get viewer user_id if logged in
        viewer_user_id = None
        
        # Create click record
        click = AdClick(
            campaign_id=campaign_id,
            creative_id=creative_id,
            placement_id=placement_id,
            clicker_user_id=viewer_user_id,
            ip_hash=get_ip_hash(request),
            session_id=session_id,
            clicked_at=datetime.utcnow()
        )
        
        db.session.add(click)
        
        # Update campaign spend if CPC billing
        campaign = AdCampaign.query.get(campaign_id)
        if campaign and campaign.billing_type == 'CPC':
            # CPC charges per click
            campaign.budget_spent += campaign.bid_amount
        
        # Get creative to get CTA URL
        creative = AdCreative.query.get(creative_id)
        cta_url = creative.cta_url if creative else None
        
        db.session.commit()
        
        return jsonify({
            'redirect_url': cta_url
        }), 200
        
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
        from sqlalchemy import func
        
        # Get filter parameter (all, pending, approved, rejected)
        filter_status = request.args.get('status', 'all')
        
        # Get all campaigns with their reviews (only joinedload employer, not creatives since it's dynamic)
        query = AdCampaign.query.options(
            joinedload(AdCampaign.employer)
        )
        
        campaigns = query.all()
        
        # Get all reviews mapping
        all_reviews = AdReview.query.all()
        review_map = {r.campaign_id: r for r in all_reviews}
        
        campaigns_data = []
        stats = {'total': 0, 'pending': 0, 'approved': 0, 'rejected': 0}
        
        for campaign in campaigns:
            review = review_map.get(campaign.id)
            review_status = review.decision if review else 'NO_REVIEW'
            
            # Apply filter
            if filter_status != 'all' and review_status.lower() != filter_status.lower():
                continue
            
            # Count stats
            if review_status == 'PENDING':
                stats['pending'] += 1
            elif review_status == 'APPROVED':
                stats['approved'] += 1
            elif review_status == 'REJECTED':
                stats['rejected'] += 1
            stats['total'] += 1
            
            creatives = campaign.creatives.all()
            
            # Determine action buttons based on review status
            can_approve = review_status in ['PENDING', 'REJECTED']
            can_reject = review_status in ['PENDING', 'APPROVED']
            can_reset = review_status in ['APPROVED', 'REJECTED']
            
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
            'count': stats['total'],
            'stats': stats,
            'filter': filter_status
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
        
        if campaign.status != 'PENDING_REVIEW':
            return jsonify({'error': 'Only pending campaigns can be approved'}), 400
        
        # Update campaign and review
        campaign.status = 'ACTIVE'
        campaign.start_date = datetime.utcnow()  # Start now if not already started
        
        # Ensure all creatives are marked as active
        creatives = AdCreative.query.filter_by(campaign_id=campaign_id).all()
        for creative in creatives:
            creative.is_active = True
        
        review = AdReview.query.filter_by(campaign_id=campaign_id).first()
        if review:
            review.decision = 'APPROVED'
            review.reviewer_id = current_user.id
            review.reviewed_at = datetime.utcnow()
        
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
        
        if campaign.status != 'PENDING_REVIEW':
            return jsonify({'error': 'Only pending campaigns can be rejected'}), 400
        
        data = request.get_json()
        notes = data.get('notes', 'No reason provided')
        
        # Update campaign and review
        campaign.status = 'REJECTED'
        
        review = AdReview.query.filter_by(campaign_id=campaign_id).first()
        if review:
            review.decision = 'REJECTED'
            review.reviewer_id = current_user.id
            review.reviewed_at = datetime.utcnow()
            review.notes = notes
        
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
        
        if campaign.status not in ['REJECTED', 'ACTIVE']:
            return jsonify({'error': 'Can only reset REJECTED or ACTIVE campaigns'}), 400
        
        # Reset campaign to PENDING_REVIEW
        campaign.status = 'PENDING_REVIEW'
        
        # Reset review to PENDING
        review = AdReview.query.filter_by(campaign_id=campaign_id).first()
        if review:
            review.decision = 'PENDING'
            review.reviewer_id = None
            review.reviewed_at = None
            review.notes = None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Campaign review reset to PENDING',
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
        employer_id = request.args.get('employer_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = AdCampaign.query
        
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
        
        campaigns = query.all()
        
        return jsonify({
            'campaigns': [c.to_dict() for c in campaigns],
            'total': len(campaigns)
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
            AdCredit.transaction_type == 'PER_HOUR' or AdCredit.transaction_type == 'BULK_PURCHASE'
        ).scalar() or Decimal('0')
        
        total_spent = db.session.query(func.sum(AdAnalyticsDaily.spend)).scalar() or Decimal('0')
        
        platform_revenue = total_spent * Decimal('0.2')  # 20% platform cut
        
        return jsonify({
            'total_impressions': total_impressions,
            'total_clicks': total_clicks,
            'platform_ctr': platform_ctr,
            'total_spend': float(total_spent),
            'active_campaigns': active_campaigns,
            'daily_breakdown': daily_breakdown,
            'top_campaigns': top_campaigns,
            'total_purchased': float(total_purchased),
            'total_spent': float(total_spent),
            'platform_revenue': float(platform_revenue)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ads_bp.route('/admin/campaigns', methods=['GET'])
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


@ads_bp.route('/admin/placements', methods=['GET'])
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


@ads_bp.route('/admin/placements/<int:placement_id>', methods=['PUT'])
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

@ads_bp.route('/admin/campaigns/<int:campaign_id>/approve', methods=['POST'])
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


@ads_bp.route('/admin/campaigns/<int:campaign_id>/reject', methods=['POST'])
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
