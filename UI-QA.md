# Kiểm tra giao diện

Cập nhật ngày 23/11/2026. Đã kiểm tra bản production cục bộ bằng Chromium chạy qua Brave ở chế độ headless. Có chụp và xem ảnh giao diện điện thoại, máy tính bảng, máy tính. Tài khoản, đánh giá và yêu cầu đặt phòng thử nằm trong SQLite riêng, không ghi vào dữ liệu website đang chạy.

## Kích thước và phạm vi

- Điện thoại: 320 × 740, 360 × 800, 390 × 844; màn hình ngang 844 × 390.
- Máy tính bảng: 600 × 960, 768 × 1024, 820 × 1180, 1024 × 768, 1180 × 820.
- Máy tính: 1440 × 900.
- Mỗi kích thước đều kiểm tra tiếng Việt và tiếng Anh.
- 240 lượt mở trang, 492 kiểm tra bố cục/tương tác cơ bản: không tràn ngang toàn trang, không có lỗi JavaScript chưa xử lý. Bảng quản trị, thanh mục chi tiết và hàng ảnh thu nhỏ được cuộn ngang trong vùng riêng.

| Phần giao diện | Kết quả |
| --- | --- |
| Trang chủ | Header trong suốt trên video; thu gọn menu trên màn hình nhỏ; bố cục tìm kiếm và bộ lọc thích ứng kích thước |
| Danh sách chỗ ở | Một cột trên điện thoại, hai cột trên máy tính bảng; ảnh khách sạn giữ tỷ lệ; tên khách sạn được xuống dòng |
| Chi tiết và hạng phòng | Khối đặt phòng đưa lên trước nội dung khi không còn cột bên; thông số, giá và nút chọn phòng không bị tràn |
| Lịch chọn ngày | Mở trong khung màn hình, chọn/đóng được; Escape trả focus; lịch ở form đặt phòng cũng đã kiểm tra |
| Thư viện ảnh | Mở/đóng, chuyển ảnh, cuộn ảnh nhỏ và vuốt bằng sự kiện cảm ứng đã qua kiểm tra |
| Đặt phòng | Điện thoại/máy tính bảng hiển thị tóm tắt trước form; gửi yêu cầu bằng giao diện và mở lại trong chuyến đi thành công |
| Tài khoản | Đăng nhập qua form thành công; kiểm tra bố cục đăng ký, khôi phục, hồ sơ và bảo mật |
| Bình luận/đánh giá | Chọn sao, gửi, sửa, xóa qua giao diện trên điện thoại tiếng Việt và máy tính bảng tiếng Anh thành công |
| Quản trị | Tổng quan, danh sách cơ sở và hộp thoại thêm cơ sở hiển thị trong khung; bảng cuộn riêng, form cuộn dọc |
| Chuyển ngôn ngữ | Đổi qua menu thành công, giữ tham số hạng phòng; chuyển hướng tương đối giữ tên miền đang truy cập |

## Kiểm tra mã nguồn và HTTP

- Build production thành công, 21 kiểm thử logic đạt.
- Các luồng HTTP danh mục, đặt phòng, tài khoản, đánh giá và quản trị đã đạt trên cơ sở dữ liệu thử riêng.
- Danh mục kiểm tra đủ 160 trang chi tiết theo hai ngôn ngữ, 16 danh sách địa danh, 80 ảnh đại diện khách sạn và các trang nguồn.
- Bổ sung kiểm tra chuyển ngôn ngữ giữ query/hash, cookie và từ chối chuyển hướng sang website khác.
- Nhánh CyberSoft: đã thử form chọn nguồn/địa điểm và trang chi tiết trên màn hình 390, 768, 1440 px với dữ liệu mô phỏng; không tràn ngang, không lỗi JavaScript. Đã xem thông báo thử lại khi dịch vụ chi tiết lỗi. Kết nối CyberSoft thật cần token được cấp.

## Chưa kiểm tra trên thiết bị thật

Chưa kiểm tra Safari/iOS, bàn phím ảo, vùng tai thỏ trên iPhone/iPad thật, công cụ đọc màn hình và thao tác tải ảnh đại diện bằng camera. Mô phỏng Chromium không thay thế các kiểm tra này. Docker cũng chưa được chạy thử trong đợt kiểm tra giao diện này.
