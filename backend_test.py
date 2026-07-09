#!/usr/bin/env python3
"""
Backend API tests for ScholarshipFit - NEW FEATURES
Tests POST/DELETE /api/cabinet/documents and GET /api/scholarships (68 records)
"""

import requests
import sys
import time

# Base URL from environment
BASE_URL = "https://stellar-fit.preview.emergentagent.com/api"

def test_cabinet_documents_auth_gate():
    """
    Test 1: POST/DELETE /api/cabinet/documents - Auth gate + validation
    These endpoints require sf_session cookie. We test ONLY auth-gate behavior.
    """
    print("\n" + "="*80)
    print("TEST 1: POST/DELETE /api/cabinet/documents - Auth Gate + Validation")
    print("="*80)
    
    tests_passed = 0
    tests_total = 5
    
    # Test 1.1: POST without cookie, valid body -> 401
    try:
        print("\n[1.1] POST /api/cabinet/documents WITHOUT cookie, valid body -> expect 401")
        body = {
            "type": "transcript",
            "filename": "transcript.pdf",
            "text": "This is a sample transcript text with more than 20 characters to pass validation."
        }
        r = requests.post(f"{BASE_URL}/cabinet/documents", json=body, timeout=10)
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
    
    # Test 1.2: DELETE without cookie -> 401
    try:
        print("\n[1.2] DELETE /api/cabinet/documents?type=transcript WITHOUT cookie -> expect 401")
        r = requests.delete(f"{BASE_URL}/cabinet/documents?type=transcript", timeout=10)
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
    
    # Test 1.3: POST without cookie, invalid type -> 401 (auth check runs before validation)
    try:
        print("\n[1.3] POST WITHOUT cookie, invalid type -> expect 401 (auth before validation)")
        body = {
            "type": "invalid",
            "filename": "test.pdf",
            "text": "This is sample text with more than 20 characters."
        }
        r = requests.post(f"{BASE_URL}/cabinet/documents", json=body, timeout=10)
        if r.status_code == 401:
            print(f"✅ PASS: Got 401 (auth check runs before validation)")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 401, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test 1.4: POST with fake cookie -> 401
    try:
        print("\n[1.4] POST WITH fake cookie sf_session=fakevalue -> expect 401")
        body = {
            "type": "transcript",
            "filename": "transcript.pdf",
            "text": "This is a sample transcript text with more than 20 characters to pass validation."
        }
        cookies = {"sf_session": "fakevalue"}
        r = requests.post(f"{BASE_URL}/cabinet/documents", json=body, cookies=cookies, timeout=10)
        if r.status_code == 401:
            print(f"✅ PASS: Got 401 with fake cookie (invalid session)")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 401, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test 1.5: DELETE with no type query param and no cookie -> 401
    try:
        print("\n[1.5] DELETE /api/cabinet/documents with no type param and no cookie -> expect 401")
        r = requests.delete(f"{BASE_URL}/cabinet/documents", timeout=10)
        if r.status_code == 401:
            print(f"✅ PASS: Got 401 (auth check runs before validation)")
            tests_passed += 1
        else:
            print(f"❌ FAIL: Expected 401, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    print(f"\n{'='*80}")
    print(f"TEST 1 SUMMARY: {tests_passed}/{tests_total} tests passed")
    print(f"{'='*80}")
    
    return tests_passed, tests_total


def test_scholarships_expanded_seed():
    """
    Test 2: GET /api/scholarships - Expanded to 68 records
    """
    print("\n" + "="*80)
    print("TEST 2: GET /api/scholarships - Expanded Seed to 68 Records")
    print("="*80)
    
    tests_passed = 0
    tests_total = 7
    
    # Test 2.1: GET /api/scholarships -> count >= 60
    try:
        print("\n[2.1] GET /api/scholarships -> count should be >= 60 (currently 68)")
        r = requests.get(f"{BASE_URL}/scholarships", timeout=10)
        if r.status_code == 200:
            data = r.json()
            scholarships = data.get("scholarships", [])
            count = len(scholarships)
            print(f"    Returned {count} scholarships")
            if count >= 60:
                print(f"✅ PASS: Count {count} >= 60")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Count {count} < 60")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test 2.2: Verify required fields
    try:
        print("\n[2.2] Verify every record has: id (UUID), slug, scholarship_name, university_name, source_url (https://)")
        r = requests.get(f"{BASE_URL}/scholarships", timeout=10)
        if r.status_code == 200:
            data = r.json()
            scholarships = data.get("scholarships", [])
            all_valid = True
            for i, s in enumerate(scholarships[:5]):  # Check first 5 as sample
                if not all([s.get("id"), s.get("slug"), s.get("scholarship_name"), 
                           s.get("university_name"), s.get("source_url")]):
                    print(f"    Record {i} missing required fields")
                    all_valid = False
                if not s.get("source_url", "").startswith("https://"):
                    print(f"    Record {i} source_url doesn't start with https://")
                    all_valid = False
            if all_valid:
                print(f"✅ PASS: All sampled records have required fields with valid source_url")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Some records missing required fields or invalid source_url")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test 2.3: Filter by country=Switzerland -> count >= 3
    try:
        print("\n[2.3] GET /api/scholarships?country=Switzerland -> count >= 3")
        r = requests.get(f"{BASE_URL}/scholarships?country=Switzerland", timeout=10)
        if r.status_code == 200:
            data = r.json()
            scholarships = data.get("scholarships", [])
            count = len(scholarships)
            print(f"    Returned {count} Swiss scholarships")
            if count >= 3:
                print(f"✅ PASS: Count {count} >= 3")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Count {count} < 3")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test 2.4: Filter by degree=PhD -> count >= 5
    try:
        print("\n[2.4] GET /api/scholarships?degree=PhD -> count >= 5")
        r = requests.get(f"{BASE_URL}/scholarships?degree=PhD", timeout=10)
        if r.status_code == 200:
            data = r.json()
            scholarships = data.get("scholarships", [])
            count = len(scholarships)
            print(f"    Returned {count} PhD scholarships")
            if count >= 5:
                print(f"✅ PASS: Count {count} >= 5")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Count {count} < 5")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test 2.5: Filter by q=fellowship -> count >= 3
    try:
        print("\n[2.5] GET /api/scholarships?q=fellowship -> count >= 3")
        r = requests.get(f"{BASE_URL}/scholarships?q=fellowship", timeout=10)
        if r.status_code == 200:
            data = r.json()
            scholarships = data.get("scholarships", [])
            count = len(scholarships)
            print(f"    Returned {count} scholarships matching 'fellowship'")
            if count >= 3:
                print(f"✅ PASS: Count {count} >= 3")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Count {count} < 3")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test 2.6: Sample-check new records: epfl-excellence-fellowship
    try:
        print("\n[2.6] Sample-check: Search for slug 'epfl-excellence-fellowship'")
        r = requests.get(f"{BASE_URL}/scholarships", timeout=10)
        if r.status_code == 200:
            data = r.json()
            scholarships = data.get("scholarships", [])
            found = any(s.get("slug") == "epfl-excellence-fellowship" for s in scholarships)
            if found:
                print(f"✅ PASS: Found 'epfl-excellence-fellowship'")
                tests_passed += 1
            else:
                print(f"❌ FAIL: 'epfl-excellence-fellowship' not found")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test 2.7: Sample-check new records: ntu-ngs-singapore and hkpfs-hong-kong
    try:
        print("\n[2.7] Sample-check: Search for slugs 'ntu-ngs-singapore' and 'hkpfs-hong-kong'")
        r = requests.get(f"{BASE_URL}/scholarships", timeout=10)
        if r.status_code == 200:
            data = r.json()
            scholarships = data.get("scholarships", [])
            slugs = [s.get("slug") for s in scholarships]
            found_ntu = "ntu-ngs-singapore" in slugs
            found_hkpfs = "hkpfs-hong-kong" in slugs
            if found_ntu and found_hkpfs:
                print(f"✅ PASS: Found both 'ntu-ngs-singapore' and 'hkpfs-hong-kong'")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Missing one or both slugs (ntu: {found_ntu}, hkpfs: {found_hkpfs})")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    print(f"\n{'='*80}")
    print(f"TEST 2 SUMMARY: {tests_passed}/{tests_total} tests passed")
    print(f"{'='*80}")
    
    return tests_passed, tests_total


def test_regression_checks():
    """
    Test 3: Regression checks - Quick sanity tests
    """
    print("\n" + "="*80)
    print("TEST 3: Regression Checks - Quick Sanity Tests")
    print("="*80)
    
    tests_passed = 0
    tests_total = 3
    
    # Test 3.1: GET /api/ -> 200 OK health
    try:
        print("\n[3.1] GET /api/ -> 200 OK health check")
        r = requests.get(f"{BASE_URL}/", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok") and data.get("service") == "ScholarshipFit API":
                print(f"✅ PASS: Health check OK")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Unexpected response: {data}")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test 3.2: POST /api/readiness/parse with small TXT file -> 200
    try:
        print("\n[3.2] POST /api/readiness/parse with small TXT file -> 200")
        # Create a small text file
        from io import BytesIO
        txt_content = "This is a sample transcript with GPA 3.8 and coursework in Computer Science. " * 3
        files = {"file": ("transcript.txt", BytesIO(txt_content.encode()), "text/plain")}
        r = requests.post(f"{BASE_URL}/readiness/parse", files=files, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok") and data.get("kind") == "txt" and len(data.get("text", "")) > 0:
                print(f"✅ PASS: Parse returned ok=true, kind=txt, text extracted ({data.get('chars')} chars)")
                tests_passed += 1
            else:
                print(f"❌ FAIL: Unexpected response: {data}")
        else:
            print(f"❌ FAIL: Expected 200, got {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    # Test 3.3: POST /api/readiness with profile + scholarship_id (no docs) -> 200
    try:
        print("\n[3.3] POST /api/readiness with profile + scholarship_id (no docs) -> 200")
        # First get a scholarship ID
        r_sch = requests.get(f"{BASE_URL}/scholarships", timeout=10)
        if r_sch.status_code == 200:
            scholarships = r_sch.json().get("scholarships", [])
            if scholarships:
                scholarship_id = scholarships[0].get("id")
                profile = {
                    "nationality": "Pakistan",
                    "degree_level": "Master",
                    "intended_major": "Mechanical Engineering",
                    "gpa": 3.7,
                    "gpa_scale": 4.0,
                    "ielts": 7.0
                }
                body = {
                    "profile": profile,
                    "scholarship_id": scholarship_id
                }
                r = requests.post(f"{BASE_URL}/readiness", json=body, timeout=40)
                if r.status_code == 200:
                    data = r.json()
                    readiness = data.get("readiness", {})
                    if "score" in readiness:
                        print(f"✅ PASS: Readiness returned score={readiness.get('score')}, bucket={readiness.get('bucket')}")
                        tests_passed += 1
                    else:
                        print(f"❌ FAIL: No score in response: {data}")
                else:
                    print(f"❌ FAIL: Expected 200, got {r.status_code}: {r.text[:200]}")
            else:
                print(f"❌ FAIL: No scholarships found to test with")
        else:
            print(f"❌ FAIL: Could not fetch scholarships")
    except Exception as e:
        print(f"❌ FAIL: Exception: {e}")
    
    print(f"\n{'='*80}")
    print(f"TEST 3 SUMMARY: {tests_passed}/{tests_total} tests passed")
    print(f"{'='*80}")
    
    return tests_passed, tests_total


def main():
    print("\n" + "="*80)
    print("SCHOLARSHIPFIT BACKEND TESTING - NEW FEATURES")
    print("Testing POST/DELETE /api/cabinet/documents and GET /api/scholarships (68 records)")
    print("="*80)
    
    total_passed = 0
    total_tests = 0
    
    # Test 1: Cabinet documents auth gate
    passed, total = test_cabinet_documents_auth_gate()
    total_passed += passed
    total_tests += total
    
    # Test 2: Scholarships expanded seed
    passed, total = test_scholarships_expanded_seed()
    total_passed += passed
    total_tests += total
    
    # Test 3: Regression checks
    passed, total = test_regression_checks()
    total_passed += passed
    total_tests += total
    
    # Final summary
    print("\n" + "="*80)
    print("FINAL SUMMARY")
    print("="*80)
    print(f"Total tests passed: {total_passed}/{total_tests}")
    print(f"Success rate: {(total_passed/total_tests*100):.1f}%")
    
    if total_passed == total_tests:
        print("\n✅ ALL TESTS PASSED")
        return 0
    else:
        print(f"\n❌ {total_tests - total_passed} TEST(S) FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
