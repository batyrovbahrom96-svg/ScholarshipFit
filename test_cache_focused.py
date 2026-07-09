#!/usr/bin/env python3
"""
Focused test for cache validation after clearing cache
"""

import requests
import time
import os

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://stellar-fit.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

print("\n" + "="*80)
print("FOCUSED CACHE TEST - After clearing readiness_cache")
print("="*80 + "\n")

# Get scholarship_id
response = requests.get(f"{API_BASE}/scholarships", timeout=30)
scholarship_id = response.json()['scholarships'][0]['id']
print(f"Using scholarship_id: {scholarship_id}\n")

sample_profile = {
    "nationality": "Pakistan",
    "degree_level": "Master",
    "intended_major": "Mechanical Engineering",
    "gpa": 3.7,
    "gpa_scale": 4.0,
    "ielts": 7.0,
    "achievements": "Robotics club president, 2 conference papers"
}

test_transcript = "Unique transcript for cache test 12345. GPA: 3.7, Courses: Advanced topics in engineering."
test_essay = "Unique essay for cache test 12345. This is a personal statement about my goals."

payload = {
    "profile": sample_profile,
    "scholarship_id": scholarship_id,
    "transcript_text": test_transcript,
    "essay_text": test_essay
}

# First call - should be cache MISS (fresh Claude call)
print("[Test 1] First call - should be cache MISS (30-90s expected)")
start1 = time.time()
response1 = requests.post(f"{API_BASE}/readiness", json=payload, timeout=120)
elapsed1 = time.time() - start1
data1 = response1.json()
cached1 = data1.get('cached', False)
print(f"✓ First call: {elapsed1:.1f}s, cached={cached1}, status={response1.status_code}")

# Second call - should be cache HIT (< 2s expected)
print("\n[Test 2] Second call (same data) - should be cache HIT (< 2s expected)")
time.sleep(1)
start2 = time.time()
response2 = requests.post(f"{API_BASE}/readiness", json=payload, timeout=120)
elapsed2 = time.time() - start2
data2 = response2.json()
cached2 = data2.get('cached', False)
print(f"✓ Second call: {elapsed2:.1f}s, cached={cached2}, status={response2.status_code}")

# Third call - change transcript (should be cache MISS)
print("\n[Test 3] Third call (modified transcript) - should be cache MISS (30-90s expected)")
payload['transcript_text'] = test_transcript + " Additional content to change cache key."
start3 = time.time()
response3 = requests.post(f"{API_BASE}/readiness", json=payload, timeout=120)
elapsed3 = time.time() - start3
data3 = response3.json()
cached3 = data3.get('cached', False)
print(f"✓ Third call: {elapsed3:.1f}s, cached={cached3}, status={response3.status_code}")

print("\n" + "="*80)
print("RESULTS:")
print("="*80)
print(f"Test 1 (first call): {'✅ PASS' if not cached1 and elapsed1 > 10 else '❌ FAIL'} - cached={cached1}, time={elapsed1:.1f}s")
print(f"Test 2 (cache hit):  {'✅ PASS' if cached2 and elapsed2 < 2 else '❌ FAIL'} - cached={cached2}, time={elapsed2:.1f}s")
print(f"Test 3 (cache miss): {'✅ PASS' if not cached3 and elapsed3 > 10 else '❌ FAIL'} - cached={cached3}, time={elapsed3:.1f}s")
print("="*80 + "\n")
