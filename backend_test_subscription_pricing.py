#!/usr/bin/env python3
"""
Backend test suite for POST /api/subscription/activate
Testing new length-based pricing + 7-day trial semantics (2026-07-10)
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient

# Base URL from .env
BASE_URL = "https://stellar-fit.preview.emergentagent.com/api"

# Test credentials
TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "testpass123"

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "scholarshipfit"

def get_mongo_db():
    """Get MongoDB database connection"""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def reset_user_subscription(email):
    """
    Reset user's subscription state to allow testing trial flow.
    This clears the subscription field so the user appears as a fresh user.
    """
    try:
        db = get_mongo_db()
        result = db.users.update_one(
            {"email": email},
            {"$unset": {"subscription": ""}}
        )
        if result.matched_count > 0:
            print(f"✅ Reset subscription state for {email}")
            return True
        else:
            print(f"⚠️  User {email} not found in database")
            return False
    except Exception as e:
        print(f"❌ Failed to reset subscription: {e}")
        return False

def login_and_get_session():
    """
    Login as testuser and return session cookie
    """
    print("\n" + "="*80)
    print("SETUP: Login to get session cookie")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=10
        )
        
        print(f"Login status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.text}")
            return None
        
        # Extract session cookie
        cookies = response.cookies
        session_cookie = cookies.get('sf_session')
        
        if not session_cookie:
            print("❌ No sf_session cookie in response")
            return None
        
        print(f"✅ Login successful, got session cookie")
        return session_cookie
        
    except Exception as e:
        print(f"❌ Login failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_1_unauthenticated():
    """
    Test 1: UNAUTHENTICATED — POST without session cookie should return 401
    """
    print("\n" + "="*80)
    print("TEST 1: UNAUTHENTICATED - No session cookie")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/subscription/activate",
            json={"plan": "quarterly"},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code != 401:
            print(f"❌ Expected 401, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        if data.get('error') != 'Not signed in':
            print(f"❌ Expected error 'Not signed in', got: {data.get('error')}")
            return False
        
        print(f"✅ Correctly returns 401 with error: '{data.get('error')}'")
        print("\n✅ TEST 1 PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 1 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_2_first_activation_quarterly(session_cookie):
    """
    Test 2: FIRST ACTIVATION — fresh user activates quarterly plan with 7-day trial
    """
    print("\n" + "="*80)
    print("TEST 2: FIRST ACTIVATION - Quarterly plan with 7-day trial")
    print("="*80)
    
    try:
        # Reset user subscription to simulate fresh user
        print("Resetting user subscription state...")
        reset_user_subscription(TEST_EMAIL)
        
        response = requests.post(
            f"{BASE_URL}/subscription/activate",
            json={"plan": "quarterly"},
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        sub = data.get('subscription')
        
        if not sub:
            print(f"❌ No subscription in response")
            return False
        
        # Verify all fields
        now = datetime.utcnow()
        
        # Check plan
        if sub.get('plan') != 'quarterly':
            print(f"❌ Expected plan='quarterly', got: {sub.get('plan')}")
            return False
        print(f"✅ plan = 'quarterly'")
        
        # Check status
        if sub.get('status') != 'trialing':
            print(f"❌ Expected status='trialing', got: {sub.get('status')}")
            return False
        print(f"✅ status = 'trialing'")
        
        # Check trial_used
        if sub.get('trial_used') != True:
            print(f"❌ Expected trial_used=true, got: {sub.get('trial_used')}")
            return False
        print(f"✅ trial_used = true")
        
        # Check price_usd
        if sub.get('price_usd') != 29:
            print(f"❌ Expected price_usd=29, got: {sub.get('price_usd')}")
            return False
        print(f"✅ price_usd = 29")
        
        # Check monthly_rate_usd
        if sub.get('monthly_rate_usd') != 9.67:
            print(f"❌ Expected monthly_rate_usd=9.67, got: {sub.get('monthly_rate_usd')}")
            return False
        print(f"✅ monthly_rate_usd = 9.67")
        
        # Check billing_cycle_days
        if sub.get('billing_cycle_days') != 90:
            print(f"❌ Expected billing_cycle_days=90, got: {sub.get('billing_cycle_days')}")
            return False
        print(f"✅ billing_cycle_days = 90")
        
        # Check trial_days
        if sub.get('trial_days') != 7:
            print(f"❌ Expected trial_days=7, got: {sub.get('trial_days')}")
            return False
        print(f"✅ trial_days = 7")
        
        # Check trial_end (should be ~7 days from now)
        trial_end_str = sub.get('trial_end')
        if not trial_end_str:
            print(f"❌ trial_end is missing")
            return False
        
        # Parse trial_end and make timezone-aware comparison
        if trial_end_str.endswith('Z'):
            trial_end = datetime.fromisoformat(trial_end_str.replace('Z', ''))
        else:
            trial_end = datetime.fromisoformat(trial_end_str.split('+')[0].split('Z')[0])
        
        expected_trial_end = now + timedelta(days=7)
        diff_seconds = abs((trial_end - expected_trial_end).total_seconds())
        
        if diff_seconds > 60:  # Allow 60 second tolerance
            print(f"❌ trial_end not ~7 days from now. Diff: {diff_seconds}s")
            return False
        print(f"✅ trial_end = ~now + 7 days ({trial_end.isoformat()})")
        
        # Check first_charge_at (should equal trial_end)
        first_charge_str = sub.get('first_charge_at')
        if not first_charge_str:
            print(f"❌ first_charge_at is missing")
            return False
        
        if first_charge_str.endswith('Z'):
            first_charge = datetime.fromisoformat(first_charge_str.replace('Z', ''))
        else:
            first_charge = datetime.fromisoformat(first_charge_str.split('+')[0].split('Z')[0])
        if abs((first_charge - trial_end).total_seconds()) > 5:
            print(f"❌ first_charge_at should equal trial_end")
            return False
        print(f"✅ first_charge_at = trial_end")
        
        # Check expires_at (should be ~trial_end + 90 days)
        expires_str = sub.get('expires_at')
        if not expires_str:
            print(f"❌ expires_at is missing")
            return False
        
        if expires_str.endswith('Z'):
            expires = datetime.fromisoformat(expires_str.replace('Z', ''))
        else:
            expires = datetime.fromisoformat(expires_str.split('+')[0].split('Z')[0])
        
        expected_expires = trial_end + timedelta(days=90)
        diff_seconds = abs((expires - expected_expires).total_seconds())
        
        if diff_seconds > 60:
            print(f"❌ expires_at not ~trial_end + 90 days. Diff: {diff_seconds}s")
            return False
        print(f"✅ expires_at = ~trial_end + 90 days ({expires.isoformat()})")
        
        print("\n✅ TEST 2 PASSED: First activation with trial working correctly")
        return True
        
    except Exception as e:
        print(f"❌ TEST 2 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_3_auth_me_shows_active(session_cookie):
    """
    Test 3: GET /api/auth/me returns subscription_active=true while trialing
    """
    print("\n" + "="*80)
    print("TEST 3: GET /api/auth/me - subscription_active while trialing")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        user = data.get('user')
        
        if not user:
            print(f"❌ No user in response")
            return False
        
        subscription_active = user.get('subscription_active')
        
        if subscription_active != True:
            print(f"❌ Expected subscription_active=true, got: {subscription_active}")
            return False
        
        print(f"✅ subscription_active = true (user has access during trial)")
        print("\n✅ TEST 3 PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 3 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_4_subscription_status_active(session_cookie):
    """
    Test 4: GET /api/subscription/status returns active=true while trialing
    """
    print("\n" + "="*80)
    print("TEST 4: GET /api/subscription/status - active while trialing")
    print("="*80)
    
    try:
        response = requests.get(
            f"{BASE_URL}/subscription/status",
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        active = data.get('active')
        subscription = data.get('subscription')
        
        if active != True:
            print(f"❌ Expected active=true, got: {active}")
            return False
        
        print(f"✅ active = true")
        
        if subscription and subscription.get('status') == 'trialing':
            print(f"✅ subscription.status = 'trialing' (confirmed)")
        
        print("\n✅ TEST 4 PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 4 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_5_second_activation_monthly(session_cookie):
    """
    Test 5: SECOND ACTIVATION — trial already used, switch to monthly (no trial)
    """
    print("\n" + "="*80)
    print("TEST 5: SECOND ACTIVATION - Monthly plan (trial already used)")
    print("="*80)
    
    try:
        # User already has trial_used=true from test 2
        response = requests.post(
            f"{BASE_URL}/subscription/activate",
            json={"plan": "monthly"},
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        sub = data.get('subscription')
        
        if not sub:
            print(f"❌ No subscription in response")
            return False
        
        now = datetime.utcnow()
        
        # Check plan
        if sub.get('plan') != 'monthly':
            print(f"❌ Expected plan='monthly', got: {sub.get('plan')}")
            return False
        print(f"✅ plan = 'monthly'")
        
        # Check status (should be 'active', NOT 'trialing')
        if sub.get('status') != 'active':
            print(f"❌ Expected status='active', got: {sub.get('status')}")
            return False
        print(f"✅ status = 'active' (NOT trialing)")
        
        # Check trial_end (should be null)
        if sub.get('trial_end') is not None:
            print(f"❌ Expected trial_end=null, got: {sub.get('trial_end')}")
            return False
        print(f"✅ trial_end = null")
        
        # Check trial_used (should still be true)
        if sub.get('trial_used') != True:
            print(f"❌ Expected trial_used=true, got: {sub.get('trial_used')}")
            return False
        print(f"✅ trial_used = true (persisted)")
        
        # Check expires_at (should be ~now + 30 days)
        expires_str = sub.get('expires_at')
        if not expires_str:
            print(f"❌ expires_at is missing")
            return False
        
        if expires_str.endswith('Z'):
            expires = datetime.fromisoformat(expires_str.replace('Z', ''))
        else:
            expires = datetime.fromisoformat(expires_str.split('+')[0].split('Z')[0])
        
        expected_expires = now + timedelta(days=30)
        diff_seconds = abs((expires - expected_expires).total_seconds())
        
        if diff_seconds > 60:
            print(f"❌ expires_at not ~now + 30 days. Diff: {diff_seconds}s")
            return False
        print(f"✅ expires_at = ~now + 30 days ({expires.isoformat()})")
        
        # Check price
        if sub.get('price_usd') != 14.99:
            print(f"❌ Expected price_usd=14.99, got: {sub.get('price_usd')}")
            return False
        print(f"✅ price_usd = 14.99")
        
        print("\n✅ TEST 5 PASSED: Second activation without trial working correctly")
        return True
        
    except Exception as e:
        print(f"❌ TEST 5 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_6_lifetime_activation(session_cookie):
    """
    Test 6: LIFETIME ACTIVATION — no trial, no expiry
    """
    print("\n" + "="*80)
    print("TEST 6: LIFETIME ACTIVATION - No trial, no expiry")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/subscription/activate",
            json={"plan": "lifetime"},
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        sub = data.get('subscription')
        
        if not sub:
            print(f"❌ No subscription in response")
            return False
        
        # Check plan
        if sub.get('plan') != 'lifetime':
            print(f"❌ Expected plan='lifetime', got: {sub.get('plan')}")
            return False
        print(f"✅ plan = 'lifetime'")
        
        # Check status
        if sub.get('status') != 'active':
            print(f"❌ Expected status='active', got: {sub.get('status')}")
            return False
        print(f"✅ status = 'active'")
        
        # Check trial_end (should be null)
        if sub.get('trial_end') is not None:
            print(f"❌ Expected trial_end=null, got: {sub.get('trial_end')}")
            return False
        print(f"✅ trial_end = null")
        
        # Check expires_at (should be null for lifetime)
        if sub.get('expires_at') is not None:
            print(f"❌ Expected expires_at=null, got: {sub.get('expires_at')}")
            return False
        print(f"✅ expires_at = null (lifetime, no expiry)")
        
        # Check price
        if sub.get('price_usd') != 79:
            print(f"❌ Expected price_usd=79, got: {sub.get('price_usd')}")
            return False
        print(f"✅ price_usd = 79")
        
        # Check billing_cycle_days (should be null)
        if sub.get('billing_cycle_days') is not None:
            print(f"❌ Expected billing_cycle_days=null, got: {sub.get('billing_cycle_days')}")
            return False
        print(f"✅ billing_cycle_days = null")
        
        # Check trial_days (should be 0)
        if sub.get('trial_days') != 0:
            print(f"❌ Expected trial_days=0, got: {sub.get('trial_days')}")
            return False
        print(f"✅ trial_days = 0")
        
        print("\n✅ TEST 6 PASSED: Lifetime activation working correctly")
        return True
        
    except Exception as e:
        print(f"❌ TEST 6 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_7_invalid_plan(session_cookie):
    """
    Test 7: INVALID PLAN — should return 400
    """
    print("\n" + "="*80)
    print("TEST 7: INVALID PLAN - Should return 400")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/subscription/activate",
            json={"plan": "gibberish"},
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code != 400:
            print(f"❌ Expected 400, got {response.status_code}")
            return False
        
        data = response.json()
        if data.get('error') != 'invalid plan':
            print(f"❌ Expected error 'invalid plan', got: {data.get('error')}")
            return False
        
        print(f"✅ Correctly returns 400 with error: '{data.get('error')}'")
        print("\n✅ TEST 7 PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 7 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("BACKEND TEST SUITE: POST /api/subscription/activate")
    print("New Length-based Pricing + 7-day Trial Semantics (2026-07-10)")
    print("="*80)
    
    # Test 1: Unauthenticated (no session needed)
    results = []
    results.append(("Test 1: Unauthenticated", test_1_unauthenticated()))
    
    # Login to get session cookie for remaining tests
    session_cookie = login_and_get_session()
    if not session_cookie:
        print("\n❌ FATAL: Could not login. Aborting remaining tests.")
        return 1
    
    # Run authenticated tests
    tests = [
        ("Test 2: First activation (quarterly with trial)", lambda: test_2_first_activation_quarterly(session_cookie)),
        ("Test 3: GET /api/auth/me shows subscription_active=true", lambda: test_3_auth_me_shows_active(session_cookie)),
        ("Test 4: GET /api/subscription/status shows active=true", lambda: test_4_subscription_status_active(session_cookie)),
        ("Test 5: Second activation (monthly, no trial)", lambda: test_5_second_activation_monthly(session_cookie)),
        ("Test 6: Lifetime activation", lambda: test_6_lifetime_activation(session_cookie)),
        ("Test 7: Invalid plan", lambda: test_7_invalid_plan(session_cookie)),
    ]
    
    for name, test_func in tests:
        try:
            passed = test_func()
            results.append((name, passed))
        except Exception as e:
            print(f"\n❌ {name} crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed_count}/{total_count} tests passed ({passed_count*100//total_count}% success rate)")
    print(f"{'='*80}\n")
    
    return 0 if passed_count == total_count else 1


if __name__ == "__main__":
    sys.exit(main())
