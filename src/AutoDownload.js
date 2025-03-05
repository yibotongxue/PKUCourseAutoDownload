import path from "path";
import fs from 'fs';
import parseCookieFile from "./ParseCookieFile.js";
import getHtml from "./GetHtml.js";
import downloadFile from "./DownloadFile.js";
import getExtensionFromRemote from "./GetExtension.js";
import getCookie from "./GetCookie.js";

const prefixUrl = "https://course.pku.edu.cn";

async function getLinks(cookies, url, filePatterns, folderPatterns, baseFolder) {
    const text = await getHtml(cookies, url);
    // console.log(text);
    let results = [];
    for (const pattern of filePatterns) {
        results = [...results, ...(text.matchAll(pattern)).map(result => [result, baseFolder])];
    }
    let folders = [];
    for (const pattern of folderPatterns) {
        folders = [...folders, ...text.matchAll(pattern)];
    }
    folders = folders.map(folder => [(prefixUrl + folder[1]).replace("amp;", ""), folder[2]]);
    for (const folder of folders) {
        results = [...results, ...await getLinks(cookies, folder[0], filePatterns, folderPatterns, path.join(baseFolder, folder[1]))];
    }
    return results;
}

export default async function autoDownload(cookieFile, url, downloadFolder, filePatterns, folderPatterns, incremental) {
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
    let results = await getLinks(cookies, url, filePatterns, folderPatterns, downloadFolder);
    if (results.length === 0 && !newestCookie) {
        console.log("找不到文件，尝试重新获取 Cookie");
        const infoContent = fs.readFileSync('./config/info.json', 'utf-8');
        const { userName, password } = JSON.parse(infoContent);
        cookies = await getCookie(userName, password, cookieFile);
        results = await getLinks(cookies, url, filePatterns, folderPatterns, downloadFolder);
    }
    if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder);
    }
    outerLoop: for (const result of results) {
        const fullUrl = prefixUrl + result[0][1];
        let fileName = result[0][3];
        if (fileName.startsWith("&nbsp;")) {
            fileName = fileName.match(/(?<=&nbsp;)(.+)/g)[0];
        }
        if (!fs.existsSync(result[1])) {
            fs.mkdirSync(result[1]);
        }
        const extension = await getExtensionFromRemote(fullUrl, cookies);
        if (extension && !path.extname(fileName)) {
            fileName += '.' + extension.ext;
        }
        const downloadPath = path.join(path.resolve(result[1]), fileName);
        if (incremental && fs.existsSync(downloadPath)) {
            console.log("文件已存在，跳过：", downloadPath);
            continue;
        }
        await downloadFile(fullUrl, downloadPath, cookies);
        // addExtension(downloadPath);
    }
}
