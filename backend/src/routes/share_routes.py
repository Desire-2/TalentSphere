"""
Job Sharing Analytics and Email Service Routes
Handles sharing analytics, email notifications, and share tracking
"""

from flask import Blueprint, request, jsonify
from src.models.user import db, User
from src.routes.auth import token_required, validate_email
from src.models.job import Job, JobShare
from src.models.company import Company
from datetime import datetime, timedelta
from html import escape
import json
import logging
from src.services.email_service import email_service as delivery_email_service

logger = logging.getLogger(__name__)
share_bp = Blueprint('share', __name__)

@share_bp.route('/jobs/<int:job_id>/share', methods=['POST'])
@token_required
def record_job_share(current_user, job_id):
    """Record a job share event"""
    try:
        data = request.get_json(silent=True) or {}
        user_id = current_user.id
        
        # Validate job exists
        job = Job.query.get_or_404(job_id)
        
        # Create share record
        share = JobShare(
            job_id=job_id,
            user_id=user_id,
            platform=data.get('platform', 'unknown'),
            custom_message=data.get('custom_message', ''),
            recipient_count=data.get('recipient_count', 1),
            share_url=data.get('share_url', ''),
            user_agent=data.get('user_agent', ''),
            timestamp=datetime.utcnow()
        )
        
        db.session.add(share)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Share recorded successfully',
            'share_id': share.id
        }), 201
        
    except Exception as e:
        logger.error(f"Error recording job share: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to record share'
        }), 500

@share_bp.route('/jobs/<int:job_id>/share/email', methods=['POST'])
@token_required
def send_job_share_email(current_user, job_id):
    """Send job share via email"""
    try:
        data = request.get_json(silent=True) or {}
        user_id = current_user.id
        
        # Validate required fields
        recipients = data.get('recipients', [])
        if not recipients:
            return jsonify({
                'success': False,
                'message': 'Recipients list is required'
            }), 400
        if len(recipients) > 20:
            return jsonify({
                'success': False,
                'message': 'A maximum of 20 recipients is allowed'
            }), 400
        invalid_recipients = [
            recipient for recipient in recipients
            if not isinstance(recipient, str) or not validate_email(recipient.strip())
        ]
        if invalid_recipients:
            return jsonify({
                'success': False,
                'message': 'One or more recipient email addresses are invalid'
            }), 400
        
        # Validate job exists
        job = Job.query.get_or_404(job_id)
        user = User.query.get(user_id)
        
        # Get company info
        company = None
        if job.company_id:
            company = Company.query.get(job.company_id)
        
        custom_message = (
            data.get('custom_message')
            or data.get('customMessage')
            or ''
        )
        requirement_items = []

        if job.required_skills:
            requirement_items.extend([
                item.strip() for item in str(job.required_skills).replace(';', ',').split(',') if item.strip()
            ])

        if job.education_requirement:
            requirement_items.append(f"Education: {job.education_requirement}")

        if job.years_experience_min and job.years_experience_min > 0:
            requirement_items.append(f"Experience: {job.years_experience_min}+ years")

        requirement_items = list(dict.fromkeys(requirement_items))[:5]
        requirements_section = f"\n**Requirements:**\n- " + "\n- ".join(requirement_items) + "\n" if requirement_items else ""
        
        # Prepare email content
        subject = f"Job Opportunity: {job.title}"
        if company:
            subject += f" at {company.name}"
        
        # Generate job URL
        job_url = f"{request.host_url.rstrip('/')}/jobs/{job.id}"
        apply_url = f"https://jobs.afritechbridge.online/jobs/{job.id}"
        # Create personal message section separately
        personal_message_section = (
            f"\nPersonal message:\n{custom_message}\n" if custom_message else ""
        )
        
        # Email template
        email_body = f"""
Hello!

{user.full_name if user.full_name else user.email} thought you might be interested in this job opportunity:

{job.title}
{f"Company: {company.name}" if company else ""}
{f"Location: {job.location}" if job.location else ""}
{f"Employment type: {job.employment_type.replace('_', ' ').title()}" if job.employment_type else ""}
{f"Salary: ${job.salary_min:,} - ${job.salary_max:,}" if job.salary_min and job.salary_max else ""}
{requirements_section}
{personal_message_section}

Job description:
{job.description[:500]}{"..." if len(job.description) > 500 else ""}

Apply here: {apply_url}

View full job details: {job_url}

---
This job was shared through TalentSphere
"""
        
        # Send emails
        success_count = 0
        failed_recipients = []
        
        for recipient_email in recipients:
            sent = delivery_email_service.send_custom_email(
                recipient_email=recipient_email.strip(),
                recipient_name='',
                subject=subject,
                html_body=escape(email_body).replace('\n', '<br>'),
                text_body=email_body,
            )
            if sent:
                success_count += 1
            else:
                failed_recipients.append(recipient_email)

        if success_count == 0:
            return jsonify({
                'success': False,
                'message': 'Email delivery failed',
                'success_count': 0,
                'failed_count': len(failed_recipients)
            }), 502
        
        # Record the share
        share = JobShare(
            job_id=job_id,
            user_id=user_id,
            platform='direct_email',
            custom_message=custom_message,
            recipient_count=success_count,
            share_url=job_url,
            user_agent=request.headers.get('User-Agent', ''),
            timestamp=datetime.utcnow(),
            extra_data=json.dumps({
                'success_count': success_count,
                'failed_count': len(failed_recipients)
            })
        )
        
        db.session.add(share)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Emails sent successfully to {success_count} recipient(s)',
            'success_count': success_count,
            'failed_count': len(failed_recipients),
            'share_id': share.id
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending job share email: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to send emails'
        }), 500

