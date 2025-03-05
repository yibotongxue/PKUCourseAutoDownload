import axios from "axios";
import { fileTypeFromBuffer } from 'file-type';

export default async function getExtensionFromRemote(fileUrl, cookies) {
    console.log("正在获取文件头：", fileUrl);
    try {
        const headers = {
            Cookie: cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
            Range: 'bytes=0-4099'
        };

        const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer',
            headers: headers
        });

        if (!response.data) {
            console.log(`无法获取文件头：${fileUrl}`);
            throw new Error('无法获取文件头');
        }

        const type = await fileTypeFromBuffer(response.data);

        if (!type) {
            console.log(`无法识别文件 '${fileUrl}' 的类型`);
            return;
        }

        return type;
    } catch (err) {
        console.error('获取文件头时出错:', err);
    }
}
