const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');

class KiloexClient {
    constructor() {
        this.headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "Origin": "https://app.kiloex.io",
            "Referer": "https://app.kiloex.io/",
            "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            "Sec-Ch-Ua-Mobile": "?1",
            "Sec-Ch-Ua-Platform": '"Android"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36"
        };
        
        this.marginLevels = [
            { required: 10000, margin: 5000 },
            { required: 2000, margin: 1000 },
            { required: 1000, margin: 500 },
            { required: 200, margin: 100 },
            { required: 100, margin: 50 },
            { required: 20, margin: 10 }
        ];
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async retryWithDelay(fn, retries = 3, delay = 5000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (error?.response?.data?.msg?.includes('too quickly') && i < retries - 1) {
                    this.log(`Đang chờ ${delay/1000}s trước khi thử lại...`, 'warning');
                    await this.sleep(delay);
                    continue;
                }
                throw error;
            }
        }
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [✓] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [✗] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [!] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [ℹ] ${msg}`.blue);
        }
    }

    async countdown(seconds) {
        for (let i = seconds; i > 0; i--) {
            const timestamp = new Date().toLocaleTimeString();
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[${timestamp}] [*] Chờ ${i} giây để tiếp tục...`);
            await this.sleep(1000);
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
    }

    async getUserInfo(account, name) {
        return await this.retryWithDelay(async () => {
            const url = `https://opapi.kiloex.io/tg/user/info?account=${account}&name=${name}&from=kiloextrade`;
            try {
                const response = await axios.get(url, { headers: this.headers });
                if (response.status === 200 && response.data.status === true) {
                    return { success: true, data: response.data.data };
                } else {
                    return { success: false, error: response.data.msg };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async claimOfflineCoins(account) {
        return await this.retryWithDelay(async () => {
            const url = 'https://opapi.kiloex.io/tg/coin/claim';
            try {
                const payload = {
                    account: account,
                    shared: false
                };
                
                const response = await axios.post(url, payload, { headers: this.headers });
                if (response.status === 200 && response.data.status === true) {
                    this.log('Claim coin offline thành công', 'success');
                    return { success: true };
                } else {
                    return { success: false, error: response.data.msg };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async checkAndBindReferral(account) {
        return await this.retryWithDelay(async () => {
            const checkUrl = `https://opapi.kiloex.io/tg/referral/code?account=${account}`;
            try {
                const checkResponse = await axios.get(checkUrl, { headers: this.headers });
                
                if (checkResponse.status === 200 && checkResponse.data.status === true) {
                    if (!checkResponse.data.data.length) {
                        await this.sleep(2000);
                        
                        const bindUrl = 'https://opapi.kiloex.io/tg/referral/bind';
                        const payload = {
                            account: account,
                            code: "bxsbz9la"
                        };
                        
                        const bindResponse = await axios.post(bindUrl, payload, { headers: this.headers });
                        
                        if (bindResponse.status === 200 && bindResponse.data.status === true) {
                            this.log('Bind ref code thành công', 'success');
                        } else {
                            return { success: false, error: bindResponse.data.msg };
                        }
                    }
                    return { success: true };
                } else {
                    return { success: false, error: checkResponse.data.msg };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async updateMining(account, stamina) {
        return await this.retryWithDelay(async () => {
            const url = 'https://opapi.kiloex.io/tg/mining/update';
            try {
                const response = await axios.post(url, {
                    account: account,
                    stamina: stamina,
                    coin: stamina
                }, { headers: this.headers });

                if (response.status === 200 && response.data.status === true) {
                    this.log('Khai thác thành công', 'success');
                    return { success: true };
                } else {
                    return { success: false, error: response.data.msg };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async openOrder(account, positionType, margin) {
        return await this.retryWithDelay(async () => {
            const url = 'https://opapi.kiloex.io/tg/order/open';
            try {
                const payload = {
                    account: account,
                    productId: 2,
                    margin: margin,
                    leverage: 100,
                    positionType: positionType,
                    settleDelay: 300
                };

                const response = await axios.post(url, payload, { headers: this.headers });
                if (response.status === 200 && response.data.status === true) {
                    this.log(`Mở lệnh ${positionType} với margin ${margin} thành công`, 'success');
                    return { success: true };
                } else {
                    return { success: false, error: response.data.msg };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    async openOrdersForMargin(account, margin) {
        this.log(`Bắt đầu mở lệnh với margin ${margin}...`, 'info');
        
        await this.sleep(2000);
        const longResult = await this.openOrder(account, 'long', margin);
        if (!longResult.success) {
            this.log(`Lỗi mở lệnh long margin ${margin}: ${longResult.error}`, 'error');
            return false;
        }

        await this.sleep(2000);
        const shortResult = await this.openOrder(account, 'short', margin);
        if (!shortResult.success) {
            this.log(`Lỗi mở lệnh short margin ${margin}: ${shortResult.error}`, 'error');
            return false;
        }

        this.log(`Đã mở xong cặp lệnh với margin ${margin}`, 'success');
        return true;
    }

    async processAccount(account, name, index) {
        try {
            console.log(`========== Tài khoản ${index + 1} | ${name.green} ==========`);
            
            const userInfo = await this.getUserInfo(account, name);
            if (!userInfo.success) {
                this.log(`Không thể lấy thông tin tài khoản: ${userInfo.error}`, 'error');
                return;
            }

            this.log(`Balance: ${userInfo.data.balance}`, 'custom');
            this.log(`Stamina: ${userInfo.data.stamina}`, 'custom');
            this.log(`Auto Coins: ${userInfo.data.autoCoins}`, 'custom');

            if (userInfo.data.autoCoins > 0) {
                await this.sleep(2000);
                const claimResult = await this.claimOfflineCoins(account);
                if (!claimResult.success) {
                    this.log(`Lỗi claim offline coins: ${claimResult.error}`, 'error');
                }
            }

            await this.sleep(2000);
            const referralResult = await this.checkAndBindReferral(account);
            if (!referralResult.success) {
                this.log(`Lỗi kiểm tra/bind referral: ${referralResult.error}`, 'error');
            }

            if (userInfo.data.stamina > 0) {
                await this.sleep(2000);
                const miningResult = await this.updateMining(account, userInfo.data.stamina);
                if (!miningResult.success) {
                    this.log(`Lỗi khai thác: ${miningResult.error}`, 'error');
                }
            }

            const balance = userInfo.data.balance;
            const appropriateLevel = this.marginLevels.find(level => balance >= level.required);

            if (appropriateLevel) {
                this.log(`Balance ${balance} đủ điều kiện mở lệnh mốc ${appropriateLevel.margin}`, 'info');
                await this.openOrdersForMargin(account, appropriateLevel.margin);
            } else {
                this.log(`Balance ${balance} chưa đủ điều kiện mở lệnh`, 'warning');
            }

        } catch (error) {
            this.log(`Lỗi xử lý tài khoản ${account}: ${error.message}`, 'error');
        }
    }

    async main() {
        try {
            const dataFile = path.join(__dirname, 'data.txt');
            if (!fs.existsSync(dataFile)) {
                this.log('Không tìm thấy file data.txt', 'error');
                return;
            }

            const data = fs.readFileSync(dataFile, 'utf8')
                .replace(/\r/g, '')
                .split('\n')
                .filter(Boolean)
                .map(line => line.trim())
                .filter(line => line.includes('|'));

            if (data.length === 0) {
                this.log('Không có dữ liệu tài khoản trong file data.txt', 'error');
                return;
            }

            while (true) {
                for (let i = 0; i < data.length; i++) {
                    const [account, name] = data[i].split('|');
                    if (!account || !name) {
                        this.log(`Dòng dữ liệu không hợp lệ: ${data[i]}`, 'error');
                        continue;
                    }

                    await this.processAccount(account.trim(), name.trim(), i);

                    if (i < data.length - 1) {
                        await this.sleep(3000);
                    }
                }

                this.log('Hoàn thành chu kỳ, chờ chu kỳ tiếp theo...', 'success');
                await this.countdown(60 * 60);
            }
        } catch (error) {
            this.log(`Lỗi chương trình: ${error.message}`, 'error');
            throw error;
        }
    }
}

const client = new KiloexClient();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});