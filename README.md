# Baby Meal Planner

개월수, 보유 재료, 제외 재료, 최근 추천 이력을 바탕으로 Gemini API가 이유식 식단을 추천해주는 Next.js 앱입니다.

## Local Development

```bash
npm install
npm run dev
```

개발 서버는 `http://localhost:3001` 에서 실행됩니다.

## Environment Variables

`.env.local` 파일에 아래 값을 넣어주세요.

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_ENABLE_PWA=false
```

- `GEMINI_API_KEY`: Google AI Studio에서 발급한 서버용 API 키
- `NEXT_PUBLIC_ENABLE_PWA`: 현재는 `false` 권장. Vercel 배포 시에도 기본적으로 꺼두는 편이 안전합니다.

## Vercel Deployment

### 1. Git 저장소 연결

이 프로젝트를 GitHub 등에 푸시한 뒤 Vercel에서 저장소를 연결합니다.

### 2. Framework Preset

Vercel이 자동으로 `Next.js`를 감지하면 그대로 사용하면 됩니다.

### 3. Environment Variables 등록

Vercel 프로젝트 설정에서 아래 환경변수를 추가합니다.

- `GEMINI_API_KEY`
- `NEXT_PUBLIC_ENABLE_PWA=false`

### 4. Deploy

기본 설정 그대로 배포하면 됩니다.

- Build Command: `next build`
- Output: Next.js 기본값 사용

## Notes

- 식단 생성 API는 [`app/api/meal-plan/route.ts`](./app/api/meal-plan/route.ts) 에 있습니다.
- 최근 추천 메뉴 제외 기능은 브라우저 `localStorage`를 사용합니다.
- 같은 메뉴 반복을 줄이기 위해 최근 추천 메뉴 이름을 다음 요청에 함께 보냅니다.

## Verification

배포 전 로컬에서 아래 명령으로 확인할 수 있습니다.

```bash
npm run lint
npm run build
```
