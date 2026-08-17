# Backend integration notes

프론트는 화면 디자인을 변경하지 않고 `src/users/*`를 백엔드 연동 경계로 사용하도록 정리했습니다.

## 1. API 계약

| 기능             | Front adapter                        |    Method | Endpoint                      | Request / Response 핵심                                                     |
| ---------------- | ------------------------------------ | --------: | ----------------------------- | --------------------------------------------------------------------------- |
| 수신자 목록      | `users/recipients.ts`                |       GET | `/api/recipients`             | `Recipient[]`                                                               |
| 수신자 생성      | `users/recipients.ts`                |      POST | `/api/recipients`             | `Recipient` → `Recipient`                                                   |
| 수신자 수정      | `users/recipients.ts` + 페이지 PATCH | PUT/PATCH | `/api/recipients/:id`         | 수정된 수신자 필드                                                          |
| 메시지 AI 최적화 | `users/messageService.ts`            |      POST | `/api/messages/optimize`      | `{ recipients, subject, body }` → `{ subject, body, score?, explanation? }` |
| 메시지 전송      | `users/messageService.ts`            |      POST | `/api/messages/send`          | `{ recipients, subject, body, originalSubject?, originalBody? }`            |
| Company DNA 조회 | `users/companyDna.ts`                |       GET | `/api/company-dna`            | `CompanyDNA`                                                                |
| Company DNA 저장 | `users/companyDna.ts`                |       PUT | `/api/company-dna`            | `CompanyDNA`                                                                |
| Team Memory 목록 | `users/teamMemory.ts`                |       GET | `/api/team-memory`            | `Pattern[]`                                                                 |
| Team Memory 생성 | `users/teamMemory.ts`                |      POST | `/api/team-memory`            | `Pattern`                                                                   |
| Team Memory 수정 | `users/teamMemory.ts`                |       PUT | `/api/team-memory/:id`        | `Pattern`                                                                   |
| Team Memory 삭제 | `users/teamMemory.ts`                |    DELETE | `/api/team-memory/:id`        | -                                                                           |
| AI 학습 후보     | `users/teamMemory.ts`                |       GET | `/api/team-memory/candidates` | `Candidate[]`                                                               |
| History 조회     | `users/history.ts`                   |       GET | `/api/history`                | `HistoryItem[]`                                                             |
| History 생성     | `users/history.ts`                   |      POST | `/api/history`                | `HistoryItem`                                                               |

## 2. 현재 프론트 동작

- 기존 `users/auth.ts`, `users/userProfile.ts`, `users/conversationArchive.ts`, `users/profileAnalytics.ts` 구조는 유지했습니다.
- 수신자 / Company DNA / Team Memory / History는 `src/users`에 데이터 접근 계층을 추가했습니다.
- 백엔드가 연결되면 페이지에서 `fetch()`를 직접 바꿀 필요 없이 해당 adapter의 endpoint/응답 매핑만 맞추면 됩니다.
- 백엔드가 아직 없는 기능은 브라우저 `localStorage`를 동일 데이터 모델의 임시 저장소로만 사용합니다.
- 가짜 AI 결과를 만들지 않습니다. `/api/messages/optimize`가 실패하면 원문을 최적화된 결과처럼 보여주지 않고 오류를 표시합니다.
- Team Memory의 AI 후보도 임의의 후보를 생성하지 않고 `/api/team-memory/candidates` 응답만 사용합니다.
- History에는 실제 AI 변환 성공 / 실제 전송 성공 시점에 기록을 생성합니다.

## 3. 인증 연결 시 변경할 곳

현재 adapter는 상대 경로 `/api/...`를 사용하므로 같은 origin 프록시 또는 배포 환경에서 바로 연결할 수 있습니다.

백엔드 인증이 JWT 방식이면 각 adapter의 공통 fetch 계층을 추가해 다음을 붙이면 됩니다.

- `Authorization: Bearer <accessToken>`
- 401 발생 시 토큰 갱신
- 사용자별 API 요청
- 로그아웃 시 local cache 정리

HttpOnly Cookie 세션이면 프론트의 `fetch`에 `credentials: 'include'`를 공통 적용하면 됩니다.

## 4. 백엔드에서 반드시 실제 데이터로 내려줘야 하는 값

### Recipient

`id`, `name`, `role`, `company`, `country`, `language`, `timezone`, `organizationRelation`, `responseSpeed`, `averageResponseMinutes`, `collaborationActivity`, `isOnline`, `isFavorite`, `isRecent`, `verifiedExpert`, `fullTime`, `avatar`

### Company DNA

`decisionStructure`, `channels`, `reporting`, `terms[]`, `rules[]`, `accuracy`, `aiEnabled`

### Team Memory Pattern

`id`, `title`, `purpose`, `reason`, `request`, `deadline`, `attachmentName?`, `updatedAt?`, `unread?`

### AI Candidate

`id`, `text`, `suggestion`, `confidence`

### History

`id`, `date`, `recipient`, `purpose`, `score`, `status`, `type`, `createdAt`, `content?`

## 5. 우선순위

1. `POST /api/messages/optimize` — 핵심 AI 기능
2. `POST /api/messages/send` — 실제 전송
3. `GET/POST /api/recipients` — 메시지 작성과 수신자 관리
4. `GET/PUT /api/company-dna` — AI 생성 시 Company DNA 반영
5. `GET/POST/PUT/DELETE /api/team-memory` — 팀 학습 데이터
6. `GET/POST /api/history` — 실제 활동 기록
7. 인증/권한 — 모든 `/api/*`가 현재 로그인 사용자 기준으로 동작하도록 연결

## 6. 검색

상단 검색은 더 이상 검색어를 입력했다고 `/messages`로 강제 이동하지 않습니다.

- Dashboard: 사용 방법 항목 검색
- Messages: 수신자 이름 / 직무 / 회사 / 국가 검색
- Recipients: 기존 수신자 검색
- Company DNA: Terms / Rules 검색
- Team Memory: Pattern 검색
- History: 수신자 / 목적 / 날짜 / 상태 검색

즉, Enter는 현재 페이지의 검색을 실행하고 페이지 이동은 하지 않습니다.
