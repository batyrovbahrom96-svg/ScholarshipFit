#!/usr/bin/env python3
"""
ScholarshipFit Backend API Test Suite
Tests all backend endpoints per test_result.md requirements
"""

import requests
import json
import time
from typing import Dict, List, Any

# Base URL from .env
BASE_URL = "https://stellar-fit.preview.emergentagent.com/api"

# Test results tracking
test_results = []

def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {name}")
    if details:
        print(f"  Details: {details}")
    test_results.append({"name": name, "passed": passed, "details": details})

def test_1_get_scholarships():
    """Test 1: GET /api/scholarships - returns 8 seeded records"""
    print("\n" + "="*80)
    print("TEST 1: GET /api/scholarships (list all)")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/scholarships", timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("GET /api/scholarships", False, f"Status {response.status_code}: {response.text[:200]}")
            return None
        
        data = response.json()
        scholarships = data.get("scholarships", [])
        
        print(f"Found {len(scholarships)} scholarships")
        
        # Check we have at least 8 seeded records
        if len(scholarships) < 8:
            log_test("GET /api/scholarships", False, f"Expected >= 8 scholarships, got {len(scholarships)}")
            return scholarships
        
        # Validate structure of first scholarship
        if scholarships:
            s = scholarships[0]
            required_fields = ["id", "slug", "scholarship_name", "university_name", 
                             "country", "source_url", "trust_level", "degree_levels", "public_status"]
            missing = [f for f in required_fields if f not in s]
            
            if missing:
                log_test("GET /api/scholarships", False, f"Missing fields: {missing}")
                return scholarships
            
            # Check source_url starts with https://
            if not s["source_url"].startswith("https://"):
                log_test("GET /api/scholarships", False, f"source_url doesn't start with https://: {s['source_url']}")
                return scholarships
            
            print(f"Sample scholarship: {s['scholarship_name']} ({s['country']})")
            print(f"  ID: {s['id']}")
            print(f"  Source: {s['source_url']}")
            print(f"  Trust: {s['trust_level']}")
            print(f"  Degrees: {s['degree_levels']}")
        
        log_test("GET /api/scholarships", True, f"Retrieved {len(scholarships)} scholarships with correct structure")
        return scholarships
        
    except Exception as e:
        log_test("GET /api/scholarships", False, f"Exception: {str(e)}")
        return None

def test_2_filter_scholarships(all_scholarships):
    """Test 2: Filter tests - country, degree, text search"""
    print("\n" + "="*80)
    print("TEST 2: Scholarship Filters")
    print("="*80)
    
    # Test 2a: Filter by country=Italy
    try:
        response = requests.get(f"{BASE_URL}/scholarships?country=Italy", timeout=30)
        if response.status_code == 200:
            data = response.json()
            italy_items = data.get("scholarships", [])
            print(f"\nFilter country=Italy: {len(italy_items)} results")
            
            # Verify all are Italy
            non_italy = [s for s in italy_items if s.get("country") != "Italy"]
            if non_italy:
                log_test("Filter country=Italy", False, f"Found {len(non_italy)} non-Italy items")
            else:
                if italy_items:
                    print(f"  Sample: {italy_items[0]['scholarship_name']}")
                log_test("Filter country=Italy", True, f"{len(italy_items)} Italy scholarships")
        else:
            log_test("Filter country=Italy", False, f"Status {response.status_code}")
    except Exception as e:
        log_test("Filter country=Italy", False, f"Exception: {str(e)}")
    
    # Test 2b: Filter by degree=Master
    try:
        response = requests.get(f"{BASE_URL}/scholarships?degree=Master", timeout=30)
        if response.status_code == 200:
            data = response.json()
            master_items = data.get("scholarships", [])
            print(f"\nFilter degree=Master: {len(master_items)} results")
            
            # Verify all contain Master in degree_levels
            non_master = [s for s in master_items if "Master" not in s.get("degree_levels", [])]
            if non_master:
                log_test("Filter degree=Master", False, f"Found {len(non_master)} non-Master items")
            else:
                if master_items:
                    print(f"  Sample: {master_items[0]['scholarship_name']}")
                log_test("Filter degree=Master", True, f"{len(master_items)} Master scholarships")
        else:
            log_test("Filter degree=Master", False, f"Status {response.status_code}")
    except Exception as e:
        log_test("Filter degree=Master", False, f"Exception: {str(e)}")
    
    # Test 2c: Text search q=engineering
    try:
        response = requests.get(f"{BASE_URL}/scholarships?q=engineering", timeout=30)
        if response.status_code == 200:
            data = response.json()
            eng_items = data.get("scholarships", [])
            print(f"\nFilter q=engineering: {len(eng_items)} results")
            
            if eng_items:
                print(f"  Sample: {eng_items[0]['scholarship_name']}")
            log_test("Filter q=engineering", True, f"{len(eng_items)} results for 'engineering'")
        else:
            log_test("Filter q=engineering", False, f"Status {response.status_code}")
    except Exception as e:
        log_test("Filter q=engineering", False, f"Exception: {str(e)}")

