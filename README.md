# The Blue Voyage

Website frontend tri ân Pastel, kể chuyện bằng bốn cảnh cuộn liên tục. Phiên bản hiện tại tập trung vào giao diện, chuyển động và hình ảnh; chưa gắn năm, cột mốc hoặc video.

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

## Asset

- Ảnh nguồn: `../Picture/p1.png` đến `../Picture/p19.png`.
- Cá voi nguồn: `../whale/frames/png/`.
- `npm run assets` tạo WebP, AVIF, thumbnail, placeholder và sprite cá voi đã crop theo vùng alpha chung.
- Ảnh nguồn không bị ghi đè.
- Asset sinh ra nằm trong `public/assets/`; manifest nằm tại `src/data/assets.generated.js`.

Khi video được bổ sung, đặt bản nguồn trong thư mục `../Video`. Video dùng trên web sẽ được xuất thành bản không có audio, có `playsinline` và lazy-load theo cảnh.

## Tương tác

- Nhấn giữ để mở cảnh đầu.
- Cuộn qua hành trình, vùng biển tối và cảnh kết.
- Nhấn “Gửi một ánh sáng” ở cảnh cuối.
- Có nút bỏ qua intro, thao tác bàn phím và chế độ `prefers-reduced-motion`.
