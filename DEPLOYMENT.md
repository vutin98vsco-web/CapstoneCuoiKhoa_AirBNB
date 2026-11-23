# Chuẩn bị triển khai TNbnb

Bản này chạy Next.js trên Node.js 24. Khi cấu hình `DATABASE_URL`, tài khoản, yêu cầu đặt phòng, yêu thích, đánh giá và thay đổi quản trị được lưu trên PostgreSQL. Nếu không có biến này, bản chạy tại máy dùng SQLite và cần ổ đĩa bền vững.

## Vercel và Neon

Website production: [https://tnbnb.vercel.app](https://tnbnb.vercel.app). Project `tnbnb` thuộc workspace `tinng`, liên kết repository GitHub và nhánh `main`. Bản triển khai ngày 23/11/2026 dùng Node.js 24, Neon PostgreSQL tại Singapore; đã kiểm tra HTTPS, 16 lượt trang ở hai ngôn ngữ, healthcheck cơ sở dữ liệu, phân quyền quản trị và ảnh/video.

Project Vercel dùng framework Next.js, lệnh cài đặt `npm ci`, lệnh build `npm run build` và khu vực `sin1`. Không đặt lệnh `npm start` làm build hoặc override Output Directory. Tệp `vercel.json` lưu các thiết lập này.

1. Liên kết thư mục với project bằng `npx vercel link`.
2. Trong phần Git của project, kết nối đúng tài khoản GitHub và repository `vutin98vsco-web/CapstoneCuoiKhoa_AirBNB`. Nhánh production là `main`.
3. Tạo hoặc kết nối Neon qua Marketplace, chọn gói Free và khu vực Singapore. Ứng dụng dùng xác thực TNbnb nên không cần bật Neon Auth.
4. Kết nối database với môi trường Production để Vercel cấp `DATABASE_URL`. Development có thể dùng kết nối dành riêng cho phát triển; Preview nên dùng database/nhánh riêng khi triển khai bản thử.
5. Chạy kiểm thử và triển khai bằng `npx vercel --prod`. Khi Git đã được liên kết, các lần push vào `main` có thể kích hoạt deployment production.

Schema PostgreSQL được khởi tạo khi kết nối đầu tiên, có khóa giao dịch để tránh khởi tạo đồng thời. Các thay đổi nhiều bước dùng một kết nối trong giao dịch. Khóa theo nghiệp vụ và ràng buộc duy nhất bảo vệ yêu cầu gửi trùng, thay đổi quyền và mã khôi phục khi nhiều instance xử lý cùng lúc.

Để bật danh mục CyberSoft, thêm `CYBERSOFT_TOKEN` do lớp cấp trong Settings → Environment Variables của project Vercel, chọn Production, rồi redeploy. Không dùng tên `NEXT_PUBLIC_*`. Nhánh này chỉ đọc danh mục, phòng và địa điểm; dữ liệu tài khoản và nghiệp vụ TNbnb không chuyển sang CyberSoft. Khi token thiếu hoặc hết hạn, danh mục TNbnb vẫn dùng được và nguồn CyberSoft hiển thị thông báo riêng.

Kiểm tra token thật tại môi trường đã nạp biến bằng `npm run check:cybersoft`; lệnh chỉ gửi GET và không xuất credential. `npm run check:http:cybersoft` dùng máy chủ mô phỏng riêng, chạy sau build và không ghi vào dịch vụ CyberSoft. Chạy các kịch bản HTTP nối tiếp nhau vì chúng chuẩn bị cùng thư mục standalone.

Để lấy biến Development về máy, dùng `npx vercel env pull .env.local`. Tệp này được loại khỏi Git. Các lệnh CLI Node.js cần nạp biến, ví dụ:

```sh
node --env-file=.env.local scripts/admin-role.mjs --email owner@example.com
npm run check:postgres
npm run check:http:postgres
```

Lệnh kiểm tra PostgreSQL chỉ thao tác trong schema thử có tên ngẫu nhiên và tự dọn khi kết thúc. Danh mục 80 cơ sở và ảnh vẫn được đóng gói từ JSON và `public`; không cần nhập chúng thành bảng để hiển thị.

Lệnh `db:backup` bên dưới dành cho SQLite. Với PostgreSQL, sao lưu/khôi phục bằng công cụ của nhà cung cấp hoặc `pg_dump`/`pg_restore`, rồi kiểm tra trên database riêng trước khi áp dụng vào production. Không dùng đường dẫn SQLite để sao lưu bản Neon.

## Kiểm tra trước khi chuyển máy chủ

```sh
npm ci
npm test
npm run build
npm run check:http
```

Kiểm tra HTTP tự khởi động bản standalone tại cổng 3002 với cơ sở dữ liệu tạm riêng, chạy các luồng danh mục/đặt phòng/tài khoản/quản trị/đánh giá và tự dọn dữ liệu thử. Đổi cổng bằng `TNB_TEST_PORT` nếu cổng đã được dùng. Script không dừng máy chủ đang chạy của người dùng.

Workflow `.github/workflows/checks.yml` chạy các bước trên khi push hoặc mở pull request. Repository và workflow đã hoạt động; CI gồm kiểm thử logic, HTTP, CyberSoft mô phỏng, email mô phỏng và build/chạy container. Không có thông tin đăng nhập nào trong mã nguồn.

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

PostgreSQL trên Neon được sao lưu bằng workflow `Encrypted PostgreSQL backup` mỗi ngày lúc 02:17 giờ Việt Nam (có thể khởi chạy thủ công trên GitHub Actions). Hai secret `BACKUP_DATABASE_URL` và `BACKUP_PUBLIC_KEY` thuộc repository; khóa riêng không được đưa lên GitHub. Mỗi lượt sao lưu dùng `pg_dump` PostgreSQL 18, thử khôi phục trong container riêng rồi mới tải bản mã hóa AES-256-GCM/RSA-OAEP-SHA256 lên artifact, lưu 7 ngày.

Khóa giải mã được lưu nội bộ ở `.backups/tnbnb-backup-private.pem`. Cần giữ thêm một bản tại nơi riêng tư ngoài máy; mất khóa này sẽ không giải mã được các bản sao tương ứng. Thư mục `.backups` không được commit hoặc xuất bản.

Sau khi tải artifact về máy, giải mã bằng:

```sh
node scripts/decrypt-backup.mjs --input encrypted.tnbackup --key .backups/tnbnb-backup-private.pem --output .backups/restored.dump
```

Dùng `pg_restore` vào một PostgreSQL riêng trước khi phục hồi dữ liệu thật. Công cụ không ghi đè tệp đích có sẵn. Không đưa bản đã giải mã vào `public/`, Git hoặc artifact công khai.

Workflow `Website availability` kiểm tra website, cơ sở dữ liệu, robots và sitemap mỗi giờ. Lỗi làm workflow thất bại để xuất hiện trong GitHub Actions; thông báo email phụ thuộc cài đặt Notifications của tài khoản GitHub. Lỗi máy chủ có log cấu trúc `tnbnb_error` trên Vercel, không chứa nội dung biểu mẫu, token hoặc URL kết nối.

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
- Gửi/xác minh email đã có mã nguồn và kiểm thử; cần khóa Resend cùng địa chỉ gửi đã xác minh để hoạt động thật. Chưa tích hợp cổng thanh toán hoặc hệ thống tồn phòng của nhà cung cấp.

## Trạng thái bàn giao

Các tệp triển khai được chuẩn bị trong repository. Docker là phương án chạy riêng với SQLite; build và chạy container đã đạt trên GitHub Actions. Vẫn cần kiểm tra cấu hình mạng/volume trên máy chủ đích. Vercel dùng PostgreSQL qua `DATABASE_URL`; kiểm tra `/api/health`, tài khoản và yêu cầu đặt phòng sau mỗi deployment.

Tài liệu chính thức: [Next.js standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), [Docker cho Next.js](https://docs.docker.com/guides/nextjs/), [SQLite Backup trong Node.js](https://nodejs.org/download/release/v24.15.0/docs/api/sqlite.html#sqlitebackupsourceDb-path-options).

## Email và tác vụ định kỳ

Thêm `RESEND_API_KEY` và `EMAIL_FROM` trong Vercel Production. Địa chỉ gửi phải thuộc tên miền được xác minh trên Resend. Đặt `SITE_URL=https://tnbnb.vercel.app` nếu đổi cấu hình; khi đổi tên miền cần cập nhật biến này trước khi gửi liên kết. Không đặt khóa trong biến NEXT_PUBLIC. Hiện chưa có khóa gửi thật, giao diện hồ sơ báo chưa cấu hình.

`CRON_SECRET` đã được tạo riêng trên Vercel. Cron `/api/cron/email` chạy mỗi ngày 07:00 giờ Việt Nam, phù hợp lịch ngày của gói Hobby. Email được thử gửi ngay sau phản hồi; cron thử lại các email chờ, tối đa 5 lần, loại bỏ liên kết hết hạn. Chỉ gửi thông báo yêu cầu đặt phòng đến email đã xác minh của tài khoản sở hữu yêu cầu; nội dung không xác nhận giữ phòng.

Kiểm thử sau build: `npm run check:http:email` và `npm run check:http:email -- --postgres`. Hai lệnh dùng nhà cung cấp mô phỏng, tài khoản/schema thử riêng, không gửi email thật.
