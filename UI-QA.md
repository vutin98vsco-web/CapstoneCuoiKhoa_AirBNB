# Kiểm tra giao diện trước khi triển khai

Tình trạng ngày 22/11/2026: build production, kiểm thử logic và các luồng HTTP đã qua. Chưa hoàn tất kiểm tra trực quan: công cụ trả `The browser access host is unavailable` và `Computer Use native pipe is unavailable (os error 2)`; thử kết nối lại vẫn lỗi. Không có ảnh chụp kiểm chứng bố cục máy tính/điện thoại trong đợt bàn giao này.

Khi kết nối trình duyệt hoạt động lại, kiểm tra trên môi trường thử riêng và tài khoản quản trị thử, không ghi nhận xét hoặc hủy yêu cầu trên dữ liệu thật.

| Màn hình | Việc cần kiểm tra trực tiếp | Trạng thái |
| --- | --- | --- |
| Máy tính 1440 × 900 và 1366 × 768 | Header/video, khoảng cách nội dung, lưới khách sạn, tìm kiếm và lịch | Chưa kiểm chứng trực quan |
| Điện thoại 390 × 844 và 360 × 800 | Menu, đổi ngôn ngữ, tìm kiếm/lọc, không tràn ngang toàn trang, nút và chữ đủ lớn | Chưa kiểm chứng trực quan |
| Chi tiết/hạng phòng | Gallery mở/đóng bằng bàn phím, chuyển ảnh, chọn hạng cập nhật giá/điều kiện sức chứa | Chưa kiểm chứng tương tác |
| Đánh giá | Chọn 1–5 sao, nhập/sửa/xóa nhận xét, hộp xác nhận, sắp xếp/phân trang, thông báo lỗi mạng | Chưa kiểm chứng tương tác |
| Quản trị | Chuyển tab, tìm kiếm/phân trang, mở/đóng form, hiển thị lỗi theo trường, cuộn bảng trên điện thoại | Chưa kiểm chứng trực quan |
| Form quản trị | Tạo/sửa/ẩn/hiện cơ sở và hạng; không mất nội dung khi lỗi; giá trống không hiển thị bằng 0 | Logic/API đã qua; tương tác chưa kiểm chứng |
| Phân quyền | Khách/thành viên không đọc được dữ liệu quản trị; khóa/đổi quyền thu hồi phiên; trang hết phiên rõ ràng | API đã qua; giao diện chưa kiểm chứng |
| Việt/Anh | Nhãn, trạng thái, hộp thoại và lỗi đổi đúng ngôn ngữ; nội dung người dùng được giữ nguyên | HTML/từ điển đã qua; trực quan chưa kiểm chứng |
| Khả năng tiếp cận | Tab, focus rõ, Escape đóng hộp thoại, nhãn input, đọc thông báo lỗi, reduced motion | Có triển khai; chưa kiểm chứng thực tế |

Trang quan trọng: `/`, `/rooms`, `/phong/hanoi-4689061`, `/dat-phong`, `/dang-nhap`, `/tai-khoan`, `/chuyen-di`, `/quan-tri`.

Không coi media query hoặc kết quả HTTP 200 là bằng chứng bố cục đã đúng trên thiết bị. Trước khi xuất bản cần hoàn tất các mục trực quan còn chờ, chạy thử Docker trên máy đích, kiểm tra HTTPS và sao lưu/khôi phục.
