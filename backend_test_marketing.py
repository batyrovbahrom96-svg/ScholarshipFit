#!/usr/bin/env python3
"""
Marketing Revenue Engine Backend Tests
Tests: Referrals, Discount Codes, Paywall Tracking, Abandoned Checkout Cron
"""

import requests
import time
import os
from dotenv import load_dotenv

load_dotenv('/app/.env')

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_BASE = f"{BASE_URL}/api"
ADMIN_KEY = os.getenv('ADMIN_PASSWORD', 'admin123')
CRON_SECRET = os.getenv('CRON_SECRET', '')

# Test credentials from /app/memory/test_credentials.md
TEST_EMAIL = "admin@scholarshipfit.com"
TEST_PASSWORD = "ScholarshipFitOwner2026!"

print(f"🧪 Marketing Revenue Engine Backend Tests")
print(f"📍 Base URL: {API_BASE}")
print(f"🔑 Admin Key: {ADMIN_KEY}")
print(f"🔐 Cron Secret: {'SET' if CRON_SECRET else 'NOT SET'}")
print("=" * 80)

# Track test results
tests_passed = 0
tests_failed = 0
test_results = []

def log_test(name, passed, details=""):
    global tests_passed, tests_failed
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    test_results.append({
        "name": name,
        "passed": passed,
        "details": details
    })
    if passed:
        tests_passed += 1
    else:
        tests_failed += 1

# ============================================================================
# SECTION 1: DISCOUNT CODES
# ============================================================================
print("\n" + "=" * 80)
print("SECTION 1: DISCOUNT CODES")
print("=" * 80)

# Test 1: Validate LAUNCH50
try:
    resp = requests.post(f"{API_BASE}/discounts/validate", json={"code": "LAUNCH50"}, timeout=10)
    data = resp.json()
    passed = (
        resp.status_code == 200 and
        data.get("valid") == True and
        data.get("code") == "LAUNCH50" and
        data.get("percent_off") == 50 and
        "description" in data and
        "remaining" in data
    )
    log_test(
        "POST /api/discounts/validate with LAUNCH50",
        passed,
        f"Status: {resp.status_code}, Response: {data}"
    )
except Exception as e:
    log_test("POST /api/discounts/validate with LAUNCH50", False, f"Error: {e}")

# Test 2: Validate STUDENT20
try:
    resp = requests.post(f"{API_BASE}/discounts/validate", json={"code": "STUDENT20"}, timeout=10)
    data = resp.json()
    passed = (
        resp.status_code == 200 and
        data.get("valid") == True and
        data.get("percent_off") == 20
    )
    log_test(
        "POST /api/discounts/validate with STUDENT20",
        passed,
        f"Status: {resp.status_code}, percent_off: {data.get('percent_off')}"
    )
except Exception as e:
    log_test("POST /api/discounts/validate with STUDENT20", False, f"Error: {e}")

# Test 3: Validate EARLYBIRD
try:
    resp = requests.post(f"{API_BASE}/discounts/validate", json={"code": "EARLYBIRD"}, timeout=10)
    data = resp.json()
    passed = (
        resp.status_code == 200 and
        data.get("valid") == True and
        data.get("percent_off") == 30
    )
    log_test(
        "POST /api/discounts/validate with EARLYBIRD",
        passed,
        f"Status: {resp.status_code}, percent_off: {data.get('percent_off')}"
    )
except Exception as e:
    log_test("POST /api/discounts/validate with EARLYBIRD", False, f"Error: {e}")

# Test 4: Invalid code
try:
    resp = requests.post(f"{API_BASE}/discounts/validate", json={"code": "NOTREAL"}, timeout=10)
    data = resp.json()
    passed = (
        resp.status_code == 200 and
        data.get("valid") == False and
        "error" in data
    )
    log_test(
        "POST /api/discounts/validate with NOTREAL (invalid)",
        passed,
        f"Status: {resp.status_code}, valid: {data.get('valid')}, error: {data.get('error')}"
    )
except Exception as e:
    log_test("POST /api/discounts/validate with NOTREAL", False, f"Error: {e}")

