import { readFileSync } from 'fs';

export default function parseCookieFile(cookieFile) {
    const cookieStr = readFileSync(cookieFile).toString();
    let cookies = null;
    try {
        cookies = JSON.parse(cookieStr);
    } catch(error) {
        cookies = [];
        const ca = cookieStr.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c) {
                const [key, value] = c.split('=');
                cookies[key] = value;
                cookies.push({
                    "name": key,
                    "value": value,
                    "domain": "course.pku.edu.cn",
                    "path": "/",
                    "httpOnly": false,
                    "secure": false
                });
            }
        }
    }
    return cookies;
}
