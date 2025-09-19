"""
Job Sharing Analytics and Email Service Routes
Handles sharing analytics, email notifications, and share tracking
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db, User
from src.models.job import Job, JobShare
from src.models.company import Company
from datetime import datetime, timedelta
import json
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

logger = logging.getLogger(__name__)
share_bp = Blueprint('share', __name__)

class EmailService:
    """Simple email service for job sharing"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'localhost')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@talentsphere.com')
    
    def send_email(self, to_email, subject, html_content, text_content=None):
        """Send an email"""
        try:
            # For now, just simulate sending email
            logger.info(f"Email simulated: {to_email} - {subject}")
            return True
        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            raise e

email_service = EmailService()

@share_bp.route('/jobs/<int:job_id>/share', methods=['POST'])
@jwt_required()
def record_job_share(job_id):
    """Record a job share event"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
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
@jwt_required()
def send_job_share_email(job_id):
    """Send job share via email"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        recipients = data.get('recipients', [])
        if not recipients:
            return jsonify({
                'success': False,
                'message': 'Recipients list is required'
            }), 400
        
        # Validate job exists
        job = Job.query.get_or_404(job_id)
        user = User.query.get(user_id)
        
        # Get company info
        company = None
        if job.company_id:
            company = Company.query.get(job.company_id)
        
        custom_message = data.get('custom_message', '')
        
        # Prepare email content
        subject = f"Job Opportunity: {job.title}"
        if company:
            subject += f" at {company.name}"
        
        # Generate job URL
        job_url = f"{request.host_url.rstrip('/')}/jobs/{job.id}"
        
        # Email template
        email_body = f"""
Hello!

{user.full_name if user.full_name else user.email} thought you might be interested in this job opportunity:

**{job.title}**
{f"Company: {company.name}" if company else ""}
{f"Location: {job.location}" if job.location else ""}
{f"Employment Type: {job.employment_type.replace('_', ' ').title()}" if job.employment_type else ""}
{f"Salary: ${job.salary_min:,} - ${job.salary_max:,}" if job.salary_min and job.salary_max else ""}

**Job Description:**
{job.description[:500]}{"..." if len(job.description) > 500 else ""}

{personal_message_section}

**View Full Job Details:** {job_url}

---
This job was shared through TalentSphere
"""

        # Create personal message section separately to avoid f-string backslash issue
        personal_message_section = f"**Personal Message:**\n{custom_message}\n" if custom_message else ""
        
        # Format the final message
        message = message.format(
            personal_message_section=personal_message_section
        )
        
        # Send emails
        success_count = 0
        failed_recipients = []
        
        for recipient_email in recipients:
            try:
                email_service.send_email(
                    to_email=recipient_email,
                    subject=subject,
                    html_content=email_body.replace('\n', '<br>'),
                    text_content=email_body
                )
                success_count += 1
            except Exception as e:
                logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
                failed_recipients.append(recipient_email)
        
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
                'recipients': recipients,
                'failed_recipients': failed_recipients,
                'success_count': success_count
            })
        )
        
        db.session.add(share)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Emails sent successfully to {success_count} recipient(s)',
            'success_count': success_count,
            'failed_count': len(failed_recipients),
            'failed_recipients': failed_recipients,
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
@jwt_required()
def get_user_share_analytics():
    """Get user's sharing analytics"""
    try:
        user_id = get_jwt_identity()
        
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
@jwt_required()
def export_share_data():
    """Export user's sharing data"""
    try:
        user_id = get_jwt_identity()
        
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
