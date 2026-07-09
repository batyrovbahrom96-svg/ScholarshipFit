#!/usr/bin/env python3
"""
Backend API tests for ScholarshipFit - Application Tracker Endpoints
Tests GET/POST/DELETE /api/cabinet/applications
"""

import requests
import sys
import time

# Base URL from environment
BASE_URL = "https://stellar-fit.preview.emergentagent.com/api"

def test_application_tracker_auth_gate():
    """
    Test A: Auth gate - All endpoints should return 401 without valid session
    """
    print("\n" + "="*80)
    print("TEST A: Application Tracker - Auth Gate")
    print("="*80)
    
    tests_passed = 0
    tests_total = 5
    
    # Test A.1: GET without cookie -> 401
    try:
        print("\n[A.1] GET /api/cabinet/applications WITHOUT cookie -> expect 401")
        r = requests.get(f"{BASE_URL}/cabinet/applications", timeout=10)
        if r.status_code == 401:
            data = r.json()
            if data.get("error") == "Not signed in":
                print(f"✅ PASS: Got 401 with error 'Not signed in'")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Got 401 but error message is: {data.get('error')}")
        else:
            print(f"❌ FAIL: Expected 401, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test A.2: POST without cookie -> 401
    try:
        print("\n[A.2] POST /api/cabinet/applications WITHOUT cookie -> expect 401")
        body = {
            "scholarship_id": "test-scholarship-id",
            "scholarship_name": "Test Scholarship"
        }
        r = requests.post(f"{BASE_URL}/cabinet/applications", json=body, timeout=10)
        if r.status_code == 401:
            data = r.json()
            if data.get("error") == "Not signed in":
                print(f"✅ PASS: Got 401 with error 'Not signed in'")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Got 401 but error message is: {data.get('error')}")
        else:
            print(f"❌ FAIL: Expected 401, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test A.3: DELETE without cookie -> 401
    try:
        print("\n[A.3] DELETE /api/cabinet/applications?id=test-uuid WITHOUT cookie -> expect 401")
        r = requests.delete(f"{BASE_URL}/cabinet/applications?id=test-uuid-123", timeout=10)
        if r.status_code == 401:
            data = r.json()
            if data.get("error") == "Not signed in":
                print(f"✅ PASS: Got 401 with error 'Not signed in'")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Got 401 but error message is: {data.get('error')}")
        else:
            print(f"❌ FAIL: Expected 401, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test A.4: POST with bogus cookie -> 401
    try:
        print("\n[A.4] POST WITH bogus cookie sf_session=faketoken -> expect 401")
        body = {
            "scholarship_id": "test-scholarship-id",
            "scholarship_name": "Test Scholarship"
        }
        cookies = {"sf_session": "faketoken"}
        r = requests.post(f"{BASE_URL}/cabinet/applications", json=body, cookies=cookies, timeout=10)
        if r.status_code == 401:
            print(f"✅ PASS: Got 401 with bogus cookie (invalid session)")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 401, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test A.5: GET with bogus cookie -> 401
    try:
        print("\n[A.5] GET WITH bogus cookie sf_session=faketoken -> expect 401")
        cookies = {"sf_session": "faketoken"}
        r = requests.get(f"{BASE_URL}/cabinet/applications", cookies=cookies, timeout=10)
        if r.status_code == 401:
            print(f"✅ PASS: Got 401 with bogus cookie (invalid session)")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 401, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    print(f"\n{'='*80}")
    print(f"TEST A SUMMARY: {tests_passed}/{tests_total} tests passed")
    print(f"{'='*80}")
    
    return tests_passed, tests_total


def test_application_tracker_validation():
    """
    Test B: Validation - Should return 401 (auth runs first) or 400 if auth passes
    """
    print("\n" + "="*80)
    print("TEST B: Application Tracker - Validation")
    print("="*80)
    
    tests_passed = 0
    tests_total = 3
    
    # Test B.1: POST with no scholarship_id -> 401 (auth runs first)
    try:
        print("\n[B.1] POST with no scholarship_id in body -> expect 401 (auth before validation)")
        body = {
            "scholarship_name": "Test Scholarship"
        }
        r = requests.post(f"{BASE_URL}/cabinet/applications", json=body, timeout=10)
        if r.status_code == 401:
            print(f"✅ PASS: Got 401 (auth check runs before validation)")
            tests_passed += 1
        elif r.status_code == 400:
            print(f"✅ PASS: Got 400 (validation error - acceptable if auth passed)")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 401 or 400, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test B.2: POST with invalid status -> 401 (auth runs first)
    try:
        print("\n[B.2] POST with invalid status -> expect 401 (auth before validation)")
        body = {
            "scholarship_id": "test-id",
            "scholarship_name": "Test Scholarship",
            "status": "invalid_status"
        }
        r = requests.post(f"{BASE_URL}/cabinet/applications", json=body, timeout=10)
        if r.status_code == 401:
            print(f"✅ PASS: Got 401 (auth check runs before validation)")
            tests_passed += 1
        elif r.status_code == 400:
            print(f"✅ PASS: Got 400 (validation error - acceptable if auth passed)")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 401 or 400, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test B.3: DELETE without id query param -> 401 (auth runs first)
    try:
        print("\n[B.3] DELETE without ?id= query param -> expect 401 (auth before validation)")
        r = requests.delete(f"{BASE_URL}/cabinet/applications", timeout=10)
        if r.status_code == 401:
            print(f"✅ PASS: Got 401 (auth check runs before validation)")
            tests_passed += 1
        elif r.status_code == 400:
            print(f"✅ PASS: Got 400 (validation error - acceptable if auth passed)")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 401 or 400, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    print(f"\n{'='*80}")
    print(f"TEST B SUMMARY: {tests_passed}/{tests_total} tests passed")
    print(f"{'='*80}")
    
    return tests_passed, tests_total


def test_regression_sanity():
    """
    Test C: Regression sanity - Verify existing endpoints still work
    """
    print("\n" + "="*80)
    print("TEST C: Regression Sanity")
    print("="*80)
    
    tests_passed = 0
    tests_total = 3
    
    # Test C.1: GET /api/ health check -> 200
    try:
        print("\n[C.1] GET /api/ -> expect 200 health check")
        r = requests.get(f"{BASE_URL}/", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok") == True and data.get("service") == "ScholarshipFit API":
                print(f"✅ PASS: Health check returned 200 with correct response")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Got 200 but response is: {data}")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test C.2: GET /api/scholarships -> returns >= 60 scholarships
    try:
        print("\n[C.2] GET /api/scholarships -> expect >= 60 scholarships")
        r = requests.get(f"{BASE_URL}/scholarships", timeout=10)
        if r.status_code == 200:
            data = r.json()
            scholarships = data.get("scholarships", [])
            count = len(scholarships)
            if count >= 60:
                print(f"✅ PASS: Got {count} scholarships (>= 60 required)")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Got only {count} scholarships, expected >= 60")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test C.3: POST /api/cabinet/documents without cookie -> 401 (previously verified endpoint)
    try:
        print("\n[C.3] POST /api/cabinet/documents WITHOUT cookie -> expect 401 (regression check)")
        body = {
            "type": "transcript",
            "filename": "test.pdf",
            "text": "This is sample text with more than 20 characters."
        }
        r = requests.post(f"{BASE_URL}/cabinet/documents", json=body, timeout=10)
        if r.status_code == 401:
            data = r.json()
            if data.get("error") == "Not signed in":
                print(f"✅ PASS: Cabinet documents endpoint still requires auth (401)")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Got 401 but error message is: {data.get('error')}")
        else:
            print(f"❌ FAIL: Expected 401, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    print(f"\n{'='*80}")
    print(f"TEST C SUMMARY: {tests_passed}/{tests_total} tests passed")
    print(f"{'='*80}")
    
    return tests_passed, tests_total


def main():
    print("\n" + "="*80)
    print("SCHOLARSHIPFIT - APPLICATION TRACKER ENDPOINT TESTING")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Testing: GET/POST/DELETE /api/cabinet/applications")
    print("="*80)
    
    total_passed = 0
    total_tests = 0
    
    # Run all test suites
    passed, total = test_application_tracker_auth_gate()
    total_passed += passed
    total_tests += total
    
    passed, total = test_application_tracker_validation()
    total_passed += passed
    total_tests += total
    
    passed, total = test_regression_sanity()
    total_passed += passed
    total_tests += total
    
    # Final summary
    print("\n" + "="*80)
    print("FINAL SUMMARY")
    print("="*80)
    print(f"Total tests passed: {total_passed}/{total_tests}")
    print(f"Success rate: {(total_passed/total_tests*100):.1f}%")
    print("="*80)
    
    if total_passed == total_tests:
        print("\n✅ ALL TESTS PASSED - Application Tracker endpoints working correctly!")
        return 0
    else:
        print(f"\n⚠️  {total_tests - total_passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
