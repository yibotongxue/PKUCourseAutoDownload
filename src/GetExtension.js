import axios from "axios";
import { fileTypeFromBuffer } from 'file-type';
import { readChunk } from 'read-chunk';
import { statSync } from "fs";

export async function getExtensionFromRemote(fileUrl, cookies) {
    console.log("正在获取文件头：", fileUrl);
    try {
        const headers = {
            Cookie: cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
            Range: 'bytes=0-7' // 请求前32KB数据
        };

        const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer',
            headers: headers
        });

        if (!response.data) {
            console.log(`无法获取文件头：${fileUrl}`);
            throw new Error('无法获取文件头');
        }

        console.log(`响应状态码: ${response.status}, 数据长度: ${response.data.length}`);

        // 手动检查ZIP文件签名（PK\x03\x04）
        if (response.data.length >= 4) {
            const signature = response.data.readUInt32BE(0);
            if (signature === 0x504B0304) {
                console.log('检测到ZIP文件签名');
                return checkOfficeType(response.data);
                // return { ext: 'zip', mime: 'application/zip' };
            }
        }

        // 如果数据超过32KB，截取前32KB
        const dataToCheck = response.data.slice(0, 32768);
        const type = await fileTypeFromBuffer(dataToCheck);

        if (!type) {
            console.log(`无法识别文件 '${fileUrl}' 的类型`);
            return;
        }

        return type;
    } catch (err) {
        console.error('获取文件头时出错:', err);
    }
}

async function checkOfficeType(buffer) {
    try {
        // 使用第三方库解析ZIP结构（例如：jszip）
        const JSZip = require('jszip');
        const zip = await JSZip.loadAsync(buffer);
        const hasContentTypes = zip.file('[Content_Types].xml') !== null;

        if (hasContentTypes) {
            // 进一步检查文档类型
            const rels = zip.file('_rels/.rels');
            if (rels) {
                const relsContent = await rels.async('text');
                if (relsContent.includes('ppt/')) return { ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
                if (relsContent.includes('xl/')) return { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
                if (relsContent.includes('word/')) return { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
            }
        }
        return { ext: 'zip', mime: 'application/zip' };
    } catch {
        return { ext: 'zip', mime: 'application/zip' };
    }
}

export async function getExtensionFromFile(filePath) {
    try {
        const stats = statSync(filePath);
        const fileSize = stats.size;
        const buffer = await readChunk(filePath, { startPosition: 0, length: fileSize });
        const type = await fileTypeFromBuffer(buffer);
        if (!type) {
            console.log(`无法识别文件 '${filePath}' 的类型`);
            return;
        }
        return type;
    } catch (err) {
        console.error('获取文件扩展名时出错:', err);
    }
}