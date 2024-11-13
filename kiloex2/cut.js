const fs = require('fs').promises;

async function processData(inputFile, outputFile) {
    try {
        const data = await fs.readFile(inputFile, 'utf8');
        
        const lines = data.split('\n');
        const processedLines = lines
            .filter(line => line.trim())
            .map(line => {
                try {
                    const userDataPart = line.split('user=')[1].split('&')[0];
                    
                    const decodedData = decodeURIComponent(userDataPart);
                    
                    const userData = JSON.parse(decodedData);
                    
                    // Format theo yêu cầu: id|username
                    return `${userData.id}|${userData.username}`;
                } catch (err) {
                    console.error('Lỗi khi xử lý dòng:', line);
                    console.error(err);
                    return null;
                }
            })
            .filter(line => line !== null);

        await fs.writeFile(outputFile, processedLines.join('\n') + '\n');
        
        console.log(`Đã xử lý thành công và lưu vào file ${outputFile}`);
        console.log(`Số dòng đã xử lý: ${processedLines.length}`);

    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`Không tìm thấy file ${inputFile}`);
        } else {
            console.error('Có lỗi xảy ra:', err);
        }
    }
}

processData('h.txt', 'hh.txt');