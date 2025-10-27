"""
Script to update external jobs with location data
This script adds location information to jobs that don't have it
"""
from src.main import app
from src.models.job import Job, db
from datetime import datetime

def update_job_locations():
    """Update jobs without location data"""
    
    with app.app_context():
        # Get all on-site jobs without location data
        jobs_without_location = Job.query.filter(
            Job.location_type == 'on-site',
            Job.city.is_(None),
            Job.state.is_(None),
            Job.country.is_(None)
        ).all()
        
        print(f"📍 Found {len(jobs_without_location)} on-site jobs without location data")
        print("=" * 80)
        
        updated_count = 0
        
        for job in jobs_without_location:
            print(f"\nJob ID {job.id}: {job.title}")
            print(f"  Company: {job.external_company_name or (job.company.name if job.company else 'N/A')}")
            print(f"  Current location: {job.get_location_display() or '(empty)'}")
            
            # Default location for Rwanda-based companies or jobs
            # You can customize this logic based on job titles, company names, etc.
            city = None
            state = None
            country = None
            
            # Check if it's a Rwanda-based job (common pattern in external jobs)
            company_name = job.external_company_name or (job.company.name if job.company else '')
            job_title_lower = job.title.lower()
            
            if 'rwanda' in company_name.lower() or 'rwanda' in job_title_lower:
                city = 'Kigali'
                state = 'Kigali City'
                country = 'Rwanda'
            elif 'fh association' in company_name.lower() or 'food for the hungry' in company_name.lower():
                city = 'Kigali'
                country = 'Rwanda'
            elif 'visionfund' in company_name.lower():
                # Check if it's Huye branch based on title
                if 'huye' in job_title_lower or 'branch leader' in job_title_lower:
                    city = 'Huye'
                    state = 'Southern Province'
                    country = 'Rwanda'
                else:
                    city = 'Kigali'
                    country = 'Rwanda'
            elif 'huming' in company_name.lower() or 'factory' in company_name.lower():
                city = 'Kigali'
                state = 'Kigali Industrial Zone'
                country = 'Rwanda'
            else:
                # Default to Kigali, Rwanda for unknown Rwanda-related jobs
                # Or skip if we can't determine
                city = 'Kigali'
                country = 'Rwanda'
                print(f"  ⚠️  Using default location (Kigali, Rwanda)")
            
            # Update the job
            if city or country:
                job.city = city
                job.state = state
                job.country = country
                job.updated_at = datetime.utcnow()
                
                updated_count += 1
                print(f"  ✅ Updated to: {job.get_location_display()}")
            else:
                print(f"  ⏭️  Skipped (couldn't determine location)")
        
        # Commit all changes
        if updated_count > 0:
            try:
                db.session.commit()
                print(f"\n✅ Successfully updated {updated_count} jobs with location data!")
            except Exception as e:
                db.session.rollback()
                print(f"\n❌ Error updating jobs: {str(e)}")
        else:
            print("\n⚠️  No jobs were updated")

if __name__ == '__main__':
    print("🚀 Starting job location update...")
    print("=" * 80)
    update_job_locations()
    print("\n" + "=" * 80)
    print("✅ Location update complete!")
