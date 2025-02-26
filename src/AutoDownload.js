import path from "path";
import fs from 'fs';
import parseCookieFile from "./ParseCookieFile.js";
import getHtml from "./GetHtml.js";
import downloadFile from "./DownloadFile.js";

async function autoDownload(cookieFile, url, downloadFolder, patterns, incremental) {

    const cookies = parseCookieFile(cookieFile);
    const text = await getHtml(cookies, url);
    let results = [];
    for (const pattern of patterns) {
        results = [...results, ...text.matchAll(pattern)];
    }
    const prefixUrl = "https://course.pku.edu.cn";
    if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder);
    }
    for (const result of results) {
        const fullUrl = prefixUrl + result[1];
        let fileName = result[3];
        if (fileName.startsWith("&nbsp;")) {
            fileName = fileName.match(/(?<=&nbsp;)(.+)/g)[0];
        }
        if (!fileName.includes(".")) {
            fileName = fileName + ".pdf";
        }
        const downloadPath = path.join(path.resolve(downloadFolder), fileName);
        if (incremental && fs.existsSync(downloadPath)) {
            console.log("文件已存在，跳过：" + fileName);
            continue;
        }
        await downloadFile(fullUrl, downloadPath, cookies);
    }
}

const patterns = [
    /(?<=href=")(.+?xid.+?)(?=")(.+?)>([^<]+?)(?=<\/a>)/g,
    /(?<=href=")(.+?xid.+?)(?=")(.+?)>([^<]+?)(?=<\/span><\/a>)/g
];

// 1. 从命令行参数中获取配置文件路径
const args = process.argv.slice(2); // 获取用户传递的参数
if (args.length === 0) {
    console.error("请提供配置文件路径作为命令行参数");
    process.exit(1);
}
for (const arg of args) {
    const configFilePath = path.resolve(arg);

    // 2. 读取并解析 JSON 配置文件
    try {
        // 读取文件内容
        const configFileContent = fs.readFileSync(configFilePath, 'utf-8');
        const config = JSON.parse(configFileContent); // 解析 JSON 数据

        // 3. 提取配置参数
        const { url, cookieFile, downloadFolder } = config;
        let incremental = config.incremental;

        // 检查是否包含必要的参数
        if (!url || !cookieFile || !downloadFolder) {
            console.error("配置文件中缺少必要的参数（url, cookieFile, downloadFolder）");
            process.exit(1);
        }

        if (!incremental) {
            incremental = false;
        }

        autoDownload(cookieFile, url, downloadFolder, patterns, incremental).then(() => {
            console.log("下载完成");
        }).catch((error) => {
            console.log("下载失败：", error);
        })

    } catch (error) {
        console.error("读取或解析配置文件时出错：", error.message);
        process.exit(1);
    }
}
