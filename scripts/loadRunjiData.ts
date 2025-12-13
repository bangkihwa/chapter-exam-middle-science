import pg from 'pg';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env file');
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 런지 교재 311개 문제 정답 데이터
const runjiAnswers = [
  {"q": 1, "unit": "물질의 규칙성과 결합", "answer": "2"},
  {"q": 2, "unit": "물질의 규칙성과 결합", "answer": "4"},
  {"q": 3, "unit": "물질의 규칙성과 결합", "answer": "4"},
  {"q": 4, "unit": "물질의 규칙성과 결합", "answer": "4"},
  {"q": 5, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 6, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 7, "unit": "물질의 규칙성과 결합", "answer": "3"},
  {"q": 8, "unit": "물질의 규칙성과 결합", "answer": "4"},
  {"q": 9, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 10, "unit": "물질의 규칙성과 결합", "answer": "3"},
  {"q": 11, "unit": "물질의 규칙성과 결합", "answer": "3"},
  {"q": 12, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 13, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 14, "unit": "물질의 규칙성과 결합", "answer": "1"},
  {"q": 15, "unit": "물질의 규칙성과 결합", "answer": "4"},
  {"q": 16, "unit": "물질의 규칙성과 결합", "answer": "3"},
  {"q": 17, "unit": "물질의 규칙성과 결합", "answer": "4"},
  {"q": 18, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 19, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 20, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 21, "unit": "물질의 규칙성과 결합", "answer": "3"},
  {"q": 22, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 23, "unit": "물질의 규칙성과 결합", "answer": "3"},
  {"q": 24, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 25, "unit": "물질의 규칙성과 결합", "answer": "3"},
  {"q": 26, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 27, "unit": "물질의 규칙성과 결합", "answer": "2"},
  {"q": 28, "unit": "물질의 규칙성과 결합", "answer": "4"},
  {"q": 29, "unit": "물질의 규칙성과 결합", "answer": "3"},
  {"q": 30, "unit": "물질의 규칙성과 결합", "answer": "2"},
  {"q": 31, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 32, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 33, "unit": "물질의 규칙성과 결합", "answer": "4"},
  {"q": 34, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 35, "unit": "물질의 규칙성과 결합", "answer": "4"},
  {"q": 36, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 37, "unit": "물질의 규칙성과 결합", "answer": "5"},
  {"q": 38, "unit": "생명체 구성 물질", "answer": "5"},
  {"q": 39, "unit": "생명체 구성 물질", "answer": "4"},
  {"q": 40, "unit": "생명체 구성 물질", "answer": "5"},
  {"q": 41, "unit": "생명체 구성 물질", "answer": "5"},
  {"q": 42, "unit": "생명체 구성 물질", "answer": "3"},
  {"q": 43, "unit": "생명체 구성 물질", "answer": "4"},
  {"q": 44, "unit": "생명체 구성 물질", "answer": "5"},
  {"q": 45, "unit": "생명체 구성 물질", "answer": "4"},
  {"q": 46, "unit": "생명체 구성 물질", "answer": "5"},
  {"q": 47, "unit": "생명체 구성 물질", "answer": "4"},
  {"q": 48, "unit": "생명체 구성 물질", "answer": "5"},
  {"q": 49, "unit": "생명체 구성 물질", "answer": "5"},
  {"q": 50, "unit": "생명체 구성 물질", "answer": "4"},
  {"q": 51, "unit": "생명체 구성 물질", "answer": "4"},
  {"q": 52, "unit": "생명체 구성 물질", "answer": "5"},
  {"q": 53, "unit": "생명체 구성 물질", "answer": "5"},
  {"q": 54, "unit": "생명체 구성 물질", "answer": "3"},
  {"q": 55, "unit": "생명체 구성 물질", "answer": "3"},
  {"q": 56, "unit": "물질의 전기적 성질", "answer": "3"},
  {"q": 57, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 58, "unit": "물질의 전기적 성질", "answer": "4"},
  {"q": 59, "unit": "물질의 전기적 성질", "answer": "4"},
  {"q": 60, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 61, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 62, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 63, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 64, "unit": "물질의 전기적 성질", "answer": "3"},
  {"q": 65, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 66, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 67, "unit": "물질의 전기적 성질", "answer": "4"},
  {"q": 68, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 69, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 70, "unit": "물질의 전기적 성질", "answer": "3"},
  {"q": 71, "unit": "물질의 전기적 성질", "answer": "3"},
  {"q": 72, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 73, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 74, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 75, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 76, "unit": "물질의 전기적 성질", "answer": "4"},
  {"q": 77, "unit": "물질의 전기적 성질", "answer": "5"},
  {"q": 78, "unit": "역학적 시스템", "answer": "5"},
  {"q": 79, "unit": "역학적 시스템", "answer": "4"},
  {"q": 80, "unit": "역학적 시스템", "answer": "5"},
  {"q": 81, "unit": "역학적 시스템", "answer": "5"},
  {"q": 82, "unit": "역학적 시스템", "answer": "5"},
  {"q": 83, "unit": "역학적 시스템", "answer": "5"},
  {"q": 84, "unit": "역학적 시스템", "answer": "5"},
  {"q": 85, "unit": "역학적 시스템", "answer": "5"},
  {"q": 86, "unit": "역학적 시스템", "answer": "5"},
  {"q": 87, "unit": "역학적 시스템", "answer": "5"},
  {"q": 88, "unit": "역학적 시스템", "answer": "5"},
  {"q": 89, "unit": "역학적 시스템", "answer": "5"},
  {"q": 90, "unit": "역학적 시스템", "answer": "5"},
  {"q": 92, "unit": "역학적 시스템", "answer": "1"},
  {"q": 93, "unit": "역학적 시스템", "answer": "2"},
  {"q": 94, "unit": "역학적 시스템", "answer": "3"},
  {"q": 95, "unit": "역학적 시스템", "answer": "1"},
  {"q": 96, "unit": "역학적 시스템", "answer": "5"},
  {"q": 97, "unit": "역학적 시스템", "answer": "1"},
  {"q": 98, "unit": "생명 시스템", "answer": "5"},
  {"q": 99, "unit": "생명 시스템", "answer": "3"},
  {"q": 100, "unit": "생명 시스템", "answer": "5"},
  {"q": 101, "unit": "생명 시스템", "answer": "3"},
  {"q": 102, "unit": "생명 시스템", "answer": "3"},
  {"q": 103, "unit": "생명 시스템", "answer": "5"},
  {"q": 104, "unit": "생명 시스템", "answer": "4"},
  {"q": 105, "unit": "생명 시스템", "answer": "4"},
  {"q": 106, "unit": "생명 시스템", "answer": "3"},
  {"q": 107, "unit": "생명 시스템", "answer": "5"},
  {"q": 108, "unit": "생명 시스템", "answer": "5"},
  {"q": 109, "unit": "생명 시스템", "answer": "5"},
  {"q": 110, "unit": "생명 시스템", "answer": "5"},
  {"q": 111, "unit": "생명 시스템", "answer": "4"},
  {"q": 112, "unit": "생명 시스템", "answer": "5"},
  {"q": 113, "unit": "생명 시스템", "answer": "3"},
  {"q": 114, "unit": "생명 시스템", "answer": "5"},
  {"q": 115, "unit": "생명 시스템", "answer": "5"},
  {"q": 116, "unit": "화학 변화 (산화 환원)", "answer": "4"},
  {"q": 117, "unit": "화학 변화 (산화 환원)", "answer": "1,3", "isMultiple": true},
  {"q": 118, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 119, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 120, "unit": "화학 변화 (산화 환원)", "answer": "2"},
  {"q": 121, "unit": "화학 변화 (산화 환원)", "answer": "3"},
  {"q": 122, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 123, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 124, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 125, "unit": "화학 변화 (산화 환원)", "answer": "2"},
  {"q": 126, "unit": "화학 변화 (산화 환원)", "answer": "2"},
  {"q": 127, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 128, "unit": "화학 변화 (산화 환원)", "answer": "3"},
  {"q": 129, "unit": "화학 변화 (산화 환원)", "answer": "3"},
  {"q": 130, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 131, "unit": "화학 변화 (산화 환원)", "answer": "4"},
  {"q": 132, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 133, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 134, "unit": "화학 변화 (산화 환원)", "answer": "3"},
  {"q": 135, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 136, "unit": "화학 변화 (산화 환원)", "answer": "4"},
  {"q": 137, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 138, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 139, "unit": "화학 변화 (산화 환원)", "answer": "3"},
  {"q": 140, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 141, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 142, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 143, "unit": "화학 변화 (산화 환원)", "answer": "3"},
  {"q": 144, "unit": "화학 변화 (산화 환원)", "answer": "3"},
  {"q": 145, "unit": "화학 변화 (산화 환원)", "answer": "4"},
  {"q": 146, "unit": "화학 변화 (산화 환원)", "answer": "5"},
  {"q": 147, "unit": "화학 변화 (산과 염기)", "answer": "1"},
  {"q": 148, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 149, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 150, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 151, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 152, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 153, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 154, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 155, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 156, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 157, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 158, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 159, "unit": "화학 변화 (산과 염기)", "answer": "3"},
  {"q": 160, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 161, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 162, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 163, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 164, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 165, "unit": "화학 변화 (산과 염기)", "answer": "1"},
  {"q": 166, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 167, "unit": "화학 변화 (산과 염기)", "answer": "3"},
  {"q": 168, "unit": "화학 변화 (산과 염기)", "answer": "3"},
  {"q": 169, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 170, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 171, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 172, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 173, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 174, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 175, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 176, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 177, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 178, "unit": "화학 변화 (산과 염기)", "answer": "3"},
  {"q": 179, "unit": "화학 변화 (산과 염기)", "answer": "1"},
  {"q": 180, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 181, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 182, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 183, "unit": "화학 변화 (산과 염기)", "answer": "3"},
  {"q": 184, "unit": "화학 변화 (산과 염기)", "answer": "3"},
  {"q": 185, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 186, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 187, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 188, "unit": "화학 변화 (산과 염기)", "answer": "5"},
  {"q": 189, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 190, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "3"},
  {"q": 191, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "2,4", "isMultiple": true},
  {"q": 192, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 193, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 194, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "3"},
  {"q": 195, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "4"},
  {"q": 196, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "3"},
  {"q": 197, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 198, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 199, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 200, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 201, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 202, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 203, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 204, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 205, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "2"},
  {"q": 206, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "4"},
  {"q": 207, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 208, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 209, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "1"},
  {"q": 210, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "3"},
  {"q": 211, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "4"},
  {"q": 212, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "1"},
  {"q": 213, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "1"},
  {"q": 214, "unit": "발전과 신재생 에너지 (태양 에너지)", "answer": "5"},
  {"q": 215, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "1"},
  {"q": 216, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 217, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "4"},
  {"q": 218, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "1"},
  {"q": 219, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 220, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "3"},
  {"q": 221, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 222, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "3"},
  {"q": 223, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "1"},
  {"q": 224, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "2"},
  {"q": 225, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 226, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 227, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 228, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 229, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "1"},
  {"q": 230, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 231, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "3"},
  {"q": 232, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 233, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 234, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 235, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "2"},
  {"q": 236, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "1"},
  {"q": 237, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 238, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 239, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 240, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 241, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 242, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "1"},
  {"q": 243, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "3"},
  {"q": 244, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "3"},
  {"q": 245, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 246, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "1"},
  {"q": 247, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "5"},
  {"q": 248, "unit": "발전과 신재생 에너지 (전자기 유도)", "answer": "4"},
  {"q": 249, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "1"},
  {"q": 250, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3"},
  {"q": 251, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3"},
  {"q": 252, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3"},
  {"q": 253, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 254, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 255, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 256, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 257, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "1"},
  {"q": 258, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 259, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 260, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 261, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 262, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 263, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 264, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "2"},
  {"q": 265, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 266, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 267, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 268, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 269, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "2"},
  {"q": 270, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 271, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 272, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 273, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "2"},
  {"q": 274, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "1"},
  {"q": 275, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 276, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 277, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3"},
  {"q": 278, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 279, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "2"},
  {"q": 280, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 281, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "1"},
  {"q": 282, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 283, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3"},
  {"q": 284, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 285, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 286, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 287, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3"},
  {"q": 288, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 289, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 290, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 291, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "1"},
  {"q": 292, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3"},
  {"q": 293, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "4"},
  {"q": 294, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 295, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3,5", "isMultiple": true},
  {"q": 296, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "2"},
  {"q": 297, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 298, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 299, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 300, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "4"},
  {"q": 301, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 302, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 303, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3"},
  {"q": 304, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 305, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "2,5", "isMultiple": true},
  {"q": 306, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3"},
  {"q": 307, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 308, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 309, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 310, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "3"},
  {"q": 311, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"},
  {"q": 312, "unit": "발전과 신재생 에너지 (에너지 전환 및 신재생)", "answer": "5"}
];

// 단원별 카테고리 매핑
const unitCategoryMap: Record<string, string> = {
  "물질의 규칙성과 결합": "물질",
  "생명체 구성 물질": "생명",
  "물질의 전기적 성질": "물질",
  "역학적 시스템": "에너지",
  "생명 시스템": "생명",
  "화학 변화 (산화 환원)": "물질",
  "화학 변화 (산과 염기)": "물질",
  "발전과 신재생 에너지 (태양 에너지)": "에너지",
  "발전과 신재생 에너지 (전자기 유도)": "에너지",
  "발전과 신재생 에너지 (에너지 전환 및 신재생)": "에너지",
};

async function loadRunjiData() {
  console.log('🚀 런지 교재 데이터 로드 시작...\n');

  const client = await pool.connect();
  try {
    // 1. 기존 questions 테이블의 모든 데이터 삭제
    console.log('📌 1단계: 기존 문제 데이터 삭제 중...');
    await client.query('DELETE FROM questions');
    console.log('   ✅ 기존 문제 데이터 삭제 완료\n');

    // 2. 런지 교재용 가상 시험 생성 (examId는 필요하지만 실제로는 단원별로 사용)
    console.log('📌 2단계: 런지 교재 가상 시험 레코드 생성 중...');

    // 기존 학교/시험 데이터도 삭제
    await client.query('DELETE FROM submissions');
    await client.query('DELETE FROM exams');
    await client.query('DELETE FROM schools');

    // 런지 교재용 학교 생성
    const schoolResult = await client.query(
      'INSERT INTO schools (name) VALUES ($1) RETURNING id',
      ['런지 교재']
    );
    const schoolId = schoolResult.rows[0].id;
    console.log(`   ✅ 학교 생성 완료 (ID: ${schoolId})`);

    // 런지 교재용 시험 생성
    const examResult = await client.query(
      'INSERT INTO exams (school_id, school_name, year, semester, subject) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [schoolId, '런지 교재', 2024, '통합', '중등 통합과학 선행']
    );
    const examId = examResult.rows[0].id;
    console.log(`   ✅ 시험 생성 완료 (ID: ${examId})\n`);

    // 3. 311개 문제 입력
    console.log('📌 3단계: 311개 문제 데이터 입력 중...');

    let insertedCount = 0;
    let multipleAnswerCount = 0;

    for (const item of runjiAnswers) {
      const { q, unit, answer, isMultiple } = item;
      const category = unitCategoryMap[unit];
      const isMultipleAnswer = isMultiple || false;

      // 복수 정답인 경우 JSON 배열로 저장, 단일 정답인 경우 문자열로 저장
      const answerValue = isMultipleAnswer
        ? JSON.stringify(answer.split(',').sort())
        : answer;

      await client.query(
        'INSERT INTO questions (exam_id, question_number, type, category, unit, answer, is_multiple_answer) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [examId, q, '객관식', category, unit, answerValue, isMultipleAnswer]
      );

      insertedCount++;
      if (isMultipleAnswer) multipleAnswerCount++;

      // 진행 상황 표시 (50개마다)
      if (insertedCount % 50 === 0) {
        console.log(`   진행 중... ${insertedCount}/311 문제 입력 완료`);
      }
    }

    console.log(`   ✅ 총 ${insertedCount}개 문제 입력 완료`);
    console.log(`   ✅ 복수 정답 문제: ${multipleAnswerCount}개 (117, 191, 295, 305번)\n`);

    // 4. 단원별 통계 확인
    console.log('📌 4단계: 단원별 문제 수 확인...');
    const unitStats = await client.query(
      'SELECT unit, COUNT(*) as count FROM questions WHERE exam_id = $1 GROUP BY unit ORDER BY MIN(question_number)',
      [examId]
    );

    console.log('\n📊 단원별 문제 수:');
    unitStats.rows.forEach((stat: any) => {
      console.log(`   - ${stat.unit}: ${stat.count}개`);
    });

    console.log('\n✅ 런지 교재 데이터 로드 완료!');
    console.log(`\n📌 요약:`);
    console.log(`   - 총 문제 수: ${insertedCount}개`);
    console.log(`   - 복수 정답 문제: ${multipleAnswerCount}개`);
    console.log(`   - 단원 수: ${unitStats.rows.length}개`);
    console.log(`   - 91번 문제: 제외됨 (데이터 없음)`);

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 스크립트 실행
loadRunjiData()
  .then(() => {
    console.log('\n🎉 스크립트 실행 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 스크립트 실행 실패:', error);
    process.exit(1);
  });
