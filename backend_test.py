#!/usr/bin/env python3
"""
Backend API Testing for ScholarshipFit - Document Parsing & Readiness Endpoints
Tests POST /api/readiness/parse and POST /api/readiness with transcript/essay support
"""

import requests
import time
import json
import io
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from docx import Document

# Base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://stellar-fit.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

print(f"\n{'='*80}")
print(f"BACKEND API TESTING - Document Parsing & Readiness Endpoints")
print(f"Base URL: {API_BASE}")
print(f"{'='*80}\n")

# Test counters
total_tests = 0
passed_tests = 0
failed_tests = 0

def test_result(name, passed, detail=""):
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    if passed:
        passed_tests += 1
        print(f"✅ PASS: {name}")
        if detail:
            print(f"   {detail}")
    else:
        failed_tests += 1
        print(f"❌ FAIL: {name}")
        if detail:
            print(f"   {detail}")

# ============================================================================
# HELPER: Generate test documents
# ============================================================================

def generate_pdf_with_text(text):
    """Generate a PDF with the given text using reportlab"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(100, 750, text)
    c.save()
    buffer.seek(0)
    return buffer

def generate_docx_with_text(text):
    """Generate a DOCX with the given text using python-docx"""
    buffer = io.BytesIO()
    doc = Document()
    doc.add_paragraph(text)
    doc.save(buffer)
    buffer.seek(0)
    return buffer

def generate_txt_with_text(text):
    """Generate a TXT file with the given text"""
    return io.BytesIO(text.encode('utf-8'))

# ============================================================================
# TEST SUITE 1: POST /api/readiness/parse (Document Text Extraction)
# ============================================================================

print("\n" + "="*80)
print("TEST SUITE 1: POST /api/readiness/parse (Document Text Extraction)")
print("="*80 + "\n")

# Test 1.1: Upload TXT file with >= 50 chars
print("\n[Test 1.1] Upload TXT file with >= 50 chars")
try:
    txt_content = "This is a test transcript with sufficient content to pass validation. It contains more than 50 characters."
    txt_file = generate_txt_with_text(txt_content)
    files = {'file': ('test_transcript.txt', txt_file, 'text/plain')}
    response = requests.post(f"{API_BASE}/readiness/parse", files=files, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('ok') and data.get('kind') == 'txt' and data.get('text') == txt_content:
            test_result("TXT upload (>= 50 chars)", True, f"Extracted {data.get('chars')} chars correctly")
        else:
            test_result("TXT upload (>= 50 chars)", False, f"Response: {data}")
    else:
        test_result("TXT upload (>= 50 chars)", False, f"Status {response.status_code}: {response.text[:200]}")
except Exception as e:
    test_result("TXT upload (>= 50 chars)", False, f"Exception: {str(e)}")

# Test 1.2: Upload PDF with text
print("\n[Test 1.2] Upload PDF with text containing GPA")
try:
    pdf_content = "Academic Transcript: GPA: 3.75, Courses: Linear Algebra, Machine Learning, Data Structures"
    pdf_file = generate_pdf_with_text(pdf_content)
    files = {'file': ('test_transcript.pdf', pdf_file, 'application/pdf')}
    response = requests.post(f"{API_BASE}/readiness/parse", files=files, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('ok') and data.get('kind') == 'pdf' and 'GPA' in data.get('text', ''):
            test_result("PDF upload with GPA text", True, f"Extracted {data.get('chars')} chars, contains 'GPA'")
        else:
            test_result("PDF upload with GPA text", False, f"Text missing GPA: {data.get('text', '')[:100]}")
    else:
        test_result("PDF upload with GPA text", False, f"Status {response.status_code}: {response.text[:200]}")
except Exception as e:
    test_result("PDF upload with GPA text", False, f"Exception: {str(e)}")

# Test 1.3: Upload DOCX with paragraph
print("\n[Test 1.3] Upload DOCX with paragraph")
try:
    docx_content = "This is my personal statement. I am passionate about engineering and have completed several projects in robotics and machine learning. My goal is to pursue a Master's degree in Mechanical Engineering."
    docx_file = generate_docx_with_text(docx_content)
    files = {'file': ('test_essay.docx', docx_file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    response = requests.post(f"{API_BASE}/readiness/parse", files=files, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('ok') and data.get('kind') == 'docx' and len(data.get('text', '')) > 0:
            test_result("DOCX upload with paragraph", True, f"Extracted {data.get('chars')} chars")
        else:
            test_result("DOCX upload with paragraph", False, f"Response: {data}")
    else:
        test_result("DOCX upload with paragraph", False, f"Status {response.status_code}: {response.text[:200]}")
except Exception as e:
    test_result("DOCX upload with paragraph", False, f"Exception: {str(e)}")

# Test 1.4: Upload TXT with < 20 chars (should fail with 422)
print("\n[Test 1.4] Upload TXT with < 20 chars (should return 422)")
try:
    tiny_txt = generate_txt_with_text("hi")
    files = {'file': ('tiny.txt', tiny_txt, 'text/plain')}
    response = requests.post(f"{API_BASE}/readiness/parse", files=files, timeout=30)
    
    if response.status_code == 422:
        data = response.json()
        if 'readable text' in data.get('error', '').lower():
            test_result("TXT < 20 chars returns 422", True, f"Error: {data.get('error')}")
        else:
            test_result("TXT < 20 chars returns 422", False, f"Wrong error message: {data}")
    else:
        test_result("TXT < 20 chars returns 422", False, f"Expected 422, got {response.status_code}")
except Exception as e:
    test_result("TXT < 20 chars returns 422", False, f"Exception: {str(e)}")

# Test 1.5: Upload unsupported file type (.exe)
print("\n[Test 1.5] Upload unsupported file type (.exe)")
try:
    fake_exe = io.BytesIO(b"MZ\x90\x00")  # Fake EXE header
    files = {'file': ('malware.exe', fake_exe, 'application/x-msdownload')}
    response = requests.post(f"{API_BASE}/readiness/parse", files=files, timeout=30)
    
    if response.status_code == 400:
        data = response.json()
        if 'unsupported' in data.get('error', '').lower():
            test_result("Unsupported file type returns 400", True, f"Error: {data.get('error')}")
        else:
            test_result("Unsupported file type returns 400", False, f"Wrong error: {data}")
    else:
        test_result("Unsupported file type returns 400", False, f"Expected 400, got {response.status_code}")
except Exception as e:
    test_result("Unsupported file type returns 400", False, f"Exception: {str(e)}")

# Test 1.6: POST with no file field
print("\n[Test 1.6] POST with no file field (should return 400)")
try:
    response = requests.post(f"{API_BASE}/readiness/parse", data={}, timeout=30)
    
    if response.status_code == 400:
        data = response.json()
        if 'file' in data.get('error', '').lower():
            test_result("No file field returns 400", True, f"Error: {data.get('error')}")
        else:
            test_result("No file field returns 400", False, f"Wrong error: {data}")
    else:
        test_result("No file field returns 400", False, f"Expected 400, got {response.status_code}")
except Exception as e:
    test_result("No file field returns 400", False, f"Exception: {str(e)}")

# ============================================================================
# TEST SUITE 2: POST /api/readiness (Enhanced with transcript_text and essay_text)
# ============================================================================

print("\n" + "="*80)
print("TEST SUITE 2: POST /api/readiness (Enhanced with transcript/essay support)")
print("="*80 + "\n")

# First, get a valid scholarship_id
print("\n[Setup] Getting valid scholarship_id from GET /api/scholarships")
scholarship_id = None
try:
    response = requests.get(f"{API_BASE}/scholarships", timeout=30)
    if response.status_code == 200:
        data = response.json()
        scholarships = data.get('scholarships', [])
        if scholarships:
            scholarship_id = scholarships[0]['id']
            print(f"✓ Got scholarship_id: {scholarship_id} ({scholarships[0].get('scholarship_name', 'Unknown')})")
        else:
            print("❌ No scholarships found in database")
    else:
        print(f"❌ Failed to get scholarships: {response.status_code}")
except Exception as e:
    print(f"❌ Exception getting scholarships: {str(e)}")

if not scholarship_id:
    print("\n❌ CRITICAL: Cannot proceed with readiness tests without scholarship_id")
else:
    # Sample profile from review request
    sample_profile = {
        "nationality": "Pakistan",
        "degree_level": "Master",
        "intended_major": "Mechanical Engineering",
        "gpa": 3.7,
        "gpa_scale": 4.0,
        "ielts": 7.0,
        "achievements": "Robotics club president, 2 conference papers"
    }

    # Test 2.1: Call WITHOUT transcript_text/essay_text
    print("\n[Test 2.1] POST /api/readiness WITHOUT transcript_text/essay_text (30-90s)")
    print("⏳ This will take 30-90 seconds (real Claude API call)...")
    try:
        start_time = time.time()
        payload = {
            "profile": sample_profile,
            "scholarship_id": scholarship_id
        }
        response = requests.post(f"{API_BASE}/readiness", json=payload, timeout=120)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            readiness = data.get('readiness', {})
            score = readiness.get('score')
            bucket = readiness.get('bucket')
            essay_feedback = readiness.get('essay_feedback')
            transcript_signals = readiness.get('transcript_signals')
            
            checks = []
            checks.append(("score is integer 0-100", isinstance(score, int) and 0 <= score <= 100))
            checks.append(("bucket is valid", bucket in ['Strong', 'Competitive', 'Reach', 'Long-shot']))
            checks.append(("essay_feedback is null", essay_feedback is None))
            checks.append(("transcript_signals is null", transcript_signals is None))
            
            all_passed = all(c[1] for c in checks)
            details = f"Elapsed: {elapsed:.1f}s, Score: {score}, Bucket: {bucket}"
            for check_name, check_result in checks:
                details += f"\n   - {check_name}: {'✓' if check_result else '✗'}"
            
            test_result("Readiness WITHOUT documents", all_passed, details)
        else:
            test_result("Readiness WITHOUT documents", False, f"Status {response.status_code}: {response.text[:300]}")
    except Exception as e:
        test_result("Readiness WITHOUT documents", False, f"Exception: {str(e)}")

    # Test 2.2: Call WITH transcript_text
    print("\n[Test 2.2] POST /api/readiness WITH transcript_text (30-90s)")
    print("⏳ This will take 30-90 seconds (real Claude API call)...")
    try:
        start_time = time.time()
        transcript_text = """
        Academic Transcript - University of Engineering and Technology, Lahore
        
        Student: Test Student
        Program: Bachelor of Science in Mechanical Engineering
        
        Semester 1 (Fall 2020):
        - Calculus I: A (4.0)
        - Physics I: A- (3.7)
        - Engineering Drawing: B+ (3.3)
        - Introduction to Programming: A (4.0)
        Semester GPA: 3.75
        
        Semester 2 (Spring 2021):
        - Calculus II: A (4.0)
        - Physics II: A (4.0)
        - Linear Algebra: A- (3.7)
        - Thermodynamics: B+ (3.3)
        Semester GPA: 3.75
        
        Cumulative GPA: 3.75 / 4.0
        Class Rank: Top 10%
        """
        
        payload = {
            "profile": sample_profile,
            "scholarship_id": scholarship_id,
            "transcript_text": transcript_text
        }
        response = requests.post(f"{API_BASE}/readiness", json=payload, timeout=120)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            readiness = data.get('readiness', {})
            transcript_signals = readiness.get('transcript_signals')
            
            checks = []
            if transcript_signals:
                checks.append(("transcript_signals exists", True))
                checks.append(("gpa_verified present", 'gpa_verified' in transcript_signals))
                checks.append(("course_rigor present", 'course_rigor' in transcript_signals))
                checks.append(("trend present", 'trend' in transcript_signals))
                checks.append(("notes present", 'notes' in transcript_signals))
            else:
                checks.append(("transcript_signals exists", False))
            
            all_passed = all(c[1] for c in checks)
            details = f"Elapsed: {elapsed:.1f}s"
            for check_name, check_result in checks:
                details += f"\n   - {check_name}: {'✓' if check_result else '✗'}"
            if transcript_signals:
                details += f"\n   - Signals: {json.dumps(transcript_signals, indent=2)}"
            
            test_result("Readiness WITH transcript_text", all_passed, details)
        else:
            test_result("Readiness WITH transcript_text", False, f"Status {response.status_code}: {response.text[:300]}")
    except Exception as e:
        test_result("Readiness WITH transcript_text", False, f"Exception: {str(e)}")

    # Test 2.3: Call WITH essay_text
    print("\n[Test 2.3] POST /api/readiness WITH essay_text (30-90s)")
    print("⏳ This will take 30-90 seconds (real Claude API call)...")
    try:
        start_time = time.time()
        essay_text = """
        Personal Statement for Master's in Mechanical Engineering
        
        My passion for mechanical engineering began in my childhood when I would disassemble and reassemble household appliances to understand their inner workings. This curiosity evolved into a dedicated pursuit of engineering excellence during my undergraduate studies at the University of Engineering and Technology, Lahore.
        
        As president of the Robotics Club, I led a team of 15 students in developing an autonomous navigation system for agricultural robots. Our project won first place at the National Engineering Competition 2022 and has been featured in two international conferences. This experience taught me the importance of interdisciplinary collaboration and innovative problem-solving.
        
        I have published two conference papers on machine learning applications in predictive maintenance, which sparked my interest in pursuing graduate research. My goal is to contribute to sustainable manufacturing technologies that can address global challenges in resource efficiency and environmental impact.
        
        I am particularly drawn to your program because of its strong focus on advanced manufacturing and robotics research. I believe my background in both theoretical foundations and practical applications makes me a strong candidate for this scholarship.
        """
        
        payload = {
            "profile": sample_profile,
            "scholarship_id": scholarship_id,
            "essay_text": essay_text
        }
        response = requests.post(f"{API_BASE}/readiness", json=payload, timeout=120)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            readiness = data.get('readiness', {})
            essay_feedback = readiness.get('essay_feedback')
            
            checks = []
            if essay_feedback:
                checks.append(("essay_feedback exists", True))
                checks.append(("clarity present (0-100)", isinstance(essay_feedback.get('clarity'), int)))
                checks.append(("specificity present (0-100)", isinstance(essay_feedback.get('specificity'), int)))
                checks.append(("alignment present (0-100)", isinstance(essay_feedback.get('alignment'), int)))
                checks.append(("notes present", 'notes' in essay_feedback))
            else:
                checks.append(("essay_feedback exists", False))
            
            all_passed = all(c[1] for c in checks)
            details = f"Elapsed: {elapsed:.1f}s"
            for check_name, check_result in checks:
                details += f"\n   - {check_name}: {'✓' if check_result else '✗'}"
            if essay_feedback:
                details += f"\n   - Feedback: {json.dumps(essay_feedback, indent=2)}"
            
            test_result("Readiness WITH essay_text", all_passed, details)
        else:
            test_result("Readiness WITH essay_text", False, f"Status {response.status_code}: {response.text[:300]}")
    except Exception as e:
        test_result("Readiness WITH essay_text", False, f"Exception: {str(e)}")

    # Test 2.4: Cache validation - call twice with SAME data
    print("\n[Test 2.4] Cache validation - call twice with SAME profile+scholarship+transcript+essay")
    print("⏳ First call will take 30-90s, second should be < 2s...")
    try:
        test_transcript = "Test transcript for cache validation. GPA: 3.7, Courses: Advanced topics."
        test_essay = "Test essay for cache validation. This is a personal statement about my goals and achievements."
        
        payload = {
            "profile": sample_profile,
            "scholarship_id": scholarship_id,
            "transcript_text": test_transcript,
            "essay_text": test_essay
        }
        
        # First call
        start1 = time.time()
        response1 = requests.post(f"{API_BASE}/readiness", json=payload, timeout=120)
        elapsed1 = time.time() - start1
        
        if response1.status_code != 200:
            test_result("Cache validation (first call)", False, f"Status {response1.status_code}")
        else:
            data1 = response1.json()
            cached1 = data1.get('cached', False)
            
            # Second call (should be cached)
            time.sleep(1)  # Small delay
            start2 = time.time()
            response2 = requests.post(f"{API_BASE}/readiness", json=payload, timeout=120)
            elapsed2 = time.time() - start2
            
            if response2.status_code != 200:
                test_result("Cache validation", False, f"Second call failed: {response2.status_code}")
            else:
                data2 = response2.json()
                cached2 = data2.get('cached', False)
                
                checks = []
                checks.append(("First call cached=false", cached1 == False))
                checks.append(("Second call cached=true", cached2 == True))
                checks.append(("Second call < 2s", elapsed2 < 2.0))
                
                all_passed = all(c[1] for c in checks)
                details = f"First: {elapsed1:.1f}s (cached={cached1}), Second: {elapsed2:.1f}s (cached={cached2})"
                for check_name, check_result in checks:
                    details += f"\n   - {check_name}: {'✓' if check_result else '✗'}"
                
                test_result("Cache validation", all_passed, details)
    except Exception as e:
        test_result("Cache validation", False, f"Exception: {str(e)}")

    # Test 2.5: Cache-key differentiation - change transcript_text
    print("\n[Test 2.5] Cache-key differentiation - change transcript_text (30-90s)")
    print("⏳ This will take 30-90 seconds (new cache entry)...")
    try:
        start_time = time.time()
        modified_transcript = test_transcript + " Additional sentence to change cache key."
        
        payload = {
            "profile": sample_profile,
            "scholarship_id": scholarship_id,
            "transcript_text": modified_transcript,
            "essay_text": test_essay
        }
        
        response = requests.post(f"{API_BASE}/readiness", json=payload, timeout=120)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            cached = data.get('cached', False)
            
            if cached == False:
                test_result("Cache-key differentiation", True, f"Elapsed: {elapsed:.1f}s, cached=false (new cache entry)")
            else:
                test_result("Cache-key differentiation", False, f"Expected cached=false, got cached=true")
        else:
            test_result("Cache-key differentiation", False, f"Status {response.status_code}: {response.text[:300]}")
    except Exception as e:
        test_result("Cache-key differentiation", False, f"Exception: {str(e)}")

    # Test 2.6: Backwards compatibility - repeat test without documents
    print("\n[Test 2.6] Backwards compatibility - call without documents (should still work)")
    print("⏳ This will take 30-90 seconds OR be cached from Test 2.1...")
    try:
        start_time = time.time()
        payload = {
            "profile": sample_profile,
            "scholarship_id": scholarship_id
        }
        response = requests.post(f"{API_BASE}/readiness", json=payload, timeout=120)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            readiness = data.get('readiness', {})
            score = readiness.get('score')
            bucket = readiness.get('bucket')
            
            checks = []
            checks.append(("score is integer 0-100", isinstance(score, int) and 0 <= score <= 100))
            checks.append(("bucket is valid", bucket in ['Strong', 'Competitive', 'Reach', 'Long-shot']))
            
            all_passed = all(c[1] for c in checks)
            details = f"Elapsed: {elapsed:.1f}s, Score: {score}, Bucket: {bucket}"
            for check_name, check_result in checks:
                details += f"\n   - {check_name}: {'✓' if check_result else '✗'}"
            
            test_result("Backwards compatibility", all_passed, details)
        else:
            test_result("Backwards compatibility", False, f"Status {response.status_code}: {response.text[:300]}")
    except Exception as e:
        test_result("Backwards compatibility", False, f"Exception: {str(e)}")

# ============================================================================
# SUMMARY
# ============================================================================

print("\n" + "="*80)
print("TEST SUMMARY")
print("="*80)
print(f"Total tests: {total_tests}")
print(f"✅ Passed: {passed_tests}")
print(f"❌ Failed: {failed_tests}")
print(f"Success rate: {(passed_tests/total_tests*100) if total_tests > 0 else 0:.1f}%")
print("="*80 + "\n")

if failed_tests == 0:
    print("🎉 ALL TESTS PASSED!")
else:
    print(f"⚠️  {failed_tests} test(s) failed. Review details above.")
