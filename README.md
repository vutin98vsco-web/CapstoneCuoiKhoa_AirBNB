# TNbnb — Ở đâu cũng thấy thuộc về

Giao diện Next.js App Router dựa theo [CyberSoftbnb](https://demo5.cybersoft.edu.vn/), dùng JavaScript và CSS thuần. Yêu cầu Node.js 24 trở lên; phần lưu yêu cầu đặt phòng sử dụng SQLite tích hợp trong Node.js.

## Chạy dự án

```sh
npm ci
npm run dev
```

Truy cập http://localhost:3000. Trên Windows PowerShell nếu `npm.ps1` bị chặn, dùng `npm.cmd run dev`.

```sh
npm run build
npm start
```

## Phần đã thực hiện

- Trang chủ: header cố định hoàn toàn trong suốt trên video, không có lớp phủ hoặc hiệu ứng làm mờ; chữ sáng khi nằm trên banner và nền trắng khi cuộn xuống nội dung; menu theo ngôn ngữ đang chọn, avatar tròn viền hồng, video banner gốc, tìm kiếm, 8 điểm đến, 4 loại chỗ ở, banner giới thiệu và footer.
- Chuyển tiếng Việt/Anh ở đầu trang. Mặc định tiếng Việt; lựa chọn lưu bằng cookie trong một năm. Đổi ngôn ngữ giữ nguyên trang, bộ lọc và liên kết đến mục đang xem.
- Nội dung giao diện, khẩu hiệu, tiêu đề trang, nhãn hỗ trợ tiếp cận, thông báo, phòng mẫu, tiện nghi và giá đều được bản địa hóa. Bộ lịch riêng dùng nhãn và thông báo kiểm tra ngày theo ngôn ngữ đã chọn, hỗ trợ nhập ngày/tháng/năm.
- `/rooms`: lọc tên phòng/địa điểm có dấu hoặc không dấu, sức chứa, loại chỗ ở, giá tối đa, số phòng ngủ và tiện nghi. Bộ lọc lưu trên URL và dùng chung biểu mẫu tìm kiếm.
- Yêu thích: khách lưu trong trình duyệt; người đăng nhập đồng bộ theo tài khoản. Xem tại `/rooms?favorites=1`.
- `/phong/[id]`: thư viện ảnh cơ sở, các hạng phòng có ảnh và nguồn riêng, mô tả, tiện nghi, vị trí, điểm đánh giá có xuất xứ và giờ nhận/trả phòng. Chọn hạng phòng cập nhật khung giá và lưu lựa chọn trong URL.
- Giá VNĐ và USD xuất hiện cùng nhau. Mỗi mức giá ghi rõ phạm vi: giá khởi điểm cơ sở hoặc giá của một hạng phòng. Hạng chưa có giá xác minh không kế thừa giá khởi điểm của khách sạn.
- `/data-sources`: nguồn thông tin, nguồn ảnh, ngày tra cứu, bối cảnh giá và nguồn hạng phòng của từng cơ sở.
- Ngày và số khách được chuyển từ kết quả tìm kiếm sang trang chi tiết. Chặn ngày trả phòng trước hoặc cùng ngày nhận phòng.
- Bố cục cho điện thoại, máy tính bảng và desktop; menu điện thoại, hỗ trợ bàn phím, reduced motion và nút dừng video.
- Trên điện thoại hoặc khi tiết kiệm dữ liệu/reduced motion, video không tự phát. Ảnh poster được nén WebP; font và ảnh phục vụ từ thư mục `public`.
- Đánh giá cộng đồng 1–5 sao: đăng nhập để gửi, sửa hoặc xóa nhận xét của mình; một nhận xét cho mỗi tài khoản/cơ sở; phân trang và sắp xếp. Điểm cộng đồng tách khỏi điểm nguồn ngoài và không gắn nhãn đã lưu trú xác minh.
- `/quan-tri`: tổng quan, tìm kiếm/phân trang người dùng, cơ sở và hạng phòng, địa danh, xử lý yêu cầu, ẩn/hiện đánh giá và nhật ký thay đổi. Dữ liệu quản trị lưu trong SQLite và áp dụng lên danh mục công khai; ẩn cơ sở/hạng phòng không làm mất biên nhận đã tạo.

## Quản trị và triển khai

Tài khoản mới luôn là người dùng thường. Đăng ký tài khoản của người quản lý, sau đó chạy `npm run admin:grant -- --email owner@example.com` với `TNB_BOOKINGS_DB_PATH` trỏ đúng tệp dữ liệu. Công cụ không tạo tài khoản/mật khẩu mặc định; sau khi cấp quyền cần đăng nhập lại. Thao tác đổi quyền/khóa tài khoản qua web yêu cầu mật khẩu quản trị hiện tại và thu hồi phiên của người bị tác động.

`npm start` chạy bản standalone, chép tài nguyên công khai cần thiết và giữ đường dẫn SQLite theo thư mục dự án. Mặc định lắng nghe `127.0.0.1`; đặt `TNB_HOST` khi cần một địa chỉ lắng nghe khác. Bản production cần reverse proxy HTTPS. Có Dockerfile, Compose với volume bền vững, healthcheck, CI và công cụ sao lưu. Chi tiết tại [DEPLOYMENT.md](DEPLOYMENT.md). Chưa xuất bản lên hosting cụ thể.

## Bổ sung dữ liệu ngày 22/11/2026

Đối chiếu thêm nguồn chính thức/nhà cung cấp cho 185 hạng phòng tại 38 cơ sở. Danh mục vẫn có 80 cơ sở và 350 hạng phòng; hiện có **154 hạng có sức chứa xác minh, 222 hạng có diện tích, 204 hạng có thông tin giường, 22 hạng có giá và 1.015 ảnh hạng phòng**. Có 246 hạng có từ 3 ảnh trở lên. Mỗi bổ sung có bằng chứng và nguồn theo trường, xem trong `lib/data/room-types.json`; các liên kết nguồn bổ sung được hiển thị trên giao diện.

Hai tệp `enrichment-north-central.json` và `enrichment-south-coast.json` là bản vá nguồn. `node scripts/merge-enrichment.mjs` kiểm tra thay đổi; thêm `--apply` để hợp nhất. Ảnh mới được nối thêm, không thay thế thư viện cũ hoặc tự điền ảnh hạng khác. Điều kiện người lớn/trẻ em được giữ trong `occupancyNote`; giới hạn chọn khách dùng sức chứa bảo thủ theo số người lớn khi nguồn có giới hạn này. Phần thiếu hoặc nguồn mâu thuẫn được để trống.

## Dữ liệu và API

Mặc định có **80 cơ sở lưu trú thật, 10 cơ sở tại mỗi điểm đến**, không cần token. Dữ liệu công khai được tra cứu ngày 18/11/2026. Tên, địa chỉ, tiện nghi, giờ nhận/trả và điểm tổng hợp của cơ sở có nguồn KAYAK; giá trên danh sách là giá tham khảo cho kỳ ngày được ghi cụ thể trong từng bản ghi, không phải báo giá trực tiếp cho ngày người dùng chọn.

`lib/data/properties.json` lưu thông tin cơ sở; `lib/data/property-images.json` lưu thư viện 5 ảnh của từng cơ sở; `lib/data/property-covers.json` lưu riêng ảnh đại diện khách sạn cho trang Khám phá chỗ ở, danh sách yêu thích và gợi ý liên quan. Ảnh đại diện ưu tiên mặt ngoài/toàn cảnh khách sạn, không dùng ảnh phòng làm ảnh khách sạn. Mỗi ảnh có nguồn, loại ảnh và chú thích Việt/Anh; ảnh nằm trong `public/images/property-covers`.

`lib/data/room-types.json` lưu các hạng phòng, ảnh đúng hạng và nguồn riêng. Thư viện mỗi hạng được bổ sung tối đa 4 góc chụp khi nguồn có ảnh xác minh được; hạng chưa tìm thấy thêm ảnh giữ số ảnh thực tế. Không lặp cùng ảnh hoặc dùng ảnh hạng khác để đủ số lượng. Ảnh hạng phòng được đối chiếu từ trang chi tiết hoặc thẻ hạng phòng của cơ sở/nhà cung cấp, không phân hạng dựa trên một ảnh phòng chung. Trường diện tích, giường và sức chứa chỉ được điền khi nguồn xác nhận. Danh sách hạng hiển thị gồm các hạng đã đối chiếu, có thể chưa bao gồm toàn bộ danh mục của nhà cung cấp.

Tỷ giá quy đổi tham khảo: **1 USD = 25.900 VND**, giá bán USD do Vietcombank công bố lúc 00:05:02 ngày 18/11/2026; liên kết XML có tại `lib/currency.js` và `/data-sources`. Đây là ảnh chụp dữ liệu tham khảo, không tự cập nhật hay cam kết tỷ giá thanh toán.

Để sử dụng [API CyberSoft](https://airbnbnew.cybersoft.edu.vn/swagger/index.html), sao chép `.env.example` thành `.env.local`, đặt token lớp học được cấp vào `CYBERSOFT_TOKEN`, rồi khởi động lại server. Token chỉ dùng trên server, không đặt trong biến `NEXT_PUBLIC_*`.

`lib/catalog.js` giữ nguyên 80 cơ sở tham khảo khi có token, đồng thời bổ sung dữ liệu API với tiền tố mã `api-` để tránh trùng mã. Dữ liệu API lưu cache 60 giây. Nếu API lỗi, giao diện thông báo và dùng danh mục tham khảo có nguồn. API chưa cung cấp dữ liệu hạng phòng tương ứng với các nguồn bên ngoài.

Luồng `/dat-phong` nhận yêu cầu theo hạng phòng, ngày, số phòng, số khách và thông tin liên hệ. Yêu cầu được lưu trên máy chủ tại `.data/tnbnb-bookings.sqlite`, có mã riêng, xem lại ở `/chuyen-di` và có thể hủy. Tệp dữ liệu được loại khỏi Git. Có thể cấu hình đường dẫn bằng biến server `TNB_BOOKINGS_DB_PATH`; cần giữ lại tệp này khi khởi động lại hoặc chuyển máy chủ.

Trước khi lưu, phiên khách được thiết lập bằng cookie ngẫu nhiên HTTP-only; cơ sở dữ liệu chỉ lưu mã băm của phiên. Người dùng chỉ xem/hủy được yêu cầu trong phiên của mình. Gửi lại một yêu cầu với cùng khóa chống trùng không tạo thêm bản ghi. Không lưu thông tin liên hệ vào localStorage.

Đây là **yêu cầu đặt phòng trong TNbnb**, chưa chuyển đến cơ sở, chưa xác nhận phòng trống/giữ phòng và không thu tiền. Nguồn giá chỉ là giá tham khảo của đúng hạng phòng; hạng chưa có giá được lưu với tổng tiền chưa xác định, không dùng giá khởi điểm khách sạn thay thế. Có liên kết tới nhà cung cấp để xác nhận và đặt phòng thực tế. Chưa kết nối tồn phòng/thanh toán của nhà cung cấp.

## Tài khoản TNbnb

- `/dang-ky`, `/dang-nhap`, `/tai-khoan`: đăng ký, đăng nhập, sửa họ tên/số điện thoại, đổi hoặc xóa ảnh đại diện, đổi mật khẩu và đăng xuất. Hồ sơ được dùng để điền nhanh thông tin liên hệ khi đặt phòng. Email đăng nhập hiện chỉ đọc.
- `/quen-mat-khau`: đặt lại mật khẩu bằng email và mã khôi phục. Mã được hiển thị một lần khi đăng ký, có nút sao chép/tải về; có thể tạo mã mới trong hồ sơ sau khi xác nhận mật khẩu. Mã đã dùng hoặc bị thay thế không thể dùng lại. Chưa cấu hình SMTP, xác minh email, đăng nhập mạng xã hội hoặc liên kết tài khoản CyberSoft; không gửi email giả lập.
- Tài khoản, ảnh đại diện, phiên, yêu thích và yêu cầu đặt phòng dùng chung tệp SQLite đã cấu hình ở trên. Cần sao lưu tệp này để giữ dữ liệu khi chuyển máy chủ. Mật khẩu băm bằng scrypt với muối ngẫu nhiên riêng; mã khôi phục và mã phiên chỉ lưu dạng băm. Không lưu mật khẩu, mã khôi phục hay token vào localStorage.
- Cookie tài khoản HTTP-only, SameSite=Lax và Secure trong bản production. Chọn duy trì đăng nhập: tối đa 30 ngày; bỏ chọn: cookie phiên và thời hạn máy chủ 24 giờ. Đăng xuất thu hồi phiên trên máy chủ. Đổi mật khẩu kết thúc các phiên khác; khôi phục mật khẩu kết thúc toàn bộ phiên cũ. Giới hạn 8 lần thử sai/15 phút theo tài khoản cho đăng nhập, khôi phục và xác nhận mật khẩu.
- Khi đăng nhập/đăng ký, yêu cầu của đúng cookie khách trong trình duyệt được gắn vào tài khoản; cookie khách được xoay mới và cookie cũ không còn truy cập các yêu cầu đã gắn. Không ghép dữ liệu theo email liên hệ. Người dùng xem/hủy được yêu cầu trên thiết bị khác sau khi đăng nhập.
- Yêu thích khi chưa đăng nhập vẫn lưu cục bộ. Khi đăng nhập, chúng được nhập vào tài khoản và xóa khỏi kho khách của trình duyệt. Yêu thích của tài khoản được lưu trên máy chủ, tách riêng từng người dùng và đồng bộ giữa các phiên đăng nhập.
- Ảnh đại diện: JPG/PNG/WebP tĩnh, tối đa 2 MB và 16 triệu điểm ảnh; máy chủ giải mã, bỏ siêu dữ liệu và lưu lại WebP 256 × 256. Ảnh chỉ được đọc qua phiên tài khoản sở hữu.

`node scripts/verify-accounts-http.mjs` kiểm tra tài khoản qua HTTP với máy chủ thử nghiệm ở `http://localhost:3001` (hoặc `TEST_BASE_URL`). Script tạo dữ liệu tổng hợp; chạy với `TNB_BOOKINGS_DB_PATH` trỏ tới tệp thử nghiệm riêng. Các bài kiểm tra bao gồm phân quyền, nhập yêu cầu khách, hồ sơ/ảnh, yêu thích, phiên, đổi/khôi phục mật khẩu, giới hạn thử sai và cả hai ngôn ngữ.

Từ điển nằm tại `lib/i18n.js`, `lib/detail-copy.js` và `lib/room-type-copy.js`. Thông tin cơ sở và hạng phòng có nội dung Việt/Anh; tên thương hiệu giữ nguyên. Nếu dữ liệu API chưa cung cấp `tenPhongEn`/`moTaEn`, chế độ tiếng Anh dùng tiêu đề địa điểm và thông báo thiếu bản dịch.

## Kiểm tra

```sh
npm test
npm run build
```

Bộ kiểm tra xác nhận mỗi điểm đến có ít nhất 10 cơ sở, mỗi cơ sở có ít nhất 2 hạng đã đối chiếu, nguồn và ảnh có đầy đủ thông tin, ảnh WebP hợp lệ, hai tiền tệ quy đổi đúng và hạng phòng chưa có giá không nhận nhầm giá cơ sở. Kiểm tra HTTP bổ sung được chạy với bản dựng cục bộ. Chưa kiểm chứng tương tác trên trình duyệt tự động vì công cụ trình duyệt của phiên làm việc không khả dụng.

## Tài nguyên tham khảo

Logo TNbnb được thiết kế riêng bằng SVG: biểu tượng ngôi nhà màu hồng san hô với chữ TN âm bản. Các tệp `public/images/tnbnb-logo.svg` và `tnbnb-wordmark.svg` lần lượt là biểu tượng và logo kèm tên. Favicon PNG và biểu tượng Apple được xuất từ cùng bản SVG.

Video và ảnh lấy từ tài nguyên công khai của website mẫu CyberSoftbnb và các ảnh Cloudinary được website mẫu sử dụng, phục vụ bản dựng học tập theo yêu cầu. Không dùng lại token có trong mã website mẫu. Font Be Vietnam Pro lưu tại `public/fonts`, kèm giấy phép OFL.

Riêng 8 ảnh địa điểm đã thay bằng ảnh chụp đúng danh thắng từ Wikimedia Commons: Chợ Bến Thành, quảng trường Lâm Viên, Cầu Rồng, Tháp Rùa, tháp Bà Ponagar, tượng Chúa Kitô Vua, Bãi Sao và Chùa Cầu. Ảnh được cắt vuông, thu nhỏ 384 × 384px và lưu WebP trong `public/images/destinations`. Thông tin tác giả, nguồn và giấy phép nằm tại `lib/destination-sources.js`, đồng thời hiển thị công khai ở `/image-credits`. Mỗi ảnh giữ giấy phép Creative Commons tương ứng của nguồn gốc.

Xem [báo cáo tiến độ](BAO-CAO.md).

Các kích thước banner, khung nội dung, chữ, thẻ và lưới đã được rà lại theo CSS demo. Xem [đối chiếu giao diện](DOI-CHIEU-GIAO-DIEN.md) để biết thông số đã chỉnh và giới hạn kiểm tra trực quan.
