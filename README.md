# study-note-deploy-system-front

study-note 위키의 화면(Next.js BFF). backend의 콘텐츠·검색 API를 SSR로 소비한다.

- 구동: `.env`에 `BACKEND_URL`(`LOG_REDIS_URL` 선택) 지정 후 `docker compose up -d --build`
- 라우트: `/`(버킷) · `/wiki/<경로>`(폴더·주제 3탭) · `/search?q=` · `/api/search`(BFF) · `/api/sync`(Actions 중계)
- requestId: **진입 서버(front)가 발행**해 X-Request-Id로 backend에 전달 (로그 규약 v2)
