import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
import re
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# LeetCode — uses the alfa-leetcode-api proxy (much more reliable than
#             hitting the GraphQL endpoint directly, which now blocks
#             server-side requests without a browser session).
# ---------------------------------------------------------------------------
LEETCODE_PROXY = 'https://alfa-leetcode-api.onrender.com'

def fetch_leetcode(handle):
    logger.info(f"Fetching LeetCode for: {handle}")
    try:
        # Profile + solved stats from the proxy
        profile_res = requests.get(f"{LEETCODE_PROXY}/{handle}", timeout=15)
        solved_res  = requests.get(f"{LEETCODE_PROXY}/{handle}/solved", timeout=15)

        if profile_res.status_code != 200:
            return {'platform': 'LeetCode', 'handle': handle, 'error': 'User not found', 'success': False}

        profile = profile_res.json()

        # The proxy returns {"username": ..., "ranking": ..., ...}
        if not profile.get('username'):
            return {'platform': 'LeetCode', 'handle': handle, 'error': 'User not found', 'success': False}

        solved = 0
        rating = None

        if solved_res.status_code == 200:
            solved_data = solved_res.json()
            solved = solved_data.get('solvedProblem', 0)

        # Try to get contest rating and history (may be empty if user hasn't participated)
        history = []
        try:
            contest_res = requests.get(f"{LEETCODE_PROXY}/{handle}/contest", timeout=10)
            if contest_res.status_code == 200:
                contest_data = contest_res.json()
                # contestRating field or extract from contestParticipation
                if contest_data.get('contestRating'):
                    rating = round(contest_data['contestRating'])

                # Build history from contestParticipation
                participations = contest_data.get('contestParticipation', [])
                for p in participations:
                    if p.get('rating'):
                        entry = {'rating': round(p['rating'])}
                        # Try to extract date from contest title or timestamp
                        if p.get('contest') and p['contest'].get('startTime'):
                            entry['date'] = datetime.fromtimestamp(int(p['contest']['startTime'])).strftime('%Y-%m-%d')
                        elif p.get('startTime'):
                            entry['date'] = datetime.fromtimestamp(int(p['startTime'])).strftime('%Y-%m-%d')
                        else:
                            entry['date'] = ''
                        history.append(entry)

                if not rating and participations:
                    last = participations[-1]
                    if last.get('rating'):
                        rating = round(last['rating'])
        except Exception:
            pass

        return {
            'platform': 'LeetCode',
            'handle': handle,
            'solved': solved,
            'rating': rating,
            'ranking': profile.get('ranking'),
            'history': history,
            'success': True
        }
    except Exception as e:
        logger.error(f"LeetCode error: {e}")
        return {'platform': 'LeetCode', 'handle': handle, 'error': f'Failed to fetch: {e}', 'success': False}


# ---------------------------------------------------------------------------
# Codeforces — official API, works fine
# ---------------------------------------------------------------------------
def fetch_codeforces(handle):
    logger.info(f"Fetching Codeforces for: {handle}")
    try:
        info_res = requests.get(f"https://codeforces.com/api/user.info?handles={handle}", timeout=10)
        rating_res = requests.get(f"https://codeforces.com/api/user.rating?handle={handle}", timeout=10)
        
        if info_res.json().get('status') != 'OK':
            return {'platform': 'Codeforces', 'handle': handle, 'error': 'User not found', 'success': False}
            
        user = info_res.json()['result'][0]
        history = []
        if rating_res.json().get('status') == 'OK':
            history = [{'rating': r['newRating'], 'date': datetime.fromtimestamp(r['ratingUpdateTimeSeconds']).strftime('%Y-%m-%d')}
                       for r in rating_res.json()['result']]
                       
        solved = 0
        try:
            status_res = requests.get(f"https://codeforces.com/api/user.status?handle={handle}&from=1&count=1000", timeout=10)
            if status_res.json().get('status') == 'OK':
                unique_solved = set()
                for sub in status_res.json()['result']:
                    if sub.get('verdict') == 'OK':
                        unique_solved.add(f"{sub['problem'].get('contestId')}{sub['problem'].get('index')}")
                solved = len(unique_solved)
        except Exception:
            pass

        return {
            'platform': 'Codeforces', 'handle': handle, 'rating': user.get('rating'),
            'maxRating': user.get('maxRating'), 'solved': solved, 'history': history, 'success': True
        }
    except Exception as e:
        logger.error(f"Codeforces error: {e}")
        return {'platform': 'Codeforces', 'handle': handle, 'error': f'Failed to fetch: {e}', 'success': False}