# Test 5: Empty code
try:
    resp = requests.post(f"{API_BASE}/discounts/validate", json={"code": ""}, timeout=10)
    data = resp.json()
    passed = resp.status_code == 400
    log_test(
        "POST /api/discounts/validate with empty code",
        passed,
        f"Status: {resp.status_code} (expected 400)"
    )
except Exception as e:
    log_test("POST /api/discounts/validate with empty code", False, f"Error: {e}")

# Test 6: GET admin discounts with header
try:
    resp = requests.get(
        f"{API_BASE}/admin/discounts",
        headers={"x-admin-key": ADMIN_KEY},
        timeout=10
    )
    data = resp.json()
    passed = (
        resp.status_code == 200 and
        "items" in data and
        isinstance(data["items"], list) and
        len(data["items"]) >= 3  # At least the 3 seeded codes
    )
    log_test(
        "GET /api/admin/discounts with x-admin-key",
        passed,
        f"Status: {resp.status_code}, items count: {len(data.get('items', []))}"
    )
except Exception as e:
    log_test("GET /api/admin/discounts with x-admin-key", False, f"Error: {e}")

# Test 7: GET admin discounts without header
try:
    resp = requests.get(f"{API_BASE}/admin/discounts", timeout=10)
    passed = resp.status_code == 401
    log_test(
        "GET /api/admin/discounts without x-admin-key",
        passed,
        f"Status: {resp.status_code} (expected 401)"
    )
except Exception as e:
    log_test("GET /api/admin/discounts without x-admin-key", False, f"Error: {e}")

# Test 8: POST admin discounts - create new code
try:
    resp = requests.post(
        f"{API_BASE}/admin/discounts",
        headers={"x-admin-key": ADMIN_KEY},
        json={
            "code": "TESTAGENT",
            "percent_off": 15,
            "description": "Auto-test",
            "max_uses": 5
        },
        timeout=10
    )
    data = resp.json()
    passed = resp.status_code == 200 and data.get("ok") == True
    log_test(
        "POST /api/admin/discounts create TESTAGENT",
        passed,
        f"Status: {resp.status_code}, ok: {data.get('ok')}"
    )
except Exception as e:
    log_test("POST /api/admin/discounts create TESTAGENT", False, f"Error: {e}")

# Test 9: POST admin discounts - duplicate code
try:
    resp = requests.post(
        f"{API_BASE}/admin/discounts",
        headers={"x-admin-key": ADMIN_KEY},
        json={
            "code": "TESTAGENT",
            "percent_off": 15,
            "description": "Duplicate",
            "max_uses": 5
        },
        timeout=10
    )
    passed = resp.status_code == 409
    log_test(
        "POST /api/admin/discounts duplicate TESTAGENT",
        passed,
        f"Status: {resp.status_code} (expected 409)"
    )
except Exception as e:
    log_test("POST /api/admin/discounts duplicate TESTAGENT", False, f"Error: {e}")

# Test 10: Validate newly created TESTAGENT code
try:
    resp = requests.post(f"{API_BASE}/discounts/validate", json={"code": "TESTAGENT"}, timeout=10)
    data = resp.json()
    passed = (
        resp.status_code == 200 and
        data.get("valid") == True and
        data.get("percent_off") == 15
    )
    log_test(
        "POST /api/discounts/validate with TESTAGENT",
        passed,
        f"Status: {resp.status_code}, valid: {data.get('valid')}, percent_off: {data.get('percent_off')}"
    )
except Exception as e:
    log_test("POST /api/discounts/validate with TESTAGENT", False, f"Error: {e}")

# ============================================================================
# SECTION 2: REFERRALS
# ============================================================================
print("\n" + "=" * 80)
print("SECTION 2: REFERRALS")
print("=" * 80)

# Test 11: GET /api/referrals/me without session cookie
try:
    resp = requests.get(f"{API_BASE}/referrals/me", timeout=10)
    passed = resp.status_code == 401
    log_test(
        "GET /api/referrals/me without session cookie",
        passed,
        f"Status: {resp.status_code} (expected 401)"
    )
