# TNbnb

Website tìm kiếm chỗ ở và quản lý yêu cầu đặt phòng, thực hiện trong đồ án Capstone Airbnb của **Nguyễn Vũ Tín**. Giao diện tham khảo [CyberSoftbnb](https://demo5.cybersoft.edu.vn/), sử dụng thương hiệu TNbnb và hỗ trợ tiếng Việt, tiếng Anh.

**Website:** [https://tnbnb.vercel.app](https://tnbnb.vercel.app)

Dự án có 80 cơ sở lưu trú tại 8 địa danh, 350 hạng phòng, các chức năng tài khoản, yêu thích, đánh giá và quản trị. Phần đặt phòng ghi nhận yêu cầu trong hệ thống; chưa kết nối tồn phòng hoặc thanh toán của khách sạn.

## Công nghệ

| Thành phần | Công nghệ sử dụng |
| --- | --- |
| Giao diện và máy chủ | Next.js App Router, React |
| Ngôn ngữ | JavaScript, CSS thuần |
| Cơ sở dữ liệu | PostgreSQL trên Vercel/Neon; SQLite khi chạy tại máy |
| Xử lý ảnh đại diện | Sharp |
| Kiểm thử | Node.js test runner và các kịch bản HTTP |
| Môi trường chạy | Node.js 24 trở lên, npm |

Phiên bản thư viện và các lệnh chạy nằm trong [package.json](package.json).

## Cài đặt và chạy

```sh
git clone https://github.com/vutin98vsco-web/CapstoneCuoiKhoa_AirBNB.git
cd CapstoneCuoiKhoa_AirBNB
npm ci
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Danh mục tham khảo hoạt động ngay, không bắt buộc cấu hình token API.

Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay cho `npm`, ví dụ `npm.cmd run dev`.

Để chạy bản production tại máy:

```sh
npm run build
npm start
```

`npm start` chạy bản standalone, mặc định tại `127.0.0.1:3000`. Hướng dẫn triển khai, HTTPS và sao lưu xem tại [DEPLOYMENT.md](DEPLOYMENT.md).

### Cấu hình môi trường

Khi dùng API CyberSoft ở môi trường phát triển, sao chép `.env.example` thành `.env.local` và thêm token được cấp. Với `npm start`, khai báo biến trong môi trường của tiến trình hoặc dịch vụ chạy ứng dụng; lệnh khởi động đọc đường dẫn dữ liệu và địa chỉ lắng nghe trước khi Next.js chạy.

| Biến | Ý nghĩa |
| --- | --- |
| `CYBERSOFT_TOKEN` | Token được cấp để gọi API CyberSoft từ máy chủ; có thể để trống khi sử dụng danh mục tham khảo |
| `RESEND_API_KEY`, `EMAIL_FROM` | Khóa Resend và địa chỉ gửi đã xác minh; chỉ dùng trên máy chủ |
| `CRON_SECRET` | Bí mật cho endpoint xử lý email chờ; Vercel tự gửi trong cron |
| `SITE_URL` | URL HTTPS chính thức dùng cho liên kết email và SEO |
| `DATABASE_URL` | Kết nối PostgreSQL, được Neon cấp qua Vercel; chỉ dùng trên máy chủ |
| `TNB_BOOKINGS_DB_PATH` | Đường dẫn SQLite; mặc định `.data/tnbnb-bookings.sqlite` |
| `TNB_HOST` | Địa chỉ lắng nghe của lệnh `npm start`; mặc định `127.0.0.1` |

Khi có `DATABASE_URL`, ứng dụng sử dụng PostgreSQL. Nếu không cấu hình biến này, bản chạy tại máy sử dụng SQLite. Bản Vercel yêu cầu PostgreSQL, không ghi dữ liệu vào tệp tạm. Không đưa token hoặc URL kết nối vào biến `NEXT_PUBLIC_*` hay commit `.env.local`.

## Chức năng chính

| Nhóm | Nội dung |
| --- | --- |
| Trang chủ | Logo TNbnb, video giới thiệu, header trong suốt trên video, tìm kiếm và 8 điểm đến |
| Tìm kiếm | Tìm tên hoặc địa danh có dấu/không dấu; lọc loại chỗ ở, số khách, giá, phòng ngủ và tiện nghi |
| Chi tiết cơ sở | Ảnh khách sạn, hạng phòng, tiện nghi, vị trí, chính sách và nguồn dữ liệu |
| Hạng phòng | Thư viện ảnh riêng, diện tích, giường, sức chứa và giá khi nguồn có thông tin |
| Ngôn ngữ | Tiếng Việt/Anh; lưu lựa chọn bằng cookie và giữ điều kiện tìm kiếm khi đổi ngôn ngữ |
| Tài khoản | Đăng ký, đăng nhập, sửa hồ sơ/ảnh đại diện, đổi mật khẩu, mã khôi phục và đăng xuất |
| Yêu thích | Lưu trong trình duyệt khi chưa đăng nhập; đồng bộ theo tài khoản khi đăng nhập |
| Yêu cầu đặt phòng | Chọn hạng, ngày, số phòng/khách; gửi yêu cầu, xem biên nhận, lịch sử và hủy yêu cầu |
| Đánh giá | Chấm 1–5 sao, viết/sửa/xóa nhận xét của mình, sắp xếp và phân trang |
| Quản trị | Quản lý cơ sở, hạng phòng, địa danh, người dùng, yêu cầu, kiểm duyệt đánh giá và nhật ký |

Các trang chính: `/`, `/rooms`, `/phong/[id]`, `/dat-phong`, `/dang-ky`, `/dang-nhap`, `/tai-khoan`, `/chuyen-di`, `/quan-tri`.

## Dữ liệu chỗ ở

Danh mục gồm Hà Nội, Hồ Chí Minh, Đà Nẵng, Đà Lạt, Nha Trang, Vũng Tàu, Phú Quốc và Hội An, mỗi địa danh có 10 cơ sở. Dữ liệu được tổng hợp từ nguồn công khai, gồm trang của cơ sở và nhà cung cấp; thông tin nguồn và ngày tra cứu được lưu cùng bản ghi, hiển thị tại `/data-sources`.

Thống kê sau lần bổ sung ngày 23/11/2026:

| Nội dung | Số lượng |
| --- | ---: |
| Cơ sở lưu trú | 80 |
| Hạng phòng | 350 |
| Hạng có giá tham khảo đúng hạng | 105 |
| Hạng có sức chứa | 237 |
| Hạng có diện tích | 271 chính xác, 6 khoảng, 3 tối thiểu |
| Hạng có thông tin giường | 272 |
| Ảnh hạng phòng | 1.067 |
| Hạng có ít nhất 3 ảnh | 269 |

Ảnh đại diện khách sạn được lưu riêng với ảnh hạng phòng. Thông số chưa tìm được nguồn hoặc có nguồn mâu thuẫn được để trống. Hạng chưa có giá không sử dụng giá khởi điểm của khách sạn để thay thế.

Giá được hiển thị bằng VNĐ và USD, kèm nguồn, ngày tra cứu và điều kiện. Tỷ giá tham khảo trong dữ liệu là **1 USD = 25.900 VNĐ**, ghi nhận từ Vietcombank ngày 18/11/2026; không tự cập nhật và không phải tỷ giá thanh toán.

Các tệp dữ liệu chính nằm trong `lib/data`. [API CyberSoft](https://airbnbnew.cybersoft.edu.vn/swagger/index.html) được gọi từ máy chủ qua `lib/cybersoft/client.js`, chuẩn hóa tại `lib/cybersoft/normalize.js` và ghép vào danh mục qua `lib/catalog.js`.

Khi có `CYBERSOFT_TOKEN`, trang khám phá cho phép chọn nguồn TNbnb/CyberSoft, lọc địa điểm CyberSoft và tìm kiếm không phân biệt dấu. Trang chi tiết gọi đúng `/api/phong-thue/{id}`; mã dạng `api-123` tách biệt với cơ sở TNbnb. Giá CyberSoft dùng USD theo giao diện mẫu, có quy đổi VNĐ. API không cung cấp hạng phòng khách sạn nên không tự tạo hạng phòng từ dữ liệu này.

| API CyberSoft | Sử dụng |
| --- | --- |
| `GET /api/phong-thue` | Danh mục phòng; chuẩn hóa và bỏ bản ghi trùng/không hợp lệ |
| `GET /api/phong-thue/{id}` | Chi tiết, kiểm tra phòng tồn tại khi lưu yêu thích/đánh giá |
| `GET /api/phong-thue/lay-phong-theo-vi-tri` | Lọc địa điểm từ form khám phá |
| `GET /api/vi-tri` và `GET /api/vi-tri/{id}` | Tên thành phố, khu vực và thông tin địa điểm |
| Hai API `phan-trang-tim-kiem` của phòng/địa điểm | Bộ gọi hỗ trợ tìm kiếm và phân trang theo Swagger; lệnh kiểm tra kết nối xác nhận hợp đồng phản hồi |

Danh mục trên giao diện lọc từ tập dữ liệu đã tải để giữ cách tìm không dấu và bộ lọc tiện nghi thống nhất. Lỗi xác thực/kết nối có thông báo; nguồn TNbnb vẫn hoạt động. Lỗi khi tải riêng một phòng được xử lý bằng trang thử lại, không biến lỗi API thành kết quả “không tồn tại”.

Tài khoản, yêu thích, yêu cầu đặt phòng, đánh giá và quản trị tiếp tục dùng API TNbnb cùng PostgreSQL/SQLite. Công cụ giá ở phòng CyberSoft chỉ tính dự kiến, chưa gửi yêu cầu sang `/api/dat-phong` của CyberSoft. Các thao tác quản trị TNbnb không sửa dữ liệu dùng chung trên CyberSoft.

Nhánh CyberSoft đã qua kiểm thử bằng máy chủ mô phỏng và kiểm tra giao diện; cần token được cấp để xác nhận kết nối thật. Đặt token trong `.env.local` tại máy, hoặc Environment Variables của Production trên Vercel và triển khai lại, rồi chạy:

```sh
npm run check:cybersoft
npm run check:http:cybersoft
```

Lệnh đầu gọi dịch vụ thật bằng GET và chỉ xuất trạng thái/số lượng, không in token. Lệnh thứ hai dùng dữ liệu mô phỏng và cơ sở dữ liệu thử riêng, kiểm tra hai ngôn ngữ, các nguồn danh mục, lọc địa điểm, chi tiết, yêu thích và phương án khi API lỗi; không gửi dữ liệu thử đến CyberSoft.

## Tài khoản và quản trị

Tài khoản TNbnb được lưu trong cơ sở dữ liệu đã cấu hình. Mật khẩu dùng scrypt với muối ngẫu nhiên; mã phiên và mã khôi phục được lưu dạng băm. Cookie tài khoản có `HttpOnly`, `SameSite=Lax` và `Secure` trong production. Khôi phục mật khẩu bằng mã đã cấp hoặc liên kết email khi đã cấu hình nhà cung cấp. Xác minh email dùng liên kết một lần, hết hạn sau 24 giờ; liên kết đặt lại mật khẩu hết hạn sau 30 phút. Đổi mật khẩu qua email kết thúc các phiên cũ và cấp mã khôi phục mới.

Tài khoản mới có vai trò người dùng. Để cấp quyền quản trị, đăng ký tài khoản trước rồi chạy lệnh tại máy chủ với đúng đường dẫn cơ sở dữ liệu:

```sh
npm run admin:grant -- --email owner@example.com
```

Thay `owner@example.com` bằng email đã đăng ký, sau đó đăng nhập lại để mở `/quan-tri`. Không có tài khoản hoặc mật khẩu quản trị mặc định.

## Kiểm tra

```sh
npm test
npm run build
npm run check:http
npm run check:http:email
```

Lệnh `check:http` cần bản build, tự chạy máy chủ thử tại cổng 3002 với SQLite riêng và dọn dữ liệu sau kiểm tra. Có thể đổi cổng bằng `TNB_TEST_PORT`.

Ngày 23/11/2026, **29/29 kiểm thử tự động và 4/4 kiểm thử tích hợp PostgreSQL đạt**, build production thành công. Các bộ kiểm tra HTTP danh mục, đặt phòng, tài khoản, quản trị và đánh giá dùng dữ liệu thử riêng. Kiểm tra yêu thích bổ sung việc lưu/bỏ lưu, nhập danh sách khi đăng nhập, cơ sở bị ẩn và cách ly giữa tài khoản. Giao diện đã kiểm tra trên 10 kích thước Chromium mô phỏng, hai ngôn ngữ; phạm vi và phần thiết bị thật còn chờ nằm trong [UI-QA.md](UI-QA.md).

Để kiểm tra PostgreSQL sau khi có `.env.local` chứa kết nối Neon:

```sh
npm run check:postgres
npm run check:http:postgres
```

Các kiểm tra PostgreSQL sử dụng schema thử riêng và tự dọn sau khi chạy, không thêm dữ liệu thử vào schema của website. Bốn kiểm thử tích hợp PostgreSQL xác nhận gửi đồng thời, phiên/tài khoản, đánh giá/danh mục và phân quyền.

## Cấu trúc thư mục

```text
app/          Các trang, API và CSS
components/   Thành phần giao diện
lib/          Dữ liệu, bản dịch, nghiệp vụ và lưu trữ
public/       Logo, font, video và ảnh
scripts/      Kiểm tra HTTP, cấp quyền và sao lưu
tests/        Kiểm thử tự động
deploy/       Cấu hình triển khai mẫu
```

## Phạm vi hiện tại

- Yêu cầu đặt phòng được lưu trong TNbnb, chưa gửi đến khách sạn, giữ phòng hoặc thu tiền.
- Đánh giá cộng đồng chưa xác minh người viết đã lưu trú và được tách khỏi điểm của nguồn ngoài.
- Luồng xác minh email, khôi phục mật khẩu và gửi thông báo yêu cầu đã được triển khai, kiểm tra HTTP trên SQLite/PostgreSQL bằng nhà cung cấp mô phỏng. Gửi email thật cần `RESEND_API_KEY` và `EMAIL_FROM` thuộc tên miền đã xác minh. Chưa có đăng nhập mạng xã hội hoặc tích hợp thanh toán.
- Docker đã build và chạy healthcheck thành công trên GitHub Actions. Sao lưu PostgreSQL hằng ngày được mã hóa, kiểm tra khôi phục trong container riêng và lưu artifact 7 ngày; kiểm tra website chạy mỗi giờ.
- Cấu hình Vercel nằm trong `vercel.json`; kết nối Neon được lưu bằng biến môi trường của Vercel. Thư mục dữ liệu, bí mật và báo cáo nội bộ được loại khỏi bản triển khai.

## Tài liệu và tài nguyên

- [Hướng dẫn triển khai](DEPLOYMENT.md)
- [Các mục kiểm tra giao diện](UI-QA.md)

Logo TNbnb được thiết kế bằng SVG. Video và một số ảnh tham khảo từ website mẫu, sử dụng cho đồ án học tập. Ảnh địa danh lấy từ Wikimedia Commons; tác giả và giấy phép được ghi tại `/image-credits` và `lib/destination-sources.js`. Font Be Vietnam Pro nằm trong `public/fonts`, kèm giấy phép OFL.
