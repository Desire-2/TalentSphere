"""
Ad Analytics Aggregation
Nightly job to aggregate impressions and clicks into daily analytics
"""

from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import and_, func
from src.models.user import db
from src.models.ads import (
    AdImpression, AdClick, AdAnalyticsDaily, 
    AdCampaign, AdCreative, AdPlacement
)

def aggregate_ad_analytics(date=None):
    """
    Aggregate ad impressions and clicks for a specific date.
    
    Args:
        date: datetime object or None for yesterday
        
    Aggregates:
    - Impressions and clicks per (campaign_id, creative_id, placement_id, date)
    - Computes CTR, spend, CPM, CPC
    - Upserts into AdAnalyticsDaily
    """
    try:
        # If no date specified, use yesterday
        if date is None:
            date = datetime.utcnow().date() - timedelta(days=1)
        elif hasattr(date, 'date'):
            date = date.date()
        
        # Define date range (entire day)
        start_of_day = datetime.combine(date, datetime.min.time())
        end_of_day = datetime.combine(date, datetime.max.time())
        
        print(f"🔄 Aggregating ad analytics for {date}...")
        
        # Get all unique (campaign, creative, placement) combinations for this date
        combinations = db.session.query(
            AdImpression.campaign_id,
            AdImpression.creative_id,
            AdImpression.placement_id
        ).filter(
            AdImpression.viewed_at >= start_of_day,
            AdImpression.viewed_at <= end_of_day
        ).distinct().all()
        
        stats_count = 0
        
        for campaign_id, creative_id, placement_id in combinations:
            # Count impressions
            impression_count = AdImpression.query.filter(
                and_(
                    AdImpression.campaign_id == campaign_id,
                    AdImpression.creative_id == creative_id,
                    AdImpression.placement_id == placement_id,
                    AdImpression.viewed_at >= start_of_day,
                    AdImpression.viewed_at <= end_of_day
                )
            ).count()
            
            # Count clicks
            click_count = AdClick.query.filter(
                and_(
                    AdClick.campaign_id == campaign_id,
                    AdClick.creative_id == creative_id,
                    AdClick.placement_id == placement_id,
                    AdClick.clicked_at >= start_of_day,
                    AdClick.clicked_at <= end_of_day
                )
            ).count()
            
            if impression_count == 0 and click_count == 0:
                continue
            
            # Get campaign to access billing info
            campaign = AdCampaign.query.get(campaign_id)
            if not campaign:
                continue
            
            # Calculate metrics
            ctr = 0
            if impression_count > 0:
                ctr = round((click_count / impression_count) * 100, 2)
            
            # Calculate spend based on billing model
            spend = Decimal('0')
            if campaign.billing_type == 'CPM':
                # Cost per 1000 impressions
                spend = Decimal(str(impression_count)) * campaign.bid_amount / Decimal('1000')
            elif campaign.billing_type == 'CPC':
                # Cost per click
                spend = Decimal(str(click_count)) * campaign.bid_amount
            elif campaign.billing_type == 'FLAT_RATE':
                # Flat daily rate
                spend = campaign.bid_amount
            
            # Calculate CPM (cost per 1000 impressions)
            avg_cpm = Decimal('0')
            if impression_count > 0:
                avg_cpm = (spend * Decimal('1000')) / Decimal(str(impression_count))
            
            # Calculate CPC (cost per click)
            avg_cpc = Decimal('0')
            if click_count > 0:
                avg_cpc = spend / Decimal(str(click_count))
            
            # Check if record exists
            existing = AdAnalyticsDaily.query.filter(
                and_(
                    AdAnalyticsDaily.campaign_id == campaign_id,
                    AdAnalyticsDaily.creative_id == creative_id,
                    AdAnalyticsDaily.placement_id == placement_id,
                    AdAnalyticsDaily.date == date
                )
            ).first()
            
            if existing:
                # Update existing record
                existing.impressions = impression_count
                existing.clicks = click_count
                existing.ctr = ctr
                existing.spend = spend
                existing.avg_cpm = avg_cpm
                existing.avg_cpc = avg_cpc
                existing.aggregated_at = datetime.utcnow()
            else:
                # Create new record
                daily_stats = AdAnalyticsDaily(
                    campaign_id=campaign_id,
                    creative_id=creative_id,
                    placement_id=placement_id,
                    date=date,
                    impressions=impression_count,
                    clicks=click_count,
                    ctr=ctr,
                    spend=spend,
                    avg_cpm=avg_cpm,
                    avg_cpc=avg_cpc,
                    aggregated_at=datetime.utcnow()
                )
                db.session.add(daily_stats)
            
            stats_count += 1
        
        # Commit changes
        db.session.commit()
        print(f"✓ Aggregated {stats_count} campaign-creative-placement combinations for {date}")
        return {
            'success': True,
            'date': date.isoformat(),
            'records_aggregated': stats_count
        }
        
    except Exception as e:
        db.session.rollback()
        print(f"✗ Error aggregating analytics: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def get_platform_analytics_summary(days=30):
    """
    Get platform-wide analytics summary for last N days.
    
    Returns:
    - Total impressions, clicks, CTR
    - Total ad spend
    - Active campaigns count
    - Daily breakdown
    """
    try:
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        # Get daily stats
        daily_stats = AdAnalyticsDaily.query.filter(
            db.and_(
                AdAnalyticsDaily.date >= start_date,
                AdAnalyticsDaily.date <= end_date
            )
        ).all()
        
        # Aggregate
        total_impressions = sum(s.impressions for s in daily_stats)
        total_clicks = sum(s.clicks for s in daily_stats)
        total_spend = sum(float(s.spend or 0) for s in daily_stats)
        
        platform_ctr = 0
        if total_impressions > 0:
            platform_ctr = round((total_clicks / total_impressions) * 100, 2)
        
        # Active campaigns
        active_campaigns = AdCampaign.query.filter_by(status='ACTIVE').count()
        
        # Daily breakdown (group by date)
        by_date = {}
        for stat in daily_stats:
            if stat.date not in by_date:
                by_date[stat.date] = {'impressions': 0, 'clicks': 0}
            by_date[stat.date]['impressions'] += stat.impressions
            by_date[stat.date]['clicks'] += stat.clicks
        
        return {
            'total_impressions': total_impressions,
            'total_clicks': total_clicks,
            'platform_ctr': platform_ctr,
            'total_spend': total_spend,
            'active_campaigns': active_campaigns,
            'daily_breakdown': by_date
        }
    except Exception as e:
        print(f"Error getting platform analytics: {e}")
        return {
            'total_impressions': 0,
            'total_clicks': 0,
            'platform_ctr': 0,
            'total_spend': 0,
            'active_campaigns': 0,
            'daily_breakdown': {}
        }


def get_campaign_analytics(campaign_id):
    """
    Get detailed analytics for a specific campaign.
    
    Returns per-creative and per-placement breakdowns.
    """
    try:
        # Get campaign
        campaign = AdCampaign.query.get(campaign_id)
        if not campaign:
            return None
        
        # Get analytics for this campaign
        analytics = AdAnalyticsDaily.query.filter_by(campaign_id=campaign_id).all()
        
        # Aggregate
        total_impressions = sum(a.impressions for a in analytics)
        total_clicks = sum(a.clicks for a in analytics)
        total_spend = sum(float(a.spend or 0) for a in analytics)
        
        campaign_ctr = 0
        if total_impressions > 0:
            campaign_ctr = round((total_clicks / total_impressions) * 100, 2)
        
        # Per-creative breakdown
        creative_stats = {}
        for stat in analytics:
            if stat.creative_id not in creative_stats:
                creative_stats[stat.creative_id] = {
                    'impressions': 0,
                    'clicks': 0,
                    'spend': Decimal('0'),
                    'creative': None
                }
            creative_stats[stat.creative_id]['impressions'] += stat.impressions
            creative_stats[stat.creative_id]['clicks'] += stat.clicks
            creative_stats[stat.creative_id]['spend'] += stat.spend or Decimal('0')
            if creative_stats[stat.creative_id]['creative'] is None:
                creative_stats[stat.creative_id]['creative'] = AdCreative.query.get(stat.creative_id)
        
        # Per-placement breakdown
        placement_stats = {}
        for stat in analytics:
            if stat.placement_id not in placement_stats:
                placement_stats[stat.placement_id] = {
                    'impressions': 0,
                    'clicks': 0,
                    'spend': Decimal('0'),
                    'placement': None
                }
            placement_stats[stat.placement_id]['impressions'] += stat.impressions
            placement_stats[stat.placement_id]['clicks'] += stat.clicks
            placement_stats[stat.placement_id]['spend'] += stat.spend or Decimal('0')
            if placement_stats[stat.placement_id]['placement'] is None:
                placement_stats[stat.placement_id]['placement'] = AdPlacement.query.get(stat.placement_id)
        
        # Daily breakdown
        by_date = {}
        for stat in analytics:
            if stat.date not in by_date:
                by_date[stat.date] = {'impressions': 0, 'clicks': 0}
            by_date[stat.date]['impressions'] += stat.impressions
            by_date[stat.date]['clicks'] += stat.clicks
        
        return {
            'campaign': campaign.to_dict(),
            'total_impressions': total_impressions,
            'total_clicks': total_clicks,
            'ctr': campaign_ctr,
            'total_spend': total_spend,
            'creative_breakdown': creative_stats,
            'placement_breakdown': placement_stats,
            'daily_breakdown': by_date
        }
    except Exception as e:
        print(f"Error getting campaign analytics: {e}")
        return None
