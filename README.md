# LawOh Backend (LawOhBe)

Backend cho nền tảng tư vấn và đặt lịch luật sư trực tuyến. Xây dựng bằng NestJS, MongoDB, Redis và hệ thống giám sát Observability (Loki, Prometheus, Grafana, OpenTelemetry).

---

## Tech Stack

- **Core:** NestJS v11, TypeScript, Express
- **Database:** MongoDB + Mongoose (Repository & Mapper Pattern)
- **Cache & Queue:** Redis (Cache-manager, Distributed Lock), BullMQ
- **Realtime:** Socket.IO (Chat 1-1, thông báo realtime)
- **Authentication & Security:** JWT với thuật toán xác thực bất đối xứng RS256 (Private Key ký token, Public Key verify), Throttler Rate Limiting (Redis storage), Sanitize middleware chống NoSQL Injection, Passport
- **Observability:**
  - Distributed Tracing: OpenTelemetry SDK (OTLP)
  - Metrics: Prometheus (/api/v1/metrics)
  - Logging: Pino Logger -> Promtail -> Grafana Loki
  - Dashboard: Grafana
  - Healthcheck: NestJS Terminus (/api/v1/health, liveness & readiness probes)
- **Dev Tools:** Husky, Commitlint, ESLint, Prettier, Jest

---

## Kiến trúc dự án

Dự án tách biệt giữa Libraries dùng chung (libs/) và Modules nghiệp vụ (src/modules/):

```
d:\LawOhBe
├── libs/                  # Core & Shared modules
│   ├── configuration/     # Cấu hình Mongo, Redis, BullMQ, Mail, Loki...
│   ├── constant/          # Metadata, Enums, Roles
│   ├── decorators/        # Custom decorators (@UserData, @RoleDecorator...)
│   ├── guard/             # JWT AuthGuard (RS256 Public Key verify), RoleGuard, CustomThrottlerGuard
│   ├── interceptor/       # Response transform, Exception filter, Logging
│   ├── observable/        # OpenTelemetry setup, Prometheus metrics
│   ├── repository/        # BaseRepository dùng chung cho Mongoose
│   ├── schemas/           # Mongoose schemas & data models
│   └── utils/             # Pagination, String, Hash helpers
│
└── src/
    ├── health/            # Healthcheck module (Memory, Mongo, Redis)
    └── modules/           # Feature modules
        ├── auth/          # Đăng ký, đăng nhập, JWT RS256 (Asymmetric), OTP email
        ├── users/         # Quản lý user và phân quyền
        ├── lawyer/        # Quản lý hồ sơ luật sư, khung giờ và dịch vụ
        ├── booking/       # Đặt lịch hẹn, chống trùng lịch bằng Redis Lock
        ├── message/       # Chat realtime Socket.IO
        ├── notification/  # Hệ thống thông báo
        ├── classification/# Phân loại hồ sơ pháp lý
        ├── review/        # Đánh giá luật sư sau phiên tư vấn
        ├── news/          # Quản lý bài viết, tin tức
        ├── video/         # Quản lý video bài giảng / tư vấn
        ├── comment/       # Bình luận bài viết và video
        ├── learn-package/ # Gói tài liệu và khoá học
        ├── price-range/   # Khung giá tư vấn
        └── form/          # Quản lý biểu mẫu pháp luật
```

---

## Chạy hạ tầng bằng Docker

Toàn bộ dịch vụ hỗ trợ (MongoDB, Redis, RedisInsight, Kafka, Loki, Promtail, Prometheus, Grafana) đã được gom trong file docker-compose.provider.yaml:

```bash
# Khởi động toàn bộ database và tools giám sát
docker compose -f docker-compose.provider.yaml up -d

# Xem log các container
docker compose -f docker-compose.provider.yaml logs -f
```

---

## Cài đặt & Chạy ứng dụng

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình biến môi trường (.env)

Tạo file .env ở thư mục gốc:

```env
PORT=3300
GLOBAL_PREFIX=api/v1
NODE_ENV=development

# Database
MONGO_URL=mongodb://root:password@localhost:27017/law-oh?authSource=admin
MONGO_DB_NAME=law-oh
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Asymmetric Keys (RS256)
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Khởi chạy

```bash
# Chạy dev (watch mode)
npm run start:dev

# Chạy test toàn bộ hệ thống
npm test

# Build production
npm run build
npm run start:prod
```

---

## Endpoints & Tools quản trị

| Dịch vụ                  | URL                                  | Ghi chú                                |
| :----------------------- | :----------------------------------- | :------------------------------------- |
| **Swagger Docs**         | http://localhost:3300/Swagger        | Tài liệu API tương tác trực tiếp       |
| **Health Check**         | http://localhost:3300/api/v1/health  | Kiểm tra MongoDB, Redis, RAM           |
| **Prometheus Metrics**   | http://localhost:3300/api/v1/metrics | Dữ liệu metric cho Prometheus scrape   |
| **Prometheus Dashboard** | http://localhost:9090                | Quản lý targets và query metrics       |
| **Grafana**              | http://localhost:3001                | User: admin / Pass: admin              |
| **Redis Insight**        | http://localhost:5540                | Giao diện trực quan kiểm tra key Redis |

---

## Testing

Dự án có đầy đủ unit tests cho tất cả các service và repository:

```bash
npm test
```

```text
Test Suites: 21 passed, 21 total
Tests:       65 passed, 65 total
```
