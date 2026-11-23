# TNbnb

Website tìm kiếm chỗ ở và quản lý yêu cầu đặt phòng, thực hiện trong đồ án Capstone Airbnb của **Nguyễn Vũ Tín**. Giao diện tham khảo [CyberSoftbnb](https://demo5.cybersoft.edu.vn/), sử dụng thương hiệu TNbnb và hỗ trợ tiếng Việt, tiếng Anh.

Dự án có 80 cơ sở lưu trú tại 8 địa danh, 350 hạng phòng, các chức năng tài khoản, yêu thích, đánh giá và quản trị. Phần đặt phòng ghi nhận yêu cầu trong hệ thống; chưa kết nối tồn phòng hoặc thanh toán của khách sạn.

## Công nghệ

| Thành phần | Công nghệ sử dụng |
| --- | --- |
| Giao diện và máy chủ | Next.js App Router, React |
| Ngôn ngữ | JavaScript, CSS thuần |
| Cơ sở dữ liệu | SQLite qua `node:sqlite` |
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
| `TNB_BOOKINGS_DB_PATH` | Đường dẫn SQLite; mặc định `.data/tnbnb-bookings.sqlite` |
| `TNB_HOST` | Địa chỉ lắng nghe của lệnh `npm start`; mặc định `127.0.0.1` |

Không đưa token vào biến `NEXT_PUBLIC_*` hoặc commit `.env.local`. Cơ sở dữ liệu được tạo khi sử dụng chức năng lưu trữ và cần được giữ lại giữa các lần chạy.

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

Thống kê sau lần bổ sung ngày 22/11/2026:

| Nội dung | Số lượng |
| --- | ---: |
| Cơ sở lưu trú | 80 |
| Hạng phòng | 350 |
| Hạng có giá tham khảo đúng hạng | 22 |
| Hạng có sức chứa | 154 |
| Hạng có diện tích | 222 |
| Hạng có thông tin giường | 204 |
| Ảnh hạng phòng | 1.015 |
| Hạng có ít nhất 3 ảnh | 246 |

Ảnh đại diện khách sạn được lưu riêng với ảnh hạng phòng. Thông số chưa tìm được nguồn hoặc có nguồn mâu thuẫn được để trống. Hạng chưa có giá không sử dụng giá khởi điểm của khách sạn để thay thế.

Giá được hiển thị bằng VNĐ và USD, kèm nguồn, ngày tra cứu và điều kiện. Tỷ giá tham khảo trong dữ liệu là **1 USD = 25.900 VNĐ**, ghi nhận từ Vietcombank ngày 18/11/2026; không tự cập nhật và không phải tỷ giá thanh toán.

Các tệp dữ liệu chính nằm trong `lib/data`. Adapter tại `lib/catalog.js` hỗ trợ bổ sung dữ liệu từ [API CyberSoft](https://airbnbnew.cybersoft.edu.vn/swagger/index.html). Nhánh API trực tiếp chưa được kiểm chứng trong đợt kiểm tra vì chưa cấu hình token được cấp.

## Tài khoản và quản trị

Tài khoản TNbnb được lưu trong SQLite. Mật khẩu dùng scrypt với muối ngẫu nhiên; mã phiên và mã khôi phục được lưu dạng băm. Cookie tài khoản có `HttpOnly`, `SameSite=Lax` và `Secure` trong production. Khôi phục mật khẩu sử dụng mã đã cấp cho người dùng, chưa gửi email.

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
```

Lệnh `check:http` cần bản build, tự chạy máy chủ thử tại cổng 3002 với SQLite riêng và dọn dữ liệu sau kiểm tra. Có thể đổi cổng bằng `TNB_TEST_PORT`.

Ngày 23/11/2026, **21/21 kiểm thử tự động đạt** và build production thành công. Các bộ kiểm tra HTTP danh mục, đặt phòng, tài khoản, quản trị và đánh giá đã đạt trong đợt 22/11/2026. Kiểm tra trực quan và tương tác trên máy tính/điện thoại còn các mục chưa hoàn tất, được liệt kê trong [UI-QA.md](UI-QA.md).

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
- Chưa có gửi/xác minh email, đăng nhập mạng xã hội hoặc tích hợp thanh toán.
- Đã có cấu hình Docker và GitHub Actions; chưa chạy thử container hoặc xuất bản website. Kết quả chạy tại máy không thay thế kết quả CI trên GitHub.
- Bản hiện tại ghi SQLite vào ổ đĩa bền vững. Nếu triển khai theo hướng Vercel, cần thay lớp lưu trữ phù hợp; việc chuyển đổi chưa thực hiện.

## Tài liệu và tài nguyên

- [Hướng dẫn triển khai](DEPLOYMENT.md)
- [Các mục kiểm tra giao diện](UI-QA.md)

Logo TNbnb được thiết kế bằng SVG. Video và một số ảnh tham khảo từ website mẫu, sử dụng cho đồ án học tập. Ảnh địa danh lấy từ Wikimedia Commons; tác giả và giấy phép được ghi tại `/image-credits` và `lib/destination-sources.js`. Font Be Vietnam Pro nằm trong `public/fonts`, kèm giấy phép OFL.
