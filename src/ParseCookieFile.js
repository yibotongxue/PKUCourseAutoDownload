import { readFileSync } from 'fs';

/**
 * 
 * @param {string} cookieFile 
 * @returns JSON
 */
export default function parseCookieFile(cookieFile) {
    const cookieStr = readFileSync(cookieFile).toString();
    // console.log(cookieStr);
    const cookies = [];
    const ca = cookieStr.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        // console.log(c);
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
    return cookies;
}
