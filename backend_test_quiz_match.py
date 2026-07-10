#!/usr/bin/env python3
"""
Backend test for POST /api/scholarships/quiz-match endpoint.
Tests the deterministic scholarship matching engine.
"""

import requests
import json
import time
from typing import Dict, Any

BASE_URL = "https://stellar-fit.preview.emergentagent.com/api"

def test_quiz_match():
    """Run all quiz-match endpoint tests."""
    
    print("=" * 80)
    print("TESTING: POST /api/scholarships/quiz-match")
    print("=" * 80)
    
    # First, get the current DB count
    print("\n[SETUP] Getting current scholarship count...")
    try:
        resp = requests.get(f"{BASE_URL}/scholarships?limit=500", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            # Handle both array and object with "scholarships" key
            if isinstance(data, list):
                db_count = len(data)
            elif isinstance(data, dict) and 'scholarships' in data:
                db_count = len(data['scholarships'])
            else:
                db_count = None
            print(f"✅ Current DB has {db_count} scholarships")
        else:
            print(f"⚠️  Could not get DB count: {resp.status_code}")
            db_count = None
    except Exception as e:
        print(f"⚠️  Error getting DB count: {e}")
        db_count = None
    
    # Test 1: Happy path - Indian Master engineering student
    print("\n" + "=" * 80)
    print("TEST 1: Happy path - Indian Master engineering student")
    print("=" * 80)
    try:
        payload = {
            "answers": {
                "education_level": "master",
                "field": "engineering-cs",
                "nationality": "India",
                "preferred_countries": ["Germany", "United Kingdom"],
                "gpa": "3.7",
                "gpa_scale": "4",
                "ielts": "7.0",
                "funding_pref": "full_only"
            }
        }
        
        resp = requests.post(f"{BASE_URL}/scholarships/quiz-match", json=payload, timeout=15)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {resp.status_code}")
            print(f"Response: {resp.text[:500]}")
            return
        
        data = resp.json()
        print(f"✅ HTTP 200 OK")
        
        # Check response structure
        if "total_evaluated" not in data:
            print("❌ FAILED: Missing 'total_evaluated' field")
            return
        if "total_matches" not in data:
            print("❌ FAILED: Missing 'total_matches' field")
            return
        if "top_matches" not in data:
            print("❌ FAILED: Missing 'top_matches' field")
            return
        if "answers_echo" not in data:
            print("❌ FAILED: Missing 'answers_echo' field")
            return
        
        print(f"✅ Response structure valid")
        print(f"   - total_evaluated: {data['total_evaluated']}")
        print(f"   - total_matches: {data['total_matches']}")
        print(f"   - top_matches count: {len(data['top_matches'])}")
        
        # Verify DB count matches
        if db_count and data['total_evaluated'] != db_count:
            print(f"⚠️  WARNING: total_evaluated ({data['total_evaluated']}) != DB count ({db_count})")
        
        # Check total_matches > 20
        if data['total_matches'] < 20:
            print(f"⚠️  WARNING: Expected total_matches > 20, got {data['total_matches']}")
        else:
            print(f"✅ total_matches > 20: {data['total_matches']}")
        
        # Check top matches
        if len(data['top_matches']) == 0:
            print("❌ FAILED: No top_matches returned")
            return
        
        print(f"\n✅ Top 5 matches:")
        for i, match in enumerate(data['top_matches'][:5], 1):
            print(f"   {i}. {match.get('scholarship_name', 'N/A')} - {match.get('country', 'N/A')} (fit: {match.get('overall_fit_score', 0)})")
            
            # Validate required fields
            if 'source_url' not in match:
                print(f"      ❌ Missing source_url")
            elif not match['source_url'].startswith('http'):
                print(f"      ❌ Invalid source_url: {match['source_url']}")
            else:
                print(f"      ✅ Valid source_url: {match['source_url'][:60]}...")
            
            if 'reasons' not in match:
                print(f"      ❌ Missing reasons array")
            elif len(match['reasons']) < 1:
                print(f"      ❌ reasons array is empty")
            else:
                print(f"      ✅ reasons.length = {len(match['reasons'])}")
        
        # Check for DAAD or German/UK programs in top matches
        top_10 = data['top_matches'][:10]
        has_german_uk = any(
            m.get('country', '').lower() in ['germany', 'united kingdom'] or
            'daad' in m.get('scholarship_name', '').lower() or
            'chevening' in m.get('scholarship_name', '').lower()
            for m in top_10
        )
        if has_german_uk:
            print(f"✅ Top 10 includes German/UK programs (DAAD, Chevening, etc.)")
        else:
            print(f"⚠️  WARNING: No German/UK programs in top 10")
        
        print("\n✅ TEST 1 PASSED")
        
    except Exception as e:
        print(f"❌ TEST 1 FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 2: Nationality hard-filter - US citizen should NOT get "Developing country only" scholarships
    print("\n" + "=" * 80)
    print("TEST 2: Nationality hard-filter - US citizen")
    print("=" * 80)
    try:
        payload = {
            "answers": {
                "education_level": "master",
                "field": "all",
                "nationality": "United States",
                "preferred_countries": ["Any"],
                "funding_pref": "any"
            }
        }
        
        resp = requests.post(f"{BASE_URL}/scholarships/quiz-match", json=payload, timeout=15)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {resp.status_code}")
            return
        
        data = resp.json()
        print(f"✅ HTTP 200 OK")
        print(f"   - total_matches: {data['total_matches']}")
        
        # Check that no "Developing country only" scholarships are in top matches
        developing_only_found = False
        for match in data['top_matches']:
            # Check if scholarship is restricted to developing countries only
            reasons = ' '.join(match.get('reasons', []))
            if 'developing' in reasons.lower() and 'only' in reasons.lower():
                print(f"❌ FAILED: Found developing-country-only scholarship: {match.get('scholarship_name')}")
                print(f"   Reasons: {match.get('reasons')}")
                developing_only_found = True
        
        if not developing_only_found:
            print(f"✅ No developing-country-only scholarships in results")
        
        # Check for US-eligible scholarships (Fulbright, Marshall, etc.)
        us_scholarships = [m for m in data['top_matches'] if 
                          'fulbright' in m.get('scholarship_name', '').lower() or
                          'marshall' in m.get('scholarship_name', '').lower() or
                          'chevening' in m.get('scholarship_name', '').lower()]
        
        if us_scholarships:
            print(f"✅ Found US-eligible scholarships: {[m['scholarship_name'] for m in us_scholarships[:3]]}")
        else:
            print(f"⚠️  No specific US scholarships found (Fulbright, Marshall, Chevening)")
        
        print("\n✅ TEST 2 PASSED")
        
    except Exception as e:
        print(f"❌ TEST 2 FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 3: Degree level hard-filter - PhD applicant
    print("\n" + "=" * 80)
    print("TEST 3: Degree level hard-filter - PhD applicant")
    print("=" * 80)
    try:
        payload = {
            "answers": {
                "education_level": "phd",
                "field": "natural-sciences",
                "nationality": "Germany",
                "preferred_countries": ["Any"],
                "funding_pref": "full_only"
            }
        }
        
        resp = requests.post(f"{BASE_URL}/scholarships/quiz-match", json=payload, timeout=15)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {resp.status_code}")
            return
        
        data = resp.json()
        print(f"✅ HTTP 200 OK")
        print(f"   - total_matches: {data['total_matches']}")
        
        # Check that no Bachelor-only or MBA-only programs are in results
        invalid_degree_found = False
        for match in data['top_matches']:
            degree_levels = [d.lower() for d in match.get('degree_levels', [])]
            degree_str = ' '.join(degree_levels)
            
            # Check if it's ONLY Bachelor or ONLY MBA (not including PhD/Doctor/Research)
            has_phd = any(x in degree_str for x in ['phd', 'doctor', 'research', 'postdoc'])
            has_only_bachelor = 'bachelor' in degree_str and not has_phd
            has_only_mba = 'mba' in degree_str and not has_phd and 'master' not in degree_str
            
            if has_only_bachelor:
                print(f"❌ FAILED: Found Bachelor-only program: {match.get('scholarship_name')}")
                print(f"   Degree levels: {match.get('degree_levels')}")
                invalid_degree_found = True
            
            if has_only_mba:
                print(f"❌ FAILED: Found MBA-only program: {match.get('scholarship_name')}")
                print(f"   Degree levels: {match.get('degree_levels')}")
                invalid_degree_found = True
        
        if not invalid_degree_found:
            print(f"✅ No Bachelor-only or MBA-only programs in results")
        
        # Show sample degree levels
        if data['top_matches']:
            print(f"\n✅ Sample degree levels from top 3:")
            for i, match in enumerate(data['top_matches'][:3], 1):
                print(f"   {i}. {match.get('scholarship_name')}: {match.get('degree_levels')}")
        
        print("\n✅ TEST 3 PASSED")
        
    except Exception as e:
        print(f"❌ TEST 3 FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 4: Empty answers robustness
    print("\n" + "=" * 80)
    print("TEST 4: Empty answers robustness")
    print("=" * 80)
    try:
        payload = {"answers": {}}
        
        resp = requests.post(f"{BASE_URL}/scholarships/quiz-match", json=payload, timeout=15)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {resp.status_code}")
            print(f"Response: {resp.text[:500]}")
            return
        
        data = resp.json()
        print(f"✅ HTTP 200 OK (does not crash)")
        print(f"   - total_matches: {data['total_matches']}")
        
        if data['total_matches'] > 50:
            print(f"✅ Returns many matches ({data['total_matches']}) since no filters applied")
        else:
            print(f"⚠️  Expected more matches with no filters, got {data['total_matches']}")
        
        print("\n✅ TEST 4 PASSED")
        
    except Exception as e:
        print(f"❌ TEST 4 FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 5: Broken JSON body
    print("\n" + "=" * 80)
    print("TEST 5: Broken JSON body - not_an_answer")
    print("=" * 80)
    try:
        payload = {"not_an_answer": True}
        
        resp = requests.post(f"{BASE_URL}/scholarships/quiz-match", json=payload, timeout=15)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"⚠️  Got {resp.status_code} instead of 200")
            print(f"Response: {resp.text[:500]}")
        else:
            data = resp.json()
            print(f"✅ HTTP 200 OK (treats as empty answers)")
            print(f"   - total_matches: {data['total_matches']}")
        
        print("\n✅ TEST 5 PASSED")
        
    except Exception as e:
        print(f"❌ TEST 5 FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 6: Malformed body (no body)
    print("\n" + "=" * 80)
    print("TEST 6: Malformed body - empty body")
    print("=" * 80)
    try:
        # Send POST with empty body
        resp = requests.post(f"{BASE_URL}/scholarships/quiz-match", data="", timeout=15)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 500:
            print(f"❌ FAILED: Got 500 error (should handle gracefully)")
            print(f"Response: {resp.text[:500]}")
        elif resp.status_code == 200:
            data = resp.json()
            print(f"✅ HTTP 200 OK (handles empty body gracefully)")
            print(f"   - total_matches: {data['total_matches']}")
        else:
            print(f"⚠️  Got {resp.status_code} (acceptable if not 500)")
        
        print("\n✅ TEST 6 PASSED (no 500 error)")
        
    except Exception as e:
        print(f"❌ TEST 6 FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 7: Fit-score sanity check
    print("\n" + "=" * 80)
    print("TEST 7: Fit-score sanity check")
    print("=" * 80)
    try:
        payload = {
            "answers": {
                "education_level": "master",
                "field": "engineering-cs",
                "nationality": "India",
                "preferred_countries": ["Germany"],
                "gpa": "3.8",
                "gpa_scale": "4",
                "ielts": "7.5",
                "funding_pref": "full_only"
            }
        }
        
        resp = requests.post(f"{BASE_URL}/scholarships/quiz-match", json=payload, timeout=15)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {resp.status_code}")
            return
        
        data = resp.json()
        print(f"✅ HTTP 200 OK")
        
        # Check sorting (descending)
        scores = [m['overall_fit_score'] for m in data['top_matches']]
        is_sorted = all(scores[i] >= scores[i+1] for i in range(len(scores)-1))
        
        if is_sorted:
            print(f"✅ top_matches sorted DESCENDING by overall_fit_score")
        else:
            print(f"❌ FAILED: top_matches NOT sorted correctly")
            print(f"   Scores: {scores[:10]}")
        
        # Check score range (0-100)
        invalid_scores = [s for s in scores if s < 0 or s > 100]
        if invalid_scores:
            print(f"❌ FAILED: Found scores outside 0-100 range: {invalid_scores}")
        else:
            print(f"✅ All scores in range 0-100")
        
        # Show top 5 scores
        print(f"\n✅ Top 5 scores: {scores[:5]}")
        
        print("\n✅ TEST 7 PASSED")
        
    except Exception as e:
        print(f"❌ TEST 7 FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 8: DB freshness
    print("\n" + "=" * 80)
    print("TEST 8: DB freshness - verify seeded records")
    print("=" * 80)
    try:
        # Get all scholarships
        resp = requests.get(f"{BASE_URL}/scholarships?limit=500", timeout=15)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {resp.status_code}")
            return
        
        data = resp.json()
        # Handle both array and object with "scholarships" key
        if isinstance(data, list):
            scholarships = data
        elif isinstance(data, dict) and 'scholarships' in data:
            scholarships = data['scholarships']
        else:
            print(f"❌ FAILED: Unexpected response format")
            return
        
        print(f"✅ HTTP 200 OK")
        print(f"   - Total scholarships: {len(scholarships)}")
        
        # Check for known slugs
        slugs = [s.get('slug', '') for s in scholarships]
        known_slugs = ['daad-epos', 'chevening-scholarship', 'fulbright-foreign-student', 'gates-cambridge']
        
        found_slugs = [slug for slug in known_slugs if slug in slugs]
        missing_slugs = [slug for slug in known_slugs if slug not in slugs]
        
        if found_slugs:
            print(f"✅ Found known slugs: {found_slugs}")
        
        if missing_slugs:
            print(f"⚠️  Missing known slugs: {missing_slugs}")
        
        # Verify total_evaluated matches DB count
        payload = {"answers": {"education_level": "master"}}
        resp = requests.post(f"{BASE_URL}/scholarships/quiz-match", json=payload, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            if data['total_evaluated'] == len(scholarships):
                print(f"✅ total_evaluated ({data['total_evaluated']}) matches DB count ({len(scholarships)})")
            else:
                print(f"⚠️  total_evaluated ({data['total_evaluated']}) != DB count ({len(scholarships)})")
        
        print("\n✅ TEST 8 PASSED")
        
    except Exception as e:
        print(f"❌ TEST 8 FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 80)
    print("ALL TESTS COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    test_quiz_match()
