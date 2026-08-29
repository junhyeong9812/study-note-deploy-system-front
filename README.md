# study-note-deploy-system-front

study-note 위키의 화면(Next.js BFF). backend의 콘텐츠·검색 API를 SSR로 소비한다.

- 구동: `.env`에 `BACKEND_URL`(`LOG_REDIS_URL` 선택) 지정 후 `docker compose up -d --build`
- 라우트: `/`(버킷) · `/wiki/<경로>`(폴더·주제 3탭) · `/search?q=` · `/api/search`(BFF) · `/api/sync`(Actions 중계)
- requestId: **진입 서버(front)가 발행**해 X-Request-Id로 backend에 전달 (로그 규약 v2)

## 임포트 정책 (2026-08-29 확정)

**절대경로(`@/...`)만 사용한다** — 같은 폴더 안이라도 상대 임포트 금지.
파일 이동 리팩토링이 임포트를 깨뜨리지 못하게 하기 위한 정책(실측: features 재편 때
상대 임포트만 3회에 걸쳐 빌드를 깨뜨림).
