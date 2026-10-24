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
dạ em không fake cv ạ, em có thể biết ít hoặc nhiều về những techstack em dùng nhưng em kh fake, đừng loại em, em đói lắm rồi <img width="1909" height="986" alt="image" src="https://github.com/user-attachments/assets/3193f636-09f7-4f12-8fdf-1626e93a3a62" />

