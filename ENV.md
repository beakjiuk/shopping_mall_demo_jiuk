# 환경 변수 (로컬 / Heroku / Vercel)

로컬은 `server/.env`, `client/.env`에 두고 **Git에는 올리지 않습니다.**  
배포 시에는 아래 표대로 **각 플랫폼 Config Vars / Environment Variables**에만 넣으면 됩니다.

---

## Heroku 빌드가 `No default language could be detected` 로 실패할 때

이건 **환경 변수 미설정 때문이 아닙니다.** 저장소 **루트**에 `package.json`이 없으면 Heroku가 Node 앱인지 몰라 빌드팩을 고르지 못합니다.

이 레포는 루트에 **`package.json` + `Procfile`** 을 두고, `heroku-postbuild`에서 **`server/` 의존성만 `npm ci`** 하도록 맞춰 두었습니다. 그다음 **Deploy** 를 다시 시도하면 됩니다.

---

## Server (Heroku 등 Node 호스팅)

| 변수 | 필수 | 설명 |
|------|------|------|
| `MONGODB_URI` | ✅ | Atlas `mongodb+srv://…` 연결 문자열 (DB 이름 경로 포함 권장, 예: `/shopping_mall_demo`) |
| `JWT_SECRET` | ✅ | 프로덕션용 긴 랜덤 문자열 (로컬과 다르게 새로 생성) |
| `NODE_ENV` | 권장 | `production` |
| `PORT` | 선택 | Heroku는 자동 설정. 로컬만 `5000` 등 |
| `CLIENT_ORIGIN` | ✅ | Vercel 프로덕션 URL, 예: `https://프로젝트.vercel.app` (CORS) |
| `PORTONE_V2_API_SECRET` | 결제 시 | 포트원 콘솔 V2 API Secret — 결제 검증 없으면 비워도 됨 |
| `USD_TO_KRW` | 선택 | 기본 `1350` 근처 |
| `JSON_BODY_LIMIT` | 선택 | 기본 외 대용량 바디 필요 시만 |
| `DNS_SERVERS` | 선택 | Windows에서 `querySrv ECONNREFUSED` 나면 `8.8.8.8,1.1.1.1` (쉼표 구분) |

---

## Client (Vercel — `VITE_` 만 빌드에 포함)

### Vercel 대시보드에서 꼭 확인 (404 나올 때)

1. **Root Directory** → 반드시 **`client`** (레포 루트에 Heroku용 `package.json`이 있어서, 루트로 두면 Vite가 아니라 잘못 빌드되거나 404가 납니다.)
2. **Framework Preset** → **Vite** (또는 Auto가 `client` 안에서 Vite를 잡도록)
3. **`client/vercel.json`** 안의 `YOUR-HEROKU-APP` 를 본인 Heroku 앱 호스트로 바꾼 뒤 Git에 커밋·푸시 (또는 Vercel에서만 수정 불가하면 로컬에서 바꿔 푸시)

### 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `VITE_PORTONE_STORE_ID` | 결제 UI 시 | 포트원 스토어 ID |
| `VITE_PORTONE_CHANNEL_KEY` | 결제 UI 시 | 포트원 채널 키 |

API는 브라우저가 **`/api/...`** 로 요청합니다. **`client/vercel.json`** 의 첫 번째 `rewrite`가 Heroku로 넘깁니다. 두 번째 줄은 **새로고침·직접 URL 진입** 시 SPA용으로 `index.html`로 보냅니다.

---

## 배포 후 한 번

- Heroku: `heroku run npm run seed --app <앱이름>` (DB가 비었을 때)
- Atlas **Network Access**: Heroku는 IP가 고정이 아니면 `0.0.0.0/0` 허용이 흔함
