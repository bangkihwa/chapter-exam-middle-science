# Vercel 배포 가이드

## 목동에이원과학학원 - 선행진도확인 프로그램

이 가이드는 프로젝트를 Vercel에 배포하는 방법을 설명합니다. Supabase 데이터베이스는 그대로 사용됩니다.

---

## 📋 사전 준비사항

1. **Vercel 계정** (https://vercel.com)
2. **GitHub/GitLab/Bitbucket 계정** (프로젝트 저장용)
3. **Supabase 데이터베이스** (현재 사용 중인 것)

---

## 🚀 배포 단계

### 1단계: 프로젝트를 Git에 푸시

#### Git 저장소가 없는 경우:

```bash
# Git 초기화 (이미 되어 있음)
git init

# .gitignore 확인
# .env 파일이 .gitignore에 포함되어 있는지 확인하세요!

# 변경사항 커밋
git add .
git commit -m "Prepare for Vercel deployment"

# GitHub에 새 저장소 생성 후 연결
git remote add origin https://github.com/사용자명/저장소명.git
git branch -M main
git push -u origin main
```

#### Git 저장소가 이미 있는 경우:

```bash
# 변경사항 커밋
git add .
git commit -m "Add Vercel configuration"
git push
```

---

### 2단계: Vercel에서 프로젝트 가져오기

1. https://vercel.com 에 로그인
2. **"Add New Project"** 클릭
3. GitHub 저장소를 선택
4. **"Import"** 클릭

---

### 3단계: 환경 변수 설정

Vercel 프로젝트 설정에서:

1. **"Settings"** 탭 클릭
2. **"Environment Variables"** 선택
3. 다음 환경 변수들을 추가:

```
DATABASE_URL=postgresql://postgres.bczhuyuundalqqzwyqmt:o8JVCUpWUkbKupVa@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
PORT=5000
NODE_ENV=production
```

⚠️ **중요**: 실제 DATABASE_URL은 .env 파일에서 복사하세요!

---

### 4단계: 빌드 설정 확인

Vercel이 자동으로 감지하지만, 확인해보세요:

- **Framework Preset**: `Other`
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

---

### 5단계: 배포!

**"Deploy"** 버튼을 클릭하면 Vercel이 자동으로:

1. 의존성 설치
2. 프로젝트 빌드
3. 배포
4. URL 제공

배포가 완료되면 `https://your-project.vercel.app` 같은 URL이 생성됩니다!

---

## 🔧 빌드 명령어 수정 (package.json)

프로젝트의 `package.json`에 다음 스크립트가 있는지 확인하세요:

```json
{
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts server/routes.ts server/storage.ts server/db.ts server/googleSheets.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "node dist/index.js",
    "check": "tsc"
  }
}
```

---

## 📝 주요 파일 설명

### `vercel.json`
Vercel 배포 설정 파일입니다.

- API 라우팅: `/api/*` 요청을 Serverless Function으로 처리
- SPA 라우팅: 나머지 요청은 `index.html`로 리다이렉트
- Functions 설정: 메모리 및 실행 시간 제한

### `api/index.js`
Vercel Serverless Function의 진입점입니다.

- Express 앱을 Vercel Function으로 래핑
- 모든 API 라우트를 등록

---

## 🔍 문제 해결

### 배포가 실패하는 경우:

1. **빌드 로그 확인**
   - Vercel 대시보드에서 배포 로그 확인

2. **환경 변수 확인**
   - DATABASE_URL이 올바른지 확인
   - Supabase 데이터베이스 연결 가능한지 확인

3. **의존성 문제**
   ```bash
   npm install
   npm run build
   ```
   로컬에서 빌드가 되는지 확인

### API 호출이 실패하는 경우:

1. **CORS 설정 확인**
   - Vercel은 자동으로 CORS를 처리하지만, 필요시 추가 설정

2. **환경 변수 재배포**
   - 환경 변수 변경 후 반드시 재배포

---

## 🎯 배포 후 확인사항

✅ 로그인 페이지가 로드되는지
✅ 학생 로그인이 작동하는지
✅ 단원 목록이 표시되는지
✅ 시험 응시가 가능한지
✅ 결과 페이지가 표시되는지
✅ 시간이 서울 시간(KST)로 표시되는지

---

## 📱 도메인 연결 (선택사항)

1. Vercel 프로젝트 설정에서 **"Domains"** 클릭
2. 원하는 도메인 입력 (예: `exam.example.com`)
3. DNS 레코드 추가 (Vercel이 안내)

---

## 🔄 자동 배포

GitHub에 푸시할 때마다 Vercel이 자동으로 배포합니다:

```bash
git add .
git commit -m "Update features"
git push
```

몇 분 후 자동으로 새 버전이 배포됩니다!

---

## 📞 지원

문제가 발생하면:
- Vercel 문서: https://vercel.com/docs
- Supabase 문서: https://supabase.com/docs

---

## ✨ 완료!

축하합니다! 프로젝트가 성공적으로 배포되었습니다. 🎉

배포된 URL: `https://your-project.vercel.app`
