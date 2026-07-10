#!/usr/bin/env python3
"""
Backend test for subscription activation endpoints
Tests all subscription-related APIs according to review request
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "https://stellar-fit.preview.emergentagent.com/api"
TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "testpass123"

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")

def test_subscription_endpoints():
    print("\n" + "="*80)
    print("SUBSCRIPTION ACTIVATION ENDPOINTS TEST")
    print("="*80 + "\n")
    
    session = requests.Session()
    test_results = []
    
    # Test 1: Unauthed activate should return 401
    print("\n[Test 1] POST /api/subscription/activate without auth → expect 401")
    try:
        resp = session.post(f"{BASE_URL}/subscription/activate", json={"plan": "pro"})
        passed = resp.status_code == 401
        test_results.append(("Unauthed activate returns 401", passed))
        print_test("Unauthed activate returns 401", passed, 
                   f"Status: {resp.status_code}, Body: {resp.text[:200]}")
    except Exception as e:
        test_results.append(("Unauthed activate returns 401", False))
        print_test("Unauthed activate returns 401", False, f"Error: {e}")
    
    # Test 2: Login to get session cookie
    print("\n[Test 2] POST /api/auth/login with test credentials")
    try:
        resp = session.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        passed = resp.status_code == 200
        if passed:
            data = resp.json()
            passed = data.get("ok") == True
        test_results.append(("Login successful", passed))
        print_test("Login successful", passed, 
                   f"Status: {resp.status_code}, Body: {resp.text[:200]}")
        
        # Check if sf_session cookie is set
        has_cookie = 'sf_session' in session.cookies
        test_results.append(("Session cookie set", has_cookie))
        print_test("Session cookie set", has_cookie, 
                   f"Cookies: {list(session.cookies.keys())}")
    except Exception as e:
        test_results.append(("Login successful", False))
        test_results.append(("Session cookie set", False))
        print_test("Login successful", False, f"Error: {e}")
        print("\n⚠️  Cannot continue without login. Exiting.")
        return test_results
    
    # Test 3: Activate Pro subscription
    print("\n[Test 3] POST /api/subscription/activate with plan='pro'")
    try:
        resp = session.post(f"{BASE_URL}/subscription/activate", json={"plan": "pro"})
        passed = resp.status_code == 200
        data = resp.json() if passed else {}
        
        if passed:
            sub = data.get("subscription", {})
            checks = {
                "ok=true": data.get("ok") == True,
                "plan='pro'": sub.get("plan") == "pro",
                "status='active'": sub.get("status") == "active",
                "price_usd=9": sub.get("price_usd") == 9,
                "activated_at exists": "activated_at" in sub,
                "expires_at exists": "expires_at" in sub,
            }
            
            # Check expires_at is ~30 days from now
            if sub.get("expires_at"):
                try:
                    expires = datetime.fromisoformat(sub["expires_at"].replace("Z", "+00:00"))
                    now = datetime.now(expires.tzinfo)
                    days_diff = (expires - now).days
                    checks["expires_at ~30 days"] = 25 <= days_diff <= 35
                except:
                    checks["expires_at ~30 days"] = False
            
            all_passed = all(checks.values())
            test_results.append(("Activate Pro subscription", all_passed))
            print_test("Activate Pro subscription", all_passed, 
                       f"Checks: {checks}\nSubscription: {json.dumps(sub, indent=2)}")
        else:
            test_results.append(("Activate Pro subscription", False))
            print_test("Activate Pro subscription", False, 
                       f"Status: {resp.status_code}, Body: {resp.text[:300]}")
    except Exception as e:
        test_results.append(("Activate Pro subscription", False))
        print_test("Activate Pro subscription", False, f"Error: {e}")
    
    # Test 4: GET /api/auth/me should show subscription_active=true
    print("\n[Test 4] GET /api/auth/me → verify subscription_active=true")
    try:
        resp = session.get(f"{BASE_URL}/auth/me")
        passed = resp.status_code == 200
        data = resp.json() if passed else {}
        
        if passed:
            user = data.get("user", {})
            sub_active = user.get("subscription_active")
            passed = sub_active == True
            test_results.append(("auth/me shows subscription_active=true", passed))
            print_test("auth/me shows subscription_active=true", passed, 
                       f"subscription_active: {sub_active}, User: {json.dumps(user, indent=2)[:300]}")
        else:
            test_results.append(("auth/me shows subscription_active=true", False))
            print_test("auth/me shows subscription_active=true", False, 
                       f"Status: {resp.status_code}")
    except Exception as e:
        test_results.append(("auth/me shows subscription_active=true", False))
        print_test("auth/me shows subscription_active=true", False, f"Error: {e}")
    
    # Test 5: GET /api/subscription/status
    print("\n[Test 5] GET /api/subscription/status → verify active=true")
    try:
        resp = session.get(f"{BASE_URL}/subscription/status")
        passed = resp.status_code == 200
        data = resp.json() if passed else {}
        
        if passed:
            active = data.get("active")
            sub = data.get("subscription", {})
            checks = {
                "active=true": active == True,
                "subscription exists": sub is not None and len(sub) > 0,
                "plan='pro'": sub.get("plan") == "pro",
                "status='active'": sub.get("status") == "active",
            }
            all_passed = all(checks.values())
            test_results.append(("subscription/status returns active=true", all_passed))
            print_test("subscription/status returns active=true", all_passed, 
                       f"Checks: {checks}\nResponse: {json.dumps(data, indent=2)[:300]}")
        else:
            test_results.append(("subscription/status returns active=true", False))
            print_test("subscription/status returns active=true", False, 
                       f"Status: {resp.status_code}")
    except Exception as e:
        test_results.append(("subscription/status returns active=true", False))
        print_test("subscription/status returns active=true", False, f"Error: {e}")
    
    # Test 6: Invalid plan should return 400
    print("\n[Test 6] POST /api/subscription/activate with plan='invalid' → expect 400")
    try:
        resp = session.post(f"{BASE_URL}/subscription/activate", json={"plan": "invalid"})
        passed = resp.status_code == 400
        test_results.append(("Invalid plan returns 400", passed))
        print_test("Invalid plan returns 400", passed, 
                   f"Status: {resp.status_code}, Body: {resp.text[:200]}")
    except Exception as e:
        test_results.append(("Invalid plan returns 400", False))
        print_test("Invalid plan returns 400", False, f"Error: {e}")
    
    # Test 7: Missing plan should return 400
    print("\n[Test 7] POST /api/subscription/activate with empty body → expect 400")
    try:
        resp = session.post(f"{BASE_URL}/subscription/activate", json={})
        passed = resp.status_code == 400
        test_results.append(("Missing plan returns 400", passed))
        print_test("Missing plan returns 400", passed, 
                   f"Status: {resp.status_code}, Body: {resp.text[:200]}")
    except Exception as e:
        test_results.append(("Missing plan returns 400", False))
        print_test("Missing plan returns 400", False, f"Error: {e}")
    
    # Test 8: Activate Lifetime subscription
    print("\n[Test 8] POST /api/subscription/activate with plan='lifetime'")
    try:
        resp = session.post(f"{BASE_URL}/subscription/activate", json={"plan": "lifetime"})
        passed = resp.status_code == 200
        data = resp.json() if passed else {}
        
        if passed:
            sub = data.get("subscription", {})
            checks = {
                "ok=true": data.get("ok") == True,
                "plan='lifetime'": sub.get("plan") == "lifetime",
                "status='active'": sub.get("status") == "active",
                "price_usd=199": sub.get("price_usd") == 199,
                "expires_at is null": sub.get("expires_at") is None,
            }
            all_passed = all(checks.values())
            test_results.append(("Activate Lifetime subscription", all_passed))
            print_test("Activate Lifetime subscription", all_passed, 
                       f"Checks: {checks}\nSubscription: {json.dumps(sub, indent=2)}")
        else:
            test_results.append(("Activate Lifetime subscription", False))
            print_test("Activate Lifetime subscription", False, 
                       f"Status: {resp.status_code}, Body: {resp.text[:300]}")
    except Exception as e:
        test_results.append(("Activate Lifetime subscription", False))
        print_test("Activate Lifetime subscription", False, f"Error: {e}")
    
    # Test 9: Cancel subscription
    print("\n[Test 9] POST /api/subscription/cancel → expect 200")
    try:
        resp = session.post(f"{BASE_URL}/subscription/cancel")
        passed = resp.status_code == 200
        data = resp.json() if passed else {}
        
        if passed:
            passed = data.get("ok") == True
            test_results.append(("Cancel subscription returns ok", passed))
            print_test("Cancel subscription returns ok", passed, 
                       f"Response: {json.dumps(data, indent=2)}")
            
            # Now check status
            resp2 = session.get(f"{BASE_URL}/subscription/status")
            if resp2.status_code == 200:
                data2 = resp2.json()
                sub = data2.get("subscription", {})
                status_cancelled = sub.get("status") == "cancelled"
                has_cancelled_at = "cancelled_at" in sub
                
                # For lifetime, active might still be true even if cancelled
                # For non-lifetime, active should be false after cancellation
                active = data2.get("active")
                
                test_results.append(("After cancel: status='cancelled'", status_cancelled))
                test_results.append(("After cancel: cancelled_at exists", has_cancelled_at))
                
                print_test("After cancel: status='cancelled'", status_cancelled, 
                           f"Status: {sub.get('status')}")
                print_test("After cancel: cancelled_at exists", has_cancelled_at, 
                           f"Subscription: {json.dumps(sub, indent=2)[:300]}")
                print(f"   Note: active={active} (lifetime may still be active even when cancelled)")
        else:
            test_results.append(("Cancel subscription returns ok", False))
            print_test("Cancel subscription returns ok", False, 
                       f"Status: {resp.status_code}")
    except Exception as e:
        test_results.append(("Cancel subscription returns ok", False))
        print_test("Cancel subscription returns ok", False, f"Error: {e}")
    
    # Test 10: Activate Elite subscription
    print("\n[Test 10] POST /api/subscription/activate with plan='elite'")
    try:
        resp = session.post(f"{BASE_URL}/subscription/activate", json={"plan": "elite"})
        passed = resp.status_code == 200
        data = resp.json() if passed else {}
        
        if passed:
            sub = data.get("subscription", {})
            checks = {
                "ok=true": data.get("ok") == True,
                "plan='elite'": sub.get("plan") == "elite",
                "status='active'": sub.get("status") == "active",
                "price_usd=24": sub.get("price_usd") == 24,
            }
            all_passed = all(checks.values())
            test_results.append(("Activate Elite subscription", all_passed))
            print_test("Activate Elite subscription", all_passed, 
                       f"Checks: {checks}\nSubscription: {json.dumps(sub, indent=2)}")
        else:
            test_results.append(("Activate Elite subscription", False))
            print_test("Activate Elite subscription", False, 
                       f"Status: {resp.status_code}, Body: {resp.text[:300]}")
    except Exception as e:
        test_results.append(("Activate Elite subscription", False))
        print_test("Activate Elite subscription", False, f"Error: {e}")
    
    # Test 11: Sanity check - previous endpoints still work
    print("\n[Test 11] Sanity check: GET /api/scholarships still works")
    try:
        resp = session.get(f"{BASE_URL}/scholarships")
        passed = resp.status_code == 200
        if passed:
            data = resp.json()
            # API returns {"scholarships": [...]} not just an array
            scholarships = data.get("scholarships", []) if isinstance(data, dict) else data
            count = len(scholarships) if isinstance(scholarships, list) else 0
            passed = count > 0
            test_results.append(("Scholarships endpoint still works", passed))
            print_test("Scholarships endpoint still works", passed, 
                       f"Count: {count} scholarships")
        else:
            test_results.append(("Scholarships endpoint still works", False))
            print_test("Scholarships endpoint still works", False, 
                       f"Status: {resp.status_code}")
    except Exception as e:
        test_results.append(("Scholarships endpoint still works", False))
        print_test("Scholarships endpoint still works", False, f"Error: {e}")
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed_count = sum(1 for _, passed in test_results if passed)
    total_count = len(test_results)
    pass_rate = (passed_count / total_count * 100) if total_count > 0 else 0
    
    print(f"\nTotal: {passed_count}/{total_count} tests passed ({pass_rate:.1f}%)\n")
    
    for test_name, passed in test_results:
        status = "✅" if passed else "❌"
        print(f"{status} {test_name}")
    
    print("\n" + "="*80 + "\n")
    
    return test_results

if __name__ == "__main__":
    test_subscription_endpoints()
