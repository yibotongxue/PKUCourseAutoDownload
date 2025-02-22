import path from "path";
import fs from 'fs';
import parseCookieFile from "./ParseCookieFile.js";
import getHtml from "./GetHtml.js";
import downloadFile from "./DownloadFile.js";

async function autoDownload(cookieFile, url, downloadFolder, patterns) {

    const cookies = await parseCookieFile(cookieFile);
    const text = await getHtml(cookies, url);
    let results = [];
    for (const pattern of patterns) {
        results = [...results, ...text.matchAll(pattern)];
    }
    const prefixUrl = "https://course.pku.edu.cn";

    for (const result of results) {
        const fullUrl = prefixUrl + result[1];
        let fileName = result[3];
        if (fileName.startsWith("&nbsp;")) {
            fileName = fileName.match(/(?<=&nbsp;)(.+)/g)[0];
        }
        if (!fileName.includes(".")) {
            fileName = fileName + ".pdf";
        }
        if (!fs.existsSync(downloadFolder)) {
            fs.mkdirSync(downloadFolder);
        }
        const downloadPath = path.join(downloadFolder, fileName);
        await downloadFile(fullUrl, downloadPath, cookies);
    }
}

const patterns = [
    /(?<=href=")(.+?xid.+?)(?=")(.+?)>([^<]+?)(?=<\/a>)/g,
    /(?<=href=")(.+?xid.+?)(?=")(.+?)>([^<]+?)(?=<\/span><\/a>)/g
];

// 1. 从命令行参数中获取配置文件路径
const args = process.argv.slice(2); // 获取用户传递的参数
const configFilePath = args[0]; // 假设第一个参数是配置文件路径

// 检查是否传入了配置文件路径
if (!configFilePath) {
    console.error("请传入配置文件路径，例如：node script.js path/to/config.json");
    process.exit(1); // 退出程序
}

// 2. 读取并解析 JSON 配置文件
try {
    // 读取文件内容
    const configFileContent = fs.readFileSync(configFilePath, 'utf-8');
    const config = JSON.parse(configFileContent); // 解析 JSON 数据

    // 3. 提取配置参数
    const { url, cookieFile, downloadFolder } = config;

    // 检查是否包含必要的参数
    if (!url || !cookieFile || !downloadFolder) {
        console.error("配置文件中缺少必要的参数（url, cookieFile, downloadFolder）");
        process.exit(1);
    }

    autoDownload(cookieFile, url, downloadFolder, patterns).then(() => {
        console.log("下载完成");
    }).catch((error) => {
        console.log("下载失败：", error);
    })

} catch (error) {
    console.error("读取或解析配置文件时出错：", error.message);
    process.exit(1);
}
