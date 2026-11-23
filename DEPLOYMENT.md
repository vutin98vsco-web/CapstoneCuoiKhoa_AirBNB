# Chuẩn bị triển khai TNbnb

Bản này chạy Next.js trên Node.js 24, dùng SQLite lưu tài khoản, yêu cầu đặt phòng, yêu thích, đánh giá và thay đổi quản trị. Triển khai một instance có ổ đĩa bền vững. Chưa phù hợp với hosting chỉ có filesystem tạm hoặc nhiều bản sao cùng ghi một tệp SQLite.

## Kiểm tra trước khi chuyển máy chủ

```sh
npm ci
npm test
npm run build
npm run check:http
```

Kiểm tra HTTP tự khởi động bản standalone tại cổng 3002 với cơ sở dữ liệu tạm riêng, chạy các luồng danh mục/đặt phòng/tài khoản/quản trị/đánh giá và tự dọn dữ liệu thử. Đổi cổng bằng `TNB_TEST_PORT` nếu cổng đã được dùng. Script không dừng máy chủ đang chạy của người dùng.

Workflow `.github/workflows/checks.yml` chạy các bước trên khi push hoặc mở pull request. Cần tạo repository GitHub và cấu hình remote trước khi workflow có thể chạy trên GitHub; không có thông tin đăng nhập nào trong mã nguồn.

## Máy chủ Docker

```sh
docker compose build
docker compose up -d
docker compose ps
curl http://127.0.0.1:3000/api/health
```

Dockerfile dùng bản standalone, tài khoản hệ thống không phải root, và endpoint kiểm tra sức khỏe không trả dữ liệu người dùng. Dữ liệu nằm trong volume `tnbnb_data`, đường dẫn `/data/tnbnb.sqlite`. Volume giữ dữ liệu khi thay container. Không dùng `docker compose down -v` nếu muốn giữ dữ liệu.

Ứng dụng chỉ mở cổng 3000 trên loopback của máy chủ. Đặt reverse proxy HTTPS phía trước. `deploy/Caddyfile` là cấu hình mẫu cho Caddy chạy trên cùng máy chủ; đặt biến môi trường `TNB_DOMAIN` thành tên miền đã trỏ DNS về máy chủ, mở cổng 80/443 cho Caddy và dùng cấu hình mẫu đó. Cookie phiên production yêu cầu HTTPS.

Nếu dùng một reverse proxy khác, giữ nguyên Host và chuyển đúng thông tin giao thức. Các API thay đổi dữ liệu kiểm tra Origin cùng nguồn; không mở CORS tùy ý. Chỉ đặt `CYBERSOFT_TOKEN` ở môi trường máy chủ nếu đã được cấp token. Website vẫn dùng danh mục tham khảo khi chưa cấu hình token.

## Cấp quyền quản trị

1. Mở website qua HTTPS và đăng ký tài khoản TNbnb của người quản lý.
2. Cấp quyền từ máy chủ cho email đã đăng ký:

```sh
docker compose exec web node scripts/admin-role.mjs --email owner@example.com
```

Ở bản chạy trực tiếp bằng Node:

```sh
npm run admin:grant -- --email owner@example.com
```

Đặt `TNB_BOOKINGS_DB_PATH` trỏ tới đúng cơ sở dữ liệu khi dùng CLI. Công cụ không tạo tài khoản, không đặt mật khẩu mặc định và không tự cấp quyền cho người đăng ký đầu tiên. Sau khi cấp quyền, đăng nhập lại và mở `/quan-tri`. Có thể dùng `--revoke` để gỡ quyền; công cụ không cho gỡ quản trị viên hoạt động cuối cùng.

Trong website, quản trị viên có thể quản lý tài khoản khác sau khi xác nhận mật khẩu hiện tại. Không thể tự khóa hoặc tự đổi quyền của phiên đang dùng. Thay đổi quyền/khóa tài khoản sẽ kết thúc các phiên đăng nhập của tài khoản bị tác động. Các thao tác quản trị có nhật ký.

## Sao lưu và khôi phục

```sh
docker compose exec web node scripts/backup-db.mjs --output /data/tnbnb-backup-YYYYMMDD.sqlite
```

Hoặc:

```sh
npm run db:backup -- --output .backups/tnbnb-YYYYMMDD.sqlite
```

Dùng tên mới cho mỗi bản sao. Công cụ dùng SQLite Backup API và kiểm tra tính toàn vẹn, không sao chép riêng tệp chính trong khi WAL đang được ghi. Đưa bản sao sang nơi lưu riêng ngoài máy chủ theo lịch của người vận hành; chưa thiết lập tự động gửi bản sao ra ngoài. Tệp sao lưu chứa dữ liệu tài khoản và liên hệ, không đưa vào Git hoặc `public/`.

Để khôi phục: dừng ứng dụng, giữ một bản sao dữ liệu hiện tại, thay bộ tệp cơ sở dữ liệu bằng bản sao đã kiểm tra, đặt đúng quyền sở hữu cho tiến trình Node, rồi khởi động lại. Không trộn tệp `-wal`/`-shm` cũ với cơ sở dữ liệu được khôi phục. Kiểm tra `/api/health`, đăng nhập và một biên nhận trước khi mở lại cho khách.

## Phạm vi nghiệp vụ

- Đánh giá cộng đồng là nhận xét của tài khoản TNbnb, chưa xác minh đã lưu trú. Điểm này tách khỏi điểm của nguồn bên ngoài.
- Quản trị có thể ẩn/hiện nhận xét và ghi lý do; không sửa điểm hoặc nội dung người dùng.
- Giá lưu trong danh mục là giá tham khảo có nguồn và điều kiện. Không tự coi là giá trực tiếp cho ngày khách chọn.
- Trạng thái xử lý yêu cầu là nội bộ TNbnb, không xác nhận tồn phòng, giữ phòng hoặc thanh toán với khách sạn.
- Chưa tích hợp gửi/xác minh email, cổng thanh toán hoặc hệ thống tồn phòng của nhà cung cấp.

## Trạng thái bàn giao

Các tệp triển khai được chuẩn bị trong repository. Chưa xuất bản lên một hosting hay tên miền cụ thể. Chạy thử Docker và xác nhận HTTPS trên máy chủ đích trước khi đưa vào sử dụng.

Tài liệu chính thức: [Next.js standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), [Docker cho Next.js](https://docs.docker.com/guides/nextjs/), [SQLite Backup trong Node.js](https://nodejs.org/download/release/v24.15.0/docs/api/sqlite.html#sqlitebackupsourceDb-path-options).
