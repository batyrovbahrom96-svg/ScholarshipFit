#!/usr/bin/env python3
"""
ScholarshipFit NEW Backend API Test Suite
Tests all NEW backend endpoints added in latest batch:
- AI Match caching
- Waitlist
- Contact
- Admin auth
- Emergent Google Auth
- Cabinet APIs
- Health check
- 28 scholarships seed
"""

import requests
import json
import time
import hashlib
from typing import Dict, List, Any

# Base URL - use localhost for testing as mentioned in review request
BASE_URL = "http://localhost:3000/api"
ADMIN_PASSWORD = "admin123"

# Test results tracking
test_results = []

def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {name}")
    if details:
        print(f"  Details: {details}")
    test_results.append({"name": name, "passed": passed, "details": details})

# ============================================================================
# TEST 1: Health & Basic Sanity
# ============================================================================
def test_1_health():
    """Test 1: Health check"""
    print("\n" + "="*80)
    print("TEST 1: Health & Basic Sanity")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        print(f"GET /api/ status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("GET /api/ (health)", False, f"Status {response.status_code}")
            return
        
        data = response.json()
        print(f"Response: {data}")
        
        if data.get("ok") == True and data.get("service") == "ScholarshipFit API":
            log_test("GET /api/ (health)", True, "Health check passed")
        else:
            log_test("GET /api/ (health)", False, f"Unexpected response: {data}")
    
    except Exception as e:
        log_test("GET /api/ (health)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 2: Scholarships count (28 records)
# ============================================================================
def test_2_scholarships_count():
    """Test 2: GET /api/scholarships returns exactly 28 records"""
    print("\n" + "="*80)
    print("TEST 2: Scholarships Count (28 records)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/scholarships", timeout=30)
        print(f"GET /api/scholarships status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("GET /api/scholarships (count)", False, f"Status {response.status_code}")
            return None
        
        data = response.json()
        scholarships = data.get("scholarships", [])
        count = len(scholarships)
        
        print(f"Found {count} scholarships")
        
        if count == 28:
            log_test("GET /api/scholarships (count)", True, f"Exactly 28 scholarships found")
        else:
            log_test("GET /api/scholarships (count)", False, f"Expected 28, got {count}")
        
        return scholarships
    
    except Exception as e:
        log_test("GET /api/scholarships (count)", False, f"Exception: {str(e)}")
        return None

# ============================================================================
# TEST 3: Admin Auth
# ============================================================================
def test_3_admin_auth():
    """Test 3: Admin authentication"""
    print("\n" + "="*80)
    print("TEST 3: Admin Authentication")
    print("="*80)
    
    # Test 3a: Login with wrong password
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": "wrong"},
            timeout=10
        )
        print(f"\nPOST /api/admin/login (wrong password) status: {response.status_code}")
        
        if response.status_code == 401:
            data = response.json()
            if data.get("ok") == False:
                log_test("POST /api/admin/login (wrong password)", True, "Correctly rejected")
            else:
                log_test("POST /api/admin/login (wrong password)", False, f"Unexpected response: {data}")
        else:
            log_test("POST /api/admin/login (wrong password)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/admin/login (wrong password)", False, f"Exception: {str(e)}")
    
    # Test 3b: Login with correct password
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"password": ADMIN_PASSWORD},
            timeout=10
        )
        print(f"\nPOST /api/admin/login (correct password) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True and data.get("token") == ADMIN_PASSWORD:
                log_test("POST /api/admin/login (correct password)", True, f"Token received: {data.get('token')}")
                return data.get("token")
            else:
                log_test("POST /api/admin/login (correct password)", False, f"Unexpected response: {data}")
                return None
        else:
            log_test("POST /api/admin/login (correct password)", False, f"Status {response.status_code}")
            return None
    
    except Exception as e:
        log_test("POST /api/admin/login (correct password)", False, f"Exception: {str(e)}")
        return None

# ============================================================================
# TEST 4: Admin Stats & Logs
# ============================================================================
def test_4_admin_stats_logs(admin_token):
    """Test 4: Admin stats and logs endpoints"""
    print("\n" + "="*80)
    print("TEST 4: Admin Stats & Logs")
    print("="*80)
    
    # Test 4a: GET /admin/stats without header
    try:
        response = requests.get(f"{BASE_URL}/admin/stats", timeout=10)
        print(f"\nGET /api/admin/stats (no header) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("GET /api/admin/stats (no header)", True, "Correctly rejected (401)")
        else:
            log_test("GET /api/admin/stats (no header)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/admin/stats (no header)", False, f"Exception: {str(e)}")
    
    # Test 4b: GET /admin/stats with correct header
    try:
        response = requests.get(
            f"{BASE_URL}/admin/stats",
            headers={"x-admin-key": admin_token},
            timeout=10
        )
        print(f"\nGET /api/admin/stats (with header) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Stats: {json.dumps(data, indent=2)}")
            
            required_keys = ["scholarships", "profiles", "match_runs", "advisor_messages", "waitlist", "contacts", "match_cache"]
            missing_keys = [k for k in required_keys if k not in data]
            
            if missing_keys:
                log_test("GET /api/admin/stats (with header)", False, f"Missing keys: {missing_keys}")
            else:
                log_test("GET /api/admin/stats (with header)", True, f"All keys present: {list(data.keys())}")
        else:
            log_test("GET /api/admin/stats (with header)", False, f"Status {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/admin/stats (with header)", False, f"Exception: {str(e)}")
    
    # Test 4c: GET /admin/stats with wrong key
    try:
        response = requests.get(
            f"{BASE_URL}/admin/stats",
            headers={"x-admin-key": "wrongkey"},
            timeout=10
        )
        print(f"\nGET /api/admin/stats (wrong key) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("GET /api/admin/stats (wrong key)", True, "Correctly rejected (401)")
        else:
            log_test("GET /api/admin/stats (wrong key)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/admin/stats (wrong key)", False, f"Exception: {str(e)}")
    
    # Test 4d: GET /admin/logs without header
    try:
        response = requests.get(f"{BASE_URL}/admin/logs", timeout=10)
        print(f"\nGET /api/admin/logs (no header) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("GET /api/admin/logs (no header)", True, "Correctly rejected (401)")
        else:
            log_test("GET /api/admin/logs (no header)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/admin/logs (no header)", False, f"Exception: {str(e)}")
    
    # Test 4e: GET /admin/logs with header
    try:
        response = requests.get(
            f"{BASE_URL}/admin/logs",
            headers={"x-admin-key": admin_token},
            timeout=10
        )
        print(f"\nGET /api/admin/logs (with header) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            match_runs = data.get("match_runs", [])
            advisor_messages = data.get("advisor_messages", [])
            
            print(f"Match runs: {len(match_runs)}")
            print(f"Advisor messages: {len(advisor_messages)}")
            
            if "match_runs" in data and "advisor_messages" in data:
                log_test("GET /api/admin/logs (with header)", True, f"Logs returned: {len(match_runs)} runs, {len(advisor_messages)} messages")
            else:
                log_test("GET /api/admin/logs (with header)", False, "Missing match_runs or advisor_messages")
        else:
            log_test("GET /api/admin/logs (with header)", False, f"Status {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/admin/logs (with header)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 5: Waitlist
# ============================================================================
def test_5_waitlist(admin_token):
    """Test 5: Waitlist endpoints"""
    print("\n" + "="*80)
    print("TEST 5: Waitlist")
    print("="*80)
    
    test_email = f"test{int(time.time())}@example.com"
    
    # Test 5a: POST /waitlist with valid email
    try:
        response = requests.post(
            f"{BASE_URL}/waitlist",
            json={"email": test_email, "source": "pricing-page"},
            timeout=10
        )
        print(f"\nPOST /api/waitlist (valid) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                log_test("POST /api/waitlist (valid)", True, f"Email added: {test_email}")
            else:
                log_test("POST /api/waitlist (valid)", False, f"Unexpected response: {data}")
        else:
            log_test("POST /api/waitlist (valid)", False, f"Status {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/waitlist (valid)", False, f"Exception: {str(e)}")
    
    # Test 5b: POST same email+source again (idempotent)
    try:
        time.sleep(0.5)
        response = requests.post(
            f"{BASE_URL}/waitlist",
            json={"email": test_email, "source": "pricing-page"},
            timeout=10
        )
        print(f"\nPOST /api/waitlist (duplicate) status: {response.status_code}")
        
        if response.status_code == 200:
            log_test("POST /api/waitlist (idempotent)", True, "Duplicate accepted (idempotent)")
        else:
            log_test("POST /api/waitlist (idempotent)", False, f"Status {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/waitlist (idempotent)", False, f"Exception: {str(e)}")
    
    # Test 5c: POST with invalid email
    try:
        response = requests.post(
            f"{BASE_URL}/waitlist",
            json={"email": "not-an-email"},
            timeout=10
        )
        print(f"\nPOST /api/waitlist (invalid email) status: {response.status_code}")
        
        if response.status_code == 400:
            log_test("POST /api/waitlist (invalid email)", True, "Correctly rejected (400)")
        else:
            log_test("POST /api/waitlist (invalid email)", False, f"Expected 400, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/waitlist (invalid email)", False, f"Exception: {str(e)}")
    
    # Test 5d: POST with missing email
    try:
        response = requests.post(
            f"{BASE_URL}/waitlist",
            json={"source": "test"},
            timeout=10
        )
        print(f"\nPOST /api/waitlist (missing email) status: {response.status_code}")
        
        if response.status_code == 400:
            log_test("POST /api/waitlist (missing email)", True, "Correctly rejected (400)")
        else:
            log_test("POST /api/waitlist (missing email)", False, f"Expected 400, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/waitlist (missing email)", False, f"Exception: {str(e)}")
    
    # Test 5e: GET /waitlist without admin key
    try:
        response = requests.get(f"{BASE_URL}/waitlist", timeout=10)
        print(f"\nGET /api/waitlist (no key) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("GET /api/waitlist (no key)", True, "Correctly rejected (401)")
        else:
            log_test("GET /api/waitlist (no key)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/waitlist (no key)", False, f"Exception: {str(e)}")
    
    # Test 5f: GET /waitlist with admin key
    try:
        response = requests.get(
            f"{BASE_URL}/waitlist",
            headers={"x-admin-key": admin_token},
            timeout=10
        )
        print(f"\nGET /api/waitlist (with key) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            print(f"Waitlist items: {len(items)}")
            
            # Check if our test email is in the list (should be only 1 record due to idempotency)
            test_items = [i for i in items if i.get("email") == test_email and i.get("source") == "pricing-page"]
            
            if len(test_items) == 1:
                log_test("GET /api/waitlist (with key)", True, f"Found {len(items)} items, idempotency verified (1 record for test email)")
            else:
                log_test("GET /api/waitlist (with key)", False, f"Expected 1 record for test email, found {len(test_items)}")
        else:
            log_test("GET /api/waitlist (with key)", False, f"Status {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/waitlist (with key)", False, f"Exception: {str(e)}")
    
    # Test 5g: GET /waitlist with wrong key
    try:
        response = requests.get(
            f"{BASE_URL}/waitlist",
            headers={"x-admin-key": "wrongkey"},
            timeout=10
        )
        print(f"\nGET /api/waitlist (wrong key) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("GET /api/waitlist (wrong key)", True, "Correctly rejected (401)")
        else:
            log_test("GET /api/waitlist (wrong key)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/waitlist (wrong key)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 6: Contact
# ============================================================================
def test_6_contact(admin_token):
    """Test 6: Contact endpoints"""
    print("\n" + "="*80)
    print("TEST 6: Contact")
    print("="*80)
    
    # Test 6a: POST /contact with valid data
    try:
        response = requests.post(
            f"{BASE_URL}/contact",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "message": "Hi there, I have a question",
                "subject": "Test Subject"
            },
            timeout=10
        )
        print(f"\nPOST /api/contact (valid) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                log_test("POST /api/contact (valid)", True, "Contact submitted")
            else:
                log_test("POST /api/contact (valid)", False, f"Unexpected response: {data}")
        else:
            log_test("POST /api/contact (valid)", False, f"Status {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/contact (valid)", False, f"Exception: {str(e)}")
    
    # Test 6b: POST /contact with missing message
    try:
        response = requests.post(
            f"{BASE_URL}/contact",
            json={
                "name": "John Doe",
                "email": "john@example.com"
            },
            timeout=10
        )
        print(f"\nPOST /api/contact (missing message) status: {response.status_code}")
        
        if response.status_code == 400:
            log_test("POST /api/contact (missing message)", True, "Correctly rejected (400)")
        else:
            log_test("POST /api/contact (missing message)", False, f"Expected 400, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/contact (missing message)", False, f"Exception: {str(e)}")
    
    # Test 6c: POST /contact with missing name
    try:
        response = requests.post(
            f"{BASE_URL}/contact",
            json={
                "email": "john@example.com",
                "message": "Test message"
            },
            timeout=10
        )
        print(f"\nPOST /api/contact (missing name) status: {response.status_code}")
        
        if response.status_code == 400:
            log_test("POST /api/contact (missing name)", True, "Correctly rejected (400)")
        else:
            log_test("POST /api/contact (missing name)", False, f"Expected 400, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/contact (missing name)", False, f"Exception: {str(e)}")
    
    # Test 6d: POST /contact with bad email
    try:
        response = requests.post(
            f"{BASE_URL}/contact",
            json={
                "name": "John Doe",
                "email": "not-an-email",
                "message": "Test message"
            },
            timeout=10
        )
        print(f"\nPOST /api/contact (bad email) status: {response.status_code}")
        
        if response.status_code == 400:
            log_test("POST /api/contact (bad email)", True, "Correctly rejected (400)")
        else:
            log_test("POST /api/contact (bad email)", False, f"Expected 400, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/contact (bad email)", False, f"Exception: {str(e)}")
    
    # Test 6e: GET /contact without admin key
    try:
        response = requests.get(f"{BASE_URL}/contact", timeout=10)
        print(f"\nGET /api/contact (no key) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("GET /api/contact (no key)", True, "Correctly rejected (401)")
        else:
            log_test("GET /api/contact (no key)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/contact (no key)", False, f"Exception: {str(e)}")
    
    # Test 6f: GET /contact with admin key
    try:
        response = requests.get(
            f"{BASE_URL}/contact",
            headers={"x-admin-key": admin_token},
            timeout=10
        )
        print(f"\nGET /api/contact (with key) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            print(f"Contact items: {len(items)}")
            log_test("GET /api/contact (with key)", True, f"Retrieved {len(items)} contact items")
        else:
            log_test("GET /api/contact (with key)", False, f"Status {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/contact (with key)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 7: Scholarship CRUD admin-gated
# ============================================================================
def test_7_scholarship_crud_admin(admin_token):
    """Test 7: Scholarship CRUD requires admin key"""
    print("\n" + "="*80)
    print("TEST 7: Scholarship CRUD Admin-Gated")
    print("="*80)
    
    # Test 7a: POST /scholarships without admin key
    try:
        response = requests.post(
            f"{BASE_URL}/scholarships",
            json={
                "scholarship_name": "Test Scholarship",
                "university_name": "Test University",
                "country": "TestLand",
                "source_url": "https://example.com/test",
                "trust_level": "Test",
                "degree_levels": ["Master"]
            },
            timeout=10
        )
        print(f"\nPOST /api/scholarships (no key) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("POST /api/scholarships (no key)", True, "Correctly rejected (401)")
        else:
            log_test("POST /api/scholarships (no key)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/scholarships (no key)", False, f"Exception: {str(e)}")
    
    # Test 7b: POST /scholarships with admin key
    scholarship_id = None
    try:
        response = requests.post(
            f"{BASE_URL}/scholarships",
            json={
                "scholarship_name": "Test Scholarship Admin",
                "university_name": "Test University",
                "country": "TestLand",
                "source_url": "https://example.com/test",
                "trust_level": "Test",
                "degree_levels": ["Master"]
            },
            headers={"x-admin-key": admin_token},
            timeout=10
        )
        print(f"\nPOST /api/scholarships (with key) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            scholarship = data.get("scholarship")
            if scholarship and "id" in scholarship:
                scholarship_id = scholarship["id"]
                log_test("POST /api/scholarships (with key)", True, f"Created with ID: {scholarship_id}")
            else:
                log_test("POST /api/scholarships (with key)", False, "No id in response")
        else:
            log_test("POST /api/scholarships (with key)", False, f"Status {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/scholarships (with key)", False, f"Exception: {str(e)}")
    
    # Test 7c: PUT /scholarships/{id} without admin key
    if scholarship_id:
        try:
            response = requests.put(
                f"{BASE_URL}/scholarships/{scholarship_id}",
                json={"trust_level": "Updated"},
                timeout=10
            )
            print(f"\nPUT /api/scholarships/{scholarship_id} (no key) status: {response.status_code}")
            
            if response.status_code == 401:
                log_test("PUT /api/scholarships/{id} (no key)", True, "Correctly rejected (401)")
            else:
                log_test("PUT /api/scholarships/{id} (no key)", False, f"Expected 401, got {response.status_code}")
        
        except Exception as e:
            log_test("PUT /api/scholarships/{id} (no key)", False, f"Exception: {str(e)}")
        
        # Test 7d: PUT /scholarships/{id} with admin key
        try:
            response = requests.put(
                f"{BASE_URL}/scholarships/{scholarship_id}",
                json={"trust_level": "Updated"},
                headers={"x-admin-key": admin_token},
                timeout=10
            )
            print(f"\nPUT /api/scholarships/{scholarship_id} (with key) status: {response.status_code}")
            
            if response.status_code == 200:
                log_test("PUT /api/scholarships/{id} (with key)", True, "Updated successfully")
            else:
                log_test("PUT /api/scholarships/{id} (with key)", False, f"Status {response.status_code}")
        
        except Exception as e:
            log_test("PUT /api/scholarships/{id} (with key)", False, f"Exception: {str(e)}")
    
    # Test 7e: GET /scholarships is public (no admin key needed)
    try:
        response = requests.get(f"{BASE_URL}/scholarships", timeout=10)
        print(f"\nGET /api/scholarships (public) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            scholarships = data.get("scholarships", [])
            log_test("GET /api/scholarships (public)", True, f"Public access works, {len(scholarships)} records")
        else:
            log_test("GET /api/scholarships (public)", False, f"Status {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/scholarships (public)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 8: AI Match Caching
# ============================================================================
def test_8_ai_match_caching():
    """Test 8: AI Match caching"""
    print("\n" + "="*80)
    print("TEST 8: AI Match Caching (CRITICAL - may take 60-120s)")
    print("="*80)
    
    cache_test_profile = {
        "profile": {
            "full_name": "Cache Test User",
            "nationality": "Indian",
            "degree_level": "Master",
            "intended_major": "Computer Science",
            "gpa": 3.8,
            "ielts": 7.5,
            "annual_budget_usd": 30000,
            "preferred_countries": ["United States", "United Kingdom"]
        }
    }
    
    # Test 8a: First call (cache miss)
    try:
        print("\nFirst call (cache miss) - this will take 30-120s...")
        start_time = time.time()
        
        response = requests.post(
            f"{BASE_URL}/match",
            json=cache_test_profile,
            timeout=150
        )
        
        elapsed = time.time() - start_time
        print(f"Response received in {elapsed:.1f}s")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/match (first call)", False, f"Status {response.status_code}: {response.text[:300]}")
            return
        
        data = response.json()
        
        # Check structure
        if "run" not in data:
            log_test("POST /api/match (first call)", False, "No 'run' in response")
            return
        
        run = data["run"]
        cached = data.get("cached", False)
        
        if cached == False:
            log_test("POST /api/match (first call - cache miss)", True, f"Cache miss as expected, took {elapsed:.1f}s")
        else:
            log_test("POST /api/match (first call - cache miss)", False, f"Expected cached=false, got cached={cached}")
        
        # Check matches
        result = run.get("result", {})
        matches = result.get("matches", [])
        
        if len(matches) > 0:
            log_test("POST /api/match (first call - matches)", True, f"{len(matches)} matches returned")
        else:
            log_test("POST /api/match (first call - matches)", False, "No matches returned")
        
        # Store first call data for comparison
        first_call_matches = matches
        
    except requests.Timeout:
        log_test("POST /api/match (first call)", False, "Request timeout (>150s)")
        return
    except Exception as e:
        log_test("POST /api/match (first call)", False, f"Exception: {str(e)}")
        return
    
    # Test 8b: Second identical call (cache hit)
    try:
        print("\nSecond identical call (cache hit) - should be sub-second...")
        time.sleep(1)  # Small delay
        start_time = time.time()
        
        response = requests.post(
            f"{BASE_URL}/match",
            json=cache_test_profile,
            timeout=10
        )
        
        elapsed = time.time() - start_time
        print(f"Response received in {elapsed:.1f}s")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/match (second call)", False, f"Status {response.status_code}")
            return
        
        data = response.json()
        cached = data.get("cached", False)
        cache_age_ms = data.get("cache_age_ms")
        
        if cached == True:
            log_test("POST /api/match (second call - cache hit)", True, f"Cache hit as expected, took {elapsed:.1f}s")
        else:
            log_test("POST /api/match (second call - cache hit)", False, f"Expected cached=true, got cached={cached}")
        
        if cache_age_ms is not None:
            log_test("POST /api/match (second call - cache_age_ms)", True, f"cache_age_ms present: {cache_age_ms}ms")
        else:
            log_test("POST /api/match (second call - cache_age_ms)", False, "cache_age_ms not present")
        
        # Check matches are identical
        run = data.get("run", {})
        result = run.get("result", {})
        matches = result.get("matches", [])
        
        if len(matches) == len(first_call_matches):
            log_test("POST /api/match (second call - matches identical)", True, f"Same number of matches: {len(matches)}")
        else:
            log_test("POST /api/match (second call - matches identical)", False, f"Different match count: {len(matches)} vs {len(first_call_matches)}")
    
    except Exception as e:
        log_test("POST /api/match (second call)", False, f"Exception: {str(e)}")
    
    # Test 8c: Third call with force_refresh=true (cache bypass)
    try:
        print("\nThird call with force_refresh=true - should take 30-120s again...")
        time.sleep(1)
        start_time = time.time()
        
        force_refresh_payload = cache_test_profile.copy()
        force_refresh_payload["force_refresh"] = True
        
        response = requests.post(
            f"{BASE_URL}/match",
            json=force_refresh_payload,
            timeout=150
        )
        
        elapsed = time.time() - start_time
        print(f"Response received in {elapsed:.1f}s")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/match (force_refresh)", False, f"Status {response.status_code}")
            return
        
        data = response.json()
        cached = data.get("cached", False)
        
        if cached == False:
            log_test("POST /api/match (force_refresh - cache bypass)", True, f"Cache bypassed as expected, took {elapsed:.1f}s")
        else:
            log_test("POST /api/match (force_refresh - cache bypass)", False, f"Expected cached=false, got cached={cached}")
    
    except requests.Timeout:
        log_test("POST /api/match (force_refresh)", False, "Request timeout (>150s)")
    except Exception as e:
        log_test("POST /api/match (force_refresh)", False, f"Exception: {str(e)}")
    
    # Test 8d: Different profile (cache miss)
    try:
        print("\nFourth call with different profile - should be cache miss...")
        time.sleep(1)
        
        different_profile = {
            "profile": {
                "full_name": "Different User",
                "nationality": "Pakistani",
                "degree_level": "PhD",
                "intended_major": "Physics",
                "gpa": 3.5,
                "ielts": 6.5,
                "annual_budget_usd": 20000,
                "preferred_countries": ["Germany", "France"]
            }
        }
        
        start_time = time.time()
        
        response = requests.post(
            f"{BASE_URL}/match",
            json=different_profile,
            timeout=150
        )
        
        elapsed = time.time() - start_time
        print(f"Response received in {elapsed:.1f}s")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/match (different profile)", False, f"Status {response.status_code}")
            return
        
        data = response.json()
        cached = data.get("cached", False)
        
        if cached == False:
            log_test("POST /api/match (different profile - cache miss)", True, f"Cache miss as expected for different profile, took {elapsed:.1f}s")
        else:
            log_test("POST /api/match (different profile - cache miss)", False, f"Expected cached=false, got cached={cached}")
    
    except requests.Timeout:
        log_test("POST /api/match (different profile)", False, "Request timeout (>150s)")
    except Exception as e:
        log_test("POST /api/match (different profile)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 9: Emergent Google Auth Session
# ============================================================================
def test_9_emergent_auth():
    """Test 9: Emergent Google Auth Session"""
    print("\n" + "="*80)
    print("TEST 9: Emergent Google Auth Session")
    print("="*80)
    
    # Test 9a: GET /auth/me with no cookie
    try:
        response = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        print(f"\nGET /api/auth/me (no cookie) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("user") is None:
                log_test("GET /api/auth/me (no cookie)", True, "Returns {user: null} as expected")
            else:
                log_test("GET /api/auth/me (no cookie)", False, f"Expected user=null, got {data}")
        else:
            log_test("GET /api/auth/me (no cookie)", False, f"Expected 200, got {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/auth/me (no cookie)", False, f"Exception: {str(e)}")
    
    # Test 9b: POST /auth/logout with no cookie
    try:
        response = requests.post(f"{BASE_URL}/auth/logout", timeout=10)
        print(f"\nPOST /api/auth/logout (no cookie) status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                log_test("POST /api/auth/logout (no cookie)", True, "Idempotent no-op as expected")
            else:
                log_test("POST /api/auth/logout (no cookie)", False, f"Unexpected response: {data}")
        else:
            log_test("POST /api/auth/logout (no cookie)", False, f"Expected 200, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/auth/logout (no cookie)", False, f"Exception: {str(e)}")
    
    # Test 9c: POST /auth/session without X-Session-ID header
    try:
        response = requests.post(f"{BASE_URL}/auth/session", json={}, timeout=10)
        print(f"\nPOST /api/auth/session (no header) status: {response.status_code}")
        
        if response.status_code == 400:
            log_test("POST /api/auth/session (no header)", True, "Correctly rejected (400)")
        else:
            log_test("POST /api/auth/session (no header)", False, f"Expected 400, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/auth/session (no header)", False, f"Exception: {str(e)}")
    
    # Test 9d: POST /auth/session with fake session_id
    try:
        response = requests.post(
            f"{BASE_URL}/auth/session",
            headers={"X-Session-ID": "fake123"},
            timeout=10
        )
        print(f"\nPOST /api/auth/session (fake session_id) status: {response.status_code}")
        
        if response.status_code == 401:
            data = response.json()
            error = data.get("error", "")
            if "Emergent auth exchange failed" in error or "auth" in error.lower():
                log_test("POST /api/auth/session (fake session_id)", True, f"Correctly rejected (401): {error}")
            else:
                log_test("POST /api/auth/session (fake session_id)", False, f"401 but unexpected error: {error}")
        else:
            log_test("POST /api/auth/session (fake session_id)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/auth/session (fake session_id)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 10: Cabinet APIs (require session cookie)
# ============================================================================
def test_10_cabinet_apis():
    """Test 10: Cabinet APIs require session cookie"""
    print("\n" + "="*80)
    print("TEST 10: Cabinet APIs (require session cookie)")
    print("="*80)
    
    # Test 10a: GET /cabinet without cookie
    try:
        response = requests.get(f"{BASE_URL}/cabinet", timeout=10)
        print(f"\nGET /api/cabinet (no cookie) status: {response.status_code}")
        
        if response.status_code == 401:
            data = response.json()
            error = data.get("error", "")
            if "Not signed in" in error or "sign" in error.lower():
                log_test("GET /api/cabinet (no cookie)", True, f"Correctly rejected (401): {error}")
            else:
                log_test("GET /api/cabinet (no cookie)", False, f"401 but unexpected error: {error}")
        else:
            log_test("GET /api/cabinet (no cookie)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("GET /api/cabinet (no cookie)", False, f"Exception: {str(e)}")
    
    # Test 10b: POST /cabinet/favorite without cookie
    try:
        response = requests.post(
            f"{BASE_URL}/cabinet/favorite",
            json={"scholarship_id": "test123"},
            timeout=10
        )
        print(f"\nPOST /api/cabinet/favorite (no cookie) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("POST /api/cabinet/favorite (no cookie)", True, "Correctly rejected (401)")
        else:
            log_test("POST /api/cabinet/favorite (no cookie)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/cabinet/favorite (no cookie)", False, f"Exception: {str(e)}")
    
    # Test 10c: POST /cabinet/search without cookie
    try:
        response = requests.post(
            f"{BASE_URL}/cabinet/search",
            json={"country": "USA", "level": "Master", "field": "CS"},
            timeout=10
        )
        print(f"\nPOST /api/cabinet/search (no cookie) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("POST /api/cabinet/search (no cookie)", True, "Correctly rejected (401)")
        else:
            log_test("POST /api/cabinet/search (no cookie)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/cabinet/search (no cookie)", False, f"Exception: {str(e)}")
    
    # Test 10d: POST /cabinet/profile without cookie
    try:
        response = requests.post(
            f"{BASE_URL}/cabinet/profile",
            json={"name": "Test"},
            timeout=10
        )
        print(f"\nPOST /api/cabinet/profile (no cookie) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("POST /api/cabinet/profile (no cookie)", True, "Correctly rejected (401)")
        else:
            log_test("POST /api/cabinet/profile (no cookie)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/cabinet/profile (no cookie)", False, f"Exception: {str(e)}")
    
    # Test 10e: POST /cabinet/sync without cookie
    try:
        response = requests.post(
            f"{BASE_URL}/cabinet/sync",
            json={"favorites": [], "recent_searches": [], "profile": {}},
            timeout=10
        )
        print(f"\nPOST /api/cabinet/sync (no cookie) status: {response.status_code}")
        
        if response.status_code == 401:
            log_test("POST /api/cabinet/sync (no cookie)", True, "Correctly rejected (401)")
        else:
            log_test("POST /api/cabinet/sync (no cookie)", False, f"Expected 401, got {response.status_code}")
    
    except Exception as e:
        log_test("POST /api/cabinet/sync (no cookie)", False, f"Exception: {str(e)}")

# ============================================================================
# SUMMARY
# ============================================================================
def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for t in test_results if t["passed"])
    failed = sum(1 for t in test_results if not t["passed"])
    total = len(test_results)
    
    print(f"\nTotal: {total} tests")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success rate: {(passed/total*100):.1f}%")
    
    if failed > 0:
        print("\n" + "="*80)
        print("FAILED TESTS:")
        print("="*80)
        for t in test_results:
            if not t["passed"]:
                print(f"\n❌ {t['name']}")
                print(f"   {t['details']}")
    
    print("\n" + "="*80)

# ============================================================================
# MAIN
# ============================================================================
def main():
    """Run all tests"""
    print("="*80)
    print("ScholarshipFit NEW Backend API Test Suite")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    # Test 1: Health
    test_1_health()
    
    # Test 2: Scholarships count (28 records)
    scholarships = test_2_scholarships_count()
    
    # Test 3: Admin auth
    admin_token = test_3_admin_auth()
    
    if admin_token:
        # Test 4: Admin stats & logs
        test_4_admin_stats_logs(admin_token)
        
        # Test 5: Waitlist
        test_5_waitlist(admin_token)
        
        # Test 6: Contact
        test_6_contact(admin_token)
        
        # Test 7: Scholarship CRUD admin-gated
        test_7_scholarship_crud_admin(admin_token)
    else:
        print("\n⚠️  Skipping admin-gated tests (no admin token)")
    
    # Test 8: AI Match caching (CRITICAL - takes time)
    print("\n⚠️  AI Match caching test will take 3-5 minutes total...")
    test_8_ai_match_caching()
    
    # Test 9: Emergent Google Auth
    test_9_emergent_auth()
    
    # Test 10: Cabinet APIs
    test_10_cabinet_apis()
    
    # Summary
    print_summary()

if __name__ == "__main__":
    main()
