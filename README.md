# The Blue Voyage

Website: [https://longbanhbao.github.io/Whale_memory/](https://longbanhbao.github.io/Whale_memory/)

Website frontend tri ân Pastel, gồm bốn cảnh toàn màn hình nối tiếp bằng nút “tiếp”. Phiên bản hiện tại tập trung vào giao diện, chuyển động và hình ảnh; chưa gắn năm, cột mốc hoặc video.

## Chạy dự án

Yêu cầu Node.js `^20.19.0` hoặc `>=22.12.0`.

```bash
npm install
npm run assets
npm run dev
```

Build và kiểm thử:

```bash
npm run build
npm run test:e2e
```

Lệnh build tạo hai đầu ra tương đương: `dist/` cho GitHub Actions và bundle
`app/` ở thư mục gốc cho trường hợp GitHub Pages đang xuất bản trực tiếp từ
nhánh `main`. Nhờ vậy cả hai chế độ đều tải đủ CSS, JavaScript và hình ảnh.
Khi GitHub Actions triển khai, ảnh và video được phục vụ qua jsDelivr bằng URL
khóa theo đúng SHA của commit. Chế độ xuất bản trực tiếp từ `main` dùng một SHA
asset ổn định tương tự, còn build local vẫn dùng `./public/`. GitHub Pages nhờ
đó chỉ phải phục vụ HTML/CSS/JavaScript, giúp giảm mạnh số request và nguy cơ
gặp phản hồi `429 Rate limit exceeded`.

## Asset

- Ảnh nguồn: `../Picture/p1.png` đến `../Picture/p19.png`.
- Cá voi nguồn: `../whale/frames/png/`.
- Ảnh dựng cảnh đầu: `../LK/Water.png`, `../LK/BR.png` và `../LK/VS.png`.
- Chân dung kết cảnh: `public/assets/scene/finale-pastel.webp`, được tách nền từ `../Picture/f.png`, lưu alpha và feather mềm ở chân ảnh.
- Nền biển động cảnh 3: `public/assets/scene/storm-ocean-v2.webp`, ảnh dựng bằng AI và được tối ưu thành WebP 1672 × 941. Bố cục giữ lối bơi chéo từ góc trái dưới tới vùng sáng phải trên.
- `npm run assets` tạo WebP, AVIF, thumbnail, placeholder, ảnh nền cảnh đầu và sprite cá voi 2× đã crop/khử viền alpha; chân dung kết cảnh đã được xử lý riêng nên lệnh này không ghi đè nó.
- Ảnh nguồn không bị ghi đè.
- Asset sinh ra nằm trong `public/assets/`; manifest nằm tại `src/data/assets.generated.js`.

Khi video được bổ sung, đặt bản nguồn trong thư mục `../Video`. Video dùng trên web sẽ được xuất thành bản không có audio, có `playsinline` và lazy-load theo cảnh.

## Tương tác

- Nhấn “tiếp” để chuyển lần lượt qua các cảnh. Cảnh 3 tự mở cảnh 4 sau khi luồng sáng phủ kín màn hình. Cuộn chuột, vuốt và phím cuộn không điều khiển hay chuyển cảnh.
- Cảnh 1 giữ thao tác nhấn giữ; cảnh 2 tự chạy 28 giây. Ở cảnh 3, nhấp vào cá voi ba lần để lần lượt bơi tới ba vật cản; sau lần thứ ba, phần còn lại của cảnh 24 giây tự chạy và mở cảnh 4. Cảnh cuối tự chạy 18 giây, dành gần 4 giây cho mỗi lời cảm ơn.
- Năm giọt ký ức lần lượt rơi xuống mặt nước, làm sáng đại dương rồi bay ngược vào vầng sáng để gọi cá voi xuất hiện.
- Cá voi cảnh 1 bơi ra trong 4,8 giây bằng lưới WebGL: sóng chuyển động từ thân tới đuôi, vây đập lệch nhịp, quỹ đạo cong và phối cảnh xa–gần. Sau khi tới gần, cá voi tiếp tục bơi nhẹ. Trình duyệt không hỗ trợ WebGL dùng ảnh dự phòng; cảnh 2 dùng sprite như trước.
- Cảnh 2 có ba dải nước nhiều lớp, các cụm bong bóng ở hai rìa và họa tiết sứa, rong, vỏ ốc trôi chậm để tạo chiều sâu mà không che cá voi hay chân dung ký ức.
- Cảnh 3 dành 24 giây cho ba nhịp tiến lên–va chạm–bị đẩy lùi giữa biển động, một khoảng lặng mệt mỏi và khoảnh khắc Family xuất hiện. Cá voi lớn dùng lưới WebGL làm biến dạng ảnh tĩnh thay cho sprite: nhịp uốn truyền dọc thân, vây và đuôi tự chuyển động; dáng bơi, mí mắt và giọt nước mắt thể hiện sự buồn bã trước khi ánh cyan của hy vọng trở lại. Sáu vật cản là các chữ nổi `TOXIC`, `ÁP LỰC`, `BẾU`, `MỆT MỎI`, `SO SÁNH` và `TỰ NGHI NGỜ`; 18 cá voi con bơi vào từ mép trái theo ba làn sóng, hô “Hu raaaaa” luân phiên, tạo đội hình rồi cùng đánh bật chúng. Bản mobile hiển thị 12 cá voi con để giữ bố cục thoáng. Flash chuyển cảnh bắt đầu ngay khi cá voi lớn chạm vùng sáng.
- Nhấn “Gửi một ánh sáng” ở cảnh cuối.
- Ánh sáng bay vào tâm màn hình, kéo thành một bán kính rồi quét thuận để hiện cá voi ký ức và quét ngược để hiện chân dung Pastel. Sau khi tia quét tan, cổng nước mở rộng thành đại dương ngân hà với tinh vân, quỹ đạo và các điểm sáng ký ức; chữ kết chỉ xuất hiện khi cổng đã mở hoàn toàn.
- Sau đoạn kết có thể xem lại hành trình, mở thư tri ân hoặc xem toàn bộ thư viện ảnh.
- Chế độ giảm chuyển động dùng cùng nút “tiếp” và hiển thị trực tiếp trạng thái tĩnh của mỗi cảnh.

Mỗi lần push lên nhánh `main`, workflow GitHub Actions sẽ build và triển khai thư mục `dist` lên GitHub Pages.
