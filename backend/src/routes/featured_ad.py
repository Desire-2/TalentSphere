from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid
from decimal import Decimal

from src.models.user import db
from src.models.featured_ad import FeaturedAd, FeaturedAdPackage, Payment, Subscription
from src.models.job import Job
from src.models.company import Company
from src.routes.auth import token_required, role_required

featured_ad_bp = Blueprint('featured_ad', __name__)

@featured_ad_bp.route('/public/featured-ads', methods=['GET'])
def get_public_featured_ads():
    """Get active featured ads for public display"""
    try:
        limit = min(request.args.get('limit', 10, type=int), 50)
        
        # Get active featured ads with job and company details
        featured_ads = db.session.query(FeaturedAd).join(Job).join(Company).join(FeaturedAdPackage).filter(
            FeaturedAd.status == 'active',
            FeaturedAd.start_date <= datetime.utcnow(),
            FeaturedAd.end_date >= datetime.utcnow(),
            Job.status == 'published',
            Job.is_active == True
        ).order_by(
            FeaturedAdPackage.priority_level.asc(),
            FeaturedAd.created_at.desc()
        ).limit(limit).all()
        
        ads_list = []
        for ad in featured_ads:
            ad_data = {
                'id': ad.id,
                'type': 'job_promotion',  # Default type for public display
                'title': ad.custom_title or f"{ad.job.title} - {ad.job.company.name}",
                'description': ad.custom_description or ad.job.summary or ad.job.description[:200] + "...",
                'image': ad.custom_image_url or '/api/placeholder/600/300',
                'company': {
                    'name': ad.job.company.name,
                    'logo': ad.job.company.logo_url or '/api/placeholder/80/80',
                    'location': f"{ad.job.city}, {ad.job.state}" if ad.job.city and ad.job.state else 'Remote',
                },
                'job': {
                    'id': ad.job.id,
                    'title': ad.job.title,
                    'employment_type': ad.job.employment_type,
                    'salary_min': ad.job.salary_min,
                    'salary_max': ad.job.salary_max,
                    'salary_currency': ad.job.salary_currency,
                    'location': f"{ad.job.city}, {ad.job.state}" if ad.job.city and ad.job.state else 'Remote',
                    'is_remote': ad.job.is_remote,
                },
                'callToAction': 'Apply Now',
                'link': f'/jobs/{ad.job.id}',
                'status': 'active',
                'priority': ad.package.priority_level if ad.package else 1,
                'stats': {
                    'impressions': ad.impressions or 0,
                    'clicks': ad.clicks or 0,
                    'applications': ad.applications_generated or 0
                }
            }
            
            # Increment impression count
            ad.impressions = (ad.impressions or 0) + 1
            
            ads_list.append(ad_data)
        
        db.session.commit()
        
        return jsonify({
            'featured_ads': ads_list,
            'total': len(ads_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get featured ads', 'details': str(e)}), 500

@featured_ad_bp.route('/featured-ad-packages', methods=['GET'])
def get_featured_ad_packages():
    """Get all available featured ad packages"""
    try:
        packages = FeaturedAdPackage.query.filter_by(is_active=True).order_by(
            FeaturedAdPackage.display_order, FeaturedAdPackage.price
        ).all()
        
        return jsonify({
            'packages': [package.to_dict() for package in packages]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get packages', 'details': str(e)}), 500

@featured_ad_bp.route('/featured-ad-packages', methods=['POST'])
@token_required
@role_required('admin')
def create_featured_ad_package(current_user):
    """Create a new featured ad package (admin only)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'duration_days', 'price']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        package = FeaturedAdPackage(
            name=data['name'],
            description=data.get('description'),
            duration_days=data['duration_days'],
            priority_level=data.get('priority_level', 1),
            includes_homepage=data.get('includes_homepage', False),
            includes_category_top=data.get('includes_category_top', False),
            includes_search_boost=data.get('includes_search_boost', False),
            includes_social_media=data.get('includes_social_media', False),
            includes_newsletter=data.get('includes_newsletter', False),
            price=Decimal(str(data['price'])),
            currency=data.get('currency', 'USD'),
            is_popular=data.get('is_popular', False),
            display_order=data.get('display_order', 0),
            max_jobs_per_purchase=data.get('max_jobs_per_purchase', 1)
        )
        
        db.session.add(package)
        db.session.commit()
        
        return jsonify({
            'message': 'Package created successfully',
            'package': package.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create package', 'details': str(e)}), 500

@featured_ad_bp.route('/featured-ads', methods=['POST'])
@token_required
@role_required('employer', 'admin')
def create_featured_ad(current_user):
    """Create a featured ad for a job"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['job_id', 'package_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify job exists and user has permission
        job = Job.query.get(data['job_id'])
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        if (current_user.role == 'employer' and 
            job.posted_by != current_user.id):
            return jsonify({'error': 'You can only create ads for your own jobs'}), 403
        
        # Verify package exists
        package = FeaturedAdPackage.query.get(data['package_id'])
        if not package or not package.is_active:
            return jsonify({'error': 'Invalid package'}), 400
        
        # Check if job already has an active featured ad
        existing_ad = FeaturedAd.query.filter_by(
            job_id=data['job_id'],
            status='active'
        ).first()
        
        if existing_ad and existing_ad.is_active():
            return jsonify({'error': 'Job already has an active featured ad'}), 409
        
        # Calculate dates
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=package.duration_days)
        
        # Create payment record first
        payment = Payment(
            user_id=current_user.id,
            company_id=job.company_id,
            payment_id=f"PAY_{uuid.uuid4().hex[:8].upper()}",
            amount=package.price,
            currency=package.currency,
            purpose='featured_ad',
            description=f'Featured ad for job: {job.title}',
            billing_name=current_user.get_full_name(),
            billing_email=current_user.email,
            status='pending'  # Will be updated after payment processing
        )
        
        db.session.add(payment)
        db.session.flush()  # Get payment ID
        
        # Create featured ad
        featured_ad = FeaturedAd(
            company_id=job.company_id,
            job_id=data['job_id'],
            package_id=data['package_id'],
            payment_id=payment.id,
            campaign_name=data.get('campaign_name', f"Featured Ad - {job.title}"),
            start_date=start_date,
            end_date=end_date,
            status='pending',  # Will be activated after payment
            custom_title=data.get('custom_title'),
            custom_description=data.get('custom_description'),
            custom_image_url=data.get('custom_image_url'),
            target_locations=data.get('target_locations'),
            target_keywords=data.get('target_keywords')
        )
        
        db.session.add(featured_ad)
        db.session.commit()
        
        return jsonify({
            'message': 'Featured ad created successfully. Complete payment to activate.',
            'featured_ad': featured_ad.to_dict(),
            'payment': payment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create featured ad', 'details': str(e)}), 500

@featured_ad_bp.route('/payments/<int:payment_id>/process', methods=['POST'])
@token_required
def process_payment(current_user, payment_id):
    """Process payment for featured ad"""
    try:
        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        # Check permission
        if payment.user_id != current_user.id:
            return jsonify({'error': 'You can only process your own payments'}), 403
        
        if payment.status != 'pending':
            return jsonify({'error': 'Payment has already been processed'}), 400
        
        data = request.get_json()
        
        # In a real implementation, you would integrate with payment gateways like Stripe, PayPal, etc.
        # For this demo, we'll simulate payment processing
        
        payment_method = data.get('payment_method', 'credit_card')
        gateway = data.get('gateway', 'stripe')
        
        # Simulate payment processing
        if data.get('simulate_success', True):
            # Payment successful
            payment.status = 'completed'
            payment.payment_method = payment_method
            payment.gateway = gateway
            payment.gateway_transaction_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"
            payment.paid_at = datetime.utcnow()
            
            # Activate featured ads associated with this payment
            featured_ads = FeaturedAd.query.filter_by(payment_id=payment.id).all()
            for ad in featured_ads:
                ad.status = 'active'
                # Mark job as featured
                if ad.job:
                    ad.job.is_featured = True
            
            db.session.commit()
            
            return jsonify({
                'message': 'Payment processed successfully',
                'payment': payment.to_dict(),
                'featured_ads_activated': len(featured_ads)
            }), 200
        else:
            # Payment failed
            payment.status = 'failed'
            payment.gateway_response = data.get('error_message', 'Payment failed')
            
            db.session.commit()
            
            return jsonify({
                'error': 'Payment failed',
                'payment': payment.to_dict()
            }), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to process payment', 'details': str(e)}), 500

@featured_ad_bp.route('/featured-ads', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_my_featured_ads(current_user):
    """Get featured ads for current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        
        if current_user.role == 'admin':
            query = FeaturedAd.query
        else:
            # Get ads for user's company
            company_id = None
            if current_user.employer_profile:
                company_id = current_user.employer_profile.company_id
            
            if not company_id:
                return jsonify({'featured_ads': [], 'pagination': {}}), 200
            
            query = FeaturedAd.query.filter_by(company_id=company_id)
        
        if status:
            query = query.filter_by(status=status)
        
        featured_ads = query.order_by(FeaturedAd.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        ad_list = []
        for ad in featured_ads.items:
            ad_data = ad.to_dict(include_performance=True)
            ad_data['job'] = ad.job.to_dict() if ad.job else None
            ad_data['package'] = ad.package.to_dict() if ad.package else None
            ad_data['payment'] = ad.payment.to_dict() if ad.payment else None
            ad_list.append(ad_data)
        
        return jsonify({
            'featured_ads': ad_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': featured_ads.total,
                'pages': featured_ads.pages,
                'has_next': featured_ads.has_next,
                'has_prev': featured_ads.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get featured ads', 'details': str(e)}), 500

@featured_ad_bp.route('/featured-ads/<int:ad_id>/analytics', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_featured_ad_analytics(current_user, ad_id):
    """Get analytics for a featured ad"""
    try:
        featured_ad = FeaturedAd.query.get(ad_id)
        if not featured_ad:
            return jsonify({'error': 'Featured ad not found'}), 404
        
        # Check permission
        if (current_user.role == 'employer' and 
            featured_ad.company_id != current_user.employer_profile.company_id):
            return jsonify({'error': 'Access denied'}), 403
        
        # Get detailed analytics
        analytics = {
            'ad_info': featured_ad.to_dict(include_performance=True),
            'performance_metrics': {
                'impressions': featured_ad.impressions,
                'clicks': featured_ad.clicks,
                'applications_generated': featured_ad.applications_generated,
                'ctr': featured_ad.get_ctr(),
                'conversion_rate': featured_ad.get_conversion_rate(),
                'cost_per_click': float(featured_ad.payment.amount) / max(featured_ad.clicks, 1),
                'cost_per_application': float(featured_ad.payment.amount) / max(featured_ad.applications_generated, 1)
            },
            'time_metrics': {
                'days_active': (datetime.utcnow() - featured_ad.start_date).days,
                'days_remaining': featured_ad.days_remaining(),
                'is_active': featured_ad.is_active(),
                'is_expired': featured_ad.is_expired()
            }
        }
        
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get analytics', 'details': str(e)}), 500

@featured_ad_bp.route('/subscriptions', methods=['GET'])
@token_required
@role_required('employer', 'admin')
def get_subscriptions(current_user):
    """Get subscription plans"""
    try:
        # In a real implementation, you would have predefined subscription plans
        # For this demo, we'll return sample plans
        
        plans = [
            {
                'id': 'basic',
                'name': 'Basic Plan',
                'price': 29.99,
                'currency': 'USD',
                'billing_period': 'monthly',
                'features': {
                    'job_posts': 5,
                    'featured_ads': 1,
                    'applications': 100,
                    'analytics': True,
                    'support': 'email'
                }
            },
            {
                'id': 'professional',
                'name': 'Professional Plan',
                'price': 79.99,
                'currency': 'USD',
                'billing_period': 'monthly',
                'features': {
                    'job_posts': 20,
                    'featured_ads': 5,
                    'applications': 500,
                    'analytics': True,
                    'support': 'priority'
                }
            },
            {
                'id': 'enterprise',
                'name': 'Enterprise Plan',
                'price': 199.99,
                'currency': 'USD',
                'billing_period': 'monthly',
                'features': {
                    'job_posts': -1,  # unlimited
                    'featured_ads': 20,
                    'applications': -1,  # unlimited
                    'analytics': True,
                    'support': 'dedicated'
                }
            }
        ]
        
        # Get current subscription if exists
        current_subscription = None
        if current_user.employer_profile and current_user.employer_profile.company_id:
            current_subscription = Subscription.query.filter_by(
                company_id=current_user.employer_profile.company_id,
                status='active'
            ).first()
        
        return jsonify({
            'plans': plans,
            'current_subscription': current_subscription.to_dict() if current_subscription else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get subscriptions', 'details': str(e)}), 500

@featured_ad_bp.route('/payments', methods=['GET'])
@token_required
def get_my_payments(current_user):
    """Get payment history for current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')
        
        query = Payment.query.filter_by(user_id=current_user.id)
        
        if status:
            query = query.filter_by(status=status)
        
        payments = query.order_by(Payment.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'payments': [payment.to_dict() for payment in payments.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': payments.total,
                'pages': payments.pages,
                'has_next': payments.has_next,
                'has_prev': payments.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get payments', 'details': str(e)}), 500

@featured_ad_bp.route('/featured-ads/<int:ad_id>/pause', methods=['POST'])
@token_required
@role_required('employer', 'admin')
def pause_featured_ad(current_user, ad_id):
    """Pause a featured ad"""
    try:
        featured_ad = FeaturedAd.query.get(ad_id)
        if not featured_ad:
            return jsonify({'error': 'Featured ad not found'}), 404
        
        # Check permission
        if (current_user.role == 'employer' and 
            featured_ad.company_id != current_user.employer_profile.company_id):
            return jsonify({'error': 'Access denied'}), 403
        
        if featured_ad.status != 'active':
            return jsonify({'error': 'Only active ads can be paused'}), 400
        
        featured_ad.status = 'paused'
        
        # Remove featured status from job
        if featured_ad.job:
            featured_ad.job.is_featured = False
        
        db.session.commit()
        
        return jsonify({
            'message': 'Featured ad paused successfully',
            'featured_ad': featured_ad.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to pause featured ad', 'details': str(e)}), 500

@featured_ad_bp.route('/featured-ads/<int:ad_id>/resume', methods=['POST'])
@token_required
@role_required('employer', 'admin')
def resume_featured_ad(current_user, ad_id):
    """Resume a paused featured ad"""
    try:
        featured_ad = FeaturedAd.query.get(ad_id)
        if not featured_ad:
            return jsonify({'error': 'Featured ad not found'}), 404
        
        # Check permission
        if (current_user.role == 'employer' and 
            featured_ad.company_id != current_user.employer_profile.company_id):
            return jsonify({'error': 'Access denied'}), 403
        
        if featured_ad.status != 'paused':
            return jsonify({'error': 'Only paused ads can be resumed'}), 400
        
        if featured_ad.is_expired():
            return jsonify({'error': 'Cannot resume expired ad'}), 400
        
        featured_ad.status = 'active'
        
        # Add featured status back to job
        if featured_ad.job:
            featured_ad.job.is_featured = True
        
        db.session.commit()
        
        return jsonify({
            'message': 'Featured ad resumed successfully',
            'featured_ad': featured_ad.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to resume featured ad', 'details': str(e)}), 500

# Error handlers
@featured_ad_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@featured_ad_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

@featured_ad_bp.errorhandler(403)
def forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403

@featured_ad_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@featured_ad_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