except Exception as e:
    log_test("GET /api/referrals/me without session cookie", False, f"Error: {e}")

# Test 12: Login to get session cookie
session = requests.Session()
try:
    resp = session.post(
        f"{API_BASE}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=10
    )
    data = resp.json()
    passed = resp.status_code == 200 and "sf_session" in session.cookies
    log_test(
        "POST /api/auth/login to get session cookie",
        passed,
        f"Status: {resp.status_code}, has sf_session: {'sf_session' in session.cookies}"
    )
    if not passed:
        print(f"   Login response: {data}")
except Exception as e:
    log_test("POST /api/auth/login", False, f"Error: {e}")

# Test 13: GET /api/referrals/me with session cookie
referral_code = None
try:
    resp = session.get(f"{API_BASE}/referrals/me", timeout=10)
    data = resp.json()
    passed = (
        resp.status_code == 200 and
        "code" in data and
        "share_url" in data and
        "clicks" in data and
        "signups" in data and
        "paid" in data and
        "credits_earned_days" in data and
        "payload" in data and
        data.get("commission_pct") == 20
    )
    if passed:
        referral_code = data.get("code")
    log_test(
        "GET /api/referrals/me with session cookie",
        passed,
        f"Status: {resp.status_code}, code: {data.get('code')}, commission_pct: {data.get('commission_pct')}"
    )
except Exception as e:
    log_test("GET /api/referrals/me with session cookie", False, f"Error: {e}")

# Test 14: GET /api/referrals/me again (idempotent)
try:
    resp = session.get(f"{API_BASE}/referrals/me", timeout=10)
    data = resp.json()
    passed = (
        resp.status_code == 200 and
        data.get("code") == referral_code  # Same code as before
    )
    log_test(
        "GET /api/referrals/me again (idempotent)",
        passed,
        f"Status: {resp.status_code}, code matches: {data.get('code') == referral_code}"
    )
except Exception as e:
    log_test("GET /api/referrals/me again", False, f"Error: {e}")

# Test 15: Track referral clicks
if referral_code:
    try:
        # Track 3 clicks
        for i in range(3):
            resp = requests.post(
                f"{API_BASE}/referrals/track-click",
                json={"code": referral_code},
                timeout=10
            )
            time.sleep(0.1)
        
        # Check if clicks increased
        resp = session.get(f"{API_BASE}/referrals/me", timeout=10)
        data = resp.json()
        clicks = data.get("clicks", 0)
        passed = clicks >= 3
        log_test(
            "POST /api/referrals/track-click (3x) and verify clicks",
            passed,
            f"Clicks after tracking: {clicks} (expected >= 3)"
        )
    except Exception as e:
        log_test("POST /api/referrals/track-click", False, f"Error: {e}")
else:
    log_test("POST /api/referrals/track-click", False, "No referral code available")

# Test 16: Track click with empty code
try:
    resp = requests.post(
        f"{API_BASE}/referrals/track-click",
        json={"code": ""},
        timeout=10
    )
    data = resp.json()
    passed = resp.status_code == 200 and data.get("skipped") == True
    log_test(
        "POST /api/referrals/track-click with empty code",
        passed,
        f"Status: {resp.status_code}, skipped: {data.get('skipped')}"
    )
except Exception as e:
    log_test("POST /api/referrals/track-click with empty code", False, f"Error: {e}")

# Test 17: GET admin referrals
try:
    resp = requests.get(
        f"{API_BASE}/admin/referrals",
        headers={"x-admin-key": ADMIN_KEY},
        timeout=10
    )
    data = resp.json()
    passed = (
        resp.status_code == 200 and
        "items" in data and
        isinstance(data["items"], list) and
        len(data["items"]) >= 1  # At least the admin's referral row
    )
    log_test(
        "GET /api/admin/referrals with x-admin-key",
        passed,
        f"Status: {resp.status_code}, items count: {len(data.get('items', []))}"
    )
except Exception as e:
    log_test("GET /api/admin/referrals", False, f"Error: {e}")

