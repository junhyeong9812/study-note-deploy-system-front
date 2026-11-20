# study-note-deploy-system-front

study-note 위키의 화면(Next.js BFF). backend의 콘텐츠·검색 API를 SSR로 소비한다.

- 구동(무중단 배포 구성 — 앱은 두 자리 `front-blue`·`front-green` 중 하나만 뜨고 nginx 가 11000 을 받는다): `.env`에 `BACKEND_URL`(`LOG_REDIS_URL` 선택) 지정 후
  `mkdir -p deploy/active && cp deploy/nginx/nginx.conf deploy/active/ && cp deploy/nginx/upstream-blue.conf deploy/active/upstream.conf && docker compose up -d --build front-blue nginx`
  - 이름 없이 `docker compose up -d` 를 하면 nginx 만 뜬다(자리는 이름을 지정해야 뜬다). `deploy/active/` 는 서버에만 있고 git 에 없다.
  - 배포·전환·수동 조작은 ci-cd 저장소 README 의 "무중단 배포" 절을 따른다.
  - 한계: 배포 직전에 열린 화면은 구 버전의 스크립트 파일을 요청하므로, 전환 뒤 일부 동작에서 새로 고침이 필요할 수 있다.
- 라우트: `/`(버킷) · `/wiki/<경로>`(폴더·주제 3탭) · `/search?q=` · `/api/search`(BFF) · `/api/sync`(Actions 중계)
- requestId: **진입 서버(front)가 발행**해 X-Request-Id로 backend에 전달 (로그 규약 v2)

## 임포트 정책 (2026-08-29 확정)

**절대경로(`@/...`)만 사용한다** — 같은 폴더 안이라도 상대 임포트 금지.
파일 이동 리팩토링이 임포트를 깨뜨리지 못하게 하기 위한 정책(실측: features 재편 때
상대 임포트만 3회에 걸쳐 빌드를 깨뜨림).
