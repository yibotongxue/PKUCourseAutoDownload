import path from "path";
import fs from 'fs';
import parseCookieFile from "./ParseCookieFile.js";
import getHtml from "./GetHtml.js";
import downloadFile from "./DownloadFile.js";

export default async function autoDownload(cookieFile, url, downloadFolder, patterns, incremental) {

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