# ============================================================================
# SECTION 3: PAYWALL TRACKING + ABANDONED CHECKOUT CRON
# ============================================================================
print("\n" + "=" * 80)
print("SECTION 3: PAYWALL TRACKING + ABANDONED CHECKOUT CRON")
print("=" * 80)

# Test 18: POST /api/paywall/track without session, empty body
try:
    resp = requests.post(f"{API_BASE}/paywall/track", json={}, timeout=10)
    data = resp.json()
    passed = resp.status_code == 200 and data.get("ok") == True
    log_test(
        "POST /api/paywall/track without session, empty body",
        passed,
        f"Status: {resp.status_code}, ok: {data.get('ok')}, skipped: {data.get('skipped')}"
    )
except Exception as e:
    log_test("POST /api/paywall/track without session", False, f"Error: {e}")

# Test 19: POST /api/paywall/track with session cookie
try:
    resp = session.post(
        f"{API_BASE}/paywall/track",
        json={
            "plan": "annual",
            "match_count": 47,
            "total_worth": 180000
        },
        timeout=10
    )
    data = resp.json()
    passed = resp.status_code == 200 and data.get("ok") == True
    log_test(
        "POST /api/paywall/track with session cookie",
        passed,
        f"Status: {resp.status_code}, ok: {data.get('ok')}"
    )
except Exception as e:
    log_test("POST /api/paywall/track with session", False, f"Error: {e}")

# Test 20: GET /api/cron/abandoned-checkout without x-cron-key header
try:
    resp = requests.get(f"{API_BASE}/cron/abandoned-checkout", timeout=15)
    # If CRON_SECRET is set, expect 401. If not set, expect 200.
    if CRON_SECRET:
        passed = resp.status_code == 401
        expected = "401 (CRON_SECRET is set)"
    else:
        passed = resp.status_code == 200
        expected = "200 (CRON_SECRET not set)"
    log_test(
        "GET /api/cron/abandoned-checkout without x-cron-key",
        passed,
        f"Status: {resp.status_code} (expected {expected})"
    )
except Exception as e:
    log_test("GET /api/cron/abandoned-checkout without header", False, f"Error: {e}")

# Test 21: GET /api/cron/abandoned-checkout with x-cron-key header (if CRON_SECRET is set)
if CRON_SECRET:
    try:
        resp = requests.get(
            f"{API_BASE}/cron/abandoned-checkout",
            headers={"x-cron-key": CRON_SECRET},
            timeout=15
        )
        data = resp.json()
        passed = (
            resp.status_code == 200 and
            data.get("ok") == True and
            "scanned" in data and
            "sent" in data and
            "skipped" in data and
            "results" in data
        )
        log_test(
            "GET /api/cron/abandoned-checkout with x-cron-key",
            passed,
            f"Status: {resp.status_code}, scanned: {data.get('scanned')}, sent: {data.get('sent')}, skipped: {data.get('skipped')}"
        )
    except Exception as e:
        log_test("GET /api/cron/abandoned-checkout with header", False, f"Error: {e}")
else:
    print("⏭️  SKIP: GET /api/cron/abandoned-checkout with x-cron-key (CRON_SECRET not set)")

# ============================================================================
# SECTION 4: CHECKOUT CREATE-SESSION WITH DISCOUNT CODE
# ============================================================================
print("\n" + "=" * 80)
print("SECTION 4: CHECKOUT CREATE-SESSION WITH DISCOUNT CODE")
print("=" * 80)

# Test 22: POST /api/checkout/create-session with LAUNCH50
try:
    resp = session.post(
        f"{API_BASE}/checkout/create-session",
        json={
            "plan": "monthly",
            "base_price": 14.99,
            "discount_code": "LAUNCH50"
        },
        timeout=15
    )
    data = resp.json()
    # Either 200 with url (if PADDLE_API_KEY set) OR 503 with detail about preorder mode
    passed = (
        (resp.status_code == 200 and "url" in data) or
        (resp.status_code == 503 and "detail" in data)
    )
    log_test(
        "POST /api/checkout/create-session with LAUNCH50",
        passed,
        f"Status: {resp.status_code}, Response: {data}"
    )
