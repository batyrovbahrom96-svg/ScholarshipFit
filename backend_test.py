#!/usr/bin/env python3
"""
Quick regression test for scholarship database expansion (68 → 303 records)
"""
import requests
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://stellar-fit.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

def test_scholarships_list():
    """Test 1: GET /api/scholarships?limit=500 - verify 303+ records"""
    print("\n" + "="*80)
    print("TEST 1: GET /api/scholarships?limit=500")
    print("="*80)
    
    try:
        response = requests.get(f"{API_URL}/scholarships", params={"limit": 500}, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False
        
        # Check if response is valid JSON
        try:
            data = response.json()
        except Exception as e:
            print(f"❌ FAILED: Response is not valid JSON: {e}")
            print(f"Response text: {response.text[:500]}")
            return False
        
        # Check scholarships array
        if 'scholarships' not in data:
            print(f"❌ FAILED: Response missing 'scholarships' key")
            print(f"Keys: {list(data.keys())}")
            return False
        
        scholarships = data['scholarships']
        count = len(scholarships)
        print(f"✅ Total scholarships returned: {count}")
        
        if count < 300:
            print(f"❌ FAILED: Expected >= 300 records, got {count}")
            return False
        
        print(f"✅ Record count >= 300: PASS (expected 303, got {count})")
        
        # Check required fields on first 5 records
        required_fields = ['id', 'slug', 'scholarship_name', 'country', 'source_url', 
                          'application_link', 'degree_levels', 'funding_type', 'deadline_status']
        
        print(f"\nChecking required fields on sample records...")
        for i, scholarship in enumerate(scholarships[:5]):
            missing = [f for f in required_fields if f not in scholarship]
            if missing:
                print(f"❌ FAILED: Record {i} missing fields: {missing}")
                print(f"   Record: {scholarship}")
                return False
        
        print(f"✅ All required fields present in sample records")
        
        # Check for duplicate slugs
        slugs = [s.get('slug') for s in scholarships if s.get('slug')]
        unique_slugs = set(slugs)
        
        if len(slugs) != len(unique_slugs):
            duplicates = [slug for slug in slugs if slugs.count(slug) > 1]
            print(f"❌ FAILED: Found duplicate slugs: {set(duplicates)}")
            return False
        
        print(f"✅ No duplicate slugs found ({len(unique_slugs)} unique slugs)")
        
        # Count distinct countries
        countries = set(s.get('country') for s in scholarships if s.get('country'))
        print(f"✅ Distinct countries: {len(countries)}")
        
        print(f"\n✅ TEST 1 PASSED")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_germany_filter():
    """Test 2: GET /api/scholarships?country=Germany&limit=500"""
    print("\n" + "="*80)
    print("TEST 2: GET /api/scholarships?country=Germany&limit=500")
    print("="*80)
    
    try:
        response = requests.get(f"{API_URL}/scholarships", 
                              params={"country": "Germany", "limit": 500}, 
                              timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        scholarships = data.get('scholarships', [])
        count = len(scholarships)
        
        print(f"✅ Germany scholarships returned: {count}")
        
        if count < 15:
            print(f"❌ FAILED: Expected >= 15 Germany records, got {count}")
            return False
        
        # Verify all are Germany
        non_germany = [s for s in scholarships if s.get('country') != 'Germany']
        if non_germany:
            print(f"❌ FAILED: Found {len(non_germany)} non-Germany records")
            print(f"   Examples: {[s.get('country') for s in non_germany[:3]]}")
            return False
        
        print(f"✅ All returned records have country == 'Germany'")
        print(f"✅ TEST 2 PASSED (>= 15 Germany records: {count})")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_us_filter():
    """Test 3: GET /api/scholarships?country=United States&limit=500"""
    print("\n" + "="*80)
    print("TEST 3: GET /api/scholarships?country=United States&limit=500")
    print("="*80)
    
    try:
        response = requests.get(f"{API_URL}/scholarships", 
                              params={"country": "United States", "limit": 500}, 
                              timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        scholarships = data.get('scholarships', [])
        count = len(scholarships)
        
        print(f"✅ US scholarships returned: {count}")
        
        if count < 25:
            print(f"❌ FAILED: Expected >= 25 US records, got {count}")
            return False
        
        # Verify all are United States
        non_us = [s for s in scholarships if s.get('country') != 'United States']
        if non_us:
            print(f"❌ FAILED: Found {len(non_us)} non-US records")
            print(f"   Examples: {[s.get('country') for s in non_us[:3]]}")
            return False
        
        print(f"✅ All returned records have country == 'United States'")
        print(f"✅ TEST 3 PASSED (>= 25 US records: {count})")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_health_check():
    """Test 4: GET /api/ - health check"""
    print("\n" + "="*80)
    print("TEST 4: GET /api/ - Health Check")
    print("="*80)
    
    try:
        response = requests.get(f"{API_URL}/", timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        print(f"Response: {data}")
        
        if data.get('ok') != True:
            print(f"❌ FAILED: Expected ok=true, got {data.get('ok')}")
            return False
        
        print(f"✅ TEST 4 PASSED (Health check OK)")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_cabinet_documents_auth():
    """Test 5: POST /api/cabinet/documents WITHOUT cookie - expect 401 (regression)"""
    print("\n" + "="*80)
    print("TEST 5: POST /api/cabinet/documents WITHOUT cookie - Regression Check")
    print("="*80)
    
    try:
        response = requests.post(f"{API_URL}/cabinet/documents", 
                               json={"type": "transcript", "filename": "test.txt", "text": "test content"},
                               timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 401:
            print(f"❌ FAILED: Expected 401 (Unauthorized), got {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False
        
        print(f"✅ Correctly returns 401 Unauthorized without session cookie")
        print(f"✅ TEST 5 PASSED (Auth gate working)")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: Exception occurred: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("\n" + "="*80)
    print("SCHOLARSHIP DATABASE EXPANSION REGRESSION TEST")
    print("Testing expansion from 68 → 303 records")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API URL: {API_URL}")
    
    results = []
    
    # Run all tests
    results.append(("Scholarships List (303+ records)", test_scholarships_list()))
    results.append(("Germany Filter (>= 15 records)", test_germany_filter()))
    results.append(("US Filter (>= 25 records)", test_us_filter()))
    results.append(("Health Check", test_health_check()))
    results.append(("Cabinet Auth Regression", test_cabinet_documents_auth()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed ({int(passed/total*100)}%)")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - Database expansion verified successfully!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
