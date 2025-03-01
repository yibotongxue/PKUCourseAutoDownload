import puppeteer from "puppeteer";
import { writeFileSync } from "fs";

export default async function getCookie(userName, password, cookieFile) {
    if (userName === "" || password === "") {
        writeFileSync(cookieFile, "");
        return [];
    }
    const browser = await puppeteer.launch({
        args: [
            "--no-sandbox",
        ]
    });
    const courseUrl = "https://course.pku.edu.cn/webapps/bb-sso-BBLEARN/login.html";
    const page = await browser.newPage();
    await page.goto(courseUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="text"]', { visible: true });
    await page.type('input[type="text"]', userName);
    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.type('input[type="password"]', password);
    await page.waitForSelector('input[type="submit"]', { visible: true });
    await page.click('input[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    let cookies = await browser.cookies();
    await browser.close();
    cookies = cookies.filter(cookie => cookie.domain === 'course.pku.edu.cn');
    writeFileSync(cookieFile, JSON.stringify(cookies, null, 2));
    return cookies;
}
