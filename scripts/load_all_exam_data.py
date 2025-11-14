#!/usr/bin/env python3
"""
Parse all exam data from the answer text files and load into database
"""
import re
import os
import psycopg2

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL')
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

def parse_answer_file(file_path):
    """Parse a single answer file and return list of exams"""
    exams = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by school sections
    sections = re.split(r'---\s*\n+###\s+\d+\.\s+', content)
    
    for section in sections[1:]:  # Skip intro
        # Extract school name and exam info
        header_match = re.match(r'([^(]+)\s+\(([^)]+)\)', section)
        if not header_match:
            continue
            
        school_name = header_match.group(1).strip()
        exam_info = header_match.group(2).strip()
        
        # Parse year and semester
        year_match = re.search(r'(\d{4})', exam_info)
        semester_match = re.search(r'(\d+학기|1학년\s*\d+학기)\s*(중간|기말)', exam_info)
        
        year = int(year_match.group(1)) if year_match else None
        semester = semester_match.group(0) if semester_match else exam_info
        
        # Extract questions
        questions = []
        
        # Find 선택형 section
        multiple_choice_section = re.search(r'#### 선택형\s*\n+(.*?)(?=####|---|\Z)', section, re.DOTALL)
        if multiple_choice_section:
            mc_content = multiple_choice_section.group(1)
            # Parse each question
            question_pattern = r'\*\s+(\d+)번\s+.*?정답\s+([①②③④⑤,\s]+)'
            for match in re.finditer(question_pattern, mc_content):
                q_num = int(match.group(1))
                answer_text = match.group(2).strip()
                
                # Handle multiple answers
                answers = []
                if ', ' in answer_text or '복수' in answer_text:
                    # Multiple answers
                    for char in answer_text:
                        if char in '①②③④⑤':
                            answers.append(char)
                else:
                    answers = [answer_text]
                
                questions.append({
                    'number': q_num,
                    'type': '객관식',
                    'answer': answers
                })
        
        exams.append({
            'school_name': school_name,
            'year': year,
            'semester': semester,
            'questions': questions
        })
    
    return exams

# Parse both files
file1 = "attached_assets/Pasted--cite--1763100515683_1763100515683.txt"
file2 = "attached_assets/Pasted---1763100538213_1763100538214.txt"

print("Parsing answer files...")
all_exams = []
all_exams.extend(parse_answer_file(file1))
all_exams.extend(parse_answer_file(file2))

print(f"Found {len(all_exams)} exams")

# Now insert into database
total_questions = 0

for exam_data in all_exams:
    school_name = exam_data['school_name']
    year = exam_data['year']
    semester = exam_data['semester']
    questions = exam_data['questions']
    
    if not questions:
        print(f"Skipping {school_name} ({year} {semester}) - no questions found")
        continue
    
    # Check if school exists
    cur.execute("SELECT id FROM schools WHERE name = %s", (school_name,))
    school_row = cur.fetchone()
    
    if not school_row:
        # Insert school
        cur.execute("INSERT INTO schools (name) VALUES (%s) RETURNING id", (school_name,))
        school_id = cur.fetchone()[0]
        print(f"Created school: {school_name} (ID: {school_id})")
    else:
        school_id = school_row[0]
    
    # Check if exam exists
    cur.execute("""
        SELECT id FROM exams 
        WHERE school_id = %s AND year = %s AND semester = %s
    """, (school_id, year, semester))
    
    exam_row = cur.fetchone()
    
    if exam_row:
        exam_id = exam_row[0]
        print(f"Exam already exists: {school_name} ({year} {semester}) - updating questions")
        # Delete existing questions
        cur.execute("DELETE FROM questions WHERE exam_id = %s", (exam_id,))
    else:
        # Create exam
        cur.execute("""
            INSERT INTO exams (school_id, school_name, year, semester)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (school_id, school_name, year, semester))
        exam_id = cur.fetchone()[0]
        print(f"Created exam: {school_name} ({year} {semester}) - ID: {exam_id}")
    
    # Insert questions
    for q in questions:
        # Convert answer list to sorted JSON array string
        import json
        answer_json = json.dumps(sorted(q['answer']), ensure_ascii=False)
        
        cur.execute("""
            INSERT INTO questions (exam_id, question_number, type, correct_answer)
            VALUES (%s, %s, %s, %s)
        """, (exam_id, q['number'], q['type'], answer_json))
        total_questions += 1
    
    conn.commit()
    print(f"  Added {len(questions)} questions")

print(f"\nTotal: {len(all_exams)} exams, {total_questions} questions loaded")

cur.close()
conn.close()
