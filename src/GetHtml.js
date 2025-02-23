import puppeteer from 'puppeteer';


export default async function getHtml(cookie, url) {
    const browser = await puppeteer.launch({
        args: [
            "--no-sandbox",
        ]
    });
    browser.setCookie(...cookie);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    page.on('console', message => console.log('PAGE LOG:', message.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error));
    const text = await page.evaluate(() => {
        return document.querySelector('body').outerHTML;
    });
    await browser.close();
    return text;
}
