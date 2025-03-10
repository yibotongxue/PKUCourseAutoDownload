import axios from "axios";
import fs from 'fs';

function renderProgressBar(percentage, length = 20) {
    const progress = Math.floor((percentage / 100) * length);
    return '='.repeat(progress).padEnd(length, ' ');
}

export default async function downloadFile(fileUrl, savePath, cookies) {
    console.log("正在下载：", savePath);
    try {
        const headers = {
            Cookie: cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        };

        const response = await axios.get(fileUrl, {
            responseType: 'stream',
            headers: headers
        });

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedBytes = 0;

        response.data.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            if (!isNaN(totalSize) && totalSize > 0) {
                const percentage = (downloadedBytes / totalSize * 100);
                const displayPercentage = percentage.toFixed(2);
                const progressBar = renderProgressBar(percentage);
                process.stdout.write(`\r下载进度: ${displayPercentage}% [${progressBar}]`);
            } else {
                process.stdout.write(`\r已下载: ${downloadedBytes} bytes`);
            }
        });

        const writer = fs.createWriteStream(savePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                process.stdout.write('\n');
                console.log(`文件已下载并保存到：${savePath}`);
                resolve();
            });
            writer.on('error', (error) => {
                process.stdout.write('\n');
                reject(error);
            });
        });
    } catch (error) {
        console.error('下载文件时出错:', error);
        throw error;
    }
}
