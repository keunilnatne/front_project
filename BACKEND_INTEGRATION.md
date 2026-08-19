# Backend integration notes

프런트는 화면 컴포넌트와 데이터 접근 코드를 분리하며, `src/users/*`와 `src/ai/*`를 백엔드 연동 경계로 사용합니다.

## API 계약

| 기능 | Front adapter | Method | Endpoint |
| --- | --- | ---: | --- |
| 로그인·회원가입 | `users/auth.ts` | POST | `/api/auth/login`, `/api/auth/signup` |
| 내 프로필 | `users/userProfile.ts` | GET/PUT/PATCH | `/api/users/me` |
| 수신자 관리 | `users/recipients.ts` | GET/POST/PUT/DELETE | `/api/recipients` |
| 수신자 AI 분석 | `ai/aiInsights.ts` | POST | `/api/ai/recipients/analyze` |
| 메시지 메타데이터 분석 | `ai/aiInsights.ts` | POST | `/api/ai/messages/metadata` |
| 메시지 AI 최적화 | `users/messageService.ts` | POST | `/api/messages/optimize` |
| 메시지 전송 | `users/messageService.ts` | POST | `/api/messages/send` |
| 임시 저장 | `users/drafts.ts` | GET/POST/DELETE | `/api/messages/drafts` |
| 팀 일정 | `users/teamMemory.ts` | GET/POST/PUT/DELETE | `/api/team-memory` |
| 기록 | `users/history.ts` | GET/DELETE | `/api/history` |
| 대시보드 | `users/dashboard.ts` | GET | `/api/dashboard/summary` |
| Gmail | `users/inbox.ts` | GET/POST | `/api/gmail/*` |
| 공지 | `users/notices.ts` | GET/POST/DELETE | `/api/notices` |

## 인증과 권한

- 보호된 모든 요청에는 `Authorization: Bearer <accessToken>`을 전송합니다.
- `401` 응답 시 토큰과 현재 사용자 로컬 캐시를 정리하고 로그인 화면으로 이동합니다.
- 대시보드와 온보딩 라우트는 `/api/users/me`로 토큰을 검증한 뒤 렌더링합니다.
- 공지 작성 화면 및 공지 생성·삭제 API는 `users.admin=true`인 사용자만 접근할 수 있습니다.
- 사용자별 데이터는 백엔드 소유권 조건과 사용자별 브라우저 저장소 키로 분리합니다.

## 실패 처리

- AI 분석 실패 시 가짜 결과를 만들지 않고 해당 보조 영역만 빈 상태로 유지합니다.
- 메시지 최적화 실패 시 원문을 최적화 결과처럼 표시하지 않고 오류를 안내합니다.
- 목록 조회 실패 시 사용자별 로컬 캐시가 있으면 캐시를 표시하고 서버 오류 상태를 안내합니다.

## 검증 명령

```bash
npm test
```
