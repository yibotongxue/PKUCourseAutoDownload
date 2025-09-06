import axios from "axios";
import { fileTypeFromBuffer } from 'file-type';
import { readChunk } from 'read-chunk';
import { statSync } from "fs";
import { execFile } from 'child_process';
import { promisify } from 'util';

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
                return { needRename: true };
                // return checkOfficeType(response.data);
                // return { ext: 'zip', mime: 'application/zip' };
            }
        }

        // 如果数据超过32KB，截取前32KB
        const dataToCheck = response.data.slice(0, 32768);
        const type = await fileTypeFromBuffer(dataToCheck);

        if (!type) {
            console.log(`无法识别文件 '${fileUrl}' 的类型`);
            return { needRename: true };
        }

        return type;
    } catch (err) {
        console.error('获取文件头时出错:', err);
        return { needRename: true };
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
        return { needRename: true };
    } catch {
        return { needRename: true };
    }
}

const execFilePromise = promisify(execFile);

// 文件类型特征映射表
const FILE_TYPE_MAPPING = {
    'java source': { ext: 'java', mime: 'text/x-java' },
    'python script': { ext: 'py', mime: 'text/x-python' },
    'javascript': { ext: 'js', mime: 'application/javascript' },
    'c++ source': { ext: 'cpp', mime: 'text/x-c++src' },
    'xml': { ext: 'xml', mime: 'application/xml' },
    'html': { ext: 'html', mime: 'text/html' },
    'json': { ext: 'json', mime: 'application/json' },
    // 可继续扩展其他类型...
};

export async function getExtensionFromFile(filePath) {
    try {
        // 第一步：使用file-type检测
        const stats = statSync(filePath);
        const fileSize = stats.size;
        const buffer = await readChunk(filePath, { startPosition: 0, length: fileSize });
        const type = await fileTypeFromBuffer(buffer);
        if (type) return type;

        // 第二步：调用file命令
        const { stdout } = await execFilePromise('file', [filePath]);

        // 第三步：解析输出
        const detectedType = parseFileOutput(stdout);

        return detectedType || { ext: '', mime: '' };

    } catch (err) {
        console.error('文件类型检测失败:', err);
        return { ext: '', mime: '' };
    }
}

// 解析file命令输出
function parseFileOutput(stdout) {
    const lowerDesc = stdout.toLowerCase();
    for (const [keyword, typeInfo] of Object.entries(FILE_TYPE_MAPPING)) {
        if (lowerDesc.includes(keyword)) {
            return typeInfo;
        }
    }

    if (lowerDesc.includes('text')) {
        return { ext: 'txt', mime: 'text/plain' };
    }

    return null;
}