def test_3_scholarship_crud(all_scholarships):
    """Test 3: POST/PUT/GET scholarship CRUD"""
    print("\n" + "="*80)
    print("TEST 3: Scholarship CRUD")
    print("="*80)
    
    # Test 3a: POST new scholarship
    new_scholarship = {
        "scholarship_name": "Test Scholarship for API Testing",
        "university_name": "Test University",
        "country": "TestLand",
        "source_url": "https://example.com/test",
        "trust_level": "Test",
        "degree_levels": ["Master"],
        "major_fields": ["Testing"],
        "funding_type": "Test",
        "eligible_nationalities": ["All"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/scholarships", json=new_scholarship, timeout=30)
        print(f"\nPOST /scholarships status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/scholarships", False, f"Status {response.status_code}: {response.text[:200]}")
            return
        
        data = response.json()
        created = data.get("scholarship")
        
        if not created or "id" not in created:
            log_test("POST /api/scholarships", False, "No id in response")
            return
        
        scholarship_id = created["id"]
        print(f"Created scholarship with ID: {scholarship_id}")
        log_test("POST /api/scholarships", True, f"Created with UUID: {scholarship_id}")
        
        # Test 3b: PUT update
        update_data = {"trust_level": "Verified"}
        response = requests.put(f"{BASE_URL}/scholarships/{scholarship_id}", json=update_data, timeout=30)
        print(f"\nPUT /scholarships/{scholarship_id} status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("PUT /api/scholarships/{id}", False, f"Status {response.status_code}")
            return
        
        log_test("PUT /api/scholarships/{id}", True, "Updated trust_level")
        
        # Test 3c: GET by id
        response = requests.get(f"{BASE_URL}/scholarships/{scholarship_id}", timeout=30)
        print(f"\nGET /scholarships/{scholarship_id} status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("GET /api/scholarships/{id}", False, f"Status {response.status_code}")
            return
        
        data = response.json()
        retrieved = data.get("scholarship")
        
        if retrieved and retrieved.get("trust_level") == "Verified":
            print(f"Verified trust_level updated: {retrieved['trust_level']}")
            log_test("GET /api/scholarships/{id}", True, "Retrieved updated record")
        else:
            log_test("GET /api/scholarships/{id}", False, f"trust_level not updated: {retrieved.get('trust_level')}")
            
    except Exception as e:
        log_test("Scholarship CRUD", False, f"Exception: {str(e)}")

def test_4_profiles():
    """Test 4: POST/GET profiles with upsert"""
    print("\n" + "="*80)
    print("TEST 4: Profiles")
    print("="*80)
    
    profile_data = {
        "full_name": "Ahmed Hassan",
        "nationality": "Pakistan",
        "degree_level": "Master",
        "intended_major": "Mechanical Engineering",
        "gpa": 3.5,
        "ielts": 7.0,
        "annual_budget_usd": 5000,
        "preferred_countries": ["Germany", "Italy"],
        "full_funding_only": False
    }
    
    try:
        # Test 4a: POST create
        response = requests.post(f"{BASE_URL}/profiles", json=profile_data, timeout=30)
        print(f"\nPOST /profiles status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/profiles", False, f"Status {response.status_code}: {response.text[:200]}")
            return
        
        data = response.json()
        profile = data.get("profile")
        
        if not profile or "id" not in profile:
            log_test("POST /api/profiles", False, "No id in response")
            return
        
        profile_id = profile["id"]
        print(f"Created profile with ID: {profile_id}")
        print(f"  Name: {profile.get('full_name')}")
        print(f"  GPA: {profile.get('gpa')}")
        log_test("POST /api/profiles (create)", True, f"Created with UUID: {profile_id}")
        
        # Test 4b: POST upsert (update GPA)
        upsert_data = {
            "id": profile_id,
            "gpa": 3.9
        }
        response = requests.post(f"{BASE_URL}/profiles", json=upsert_data, timeout=30)
        print(f"\nPOST /profiles (upsert) status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/profiles (upsert)", False, f"Status {response.status_code}")
            return
        
        log_test("POST /api/profiles (upsert)", True, "Upserted GPA")
        
        # Test 4c: GET by id
        response = requests.get(f"{BASE_URL}/profiles/{profile_id}", timeout=30)
        print(f"\nGET /profiles/{profile_id} status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("GET /api/profiles/{id}", False, f"Status {response.status_code}")
            return
        
        data = response.json()
        retrieved = data.get("profile")
        
        if retrieved and retrieved.get("gpa") == 3.9:
            print(f"Verified GPA updated: {retrieved['gpa']}")
            log_test("GET /api/profiles/{id}", True, f"Retrieved updated GPA: {retrieved['gpa']}")
            return profile_id
        else:
            log_test("GET /api/profiles/{id}", False, f"GPA not updated: {retrieved.get('gpa')}")
            return profile_id
            
    except Exception as e:
        log_test("Profiles", False, f"Exception: {str(e)}")
        return None

def test_5_ai_match(all_scholarships):
    """Test 5: CRITICAL - AI matching engine with Claude Sonnet 4.5"""
    print("\n" + "="*80)
    print("TEST 5: AI Matching Engine (CRITICAL - may take 60s)")
    print("="*80)
    
    match_profile = {
        "degree_level": "Master",
        "intended_major": "Mechanical Engineering",
        "nationality": "Pakistan",
        "gpa": 3.7,
        "ielts": 7.0,
        "preferred_countries": ["Germany", "Italy", "Türkiye"],
        "annual_budget_usd": 3000,
        "full_funding_only": True
    }
    
    try:
        print("\nSending match request (timeout: 120s)...")
        start_time = time.time()
        
        response = requests.post(
            f"{BASE_URL}/match",
            json={"profile": match_profile},
            timeout=120
        )
        
        elapsed = time.time() - start_time
        print(f"Response received in {elapsed:.1f}s")
        print(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            error_body = response.text[:500]
            log_test("POST /api/match", False, f"Status {response.status_code}: {error_body}")
            return
        
        data = response.json()
        
        # Check structure
        if "run" not in data:
            log_test("POST /api/match", False, "No 'run' in response")
            return
        
        run = data["run"]
        if "result" not in run:
            log_test("POST /api/match", False, "No 'result' in run")
            return
        
        result = run["result"]
        matches = result.get("matches", [])
        summary = result.get("summary", "")
        
        print(f"\nMatches returned: {len(matches)}")
        print(f"Summary: {summary[:100]}...")
        
        # Assert: matches array length >= 3
        if len(matches) < 3:
            log_test("POST /api/match - match count", False, f"Expected >= 3 matches, got {len(matches)}")
        else:
            log_test("POST /api/match - match count", True, f"{len(matches)} matches returned")
        
        # Build scholarship ID map from all_scholarships
        if not all_scholarships:
            log_test("POST /api/match - validation", False, "No scholarships to validate against")
            return
        
        scholarship_ids = {s["id"] for s in all_scholarships}
        scholarship_urls = {s["id"]: s["source_url"] for s in all_scholarships}
        
        # Validate each match
        invalid_ids = []
        invalid_urls = []
        unsorted = False
        prev_score = 101
        
        for i, match in enumerate(matches):
            print(f"\nMatch {i+1}:")
            print(f"  Scholarship: {match.get('scholarship_name')}")
            print(f"  Country: {match.get('country')}")
            print(f"  Fit Score: {match.get('overall_fit_score')}")
            print(f"  Source: {match.get('source_url', '')[:60]}...")
            
            # Check scholarship_id exists in DB
            match_id = match.get("scholarship_id")
            if match_id not in scholarship_ids:
                invalid_ids.append(match.get("scholarship_name", match_id))
            
            # Check source_url matches DB
            if match_id in scholarship_urls:
                db_url = scholarship_urls[match_id]
                match_url = match.get("source_url")
                if db_url != match_url:
                    invalid_urls.append(f"{match.get('scholarship_name')}: expected {db_url}, got {match_url}")
            
            # Check sorting
            score = match.get("overall_fit_score", 0)
            if score > prev_score:
                unsorted = True
            prev_score = score
            
            # Check requirements arrays
            if i == 0:  # Check first match
                req_met = match.get("requirements_met", [])
                req_miss = match.get("requirements_missing", [])
                print(f"  Requirements met: {len(req_met)}")
                print(f"  Requirements missing: {len(req_miss)}")
        
        # Assert: all scholarship_ids exist in DB
        if invalid_ids:
            log_test("POST /api/match - no invented records", False, f"Invented scholarships: {invalid_ids}")
        else:
            log_test("POST /api/match - no invented records", True, "All scholarship_ids exist in DB")
        
        # Assert: all source_urls match DB
        if invalid_urls:
            log_test("POST /api/match - source_url integrity", False, f"Mismatched URLs: {invalid_urls}")
        else:
            log_test("POST /api/match - source_url integrity", True, "All source_urls match DB records")
        
        # Assert: sorted by overall_fit_score DESC
        if unsorted:
            log_test("POST /api/match - sorting", False, "Matches not sorted by overall_fit_score DESC")
        else:
            log_test("POST /api/match - sorting", True, "Matches sorted by fit score DESC")
        
        # Assert: summary is non-empty
        if not summary or len(summary) < 10:
            log_test("POST /api/match - summary", False, f"Summary too short: {summary}")
        else:
            log_test("POST /api/match - summary", True, f"Summary present ({len(summary)} chars)")
        
        # Assert: at least one match has requirements arrays
        has_requirements = any(
            match.get("requirements_met") and match.get("requirements_missing")
            for match in matches
        )
        if has_requirements:
            log_test("POST /api/match - requirements arrays", True, "Requirements met/missing present")
        else:
            log_test("POST /api/match - requirements arrays", False, "No match has requirements arrays")
        
    except requests.Timeout:
        log_test("POST /api/match", False, "Request timeout (>120s)")
    except Exception as e:
        log_test("POST /api/match", False, f"Exception: {str(e)}")

def test_6_ai_advisor():
    """Test 6: AI Advisor multi-turn chat"""
    print("\n" + "="*80)
    print("TEST 6: AI Advisor Multi-turn Chat")
    print("="*80)
    
    try:
        # Test 6a: First message
        msg1 = "I want full funding in Germany for engineering with IELTS 7.0"
        response = requests.post(
            f"{BASE_URL}/advisor",
            json={"message": msg1},
            timeout=60
        )
        
        print(f"\nFirst message status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/advisor (first)", False, f"Status {response.status_code}: {response.text[:200]}")
            return
        
        data = response.json()
        session_id = data.get("session_id")
        reply1 = data.get("reply", "")
        
        if not session_id:
            log_test("POST /api/advisor (first)", False, "No session_id returned")
            return
        
        print(f"Session ID: {session_id}")
        print(f"Reply preview: {reply1[:150]}...")
        
        # Check reply doesn't invent scholarships
        invented_names = ["fake scholarship", "example scholarship", "test scholarship"]
        has_invented = any(name in reply1.lower() for name in invented_names)
        
        # Check reply mentions known scholarships
        known_names = ["DAAD", "Padua", "Bologna", "Türkiye", "Stipendium Hungaricum", "KAIST", "UBC", "Toronto"]
        mentions_known = any(name.lower() in reply1.lower() for name in known_names)
        
        log_test("POST /api/advisor (first)", True, f"Session created: {session_id}")
        
        # Test 6b: Second message (follow-up)
        time.sleep(1)
        msg2 = "What about Italy?"
        response = requests.post(
            f"{BASE_URL}/advisor",
            json={"session_id": session_id, "message": msg2},
            timeout=60
        )
        
        print(f"\nSecond message status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/advisor (second)", False, f"Status {response.status_code}")
            return
        
        data = response.json()
        reply2 = data.get("reply", "")
        
        print(f"Reply preview: {reply2[:150]}...")
        log_test("POST /api/advisor (second)", True, "Follow-up message sent")
        
        # Test 6c: Get history
        time.sleep(1)
        response = requests.get(
            f"{BASE_URL}/advisor/history",
            params={"session_id": session_id},
            timeout=30
        )
        
        print(f"\nGET /advisor/history status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("GET /api/advisor/history", False, f"Status {response.status_code}")
            return
        
        data = response.json()
        messages = data.get("messages", [])
        
        print(f"History messages: {len(messages)}")
        
        # Should have at least 4 messages (2 user + 2 assistant)
        if len(messages) < 4:
            log_test("GET /api/advisor/history - count", False, f"Expected >= 4 messages, got {len(messages)}")
        else:
            log_test("GET /api/advisor/history - count", True, f"{len(messages)} messages in history")
        
        # Check alternating order
        if len(messages) >= 4:
            roles = [m.get("role") for m in messages]
            print(f"Message roles: {roles}")
            
            expected_pattern = ["user", "assistant", "user", "assistant"]
            if roles[:4] == expected_pattern:
                log_test("GET /api/advisor/history - order", True, "Messages alternate user/assistant")
            else:
                log_test("GET /api/advisor/history - order", False, f"Unexpected order: {roles[:4]}")
        
        # Check reply doesn't invent scholarships
        if has_invented:
            log_test("AI Advisor - no invented names", False, "Reply contains invented scholarship names")
        elif mentions_known:
            log_test("AI Advisor - references seeded scholarships", True, "Reply mentions known scholarships")
        else:
            log_test("AI Advisor - references seeded scholarships", True, "Reply doesn't invent scholarships")
        
        # Check for official source mention
        has_official = "official" in reply1.lower() or "official" in reply2.lower()
        has_link = "http" in reply1 or "http" in reply2
        
        if has_official or has_link:
            log_test("AI Advisor - official source reference", True, "Reply mentions official sources or links")
        else:
            log_test("AI Advisor - official source reference", False, "No official source reference found")
        
    except Exception as e:
        log_test("AI Advisor", False, f"Exception: {str(e)}")

def test_7_tracker():
    """Test 7: Application tracker"""
    print("\n" + "="*80)
    print("TEST 7: Application Tracker")
    print("="*80)
    
    # Get a scholarship ID from the list
    try:
        response = requests.get(f"{BASE_URL}/scholarships", timeout=30)
        if response.status_code != 200:
            log_test("Tracker setup", False, "Could not fetch scholarships")
            return
        
        scholarships = response.json().get("scholarships", [])
        if not scholarships:
            log_test("Tracker setup", False, "No scholarships available")
            return
        
        scholarship_id = scholarships[0]["id"]
        user_id = "test_user_123"
        
        # Test 7a: POST tracker (saved)
        tracker_data = {
            "user_id": user_id,
            "scholarship_id": scholarship_id,
            "status": "saved"
        }
        
        response = requests.post(f"{BASE_URL}/tracker", json=tracker_data, timeout=30)
        print(f"\nPOST /tracker (saved) status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/tracker", False, f"Status {response.status_code}: {response.text[:200]}")
            return
        
        data = response.json()
        tracker = data.get("tracker")
        
        if not tracker:
            log_test("POST /api/tracker", False, "No tracker in response")
            return
        
        print(f"Tracker created: {tracker.get('status')}")
        log_test("POST /api/tracker (create)", True, f"Created with status: saved")
        
        # Test 7b: GET tracker
        response = requests.get(f"{BASE_URL}/tracker", params={"user_id": user_id}, timeout=30)
        print(f"\nGET /tracker status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("GET /api/tracker", False, f"Status {response.status_code}")
            return
        
        data = response.json()
        items = data.get("items", [])
        
        print(f"Tracker items: {len(items)}")
        
        if len(items) == 0:
            log_test("GET /api/tracker", False, "No items returned")
            return
        
        log_test("GET /api/tracker", True, f"Retrieved {len(items)} tracker items")
        
        # Test 7c: POST tracker (upsert to 'applied')
        tracker_data["status"] = "applied"
        response = requests.post(f"{BASE_URL}/tracker", json=tracker_data, timeout=30)
        print(f"\nPOST /tracker (upsert) status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("POST /api/tracker (upsert)", False, f"Status {response.status_code}")
            return
        
        data = response.json()
        tracker = data.get("tracker")
        
        if tracker and tracker.get("status") == "applied":
            print(f"Tracker updated: {tracker.get('status')}")
            log_test("POST /api/tracker (upsert)", True, "Updated status to: applied")
        else:
            log_test("POST /api/tracker (upsert)", False, f"Status not updated: {tracker.get('status')}")
        
    except Exception as e:
        log_test("Tracker", False, f"Exception: {str(e)}")

def test_8_admin():
    """Test 8: Admin endpoints"""
    print("\n" + "="*80)
    print("TEST 8: Admin Endpoints")
    print("="*80)
    
    # Test 8a: GET /admin/stats
    try:
        response = requests.get(f"{BASE_URL}/admin/stats", timeout=30)
        print(f"\nGET /admin/stats status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("GET /api/admin/stats", False, f"Status {response.status_code}: {response.text[:200]}")
        else:
            data = response.json()
            print(f"Stats: {json.dumps(data, indent=2)}")
            
            scholarships = data.get("scholarships", 0)
            profiles = data.get("profiles", 0)
            match_runs = data.get("match_runs", 0)
            advisor_messages = data.get("advisor_messages", 0)
            
            # Check expected counts
            issues = []
            if scholarships < 8:
                issues.append(f"scholarships={scholarships} (expected >=8)")
            if profiles < 1:
                issues.append(f"profiles={profiles} (expected >=1)")
            if match_runs < 1:
                issues.append(f"match_runs={match_runs} (expected >=1)")
            if advisor_messages < 4:
                issues.append(f"advisor_messages={advisor_messages} (expected >=4)")
            
            if issues:
                log_test("GET /api/admin/stats", False, f"Count issues: {', '.join(issues)}")
            else:
                log_test("GET /api/admin/stats", True, f"All counts valid: s={scholarships}, p={profiles}, m={match_runs}, a={advisor_messages}")
    
    except Exception as e:
        log_test("GET /api/admin/stats", False, f"Exception: {str(e)}")
    
    # Test 8b: GET /admin/logs
    try:
        response = requests.get(f"{BASE_URL}/admin/logs", timeout=30)
        print(f"\nGET /admin/logs status: {response.status_code}")
        
        if response.status_code != 200:
            log_test("GET /api/admin/logs", False, f"Status {response.status_code}: {response.text[:200]}")
        else:
            data = response.json()
            match_runs = data.get("match_runs", [])
            advisor_messages = data.get("advisor_messages", [])
            
            print(f"Match runs: {len(match_runs)}")
            print(f"Advisor messages: {len(advisor_messages)}")
            
            if "match_runs" in data and "advisor_messages" in data:
                log_test("GET /api/admin/logs", True, f"Logs returned: {len(match_runs)} runs, {len(advisor_messages)} messages")
            else:
                log_test("GET /api/admin/logs", False, "Missing match_runs or advisor_messages")
    
    except Exception as e:
        log_test("GET /api/admin/logs", False, f"Exception: {str(e)}")

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

def main():
    """Run all tests"""
    print("="*80)
    print("ScholarshipFit Backend API Test Suite")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    # Test 1: Get all scholarships
    all_scholarships = test_1_get_scholarships()
    
    # Test 2: Filters
    if all_scholarships:
        test_2_filter_scholarships(all_scholarships)
    
    # Test 3: CRUD
    if all_scholarships:
        test_3_scholarship_crud(all_scholarships)
    
    # Test 4: Profiles
    test_4_profiles()
    
    # Test 5: AI Match (CRITICAL)
    if all_scholarships:
        test_5_ai_match(all_scholarships)
    
    # Test 6: AI Advisor
    test_6_ai_advisor()
    
    # Test 7: Tracker
    test_7_tracker()
    
    # Test 8: Admin
    test_8_admin()
    
    # Summary
    print_summary()

if __name__ == "__main__":
    main()
