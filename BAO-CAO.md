# Báo cáo tiến độ Capstone Airbnb

**Nguyễn Vũ Tín · cập nhật 22/11/2026**

## Kết quả hiện tại

Giao diện được dựng lại theo website mẫu CyberSoftbnb. Thương hiệu TNbnb dùng logo SVG tự thiết kế, tên và favicon đồng bộ. Header trên video trong suốt; các trang nội dung có nền để dễ đọc. Trang chủ có tìm kiếm địa điểm/ngày/khách, điểm đến, các loại chỗ ở, banner giới thiệu và footer. Giao diện có bản Việt/Anh và CSS cho điện thoại, máy tính bảng, máy tính.

Danh mục có 80 cơ sở ở 8 địa danh, mỗi địa danh ít nhất 10 cơ sở; có ảnh khách sạn riêng và ảnh theo hạng phòng, nguồn tham khảo, giá VND/USD khi nguồn có giá. Người dùng có thể gửi và hủy yêu cầu đặt phòng trong TNbnb. Yêu cầu chưa chuyển đến cơ sở, chưa xác nhận phòng trống và không thu tiền.

## Phạm vi

| Hạng mục | Trạng thái |
| --- | --- |
| Trang chủ theo mẫu | Đã dựng với video, ảnh, nội dung tiếng Việt và bố cục responsive. |
| Danh sách và chi tiết phòng | 80 cơ sở có nguồn, hạng phòng và ảnh; tìm kiếm, lọc, trạng thái rỗng/404. |
| Yêu thích | Khách lưu trên trình duyệt; người đăng nhập đồng bộ theo tài khoản trên máy chủ. |
| Ngày đi và giá dự kiến | Có kiểm tra thứ tự ngày và tính số đêm; chưa kiểm tra phòng trống. |
| API vị trí và phòng | Có adapter server; đợt kiểm tra 22/11 chưa có CYBERSOFT_TOKEN được cấu hình nên chưa kiểm chứng nhánh dữ liệu API. |
| Đăng nhập, đăng ký, hồ sơ | Đã có tài khoản TNbnb: sửa hồ sơ/ảnh đại diện, đổi mật khẩu, đăng xuất, mã khôi phục dùng một lần. Chưa gửi/xác minh email hoặc đăng nhập qua mạng xã hội. |
| Yêu cầu đặt phòng | Lưu SQLite, chống gửi trùng, biên nhận riêng, danh sách chuyến đi, hủy yêu cầu. Yêu cầu của khách được gắn vào tài khoản qua đúng phiên trình duyệt; không ghép theo email. |
| Bình luận/đánh giá TNbnb | Đã có 1–5 sao, tạo/sửa/xóa nhận xét của mình, phân trang/sắp xếp, điểm cộng đồng riêng và kiểm duyệt ẩn/hiện có lý do. Không tự gắn nhãn đã lưu trú xác minh. |
| Quản trị | Đã có tổng quan, người dùng/vai trò/khóa tài khoản, cơ sở/hạng phòng, địa danh, xử lý yêu cầu, kiểm duyệt và nhật ký thay đổi. Phân quyền kiểm tra trên máy chủ. |
| Thanh toán, tồn phòng thực tế | Chưa tích hợp nhà cung cấp. Tiến độ xử lý yêu cầu là nội bộ TNbnb. |
| Git và chuẩn bị triển khai | Đã khởi tạo Git, thêm CI, Docker/Compose với volume, standalone, healthcheck và sao lưu có kiểm tra toàn vẹn. Chưa gắn remote/push, chưa chạy Docker trên máy đích hoặc xuất bản website. |

## Bổ sung chức năng và dữ liệu ngày 22/11/2026

