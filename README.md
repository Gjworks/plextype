# Plextype

# Install

```bash
git clone [git@github.com](mailto:git@github.com):Gjworks/plextype.git
npm install
```

## .env

로컬에서 개발 할 경우 `.env.development` 와 `.env.production` 과 `.env` 파일을 만들어 아래 값을 넣어줍니다.

`.env.development` 와 `.env.production` 의경우 서로 겹치는 경우에만 작성을 하며 기본적으로 겹치지 않은 경우는 `.env` 에만 넣어둬도 됩니다.

```bash
PROJECT_NAME=프로젝트이름
NEXT_PUBLIC_DEFAULT_URL=도메인주소
NEXT_PUBLIC_SECRET=토큰

JWT_SECRET=JWT에 사용될 토큰 
SECRET_KEY=단방향 비밀번호에 생성될 토큰
ACCESSTOKEN_EXPIRES_IN=1h
REFRESHTOKEN_EXPIRES_IN=4h

#테이블 생성 후 기본적인 관리자 정보를 넣기 위함
ADMIN_ACCOUNT_ID=아이디
ADMIN_PASSWORD=패스워드
ADMIN_EMAIL=관리자이메일
ADMIN_NICKNAME="관리자닉네임"

#데이터베이스 정보
DATABASE_URL="postgresql://DB_USER:DB_PASSWORD@postgres:5432/DB_NAME?schema=public"
```

`.env` 에서는 기본적으로 영어를 사용하며 `NAME=abcd` (=) 사이에 공백없이 반드시 붙여서 작성 하시기 바랍니다. 한글 및 띄어쓰기가 있는경우 “(쌍따옴)” 을 사용 합니다.

 해당 토큰들 생성은

```bash
openssl rand -base64 32
```

를 통해서 나온 토큰 값들을 넣어서 생성된 값을 토큰 값에 넣어줍니다. 각 .env 파일 들에 넣어주고 절대로 유출되지 않도록 해야 합니다.

<aside>
💡

`.env` 파일과 `.env.development` , `.env.production`  들은 절대 github등에 되지 않도록 주의 해야 하며 `gitignore` 에 작성은 되어 있으나 임의로 삭제후 github 저장소등에 올리지 마시기 바랍니다.

</aside>

## 첨부파일 폴더 생성

그리고 프로젝트 최상위 폴더로 온다음에 `storage` 폴더를 만들어줍니다.

```bash
mkdir storage
cd public
mkdir storage
ln -s ../storage storage
```

를 통해 폴더를 만들고 심볼링크를 해놓습니다.

```bash
npx prisma migrate dev
npx prisma db seed
```