@share_bp.route('/jobs/<int:job_id>/share/stats', methods=['GET'])
@token_required
def get_job_share_stats(job_id):
    """Get sharing statistics for a specific job"""
    try:
        # Validate job exists
        job = Job.query.get_or_404(job_id)
        
        # Get share statistics
        shares = JobShare.query.filter_by(job_id=job_id).all()
        
        total_shares = sum(share.recipient_count for share in shares)
        platform_stats = {}
        
        for share in shares:
            platform = share.platform
            if platform not in platform_stats:
                platform_stats[platform] = 0
            platform_stats[platform] += share.recipient_count
        
        # Recent shares (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_shares = JobShare.query.filter(
            JobShare.job_id == job_id,
            JobShare.timestamp >= week_ago
        ).all()
        
        recent_total = sum(share.recipient_count for share in recent_shares)
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'total_shares': total_shares,
            'platform_stats': platform_stats,
            'recent_shares_7days': recent_total,
            'share_count': len(shares),
            'last_shared': shares[-1].timestamp.isoformat() if shares else None
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting job share stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get share statistics'
        }), 500

@share_bp.route('/analytics/shares', methods=['GET'])
@token_required
def get_user_share_analytics(current_user):
    """Get user's sharing analytics"""
    try:
        user_id = current_user.id
        
        # Get all user shares
        shares = JobShare.query.filter_by(user_id=user_id).all()
        
        if not shares:
            return jsonify({
                'success': True,
                'total_shares': 0,
                'platform_stats': {},
                'daily_stats': {},
                'recent_shares': [],
                'top_shared_jobs': []
            }), 200
        
        # Calculate statistics
        total_shares = sum(share.recipient_count for share in shares)
        platform_stats = {}
        daily_stats = {}
        job_stats = {}
        
        for share in shares:
            # Platform stats
            platform = share.platform
            if platform not in platform_stats:
                platform_stats[platform] = 0
            platform_stats[platform] += share.recipient_count
            
            # Daily stats
            date_key = share.timestamp.date().isoformat()
            if date_key not in daily_stats:
                daily_stats[date_key] = 0
            daily_stats[date_key] += share.recipient_count
            
            # Job stats
            if share.job_id not in job_stats:
                job_stats[share.job_id] = 0
            job_stats[share.job_id] += share.recipient_count
        
        # Get recent shares with job details
        recent_shares = JobShare.query.filter_by(user_id=user_id)\
            .order_by(JobShare.timestamp.desc())\
            .limit(10)\
            .all()
        
        recent_shares_data = []
        for share in recent_shares:
            job = Job.query.get(share.job_id)
            company = Company.query.get(job.company_id) if job.company_id else None
            
            recent_shares_data.append({
                'id': share.id,
                'job_id': share.job_id,
                'job_title': job.title if job else 'Unknown Job',
                'company_name': company.name if company else job.external_company_name if job else 'Unknown Company',
                'platform': share.platform,
                'recipient_count': share.recipient_count,
                'timestamp': share.timestamp.isoformat(),
                'custom_message': share.custom_message[:100] + '...' if len(share.custom_message) > 100 else share.custom_message
            })
        
        # Get top shared jobs
        top_jobs = []
        for job_id, share_count in sorted(job_stats.items(), key=lambda x: x[1], reverse=True)[:5]:
            job = Job.query.get(job_id)
            company = Company.query.get(job.company_id) if job.company_id else None
            
            top_jobs.append({
                'job_id': job_id,
                'job_title': job.title if job else 'Unknown Job',
                'company_name': company.name if company else job.external_company_name if job else 'Unknown Company',
                'share_count': share_count
            })
        
        return jsonify({
            'success': True,
            'total_shares': total_shares,
            'platform_stats': dict(sorted(platform_stats.items(), key=lambda x: x[1], reverse=True)),
            'daily_stats': daily_stats,
            'recent_shares': recent_shares_data,
            'top_shared_jobs': top_jobs,
            'sharing_streak': calculate_sharing_streak(shares),
            'total_share_events': len(shares)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user share analytics: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get analytics'
        }), 500

