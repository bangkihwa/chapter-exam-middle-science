# 🚀 Vercel 배포 빠른 시작 가이드

5분 안에 배포하기!

## 1️⃣ GitHub에 푸시

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

Git 저장소가 없다면:
```bash
# GitHub에서 새 저장소 생성 후
git remote add origin https://github.com/사용자명/저장소명.git
git branch -M main
git push -u origin main
```

## 2️⃣ Vercel에서 배포

1. https://vercel.com 접속 및 로그인
2. **"Add New Project"** 클릭
3. GitHub 저장소 선택
4. **환경 변수 추가**:
   ```
   DATABASE_URL=your_supabase_connection_string
   NODE_ENV=production
   ```
5. **"Deploy"** 클릭!

## 3️⃣ 완료! 🎉

배포 완료 후 제공되는 URL로 접속하세요.
예: `https://your-project.vercel.app`

---

## ⚙️ 자동 배포 설정됨

이제부터 GitHub에 푸시할 때마다 자동으로 배포됩니다!

```bash
git add .
git commit -m "Update"
git push
# 자동으로 Vercel에 배포됩니다!
```

---

상세 가이드는 `VERCEL_DEPLOYMENT.md`를 참고하세요.
