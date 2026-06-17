# BMS (Battery Management System / Business Management System)

본 프로젝트는 NestJS 기반의 API 서버와 MariaDB, 그리고 Nginx 리버스 프록시를 활용하여 구성된 시스템입니다.
모든 서비스는 Docker 및 Docker Compose를 통해 손쉽게 배포하고 관리할 수 있도록 설계되었습니다.

---

## 🏛 시스템 아키텍처 (Architecture)

- **bms-proxy (Nginx)**: 리버스 프록시 및 SSL/HTTPS 처리. `DOMAIN` 환경변수를 기반으로 동적 라우팅 수행.
- **bms-api (NestJS)**: 메인 비즈니스 로직을 처리하는 백엔드 서버. Prisma ORM을 사용하여 DB와 통신.
- **bms-db (MariaDB)**: 데이터베이스 서버.

---

## ⚙️ 사전 요구사항 (Prerequisites)

시스템 구축 및 배포를 위해 다음 소프트웨어가 설치되어 있어야 합니다.
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v22 이상 권장) - 로컬 개발 및 Prisma 타입 생성 시 필요

---

## 🚀 환경 변수 설정 (Environment Setup)

프로젝트 루트 디렉토리에는 2개의 환경 변수 파일이 필요합니다.
제공된 `.example` 파일을 복사하여 실제 환경 변수 파일을 생성하세요.

### 1. 전역 환경 변수 (`.env`)
Nginx 프록시 등 시스템 전반에 적용되는 설정입니다.
```bash
cp .env.example .env
```
`.env` 파일을 열어 사용할 도메인(`DOMAIN`)을 설정합니다. 로컬 테스트용인 경우 `localhost`를 유지합니다.

### 2. API 전용 환경 변수 (`.env.api`)
데이터베이스 연결 정보 및 JWT 인증 시크릿 키 등을 설정합니다.
```bash
cp .env.api.example .env.api
```
`.env.api` 파일을 열어 `JWT_SECRET`과 `JWT_REFRESH_SECRET`에 안전한 난수 문자열을 기입합니다.

---

## 💻 로컬 개발 환경 구성 (Local Development)

API 코드를 로컬 에디터(VS Code 등)에서 수정하고 타입스크립트 에러 없이 개발하기 위한 설정입니다.

1. **패키지 설치 및 Prisma Client 생성**
   API 디렉토리로 이동하여 패키지를 설치하고, 데이터베이스 스키마 타입을 생성합니다.
   ```bash
   cd bms-api
   npm install
   npm run prisma:generate
   ```
   *참고: `prisma:generate` 명령어는 루트에 위치한 `.env` 및 `.env.api`를 자동으로 참조하도록 설정되어 있습니다.*

2. **데이터베이스 스키마 변경 및 반영 (개발용)**
   DB 스키마(`schema.prisma`)를 변경한 경우, 아래 명령어를 실행하면 DB에 변경사항을 반영하고 동시에 로컬 타입(자동완성)을 업데이트합니다.
   ```bash
   npm run migrate:dev
   ```
   *(참고: 명령어를 치면 터미널에서 마이그레이션 이름을 입력하라고 물어보며, 적당한 이름을 입력하고 엔터를 치시면 됩니다.)*
   *(주의: 이 명령어는 개발 환경 전용입니다. 기존 데이터와 충돌 시 DB를 초기화할 위험이 있으므로 운영 환경에서는 절대 사용하지 마세요.)*

3. **로컬 서버 실행 (옵션)**
   ```bash
   npm run start:dev
   ```

---

## 🛳️ 배포 및 실행 (Deployment)

Docker Compose를 이용하면 명령어 한 줄로 전체 인프라를 구축할 수 있습니다.

1. **컨테이너 빌드 및 백그라운드 실행**
   프로젝트 루트(docker-compose.yml이 있는 곳)에서 아래 명령어를 실행합니다.
   ```bash
   docker-compose up -d --build
   ```

2. **운영 데이터베이스 스키마 안전 배포 (운영용)**
   로컬에서 위 과정으로 생성된 마이그레이션 파일(`.sql`)들을 Git으로 받아온 뒤, 운영 서버 DB에 안전하게 반영합니다. `db push`나 `migrate dev` 대신 반드시 아래 명령어를 사용해야 데이터 유실을 방지할 수 있습니다.
   ```bash
   docker-compose exec bms-api npx prisma migrate deploy
   ```

3. **상태 확인 및 로그 보기**
   ```bash
   docker-compose ps       # 켜져있는 컨테이너 상태 확인
   docker-compose logs -f  # 전체 로그 실시간 확인
   ```

4. **서비스 종료**
   ```bash
   docker-compose down
   ```
