import axios from "axios";
import fs from 'fs';

export default async function downloadFile(fileUrl, savePath, cookies) {
    console.log("正在下载：", savePath);
    try {
        // 设置请求头，添加 Cookie
        const headers = {
            Cookie: cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        };

        // 发起请求，下载文件
        const response = await axios.get(fileUrl, {
            responseType: 'stream', // 设置响应类型为流
            headers: headers // 添加自定义请求头
        });

        // 创建可写流，将文件内容写入本地
        const writer = fs.createWriteStream(savePath);

        // 将响应流管道到文件写入流
        response.data.pipe(writer);

        // 等待文件写入完成
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`文件已下载并保存到：${savePath}`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('下载文件时出错:', error);
        throw error;
    }
}