except Exception as e:
    log_test("POST /api/checkout/create-session with LAUNCH50", False, f"Error: {e}")

# Test 23: POST /api/checkout/create-session with invalid discount code
try:
    resp = session.post(
        f"{API_BASE}/checkout/create-session",
        json={
            "plan": "monthly",
            "discount_code": "NOTREAL"
        },
        timeout=15
    )
    data = resp.json()
    # Should not crash - either 200/503 (discount silently ignored) or proper error
    passed = resp.status_code in [200, 503, 400]
    log_test(
        "POST /api/checkout/create-session with invalid discount code",
        passed,
        f"Status: {resp.status_code}, Response: {data}"
    )
except Exception as e:
    log_test("POST /api/checkout/create-session with invalid code", False, f"Error: {e}")

# ============================================================================
# SECTION 5: REFERRAL CAPTURE DURING SIGNUP (LIGHT TEST)
# ============================================================================
print("\n" + "=" * 80)
print("SECTION 5: REFERRAL CAPTURE DURING SIGNUP (LIGHT TEST)")
print("=" * 80)

# Test 24: POST /api/auth/register accepts ref field without erroring
try:
    resp = requests.post(
        f"{API_BASE}/auth/register",
        json={
            "email": "test_already_exists@example.com",  # Will likely return 409
            "password": "TestPass123!",
            "name": "Test User",
            "ref": "SF123456"
        },
        timeout=10
    )
    # We expect either 409 (email exists) or 400 (validation) - NOT 500
    passed = resp.status_code in [200, 400, 409]
    log_test(
        "POST /api/auth/register accepts ref field",
        passed,
        f"Status: {resp.status_code} (expected 200/400/409, not 500)"
    )
except Exception as e:
    log_test("POST /api/auth/register with ref field", False, f"Error: {e}")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"✅ Passed: {tests_passed}")
print(f"❌ Failed: {tests_failed}")
print(f"📊 Total: {tests_passed + tests_failed}")
print(f"📈 Success Rate: {(tests_passed / (tests_passed + tests_failed) * 100):.1f}%")

if tests_failed > 0:
    print("\n❌ FAILED TESTS:")
    for result in test_results:
        if not result["passed"]:
            print(f"  - {result['name']}")
            if result["details"]:
                print(f"    {result['details']}")

print("\n" + "=" * 80)
print("DETAILED RESULTS BY ENDPOINT:")
print("=" * 80)

# Group results by endpoint
endpoints = {}
for result in test_results:
    # Extract endpoint from test name
    if "discounts/validate" in result["name"]:
        endpoint = "POST /api/discounts/validate"
    elif "admin/discounts" in result["name"]:
        endpoint = "GET/POST /api/admin/discounts"
    elif "referrals/me" in result["name"]:
        endpoint = "GET /api/referrals/me"
    elif "referrals/track-click" in result["name"]:
        endpoint = "POST /api/referrals/track-click"
    elif "admin/referrals" in result["name"]:
        endpoint = "GET /api/admin/referrals"
    elif "paywall/track" in result["name"]:
        endpoint = "POST /api/paywall/track"
    elif "abandoned-checkout" in result["name"]:
        endpoint = "GET /api/cron/abandoned-checkout"
    elif "checkout/create-session" in result["name"]:
        endpoint = "POST /api/checkout/create-session"
    elif "auth/register" in result["name"]:
        endpoint = "POST /api/auth/register"
    elif "auth/login" in result["name"]:
        endpoint = "POST /api/auth/login"
    else:
        endpoint = "Other"
    
    if endpoint not in endpoints:
        endpoints[endpoint] = {"passed": 0, "failed": 0}
    
    if result["passed"]:
        endpoints[endpoint]["passed"] += 1
    else:
        endpoints[endpoint]["failed"] += 1

for endpoint, counts in endpoints.items():
    total = counts["passed"] + counts["failed"]
    status = "✅" if counts["failed"] == 0 else "❌"
    print(f"{status} {endpoint}: {counts['passed']}/{total} passed")

print("\n" + "=" * 80)
exit(0 if tests_failed == 0 else 1)
