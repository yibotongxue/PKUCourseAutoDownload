import path from "path";
import fs from 'fs';
import parseCookieFile from "./ParseCookieFile.js";
import getHtml from "./GetHtml.js";
import downloadFile from "./DownloadFile.js";
import getCookie from "./GetCookie.js";

async function getLinks(cookies, url, patterns) {
    const text = await getHtml(cookies, url);
    let results = [];
    for (const pattern of patterns) {
        results = [...results, ...text.matchAll(pattern)];
    }
    return results;
}

export default async function autoDownload(cookieFile, url, downloadFolder, patterns, incremental) {
    let cookies = null;
    let newestCookie = false;
    if (!fs.existsSync(cookieFile)) {
        console.log("Cookie文件找不到，尝试重新获取");
        const infoContent = fs.readFileSync('./config/info.json', 'utf-8');
        const { userName, password } = JSON.parse(infoContent);
        cookies = await getCookie(userName, password, cookieFile);
        newestCookie = true;
    } else {
        cookies = parseCookieFile(cookieFile);
    }
    let results = await getLinks(cookies, url, patterns);
    if (results.length === 0 && !newestCookie) {
        console.log("找不到文件，尝试重新获取 Cookie");
        const infoContent = fs.readFileSync('./config/info.json', 'utf-8');
        const { userName, password } = JSON.parse(infoContent);
        cookies = await getCookie(userName, password, cookieFile);
        results = await getLinks(cookies, url, patterns);
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
