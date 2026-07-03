#!/usr/bin/env python3
"""Quick test for AI endpoints only"""

import requests
import json
import time

BASE_URL = "https://stellar-fit.preview.emergentagent.com/api"

print("="*80)
print("Testing AI Match Endpoint")
print("="*80)

# Get scholarships first
response = requests.get(f"{BASE_URL}/scholarships", timeout=30)
scholarships = response.json().get("scholarships", [])
print(f"Found {len(scholarships)} scholarships in DB")

# Test AI Match
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

print("\nSending match request (timeout: 120s)...")
start_time = time.time()

try:
    response = requests.post(
        f"{BASE_URL}/match",
        json={"profile": match_profile},
        timeout=120
    )
    
    elapsed = time.time() - start_time
    print(f"Response received in {elapsed:.1f}s")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        run = data.get("run", {})
        result = run.get("result", {})
        matches = result.get("matches", [])
        summary = result.get("summary", "")
        
        print(f"\n✅ SUCCESS!")
        print(f"Matches: {len(matches)}")
        print(f"Summary: {summary[:100]}...")
        
        # Validate
        scholarship_ids = {s["id"] for s in scholarships}
        for i, match in enumerate(matches[:3]):
            print(f"\nMatch {i+1}:")
            print(f"  Name: {match.get('scholarship_name')}")
            print(f"  Country: {match.get('country')}")
            print(f"  Fit: {match.get('overall_fit_score')}")
            print(f"  ID in DB: {match.get('scholarship_id') in scholarship_ids}")
    else:
        print(f"\n❌ FAILED: {response.status_code}")
        print(response.text[:500])
        
except requests.Timeout:
    print(f"\n❌ TIMEOUT after {time.time() - start_time:.1f}s")
except Exception as e:
    print(f"\n❌ ERROR: {e}")

print("\n" + "="*80)
print("Testing AI Advisor Endpoint")
print("="*80)

try:
    response = requests.post(
        f"{BASE_URL}/advisor",
        json={"message": "I want full funding in Germany for engineering"},
        timeout=60
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        session_id = data.get("session_id")
        reply = data.get("reply", "")
        
        print(f"\n✅ SUCCESS!")
        print(f"Session: {session_id}")
        print(f"Reply: {reply[:200]}...")
    else:
        print(f"\n❌ FAILED: {response.status_code}")
        print(response.text[:500])
        
except Exception as e:
    print(f"\n❌ ERROR: {e}")

print("\n" + "="*80)