def calculate_sharing_streak(shares):
    """Calculate user's current sharing streak (consecutive days with shares)"""
    if not shares:
        return 0
    
    # Group shares by date
    daily_shares = {}
    for share in shares:
        date_key = share.timestamp.date()
        if date_key not in daily_shares:
            daily_shares[date_key] = True
    
    # Calculate streak
    dates = sorted(daily_shares.keys(), reverse=True)
    streak = 0
    today = datetime.utcnow().date()
    
    for i, date in enumerate(dates):
        expected_date = today - timedelta(days=i)
        if date == expected_date:
            streak += 1
        else:
            break
    
    return streak

@share_bp.route('/analytics/shares/export', methods=['GET'])
@token_required
def export_share_data(current_user):
    """Export user's sharing data"""
    try:
        user_id = current_user.id
        
        # Get all user shares with job details
        shares = db.session.query(JobShare, Job, Company)\
            .join(Job, JobShare.job_id == Job.id)\
            .outerjoin(Company, Job.company_id == Company.id)\
            .filter(JobShare.user_id == user_id)\
            .order_by(JobShare.timestamp.desc())\
            .all()
        
        export_data = []
        for share, job, company in shares:
            export_data.append({
                'share_id': share.id,
                'timestamp': share.timestamp.isoformat(),
                'job_title': job.title,
                'company_name': company.name if company else job.external_company_name,
                'platform': share.platform,
                'recipient_count': share.recipient_count,
                'custom_message': share.custom_message,
                'share_url': share.share_url
            })
        
        return jsonify({
            'success': True,
            'export_date': datetime.utcnow().isoformat(),
            'total_records': len(export_data),
            'data': export_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error exporting share data: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to export data'
        }), 500

@share_bp.route('/jobs/trending-shares', methods=['GET'])
def get_trending_shared_jobs():
    """Get most shared jobs (trending)"""
    try:
        # Get jobs with most shares in the last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        trending_query = db.session.query(
            Job.id,
            Job.title,
            Job.location,
            Job.employment_type,
            Job.external_company_name,
            Company.name.label('company_name'),
            db.func.sum(JobShare.recipient_count).label('share_count')
        ).outerjoin(Company, Job.company_id == Company.id)\
         .join(JobShare, Job.id == JobShare.job_id)\
         .filter(JobShare.timestamp >= week_ago)\
         .group_by(Job.id, Job.title, Job.location, Job.employment_type, 
                  Job.external_company_name, Company.name)\
         .order_by(db.func.sum(JobShare.recipient_count).desc())\
         .limit(10)\
         .all()
        
        trending_jobs = []
        for result in trending_query:
            trending_jobs.append({
                'job_id': result.id,
                'title': result.title,
                'company_name': result.company_name or result.external_company_name,
                'location': result.location,
                'employment_type': result.employment_type,
                'share_count': result.share_count
            })
        
        return jsonify({
            'success': True,
            'trending_jobs': trending_jobs,
            'period': '7 days'
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting trending shared jobs: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get trending jobs'
        }), 500
