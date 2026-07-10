#!/usr/bin/env python3
"""
Backend test suite for Regional/PPP Pricing
Tests GET /api/pricing/region and POST /api/subscription/activate with regional discounts
"""

import requests
import json
import sys
from typing import Dict, Any

# Base URL from .env
BASE_URL = "https://stellar-fit.preview.emergentagent.com/api"

# Test credentials
TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "testpass123"

# Global session cookie
session_cookie = None


def login():
    """Login and get session cookie"""
    global session_cookie
    print("\n" + "="*80)
    print("LOGGING IN")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        # Get session cookie
        cookies = response.cookies
        if 'sf_session' in cookies:
            session_cookie = cookies['sf_session']
            print(f"✅ Login successful, session cookie obtained")
            return True
        else:
            print(f"❌ No sf_session cookie in response")
            return False
            
    except Exception as e:
        print(f"❌ Login failed: {str(e)}")
        return False


def test_1a_pricing_region_no_param():
    """
    Test 1a: GET /api/pricing/region with no query param
    Expected: tier='A', discount_pct=0, base==adjusted
    """
    print("\n" + "="*80)
    print("TEST 1a: GET /api/pricing/region (no query param)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/pricing/region", timeout=10)
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        
        # Verify structure
        assert "tier" in data, "Missing tier"
        assert "discount_pct" in data, "Missing discount_pct"
        assert "plans" in data, "Missing plans"
        assert "detected_country" in data, "Missing detected_country"
        assert "detected_from" in data, "Missing detected_from"
        assert "label" in data, "Missing label"
        assert "note" in data, "Missing note"
        
        print(f"✅ Response structure valid")
        print(f"   tier: {data['tier']}")
        print(f"   discount_pct: {data['discount_pct']}")
        print(f"   detected_country: {data['detected_country']}")
        print(f"   detected_from: {data['detected_from']}")
        print(f"   label: {data['label']}")
        
        # Verify tier A (default)
        assert data['tier'] == 'A', f"Expected tier='A', got {data['tier']}"
        assert data['discount_pct'] == 0, f"Expected discount_pct=0, got {data['discount_pct']}"
        
        # Verify plans array has 4 items
        assert len(data['plans']) == 4, f"Expected 4 plans, got {len(data['plans'])}"
        print(f"✅ Plans count: {len(data['plans'])}")
        
        # Verify each plan has required fields and base==adjusted for Tier A
        for plan in data['plans']:
            assert 'key' in plan
            assert 'base_total' in plan
            assert 'base_monthly' in plan
            assert 'adjusted_total' in plan
            assert 'adjusted_monthly' in plan
            
            # For Tier A, adjusted should equal base
            assert plan['base_total'] == plan['adjusted_total'], \
                f"Plan {plan['key']}: base_total != adjusted_total for Tier A"
            assert plan['base_monthly'] == plan['adjusted_monthly'], \
                f"Plan {plan['key']}: base_monthly != adjusted_monthly for Tier A"
        
        print(f"✅ All plans have base==adjusted (Tier A, no discount)")
        
        # Print sample plan
        sample = data['plans'][0]
        print(f"\n✅ Sample plan ({sample['key']}):")
        print(f"   base_total: {sample['base_total']}")
        print(f"   adjusted_total: {sample['adjusted_total']}")
        
        print("\n✅ TEST 1a PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 1a FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_1b_pricing_region_india():
    """
    Test 1b: GET /api/pricing/region?country=IN
    Expected: tier='C', discount_pct=60, specific adjusted prices
    """
    print("\n" + "="*80)
    print("TEST 1b: GET /api/pricing/region?country=IN (Tier C, 60% off)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/pricing/region?country=IN", timeout=10)
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Verify tier C
        assert data['tier'] == 'C', f"Expected tier='C', got {data['tier']}"
        assert data['discount_pct'] == 60, f"Expected discount_pct=60, got {data['discount_pct']}"
        assert data['detected_country'] == 'IN', f"Expected detected_country='IN', got {data['detected_country']}"
        assert data['detected_from'] == 'query', f"Expected detected_from='query', got {data['detected_from']}"
        
        print(f"✅ Tier: {data['tier']}")
        print(f"✅ Discount: {data['discount_pct']}%")
        print(f"✅ Country: {data['detected_country']}")
        print(f"✅ Label: {data['label']}")
        
        # Verify specific prices for India (60% off = 40% of base)
        # Base prices: monthly=14.99, quarterly=29, half_yearly=49, lifetime=79
        # Expected adjusted (40% of base): monthly=6, quarterly=11.6, half_yearly=19.6, lifetime=31.6
        
        plans_dict = {p['key']: p for p in data['plans']}
        
        # Monthly
        monthly = plans_dict.get('monthly')
        assert monthly is not None, "Missing monthly plan"
        assert monthly['adjusted_total'] == 6.0, \
            f"Monthly adjusted_total: expected 6.0, got {monthly['adjusted_total']}"
        print(f"✅ monthly.adjusted_total = {monthly['adjusted_total']} (expected 6.0)")
        
        # Quarterly
        quarterly = plans_dict.get('quarterly')
        assert quarterly is not None, "Missing quarterly plan"
        assert quarterly['adjusted_total'] == 11.6, \
            f"Quarterly adjusted_total: expected 11.6, got {quarterly['adjusted_total']}"
        assert abs(quarterly['adjusted_monthly'] - 3.87) < 0.01, \
            f"Quarterly adjusted_monthly: expected ~3.87, got {quarterly['adjusted_monthly']}"
        print(f"✅ quarterly.adjusted_total = {quarterly['adjusted_total']} (expected 11.6)")
        print(f"✅ quarterly.adjusted_monthly = {quarterly['adjusted_monthly']} (expected ~3.87)")
        
        # Half-yearly
        half_yearly = plans_dict.get('half_yearly')
        assert half_yearly is not None, "Missing half_yearly plan"
        assert half_yearly['adjusted_total'] == 19.6, \
            f"Half-yearly adjusted_total: expected 19.6, got {half_yearly['adjusted_total']}"
        print(f"✅ half_yearly.adjusted_total = {half_yearly['adjusted_total']} (expected 19.6)")
        
        # Lifetime
        lifetime = plans_dict.get('lifetime')
        assert lifetime is not None, "Missing lifetime plan"
        assert lifetime['adjusted_total'] == 31.6, \
            f"Lifetime adjusted_total: expected 31.6, got {lifetime['adjusted_total']}"
        print(f"✅ lifetime.adjusted_total = {lifetime['adjusted_total']} (expected 31.6)")
        
        print("\n✅ TEST 1b PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 1b FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_1c_pricing_region_brazil():
    """
    Test 1c: GET /api/pricing/region?country=BR
    Expected: tier='B', discount_pct=40, specific adjusted prices
    """
    print("\n" + "="*80)
    print("TEST 1c: GET /api/pricing/region?country=BR (Tier B, 40% off)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/pricing/region?country=BR", timeout=10)
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Verify tier B
        assert data['tier'] == 'B', f"Expected tier='B', got {data['tier']}"
        assert data['discount_pct'] == 40, f"Expected discount_pct=40, got {data['discount_pct']}"
        
        print(f"✅ Tier: {data['tier']}")
        print(f"✅ Discount: {data['discount_pct']}%")
        
        # Verify specific prices for Brazil (40% off = 60% of base)
        # Expected adjusted (60% of base): monthly=8.99, quarterly=17.4, half_yearly=29.4, lifetime=47.4
        
        plans_dict = {p['key']: p for p in data['plans']}
        
        monthly = plans_dict.get('monthly')
        assert abs(monthly['adjusted_total'] - 8.99) < 0.01, \
            f"Monthly adjusted_total: expected ~8.99, got {monthly['adjusted_total']}"
        print(f"✅ monthly.adjusted_total = {monthly['adjusted_total']} (expected ~8.99)")
        
        quarterly = plans_dict.get('quarterly')
        assert abs(quarterly['adjusted_total'] - 17.4) < 0.01, \
            f"Quarterly adjusted_total: expected ~17.4, got {quarterly['adjusted_total']}"
        print(f"✅ quarterly.adjusted_total = {quarterly['adjusted_total']} (expected ~17.4)")
        
        half_yearly = plans_dict.get('half_yearly')
        assert abs(half_yearly['adjusted_total'] - 29.4) < 0.01, \
            f"Half-yearly adjusted_total: expected ~29.4, got {half_yearly['adjusted_total']}"
        print(f"✅ half_yearly.adjusted_total = {half_yearly['adjusted_total']} (expected ~29.4)")
        
        lifetime = plans_dict.get('lifetime')
        assert abs(lifetime['adjusted_total'] - 47.4) < 0.01, \
            f"Lifetime adjusted_total: expected ~47.4, got {lifetime['adjusted_total']}"
        print(f"✅ lifetime.adjusted_total = {lifetime['adjusted_total']} (expected ~47.4)")
        
        print("\n✅ TEST 1c PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 1c FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_1d_pricing_region_us():
    """
    Test 1d: GET /api/pricing/region?country=US
    Expected: tier='A', discount_pct=0, base==adjusted
    """
    print("\n" + "="*80)
    print("TEST 1d: GET /api/pricing/region?country=US (Tier A, no discount)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/pricing/region?country=US", timeout=10)
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Verify tier A
        assert data['tier'] == 'A', f"Expected tier='A', got {data['tier']}"
        assert data['discount_pct'] == 0, f"Expected discount_pct=0, got {data['discount_pct']}"
        
        print(f"✅ Tier: {data['tier']}")
        print(f"✅ Discount: {data['discount_pct']}%")
        
        # Verify base==adjusted
        for plan in data['plans']:
            assert plan['base_total'] == plan['adjusted_total'], \
                f"Plan {plan['key']}: base != adjusted for Tier A"
        
        print(f"✅ All plans have base==adjusted (no discount)")
        
        print("\n✅ TEST 1d PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 1d FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_1e_pricing_region_invalid():
    """
    Test 1e: GET /api/pricing/region?country=xx
    Expected: tier='A' fallback (invalid ISO code)
    """
    print("\n" + "="*80)
    print("TEST 1e: GET /api/pricing/region?country=xx (invalid, fallback to Tier A)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/pricing/region?country=xx", timeout=10)
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Should fallback to tier A
        assert data['tier'] == 'A', f"Expected tier='A' fallback, got {data['tier']}"
        assert data['discount_pct'] == 0, f"Expected discount_pct=0, got {data['discount_pct']}"
        
        print(f"✅ Tier: {data['tier']} (fallback to A)")
        print(f"✅ Discount: {data['discount_pct']}%")
        
        print("\n✅ TEST 1e PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 1e FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_1f_pricing_region_response_shape():
    """
    Test 1f: Verify complete response shape
    """
    print("\n" + "="*80)
    print("TEST 1f: Verify complete response shape")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/pricing/region?country=IN", timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Verify all required fields
        required_fields = ['detected_country', 'detected_from', 'tier', 'discount_pct', 'label', 'note', 'plans']
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✅ All required fields present: {required_fields}")
        
        # Verify plans structure
        for plan in data['plans']:
            required_plan_fields = ['key', 'base_total', 'base_monthly', 'adjusted_total', 'adjusted_monthly']
            for field in required_plan_fields:
                assert field in plan, f"Plan missing field: {field}"
        
        print(f"✅ All plans have required fields: {required_plan_fields}")
        
        print("\n✅ TEST 1f PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 1f FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_2a_activate_india_quarterly():
    """
    Test 2a: POST /api/subscription/activate with country_code=IN, plan=quarterly
    Expected: regional discount applied server-side
    """
    print("\n" + "="*80)
    print("TEST 2a: POST /api/subscription/activate (quarterly, IN, 60% off)")
    print("="*80)
    
    if not session_cookie:
        print("❌ No session cookie, cannot test authenticated endpoint")
        return False
    
    try:
        response = requests.post(
            f"{BASE_URL}/subscription/activate",
            json={"plan": "quarterly", "country_code": "IN"},
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        
        # Verify subscription fields
        assert 'subscription' in data, "Missing subscription in response"
        sub = data['subscription']
        
        print(f"\n✅ Subscription created:")
        print(f"   plan: {sub.get('plan')}")
        print(f"   price_usd: {sub.get('price_usd')}")
        print(f"   base_price_usd: {sub.get('base_price_usd')}")
        print(f"   monthly_rate_usd: {sub.get('monthly_rate_usd')}")
        print(f"   base_monthly_rate_usd: {sub.get('base_monthly_rate_usd')}")
        print(f"   region_tier: {sub.get('region_tier')}")
        print(f"   region_country: {sub.get('region_country')}")
        print(f"   region_discount_pct: {sub.get('region_discount_pct')}")
        
        # Verify values
        assert sub['price_usd'] == 11.6, f"Expected price_usd=11.6, got {sub['price_usd']}"
        assert sub['base_price_usd'] == 29, f"Expected base_price_usd=29, got {sub['base_price_usd']}"
        assert abs(sub['monthly_rate_usd'] - 3.87) < 0.01, \
            f"Expected monthly_rate_usd~3.87, got {sub['monthly_rate_usd']}"
        assert abs(sub['base_monthly_rate_usd'] - 9.67) < 0.01, \
            f"Expected base_monthly_rate_usd~9.67, got {sub['base_monthly_rate_usd']}"
        assert sub['region_tier'] == 'C', f"Expected region_tier='C', got {sub['region_tier']}"
        assert sub['region_country'] == 'IN', f"Expected region_country='IN', got {sub['region_country']}"
        assert sub['region_discount_pct'] == 60, f"Expected region_discount_pct=60, got {sub['region_discount_pct']}"
        
        print("\n✅ All regional pricing fields correct")
        print("\n✅ TEST 2a PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 2a FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_2b_activate_us_monthly():
    """
    Test 2b: POST /api/subscription/activate with country_code=US, plan=monthly
    Expected: no discount (Tier A)
    """
    print("\n" + "="*80)
    print("TEST 2b: POST /api/subscription/activate (monthly, US, no discount)")
    print("="*80)
    
    if not session_cookie:
        print("❌ No session cookie, cannot test authenticated endpoint")
        return False
    
    try:
        response = requests.post(
            f"{BASE_URL}/subscription/activate",
            json={"plan": "monthly", "country_code": "US"},
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        sub = data['subscription']
        
        print(f"\n✅ Subscription created:")
        print(f"   region_tier: {sub.get('region_tier')}")
        print(f"   region_discount_pct: {sub.get('region_discount_pct')}")
        print(f"   price_usd: {sub.get('price_usd')}")
        
        # Verify Tier A (no discount)
        assert sub['region_tier'] == 'A', f"Expected region_tier='A', got {sub['region_tier']}"
        assert sub['region_discount_pct'] == 0, f"Expected region_discount_pct=0, got {sub['region_discount_pct']}"
        assert sub['price_usd'] == 14.99, f"Expected price_usd=14.99, got {sub['price_usd']}"
        
        print("\n✅ Tier A pricing applied correctly (no discount)")
        print("\n✅ TEST 2b PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 2b FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_2c_activate_brazil_lifetime():
    """
    Test 2c: POST /api/subscription/activate with country_code=BR, plan=lifetime
    Expected: Tier B discount (40% off), expires_at=null
    """
    print("\n" + "="*80)
    print("TEST 2c: POST /api/subscription/activate (lifetime, BR, 40% off)")
    print("="*80)
    
    if not session_cookie:
        print("❌ No session cookie, cannot test authenticated endpoint")
        return False
    
    try:
        response = requests.post(
            f"{BASE_URL}/subscription/activate",
            json={"plan": "lifetime", "country_code": "BR"},
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        sub = data['subscription']
        
        print(f"\n✅ Subscription created:")
        print(f"   region_tier: {sub.get('region_tier')}")
        print(f"   region_discount_pct: {sub.get('region_discount_pct')}")
        print(f"   price_usd: {sub.get('price_usd')}")
        print(f"   expires_at: {sub.get('expires_at')}")
        print(f"   status: {sub.get('status')}")
        
        # Verify Tier B
        assert sub['region_tier'] == 'B', f"Expected region_tier='B', got {sub['region_tier']}"
        assert sub['region_discount_pct'] == 40, f"Expected region_discount_pct=40, got {sub['region_discount_pct']}"
        assert abs(sub['price_usd'] - 47.4) < 0.01, f"Expected price_usd~47.4, got {sub['price_usd']}"
        assert sub['expires_at'] is None, f"Expected expires_at=null for lifetime, got {sub['expires_at']}"
        assert sub['status'] == 'active', f"Expected status='active', got {sub['status']}"
        
        print("\n✅ Lifetime plan with Tier B discount applied correctly")
        print("\n✅ TEST 2c PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 2c FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_3a_regression_invalid_plan():
    """
    Test 3a: REGRESSION - Invalid plan should return 400
    """
    print("\n" + "="*80)
    print("TEST 3a: REGRESSION - Invalid plan")
    print("="*80)
    
    if not session_cookie:
        print("❌ No session cookie, cannot test authenticated endpoint")
        return False
    
    try:
        response = requests.post(
            f"{BASE_URL}/subscription/activate",
            json={"plan": "gibberish"},
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 400:
            print(f"❌ Expected 400, got {response.status_code}")
            return False
        
        data = response.json()
        assert 'error' in data, "Missing error field"
        assert 'invalid plan' in data['error'].lower(), f"Expected 'invalid plan' error, got {data['error']}"
        
        print(f"✅ Error message: {data['error']}")
        print("\n✅ TEST 3a PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 3a FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_3b_regression_unauthenticated():
    """
    Test 3b: REGRESSION - Unauthenticated request should return 401
    """
    print("\n" + "="*80)
    print("TEST 3b: REGRESSION - Unauthenticated request")
    print("="*80)
    
    try:
        response = requests.post(
            f"{BASE_URL}/subscription/activate",
            json={"plan": "monthly"},
            timeout=10
        )
        
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 401:
            print(f"❌ Expected 401, got {response.status_code}")
            return False
        
        data = response.json()
        assert 'error' in data, "Missing error field"
        assert 'not signed in' in data['error'].lower(), f"Expected 'Not signed in' error, got {data['error']}"
        
        print(f"✅ Error message: {data['error']}")
        print("\n✅ TEST 3b PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 3b FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_3c_regression_subscription_status():
    """
    Test 3c: REGRESSION - GET /api/subscription/status should return active=true
    """
    print("\n" + "="*80)
    print("TEST 3c: REGRESSION - GET /api/subscription/status")
    print("="*80)
    
    if not session_cookie:
        print("❌ No session cookie, cannot test authenticated endpoint")
        return False
    
    try:
        response = requests.get(
            f"{BASE_URL}/subscription/status",
            cookies={"sf_session": session_cookie},
            timeout=10
        )
        
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        assert 'active' in data, "Missing active field"
        assert 'subscription' in data, "Missing subscription field"
        
        print(f"✅ active: {data['active']}")
        print(f"✅ subscription.plan: {data['subscription'].get('plan')}")
        
        # Should be active after any activation
        assert data['active'] == True, f"Expected active=true, got {data['active']}"
        
        print("\n✅ TEST 3c PASSED")
        return True
        
    except Exception as e:
        print(f"❌ TEST 3c FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("BACKEND TEST SUITE: Regional/PPP Pricing")
    print("Testing GET /api/pricing/region + POST /api/subscription/activate")
    print("="*80)
    
    # Login first
    if not login():
        print("\n❌ Login failed, cannot proceed with authenticated tests")
        return 1
    
    tests = [
        ("Test 1a: GET /api/pricing/region (no param)", test_1a_pricing_region_no_param),
        ("Test 1b: GET /api/pricing/region?country=IN", test_1b_pricing_region_india),
        ("Test 1c: GET /api/pricing/region?country=BR", test_1c_pricing_region_brazil),
        ("Test 1d: GET /api/pricing/region?country=US", test_1d_pricing_region_us),
        ("Test 1e: GET /api/pricing/region?country=xx", test_1e_pricing_region_invalid),
        ("Test 1f: Response shape verification", test_1f_pricing_region_response_shape),
        ("Test 2a: Activate quarterly with IN (60% off)", test_2a_activate_india_quarterly),
        ("Test 2b: Activate monthly with US (no discount)", test_2b_activate_us_monthly),
        ("Test 2c: Activate lifetime with BR (40% off)", test_2c_activate_brazil_lifetime),
        ("Test 3a: REGRESSION - Invalid plan", test_3a_regression_invalid_plan),
        ("Test 3b: REGRESSION - Unauthenticated", test_3b_regression_unauthenticated),
        ("Test 3c: REGRESSION - Subscription status", test_3c_regression_subscription_status),
    ]
    
    results = []
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
