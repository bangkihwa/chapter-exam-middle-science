#!/usr/bin/env python3
import re
from collections import OrderedDict

def parse_school_data(file_path):
    """Parse school names and exam info from answer text file"""
    schools = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all school sections
    pattern = r'###\s+\d+\.\s+([^(]+)\s+\(([^)]+)\)'
    matches = re.findall(pattern, content)
    
    for school_name, exam_info in matches:
        school_name = school_name.strip()
        exam_info = exam_info.strip()
        schools.append({
            'name': school_name,
            'exam_info': exam_info,
            'full': f"{school_name} ({exam_info})"
        })
    
    return schools

# Parse both files
file1 = "attached_assets/Pasted--cite--1763100515683_1763100515683.txt"
file2 = "attached_assets/Pasted---1763100538213_1763100538214.txt"

print("=== 첫 번째 파일 (2024년 2학기 중간 위주) ===")
schools1 = parse_school_data(file1)
for i, school in enumerate(schools1, 1):
    print(f"{i}. {school['full']}")

print(f"\n총 {len(schools1)}개 시험")

print("\n=== 두 번째 파일 (2023년 2학기 기말 위주) ===")
schools2 = parse_school_data(file2)
for i, school in enumerate(schools2, 1):
    print(f"{i}. {school['full']}")

print(f"\n총 {len(schools2)}개 시험")

# Count unique schools
all_schools = OrderedDict()
for school in schools1 + schools2:
    if school['name'] not in all_schools:
        all_schools[school['name']] = []
    all_schools[school['name']].append(school['exam_info'])

print(f"\n=== 고유 학교 목록: {len(all_schools)}개 ===")
for i, (name, exams) in enumerate(all_schools.items(), 1):
    print(f"{i}. {name}: {len(exams)}개 시험 ({', '.join(exams)})")

print(f"\n총 학교 수: {len(all_schools)}개")
print(f"총 시험 수: {len(schools1) + len(schools2)}개")
