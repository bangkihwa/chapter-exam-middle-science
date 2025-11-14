#!/usr/bin/env python3
import pdfplumber
import re
from collections import OrderedDict

def extract_schools(pdf_path):
    schools = OrderedDict()
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if not text:
                continue
            
            # Find school names (한글 + 고등학교)
            school_matches = re.findall(r'([가-힣]+(?:여자|남자)?고등학교)', text)
            
            for school_name in school_matches:
                if school_name not in schools:
                    schools[school_name] = {
                        'name': school_name,
                        'first_page': page_num
                    }
                    
                    # Try to extract year and semester info
                    year_match = re.search(r'(\d{4})[학년도]*', text)
                    semester_match = re.search(r'(\d+학기|[12]학년\s*\d+학기)\s*(중간|기말)', text)
                    
                    if year_match:
                        schools[school_name]['year'] = year_match.group(1)
                    if semester_match:
                        schools[school_name]['semester'] = semester_match.group(0)
    
    return list(schools.values())

# Extract from both PDFs
pdf1 = "attached_assets/ilovepdf_merged_1763100279755.pdf"
pdf2 = "attached_assets/ilovepdf_merged (2)_1763100288330.pdf"

print("=== PDF 1 학교 목록 ===")
schools1 = extract_schools(pdf1)
for i, school in enumerate(schools1, 1):
    print(f"{i}. {school['name']}")
    if 'year' in school:
        print(f"   연도: {school.get('year', 'N/A')}, 학기: {school.get('semester', 'N/A')}")

print(f"\n총 {len(schools1)}개 학교")

print("\n=== PDF 2 학교 목록 ===")
schools2 = extract_schools(pdf2)
for i, school in enumerate(schools2, 1):
    print(f"{i}. {school['name']}")
    if 'year' in school:
        print(f"   연도: {school.get('year', 'N/A')}, 학기: {school.get('semester', 'N/A')}")

print(f"\n총 {len(schools2)}개 학교")

# Combine unique schools
all_schools = OrderedDict()
for school in schools1 + schools2:
    all_schools[school['name']] = school

print(f"\n=== 전체 고유 학교: {len(all_schools)}개 ===")
for i, name in enumerate(all_schools.keys(), 1):
    print(f"{i}. {name}")
