# FreeDog

Tạo file `data.txt`, mỗi dòng là 1 tài khoản chứa `query_id` hoặc `user`. Khi lấy query_id, chú ý tìm trong key từ `tgWebAppData` và lấy đến cuối chuỗi vì token app này đang merge cả các phần config app khác vào 1 chuỗi duy nhất.

Chạy cài đặt:
`npm i`

Chạy bot
`node freedog.js`