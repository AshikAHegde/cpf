import os
import requests
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COLORS = {
    'leetcode': '#f59e0b',
    'codeforces': '#3b82f6',
    'codechef': '#10b981',
    'atcoder': '#8b5cf6',
    'default': '#8b5cf6'
}

cached_contests = None
last_fetch_time = 0
CACHE_DURATION = 3600  # 1 hour in seconds

def get_codeforces_type(name, type_):
    if 'Div.' in name:
        parts = name.split('Div.')
        if len(parts) > 1:
            div = parts[1].strip().split(' ')[0]
            if 'Educational' in name:
                return f"Edu Div {div}"
            return f"Div {div}"
    if 'Educational' in name:
        return 'Educational'
    return 'Division' if type_ == 'CF' else 'Other'

def get_leetcode_type(title):
    title_lower = title.lower()
    if 'biweekly' in title_lower:
        return 'Biweekly'
    elif 'weekly' in title_lower:
        return 'Weekly'
    else:
        return 'Contest'

def get_contest_status(start_iso, end_iso):
    now = datetime.now()
    start_dt = datetime.fromisoformat(start_iso)
    end_dt = datetime.fromisoformat(end_iso)
    if now < start_dt:
        return 'upcoming'
    elif start_dt <= now < end_dt:
        return 'live'
    else:
        return 'done'

