import logging
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from services.contest_service import fetch_contests

logger = logging.getLogger(__name__)

def check_upcoming_contests():
    logger.info("Running notification scheduler...")
    try:
        contests = fetch_contests()
        now = datetime.now()
        
        # This is a stub for the email logic. 
        # Since we don't have the user collection imported directly here easily
        # without circular imports in Flask, we can just log for now,
        # or import it properly if needed.
        logger.info(f"Fetched {len(contests)} contests. Notification logic is mocked.")
        
    except Exception as e:
        logger.error(f"Scheduler error: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every hour
    scheduler.add_job(check_upcoming_contests, 'cron', minute=0)
    scheduler.start()
    logger.info("Scheduler started")