# ---------------------------------------------------------------------------
# CodeChef — uses codechef-api.vercel.app community proxy.
#             Falls back to direct scraping if the proxy is down.
# ---------------------------------------------------------------------------
def fetch_codechef(handle):
    logger.info(f"Fetching CodeChef for: {handle}")

    # --- Attempt 1: Community proxy API ---
    try:
        proxy_res = requests.get(f"https://codechef-api.vercel.app/handle/{handle}", timeout=12)
        if proxy_res.status_code == 200:
            data = proxy_res.json()
            if data.get('success') != False and (data.get('currentRating') or data.get('rating')):
                rating = data.get('currentRating') or data.get('rating')
                return {
                    'platform': 'CodeChef',
                    'handle': handle,
                    'rating': int(rating) if rating else None,
                    'solved': data.get('totalProblemsSolved') or data.get('problemsSolved'),
                    'success': True
                }
    except Exception as e:
        logger.warning(f"CodeChef proxy failed, trying direct scrape: {e}")

    # --- Attempt 2: Direct scrape ---
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        res = requests.get(f"https://www.codechef.com/users/{handle}", headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')

        # Try multiple known selectors (CodeChef changes their layout often)
        rating = None
        for selector in ['.rating-number', '.rating-header .rating', '.user-details-container .rating']:
            el = soup.select_one(selector)
            if el:
                digits = ''.join(filter(str.isdigit, el.text))
                if digits:
                    rating = int(digits)
                    break

        if rating is None:
            return {'platform': 'CodeChef', 'handle': handle, 'error': 'Could not parse rating', 'success': False}

        return {'platform': 'CodeChef', 'handle': handle, 'rating': rating, 'success': True}
    except Exception as e:
        logger.error(f"CodeChef scrape error: {e}")
        return {'platform': 'CodeChef', 'handle': handle, 'error': f'Failed to fetch: {e}', 'success': False}


# ---------------------------------------------------------------------------
# AtCoder — direct scrape, works reliably
# ---------------------------------------------------------------------------
def fetch_atcoder(handle):
    logger.info(f"Fetching AtCoder for: {handle}")
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        res = requests.get(f"https://atcoder.jp/users/{handle}", headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        rating = 0
        for th in soup.find_all('th'):
            if th.text.strip() == 'Rating':
                td = th.find_next_sibling('td')
                if td:
                    match = re.match(r'^(\d+)', td.text.strip())
                    if match:
                        rating = int(match.group(1))
        return {'platform': 'AtCoder', 'handle': handle, 'rating': rating, 'success': True}
    except Exception as e:
        logger.error(f"AtCoder error: {e}")
        return {'platform': 'AtCoder', 'handle': handle, 'error': f'Failed to fetch: {e}', 'success': False}


# ---------------------------------------------------------------------------
# GFG — uses community proxy APIs.
#        Direct scraping doesn't work because GFG is JS-rendered.
# ---------------------------------------------------------------------------
def fetch_gfg(handle):
    logger.info(f"Fetching GFG for: {handle}")

    # --- Attempt 1: Community stats API ---
    try:
        stats_res = requests.get(
            "https://geeks-for-geeks-stats-api.vercel.app/",
            params={'raw': 'Y', 'userName': handle},
            timeout=15
        )
        if stats_res.status_code == 200:
            data = stats_res.json()
            # Validate: must have recognizable fields and a sane number
            total = data.get('totalProblemsSolved')
            if total is not None and isinstance(total, (int, float)) and 0 <= total < 10000:
                return {
                    'platform': 'GFG',
                    'handle': handle,
                    'solved': int(total),
                    'success': True
                }
    except Exception as e:
        logger.warning(f"GFG stats API failed: {e}")

    # --- Attempt 2: Alternate community API ---
    try:
        alt_res = requests.get(f"https://gfg-api-fefa.onrender.com/{handle}", timeout=15)
        if alt_res.status_code == 200:
            data = alt_res.json()
            total = data.get('totalProblemsSolved')
            if total is not None and isinstance(total, (int, float, str)):
                try:
                    total_int = int(total)
                except (ValueError, TypeError):
                    total_int = 0
                if 0 <= total_int < 10000:
                    return {
                        'platform': 'GFG',
                        'handle': handle,
                        'solved': total_int,
                        'success': True
                    }
    except Exception as e:
        logger.warning(f"GFG alternate API failed: {e}")

    # If both APIs failed, return a clean error — no scraping (GFG is JS-rendered)
    return {
        'platform': 'GFG',
        'handle': handle,
        'error': 'Could not fetch stats — check your handle',
        'success': False
    }


# ---------------------------------------------------------------------------
# Main dispatcher
# ---------------------------------------------------------------------------
def fetch_stats(handles):
    results = []
    for item in handles:
        platform = item.get('platform')
        handle = item.get('handle')
        if not handle:
            continue
        if platform == 'LeetCode':
            results.append(fetch_leetcode(handle))
        elif platform == 'Codeforces':
            results.append(fetch_codeforces(handle))
        elif platform == 'CodeChef':
            results.append(fetch_codechef(handle))
        elif platform == 'AtCoder':
            results.append(fetch_atcoder(handle))
        elif platform == 'GFG':
            results.append(fetch_gfg(handle))
    return results