def fetch_contests():
    global cached_contests, last_fetch_time
    
    now = datetime.now()
    if cached_contests and (now.timestamp() - last_fetch_time < CACHE_DURATION):
        logger.info('Serving contests from cache')
        # Add status to cached contests
        for contest in cached_contests:
            contest['status'] = get_contest_status(contest['start'], contest['end'])
        return cached_contests

    contests = []
    
    # Calculate date range
    start_date = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
    end_date = (now.replace(day=1) + timedelta(days=62)).replace(day=1) - timedelta(days=1)
    
    def is_in_range(date_obj):
        return start_date <= date_obj <= end_date

    # URLs from env
    cf_url = os.getenv('CODEFORCES_API_URL', 'https://codeforces.com/api/contest.list?gym=false')
    at_url = os.getenv('ATCODER_API_URL', 'https://kenkoooo.com/atcoder/resources/contests.json')
    lc_url = os.getenv('LEETCODE_API_URL', 'https://alfa-leetcode-api.onrender.com/contests')
    cc_url = os.getenv('CODECHEF_API_URL', 'https://www.codechef.com/api/list/contests/all')

    # ---- Fetch LeetCode ----
    lc_fetched = False

    # Attempt 1: alfa-leetcode-api proxy
    try:
        # The proxy has /contests which returns all upcoming contests
        res = requests.get(lc_url, timeout=12)
        if res.status_code == 200:
            data = res.json()
            # The response can be a dict with keys or a list depending on version
            contest_list = []
            if isinstance(data, list):
                contest_list = data
            elif isinstance(data, dict):
                # May have keys like 'topTwoContests', 'allContests', etc.
                for key in ['topTwoContests', 'allContests', 'upcoming', 'contests']:
                    if key in data and isinstance(data[key], list):
                        contest_list.extend(data[key])
                # If it's just a flat dict with contest fields, skip
                if not contest_list and data.get('title'):
                    contest_list = [data]

            for c in contest_list:
                try:
                    start_ts = c.get('startTime')
                    if start_ts:
                        start_dt = datetime.fromtimestamp(int(start_ts))
                    elif c.get('originStartTime'):
                        start_dt = datetime.fromtimestamp(int(c['originStartTime']))
                    else:
                        continue

                    duration = int(c.get('duration', 5400))  # default 1.5 hours
                    end_dt = start_dt + timedelta(seconds=duration)
                    title = c.get('title', 'LeetCode Contest')
                    slug = c.get('titleSlug') or c.get('contestSlug') or ''

                    if is_in_range(start_dt):
                        start_iso = start_dt.isoformat()
                        end_iso = end_dt.isoformat()
                        contests.append({
                            'title': title,
                            'start': start_iso,
                            'end': end_iso,
                            'platform': 'LeetCode',
                            'type': get_leetcode_type(title),
                            'url': f'https://leetcode.com/contest/{slug}' if slug else 'https://leetcode.com/contest/',
                            'color': COLORS['leetcode'],
                            'status': get_contest_status(start_iso, end_iso)
                        })
                        lc_fetched = True
                except Exception:
                    pass
    except Exception as e:
        logger.warning(f"LeetCode proxy contest fetch failed: {e}")

    # Attempt 2: Direct LeetCode GraphQL (fallback)
    if not lc_fetched:
        try:
            query = """
            query {
                allContests {
                    title
                    titleSlug
                    startTime
                    duration
                }
            }
            """
            headers = {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com/contest/',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
            }
            res = requests.post(
                'https://leetcode.com/graphql',
                json={'query': query},
                headers=headers,
                timeout=10
            )
            if res.status_code == 200:
                data = res.json()
                all_contests = data.get('data', {}).get('allContests', [])
                for c in all_contests:
                    try:
                        start_dt = datetime.fromtimestamp(c['startTime'])
                        if is_in_range(start_dt):
                            end_dt = start_dt + timedelta(seconds=c['duration'])
                            title = c['title']
                            start_iso = start_dt.isoformat()
                            end_iso = end_dt.isoformat()
                            contests.append({
                                'title': title,
                                'start': start_iso,
                                'end': end_iso,
                                'platform': 'LeetCode',
                                'type': get_leetcode_type(title),
                                'url': f"https://leetcode.com/contest/{c['titleSlug']}",
                                'color': COLORS['leetcode'],
                                'status': get_contest_status(start_iso, end_iso)
                            })
                    except Exception:
                        pass
                lc_fetched = True
        except Exception as e:
            logger.warning(f"LeetCode GraphQL contest fetch failed: {e}")

    # ---- Fetch Codeforces ----
    try:
        res = requests.get(cf_url, timeout=10)
        if res.status_code == 200:
            cf_contests = res.json().get('result', [])
            for c in cf_contests:
                try:
                    if c.get('phase') == 'BEFORE':
                        start_dt = datetime.fromtimestamp(c['startTimeSeconds'])
                        if is_in_range(start_dt):
                            end_dt = start_dt + timedelta(seconds=c.get('durationSeconds', 7200))
                            start_iso = start_dt.isoformat()
                            end_iso = end_dt.isoformat()
                            contests.append({
                                'title': c['name'],
                                'start': start_iso,
                                'end': end_iso,
                                'platform': 'Codeforces',
                                'type': get_codeforces_type(c['name'], c['type']),
                                'url': f"https://codeforces.com/contests/{c['id']}",
                                'color': COLORS['codeforces'],
                                'status': get_contest_status(start_iso, end_iso)
                            })
                except Exception:
                    pass
    except Exception as e:
        logger.warning(f"Codeforces contest fetch failed: {e}")

    # ---- Fetch AtCoder ----
    try:
        res = requests.get(at_url, timeout=10)
        if res.status_code == 200:
            ac_contests = res.json()
            for c in ac_contests:
                try:
                    start_dt = datetime.fromtimestamp(c['start_epoch_second'])
                    if is_in_range(start_dt):
                        end_dt = start_dt + timedelta(seconds=c['duration_second'])
                        start_iso = start_dt.isoformat()
                        end_iso = end_dt.isoformat()
                        contests.append({
                            'title': c['title'],
                            'start': start_iso,
                            'end': end_iso,
                            'platform': 'AtCoder',
                            'type': c['rate_change'],
                            'url': f"https://atcoder.jp/contests/{c['id']}",
                            'color': COLORS['atcoder'],
                            'status': get_contest_status(start_iso, end_iso)
                        })
                except Exception:
                    pass
    except Exception as e:
        logger.warning(f"AtCoder contest fetch failed: {e}")

    # ---- Fetch CodeChef ----
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(cc_url, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            # Future contests
            for c in data.get('future_contests', []):
                try:
                    start_dt = datetime.strptime(c['contest_start_date_iso'], "%Y-%m-%dT%H:%M:%S%z").astimezone(None).replace(tzinfo=None)
                    if is_in_range(start_dt):
                        end_dt = datetime.strptime(c['contest_end_date_iso'], "%Y-%m-%dT%H:%M:%S%z").astimezone(None).replace(tzinfo=None)
                        start_iso = start_dt.isoformat()
                        end_iso = end_dt.isoformat()
                        contests.append({
                            'title': c['contest_name'],
                            'start': start_iso,
                            'end': end_iso,
                            'platform': 'CodeChef',
                            'type': 'Contest',
                            'url': f"https://www.codechef.com/{c['contest_code']}",
                            'color': COLORS['codechef'],
                            'status': get_contest_status(start_iso, end_iso)
                        })
                except Exception:
                    pass
            # Present contests
            for c in data.get('present_contests', []):
                try:
                    start_dt = datetime.strptime(c['contest_start_date_iso'], "%Y-%m-%dT%H:%M:%S%z").astimezone(None).replace(tzinfo=None)
                    if is_in_range(start_dt):
                        end_dt = datetime.strptime(c['contest_end_date_iso'], "%Y-%m-%dT%H:%M:%S%z").astimezone(None).replace(tzinfo=None)
                        start_iso = start_dt.isoformat()
                        end_iso = end_dt.isoformat()
                        contests.append({
                            'title': c['contest_name'],
                            'start': start_iso,
                            'end': end_iso,
                            'platform': 'CodeChef',
                            'type': 'Contest',
                            'url': f"https://www.codechef.com/{c['contest_code']}",
                            'color': COLORS['codechef'],
                            'status': get_contest_status(start_iso, end_iso)
                        })
                except Exception:
                    pass
    except Exception as e:
        logger.warning(f"CodeChef contest fetch failed: {e}")

    # Sort contests by start time
    contests.sort(key=lambda x: x['start'])
    
    cached_contests = contests
    last_fetch_time = now.timestamp()
    
    logger.info(f'Fetched {len(contests)} contests from APIs')
    return contests

