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

## Asset

- Ảnh nguồn: `../Picture/p1.png` đến `../Picture/p19.png`.
- Cá voi nguồn: `../whale/frames/png/`.
- Ảnh dựng cảnh đầu: `../LK/Water.png`, `../LK/BR.png` và `../LK/VS.png`.
- `npm run assets` tạo WebP, AVIF, thumbnail, placeholder, ảnh nền cảnh đầu và sprite cá voi 2× đã crop/khử viền alpha.
- Ảnh nguồn không bị ghi đè.
- Asset sinh ra nằm trong `public/assets/`; manifest nằm tại `src/data/assets.generated.js`.

Khi video được bổ sung, đặt bản nguồn trong thư mục `../Video`. Video dùng trên web sẽ được xuất thành bản không có audio, có `playsinline` và lazy-load theo cảnh.

## Tương tác

- Nhấn “tiếp” để chuyển lần lượt qua các cảnh. Cuộn chuột, vuốt và phím cuộn không điều khiển hay chuyển cảnh.
- Cảnh 1 giữ thao tác nhấn giữ; cảnh 2–4 tự chạy hiệu ứng khi được mở, dừng khi rời cảnh. Thời lượng hiện tại là 28, 14 và 12 giây.
- Năm giọt ký ức lần lượt rơi xuống mặt nước, làm sáng đại dương rồi bay ngược vào vầng sáng để gọi cá voi xuất hiện.
- Cá voi cảnh 1 bơi ra trong 4,8 giây bằng lưới WebGL: sóng chuyển động từ thân tới đuôi, vây đập lệch nhịp, quỹ đạo cong và phối cảnh xa–gần. Sau khi tới gần, cá voi tiếp tục bơi nhẹ. Trình duyệt không hỗ trợ WebGL dùng ảnh dự phòng; cảnh 2 dùng sprite như trước.
- Nhấn “Gửi một ánh sáng” ở cảnh cuối.
- Sau đoạn kết có thể xem lại hành trình, mở thư tri ân hoặc xem toàn bộ thư viện ảnh.
- Chế độ giảm chuyển động dùng cùng nút “tiếp” và hiển thị trực tiếp trạng thái tĩnh của mỗi cảnh.

Mỗi lần push lên nhánh `main`, workflow GitHub Actions sẽ build và triển khai thư mục `dist` lên GitHub Pages.