- Hoàn thiện API và giao diện Việt/Anh cho đánh giá cộng đồng và `/quan-tri`. Thành viên chỉ sửa/xóa đánh giá của mình; mỗi tài khoản có một đánh giá mỗi cơ sở. Đánh giá bị ẩn/xóa không tham gia điểm trung bình công khai. Quản trị không sửa điểm hoặc nội dung của người gửi.
- Vai trò mặc định luôn là người dùng. CLI `npm run admin:grant -- --email ...` cấp quyền cho tài khoản đã tồn tại, không tạo mật khẩu mặc định. Thay đổi quyền/khóa qua web yêu cầu mật khẩu quản trị, thu hồi phiên và giữ ít nhất một quản trị viên hoạt động. Chưa cấp quyền cho tài khoản thật vì đang chờ email do chủ dự án chỉ định.
- Quản trị thêm/sửa/ẩn/hiện cơ sở và hạng phòng, quản lý địa danh; thay đổi lưu trong SQLite, áp dụng vào danh mục công khai và kiểm tra lại khi gửi yêu cầu. Hồ sơ đặt phòng đã tạo giữ nguyên thông tin chụp lúc gửi. Ghi chú xử lý nội bộ không xuất hiện trong biên nhận của khách.
- Bổ sung có nguồn cho 185 hạng tại 38 cơ sở: danh mục hiện có **154 hạng có sức chứa, 222 hạng có diện tích, 204 hạng có thông tin giường, 22 hạng có giá và 1.015 ảnh**; **246/350 hạng có từ 3 ảnh trở lên**. Nguồn và bằng chứng theo từng trường, cập nhật ngày 22/11. Sửa giới hạn Wink Corner thành 3 người lớn kèm điều kiện trẻ em của nguồn. Giá/điều kiện sức chứa chưa xác minh hoặc nguồn mâu thuẫn được giữ trống.
- Đã chuẩn bị bản standalone và kiểm tra việc đóng gói thư viện ảnh gốc; loại tệp dữ liệu, môi trường và hồ sơ nghiên cứu khỏi phần tracing. Chuẩn hóa kiểm tra Origin theo Host của trình duyệt để chạy đúng sau reverse proxy, đồng thời chặn yêu cầu từ nguồn khác.
- **21 kiểm thử qua**, gồm phân quyền, kiểm duyệt/điểm trung bình, lưu thay đổi, giữ biên nhận và sao lưu WAL. Build production thành công. Các bộ kiểm tra HTTP danh mục, đặt phòng, tài khoản và quản trị/đánh giá đã qua trên bản standalone dùng dữ liệu thử riêng. Có kiểm tra SSR khi đã tồn tại nhận xét, hai ngôn ngữ và hoạt động ẩn/hiện dữ liệu.
- Chưa xác nhận kiểm tra trực quan và thao tác bằng trình duyệt trên máy tính/điện thoại. Cả kết nối trình duyệt lẫn điều khiển cửa sổ báo không khả dụng sau khi thử lại. Kịch bản còn chờ được ghi trong [UI-QA.md](UI-QA.md); phần này tách riêng với kết quả HTML/API.
- Hướng dẫn chạy, HTTPS, cấp quyền, sao lưu và khôi phục nằm tại [DEPLOYMENT.md](DEPLOYMENT.md). Dữ liệu SQLite cần volume bền vững và một instance ghi; chưa xuất bản lên hosting/tên miền cụ thể.
- Đã chạy thử lệnh `npm start` mới với SQLite thử riêng: healthcheck trả 200, điều kiện giá của hạng phòng hiển thị trong HTML tiếng Việt và tiếng Anh. Máy đang dùng chưa có CLI Docker nên chưa chạy build/container Docker; bản Node standalone đã được kiểm tra. Máy chủ và dữ liệu thử được dọn sau kiểm tra, giữ nguyên máy chủ dev của chủ dự án.

## Rà soát ban đầu ngày 22/11/2026 (trước khi bổ sung)

- Chạy lại `npm.cmd test`: **15/15 kiểm thử qua**. `npm.cmd run build` biên dịch bản production thành công.
- Cả ba bộ kiểm tra HTTP `verify-accounts-http.mjs`, `verify-bookings-http.mjs`, `verify-http.mjs` đều qua trên máy chủ thử nghiệm riêng. Cơ sở dữ liệu thử tách khỏi dữ liệu đang dùng.
- Tài khoản: đăng ký/đăng nhập/đăng xuất, sửa hồ sơ/ảnh, yêu thích và chuyến đi ở phiên khác, phân quyền, chống yêu cầu khác nguồn, đổi mật khẩu thu hồi phiên, mã khôi phục dùng một lần và giới hạn thử sai đều qua kiểm tra.
- Đặt phòng: gửi yêu cầu, chống gửi trùng, tính tổng theo giá hạng phòng trên máy chủ, giữ trạng thái chưa có giá, xem biên nhận và hủy yêu cầu đều qua kiểm tra. Đây vẫn là yêu cầu lưu trong TNbnb, chưa phải xác nhận giữ phòng của khách sạn.
- Danh mục: 160 lượt kiểm tra trang chi tiết (80 cơ sở × 2 ngôn ngữ), 16 danh sách địa danh, 80 ảnh khách sạn, 2 trang nguồn, 4 trường hợp chọn hạng phòng, trang chủ ở hai ngôn ngữ và trang 404 đều qua.
- Phát hiện và sửa thông báo tài khoản bị hiển thị hai lần trong biểu mẫu đặt phòng. Giữ lại liên kết đăng nhập mang theo lựa chọn ngày, số phòng và số khách hiện tại.
- Dữ liệu hiện có: **80 cơ sở, mỗi địa danh 10 cơ sở; 350 hạng phòng; 971 ảnh hạng phòng**. Có 232/350 hạng có từ 3 ảnh trở lên (66,3%); 17/350 hạng có giá xác minh (4,9%); 44/350 hạng có sức chứa xác minh (12,6%); 160/350 hạng có diện tích; 75/350 hạng có thông tin giường. Ngày tra cứu hạng phòng đang ghi 18/11/2026; đợt này kiểm tra dữ liệu lưu sẵn, không tra cứu lại từng nguồn.
- Chưa có bình luận/đánh giá do người dùng TNbnb gửi, trang quản trị, tích hợp tồn phòng/thanh toán hoặc gửi/xác minh email. Điểm đánh giá hiện tại là điểm tổng hợp từ nguồn ngoài.
- Giới hạn: kiểm tra mã nguồn, ảnh lưu cục bộ, logic, HTML và API; chưa kiểm tra trực quan hoặc thao tác tương tác bằng trình duyệt, chưa đo hiệu năng thực tế trên thiết bị di động. Kiểm thử qua không thay thế kiểm tra giao diện.

