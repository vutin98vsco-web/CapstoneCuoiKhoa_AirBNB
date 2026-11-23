# Báo cáo đồ án Capstone Airbnb

**Tên dự án:** TNbnb

**Người thực hiện:** Nguyễn Vũ Tín

**Ngày cập nhật:** 23/11/2026

**Mã nguồn:** [CapstoneCuoiKhoa_AirBNB](https://github.com/vutin98vsco-web/CapstoneCuoiKhoa_AirBNB)

## 1. Giới thiệu

TNbnb là website tìm kiếm chỗ ở, tham khảo cách bố trí và chức năng của website CyberSoftbnb. Dự án sử dụng tên, logo riêng và bổ sung dữ liệu khách sạn thực tế, hạng phòng, tài khoản, yêu cầu đặt phòng, đánh giá và trang quản trị.

Mục tiêu của đồ án là xây dựng luồng sử dụng từ tìm địa danh, xem cơ sở, chọn hạng phòng đến gửi và theo dõi yêu cầu. Phần quản trị phục vụ cập nhật danh mục, quản lý người dùng và xử lý nội dung phát sinh. Giao diện có hai ngôn ngữ Việt/Anh và bố cục cho các kích thước màn hình khác nhau.

Phạm vi đặt phòng hiện tại là ghi nhận yêu cầu trong TNbnb. Hệ thống chưa kết nối tồn phòng, xác nhận giữ phòng hoặc thanh toán với khách sạn.

## 2. Công nghệ và tổ chức dự án

| Thành phần | Lựa chọn |
| --- | --- |
| Framework | Next.js App Router |
| Thư viện giao diện | React |
| Ngôn ngữ | JavaScript và CSS thuần |
| Lưu trữ | SQLite, sử dụng `DatabaseSync` trong `node:sqlite` |
| Ảnh đại diện | Sharp, lưu WebP 256 × 256 |
| Kiểm thử | Node.js test runner, các kịch bản HTTP |
| Môi trường | Node.js 24 trở lên |

Các trang và API nằm trong `app`; giao diện được chia thành các thành phần trong `components`. Thư mục `lib` chứa bản dịch, dữ liệu tham khảo, xác thực, nghiệp vụ đặt phòng, đánh giá và quản trị. Các lệnh kiểm tra, cấp quyền và sao lưu nằm trong `scripts`.

Danh mục gốc được lưu bằng JSON. Dữ liệu tài khoản, phiên đăng nhập, yêu thích, yêu cầu đặt phòng, đánh giá và thay đổi quản trị được lưu trong SQLite. Khi quản trị chỉnh sửa danh mục, hệ thống đọc bản thay đổi từ SQLite và ghép với dữ liệu tham khảo, không sửa trực tiếp tệp JSON gốc.

SQLite được chọn cho môi trường chạy một máy chủ có ổ đĩa bền vững. Cách lưu này cần được thay đổi nếu chuyển sang môi trường không duy trì tệp ghi giữa các lần chạy.

## 3. Chức năng đã thực hiện

### 3.1. Trang chủ và tìm kiếm

Trang chủ sử dụng logo TNbnb, video giới thiệu, header trong suốt trên video, khối tìm kiếm, 8 địa danh, các loại chỗ ở và chân trang. Khi cuộn khỏi video, header có nền để giữ độ rõ của nội dung điều hướng.

Người dùng có thể tìm tên cơ sở hoặc địa danh bằng tiếng Việt có dấu/không dấu. Danh sách hỗ trợ lọc số khách, loại chỗ ở, giá tối đa, phòng ngủ và tiện nghi. Điều kiện lọc được lưu trên URL để giữ lựa chọn khi chuyển trang.

Ngày nhận/trả và số khách được chuyển từ danh sách sang trang chi tiết. Hệ thống kiểm tra thứ tự ngày; việc chọn ngày chưa đồng nghĩa với kiểm tra phòng trống.

### 3.2. Chi tiết cơ sở và hạng phòng

Trang chi tiết trình bày ảnh khách sạn, mô tả, tiện nghi, vị trí, chính sách nhận/trả phòng, các hạng phòng và đánh giá. Ảnh đại diện ở danh sách là ảnh khách sạn, được quản lý riêng với thư viện ảnh từng hạng.

Mỗi hạng có tên, mô tả Việt/Anh, ảnh và nguồn riêng. Diện tích, giường, sức chứa và giá chỉ được điền khi có thông tin từ nguồn. Khi chọn hạng, khung giá cập nhật theo đúng hạng đó. Hạng chưa có giá không sử dụng giá khởi điểm cơ sở để tính tổng.

### 3.3. Tài khoản và yêu thích

Các chức năng tài khoản gồm đăng ký, đăng nhập, sửa họ tên/số điện thoại, thay hoặc xóa ảnh đại diện, đổi mật khẩu, cấp lại mã khôi phục và đăng xuất. Hồ sơ có thể được dùng để điền nhanh thông tin liên hệ trong biểu mẫu đặt phòng.

Khôi phục mật khẩu dùng email và mã khôi phục đã cấp; chưa gửi email hoặc xác minh địa chỉ email. Mã chỉ được hiển thị khi cấp, được lưu dạng băm và không thể dùng lại sau khi sử dụng hoặc thay thế.

Khách chưa đăng nhập lưu yêu thích trong trình duyệt. Sau khi đăng nhập, danh sách được nhập vào tài khoản và lưu trên máy chủ, cho phép xem ở phiên đăng nhập khác.

### 3.4. Yêu cầu đặt phòng

Người dùng chọn cơ sở, hạng phòng, ngày, số phòng, số khách và điền thông tin liên hệ. Máy chủ kiểm tra dữ liệu, tính số đêm và tổng dự kiến từ mức giá của hạng đang lưu. Giá do trình duyệt gửi không được sử dụng làm căn cứ tính tiền.

Yêu cầu có khóa chống gửi trùng, mã riêng và biên nhận. Thông tin cơ sở, hạng, giá và điều kiện được chụp lại tại thời điểm gửi, nên lịch sử không bị thay đổi khi quản trị sửa danh mục sau đó. Người sở hữu có thể xem yêu cầu tại “Chuyến đi của tôi” và hủy trong hệ thống.

Yêu cầu của khách được liên kết với tài khoản qua đúng phiên trình duyệt khi đăng nhập, không ghép theo email liên hệ. Cách này tránh việc một tài khoản nhận yêu cầu do người khác tạo chỉ vì trùng email nhập trong biểu mẫu.

### 3.5. Đánh giá cộng đồng

Tài khoản đăng nhập được chấm từ 1 đến 5 sao và viết nhận xét dài 10–2.000 ký tự. Mỗi tài khoản có một đánh giá cho mỗi cơ sở, được sửa hoặc xóa nhận xét của mình. Danh sách có sắp xếp và phân trang.

Điểm cộng đồng được tính từ các đánh giá đang hiển thị của tài khoản hoạt động, tách khỏi điểm tổng hợp của nguồn bên ngoài. Quản trị có thể ẩn/hiện đánh giá kèm lý do, nhưng không sửa nội dung hoặc điểm của tác giả. Hệ thống chưa xác minh người đánh giá đã lưu trú.

### 3.6. Trang quản trị

Trang `/quan-tri` gồm tổng quan, người dùng, cơ sở, hạng phòng, địa danh, yêu cầu đặt phòng, đánh giá và nhật ký. Quản trị có thể thêm, sửa, ẩn hoặc hiển thị lại nội dung. Việc ẩn cơ sở/hạng phòng ngăn nhận yêu cầu mới nhưng giữ lịch sử đã tạo.

Yêu cầu có tiến độ xử lý và ghi chú nội bộ. Các ghi chú này không xuất hiện trong biên nhận của khách; trạng thái xử lý không thay cho xác nhận của khách sạn.

Vai trò mặc định là người dùng. Quản trị viên đầu tiên được cấp bằng lệnh trên máy chủ cho tài khoản đã đăng ký, không có mật khẩu quản trị mặc định. Đổi quyền hoặc khóa tài khoản qua web yêu cầu xác nhận mật khẩu, thu hồi phiên liên quan và giữ ít nhất một quản trị viên hoạt động.

### 3.7. Ngôn ngữ và bố cục

Lựa chọn Việt/Anh được lưu bằng cookie, áp dụng cho nhãn, lịch, thông báo và định dạng giá. Tên cơ sở, thương hiệu và nhận xét của người dùng được giữ theo nội dung gốc. Đổi ngôn ngữ giữ trang và bộ lọc đang xem.

Giao diện có menu điện thoại, điểm chuyển bố cục, hỗ trợ bàn phím, nút dừng video và xử lý tùy chọn giảm chuyển động. Phần bố cục và tương tác trên thiết bị vẫn cần kiểm tra trực tiếp trước nghiệm thu.

## 4. Dữ liệu và nguồn tham khảo

Danh mục có 80 cơ sở tại Hà Nội, Hồ Chí Minh, Đà Nẵng, Đà Lạt, Nha Trang, Vũng Tàu, Phú Quốc và Hội An; mỗi địa danh có 10 cơ sở. Thông tin được tổng hợp từ trang cơ sở và nhà cung cấp công khai, lưu URL nguồn và ngày tra cứu.

| Chỉ tiêu | Số lượng | Tỷ lệ trên 350 hạng |
| --- | ---: | ---: |
| Cơ sở lưu trú | 80 | — |
| Hạng phòng | 350 | 100% |
| Hạng có giá tham khảo đúng hạng | 22 | 6,3% |
| Hạng có sức chứa | 154 | 44,0% |
| Hạng có diện tích | 222 | 63,4% |
| Hạng có thông tin giường | 204 | 58,3% |
| Hạng có ít nhất 3 ảnh | 246 | 70,3% |
| Tổng ảnh hạng phòng | 1.015 | — |

Số liệu trên được đối chiếu với dữ liệu trong dự án ngày 23/11/2026, sau lần bổ sung ngày 22/11. Đợt bổ sung cập nhật 185 hạng tại 38 cơ sở. Nguồn theo từng trường và điều kiện trẻ em được lưu để phân biệt giới hạn người lớn với tổng số người lưu trú. Thông tin thiếu hoặc mâu thuẫn tiếp tục để trống.

Giá trên danh sách có thể là giá khởi điểm cơ sở, còn giá dùng khi chọn hạng phải có nguồn cho đúng hạng. Mỗi mức giá giữ ngày tra cứu và điều kiện, không phải báo giá trực tiếp theo ngày người dùng chọn. Quy đổi USD sử dụng tỷ giá tham khảo 25.900 VNĐ/USD ghi nhận ngày 18/11/2026.

Thông tin dữ liệu nằm trong `lib/data` và trang `/data-sources`. Ảnh địa danh có nguồn, tác giả và giấy phép tại `/image-credits`. Các ảnh khách sạn và hạng phòng được lưu cùng thông tin xuất xứ.

Adapter CyberSoft được tổ chức ở phía máy chủ và hỗ trợ bổ sung dữ liệu API vào danh mục. Do chưa cấu hình token được cấp, kết quả kiểm tra hiện tại áp dụng cho danh mục tham khảo; chưa kết luận nhánh API trực tiếp đã hoạt động đầy đủ.

## 5. Kiểm tra và kết quả

### 5.1. Kiểm thử tự động

Ngày 23/11/2026, chạy lại `npm test` đạt **21/21 bài**, không có bài lỗi hoặc bỏ qua. Lệnh `npm run build` tạo bản production thành công.

| Nhóm kiểm thử | Số bài | Nội dung chính |
| --- | ---: | --- |
| Danh mục | 6 | Số cơ sở, hạng phòng, ảnh, nguồn, hai tiền tệ và giá đúng hạng |
| Đặt phòng | 5 | Ngày, sức chứa, liên hệ, tính giá, chống trùng và quyền sở hữu |
| Tài khoản | 4 | Băm mật khẩu, dữ liệu đầu vào, phiên, yêu thích và bản dịch |
| Quản trị và đánh giá | 5 | Điểm cộng đồng, phân quyền, lưu thay đổi, bản dịch và sao lưu |
| Bổ sung dữ liệu | 1 | Bằng chứng cho giá/sức chứa và điều kiện trẻ em |

Số bài đạt phản ánh bộ kiểm thử hiện có, chưa phải số đo độ bao phủ toàn bộ mã nguồn.

### 5.2. Kiểm tra HTTP

Các bộ kiểm tra HTTP đã chạy đạt ngày 22/11/2026 trên bản standalone với cơ sở dữ liệu thử riêng:

| Bộ kiểm tra | Phạm vi |
| --- | --- |
| `verify-http.mjs` | 160 lượt trang chi tiết ở hai ngôn ngữ, 16 danh sách địa danh, 80 ảnh đại diện, trang nguồn, trang chủ và 404 |
| `verify-bookings-http.mjs` | Tạo yêu cầu có/chưa có giá, gửi trùng, biên nhận, quyền sở hữu, hủy và giá tính trên máy chủ |
| `verify-accounts-http.mjs` | Đăng ký/đăng nhập, hồ sơ/ảnh, yêu thích, liên kết yêu cầu khách, đổi/khôi phục mật khẩu và thu hồi phiên |
| `verify-workspace-http.mjs` | Quyền truy cập, đánh giá, kiểm duyệt, danh mục, ghi chú nội bộ và giữ lịch sử yêu cầu |

Có thể chạy lại toàn bộ bằng `npm run check:http` sau build. Script tự khởi động máy chủ tại cổng 3002, sử dụng SQLite tạm và dọn dữ liệu thử sau khi kết thúc.

### 5.3. Các lỗi đã xử lý

- Loại thông báo đăng nhập xuất hiện hai lần trong biểu mẫu đặt phòng, giữ lại liên kết mang theo ngày và số khách đã chọn.
- Điều chỉnh kiểm tra Origin theo Host của yêu cầu để biểu mẫu cùng nguồn chạy trên standalone, đồng thời từ chối nguồn khác.
- Bổ sung cấu hình đóng gói thư viện Sharp để xử lý ảnh đại diện trong bản production.
- Chuyển kết quả thống kê SQLite thành đối tượng JavaScript thuần trước khi truyền sang thành phần phía trình duyệt.

### 5.4. Phần kiểm tra còn thiếu

Chưa hoàn tất kiểm tra trực quan ở các kích thước máy tính và điện thoại. Các mục cần kiểm tra gồm tràn ngang, menu, lịch, thư viện ảnh, hộp thoại, thứ tự focus và thao tác quản trị. Danh sách chi tiết nằm trong [UI-QA.md](UI-QA.md).

Chưa có kết quả đo Core Web Vitals, tải đồng thời hoặc kiểm thử trên nhiều trình duyệt. Kiểm tra HTML/API đạt chưa đủ để kết luận bố cục và thao tác giao diện đều đạt.

## 6. Lưu trữ và triển khai

Tệp SQLite mặc định là `.data/tnbnb-bookings.sqlite`, có thể đổi bằng `TNB_BOOKINGS_DB_PATH`. Mật khẩu, mã khôi phục và token phiên không được lưu dạng thô. API thay đổi dữ liệu kiểm tra cùng nguồn; truy vấn dùng tham số và kiểm tra quyền ở máy chủ.

Công cụ sao lưu sử dụng SQLite Backup API và kiểm tra tính toàn vẹn. Khi triển khai cần có nơi lưu bền vững, lịch sao lưu và kiểm tra khôi phục. Tệp dữ liệu, bản sao lưu và cấu hình môi trường thật được loại khỏi Git.

Dự án đã được đẩy lên GitHub, nhánh `main`, với commit đầu tiên `first commit`. Repository có workflow GitHub Actions để chạy cài đặt, kiểm thử, build và kiểm tra HTTP. Các kết quả tại máy được nêu ở mục 5; chưa dùng chúng để khẳng định kết quả chạy workflow trên GitHub.

Đã chuẩn bị cấu hình Node.js standalone, Dockerfile, Compose, healthcheck và reverse proxy mẫu. Container chưa được chạy thử và website chưa được xuất bản. Nếu chọn Vercel, cần chuyển phần lưu trữ SQLite sang phương án phù hợp, chẳng hạn PostgreSQL; bước chuyển đổi này chưa thực hiện.

## 7. Hạn chế và hướng phát triển

| Nội dung | Công việc tiếp theo |
| --- | --- |
| Giao diện | Kiểm tra trực tiếp trên máy tính/điện thoại và xử lý lỗi tìm thấy |
| Dữ liệu | Bổ sung giá đúng hạng, sức chứa và ảnh còn thiếu, giữ nguồn và điều kiện |
| Triển khai | Chọn hosting, chuẩn bị cơ sở dữ liệu, kiểm tra HTTPS và sao lưu/khôi phục |
| Tài khoản | Cấp quyền cho tài khoản quản lý được chỉ định; bổ sung xác minh email khi có dịch vụ gửi thư |
| Đặt phòng | Tích hợp nhà cung cấp để kiểm tra phòng trống, xác nhận và thanh toán nếu mở rộng phạm vi |
| Đánh giá | Bổ sung xác minh lưu trú khi đã có quy trình đặt phòng được xác nhận |

Kết quả hiện tại gồm các luồng chính cho khách, thành viên và quản trị, cùng dữ liệu có nguồn và kiểm thử tại máy. Để hoàn tất bản demo online, hai phần cần ưu tiên là kiểm tra giao diện thực tế và chuẩn bị môi trường lưu trữ phù hợp.

## 8. Kịch bản trình diễn

1. Mở trang chủ, kiểm tra thương hiệu và chuyển Việt/Anh.
2. Tìm `da lat`, chọn bộ lọc và mở một cơ sở trong kết quả.
3. Xem ảnh khách sạn, đổi hạng phòng; đối chiếu hạng có giá và hạng chưa có giá.
4. Chọn ngày tương lai, số phòng/khách, gửi yêu cầu bằng dữ liệu thử và xem biên nhận.
5. Đăng nhập tài khoản thử, mở yêu thích và “Chuyến đi của tôi”.
6. Gửi, sửa và xóa đánh giá của tài khoản thử.
7. Dùng tài khoản quản trị thử để xem tổng quan, cập nhật danh mục, kiểm duyệt đánh giá và xử lý yêu cầu.
8. Kiểm tra trang không tìm thấy và trạng thái rỗng khi không có kết quả phù hợp.

Kịch bản dùng cho trình diễn và kiểm tra bổ sung; các thao tác chưa kiểm tra trực quan vẫn cần được thực hiện trước nghiệm thu. Việc thêm, sửa hoặc hủy khi trình diễn chỉ dùng dữ liệu thử riêng.

## 9. Tài liệu tham khảo

- [Website mẫu CyberSoftbnb](https://demo5.cybersoft.edu.vn/)
- [Tài liệu API CyberSoft](https://airbnbnew.cybersoft.edu.vn/swagger/index.html)
- Nguồn cơ sở, hạng phòng và ảnh: `lib/data` và trang `/data-sources`.
- Nguồn ảnh địa danh và giấy phép: `lib/destination-sources.js` và trang `/image-credits`.
- [Hướng dẫn chạy dự án](README.md), [triển khai](DEPLOYMENT.md) và [đối chiếu giao diện](DOI-CHIEU-GIAO-DIEN.md).
- [Báo cáo Word chi tiết](reports/Bao_cao_chi_tiet_du_an_TNbnb_2026-11-23.docx), chốt dữ liệu và kết quả kiểm thử đến ngày 22/11/2026.