Ưu tiên tiếp theo: hoàn thiện bình luận/đánh giá và trang quản trị theo phạm vi demo; bổ sung giá/sức chứa/ảnh còn thiếu; kiểm tra giao diện bằng trình duyệt; thiết lập Git, CI và môi trường triển khai với nơi lưu dữ liệu bền vững.

## Kịch bản xem thử

1. Mở `/`, xem video và các điểm đến.
2. Tìm `da lat` hoặc chọn một địa danh để xem danh sách khách sạn.
3. Mở khách sạn, chọn hạng phòng, ngày nhận/trả, số phòng/khách; tiếp tục gửi yêu cầu đặt phòng và xem biên nhận.
4. Lưu chỗ ở bằng nút trái tim, mở “Chỗ ở đã lưu”. Đăng ký tài khoản, lưu mã khôi phục, xem yêu cầu tại “Chuyến đi của tôi”.
5. Tìm địa điểm không có trong dữ liệu mẫu để xem trạng thái rỗng; mở mã phòng không tồn tại để xem trang 404.
6. Chọn tiếng Anh ở đầu trang; kiểm tra nội dung, biểu mẫu và lịch đổi sang tiếng Anh. Tải lại hoặc chuyển trang để kiểm tra lựa chọn vẫn được giữ, sau đó chuyển lại tiếng Việt.
7. Vào “Tài khoản”, sửa hồ sơ/ảnh đại diện, đổi mật khẩu; dùng email và mã khôi phục tại “Quên mật khẩu”. Lưu mã mới vì mã cũ hết hiệu lực sau khi sử dụng.

## Kiểm tra

Phần tài khoản: 15 kiểm thử tự động và bản dựng production đã qua. Kiểm tra HTTP bao gồm đăng ký/đăng nhập/đăng xuất, hồ sơ/ảnh đại diện, điền nhanh liên hệ, đồng bộ yêu thích/chuyến đi ở phiên mới, cô lập dữ liệu tài khoản, chống yêu cầu khác nguồn, giới hạn đăng nhập sai, thu hồi phiên sau đổi mật khẩu, mã khôi phục dùng một lần và màn hình Việt/Anh. Các kiểm tra đặt phòng cũ, 160 trang chi tiết và 16 danh sách địa danh ở hai ngôn ngữ vẫn qua. Chưa kiểm tra tương tác trực quan trên trình duyệt trong phiên này.

Lần rà bố cục ngày 17/11 đã chỉnh lại banner theo chiều cao màn hình, header theo trạng thái cuộn, khung nội dung 1280/1536px, cỡ chữ, lưới phòng, khối giá và chân trang. Bổ sung bộ lọc giá/phòng ngủ/tiện nghi dùng chung biểu mẫu tìm kiếm và nút lên đầu trang. Chi tiết tại [đối chiếu giao diện](DOI-CHIEU-GIAO-DIEN.md).

Bản build production đã biên dịch thành công. Đã kiểm tra logic tìm kiếm không dấu, sức chứa, phân loại và phòng không tồn tại; các tuyến trang chủ, kết quả và chi tiết trả HTTP 200, mã phòng không tồn tại trả HTTP 404. Với tính năng ngôn ngữ, đã kiểm tra khóa từ điển đồng bộ, bản dịch phòng mẫu, tìm kiếm Việt/Anh, ngày hợp lệ, nội dung và thuộc tính ngôn ngữ trong HTML của từng ngôn ngữ, lưu cookie và giữ URL/bộ lọc khi đổi ngôn ngữ. Chưa kiểm tra trực quan và thao tác tương tác trong trình duyệt tự động vì công cụ trình duyệt không khả dụng ở phiên làm việc này.
