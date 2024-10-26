const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const { DateTime } = require('luxon');

class BirdX {
    constructor() {
        this.headers = {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://catsdogs.live',
            'priority': 'u=1, i',
            'referer': 'https://catsdogs.live/',
            'sec-ch-ua': '"Microsoft Edge";v="129", "Not=A?Brand";v="8", "Chromium";v="129", "Microsoft Edge WebView2";v="129"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
        };
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch (type) {
            case 'success':
                console.log(`[CatsDog][${timestamp}] [*] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[CatsDog][${timestamp}] [*] ${msg}`.magenta);
                break;
            case 'error':
                console.log(`[CatsDog][${timestamp}] [!] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[CatsDog][${timestamp}] [*] ${msg}`.yellow);
                break;
            default:
                console.log(`[CatsDog][${timestamp}] [*] ${msg}`.white);
        }
    }

    async countdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`===== Chờ ${i} giây để tiếp tục vòng lặp =====`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.log('', 'info');
    }

    async claimReward(telegramauth) {
        try {
            const headers = {
                ...this.headers,
                "x-telegram-web-app-data": `${telegramauth}`
            };

            const claimResponse = await axios.post("https://api.catsdogs.live/game/claim", null, { headers });
            if (claimResponse.status === 200) {
                this.log("Claim phần thưởng thành công!", 'success');
            } else {
                this.log(`Lỗi khi nhận phần thưởng (chưa đến thời gian claim): ${claimResponse.status}`, 'error');
            }
        } catch (error) {
            this.log(`Lỗi khi nhận phần thưởng (chưa đến thời gian claim): ${error}`, 'error');
        }

    }

    async doTask(telegramauth) {
        const headers = {
            ...this.headers,
            "x-telegram-web-app-data": `${telegramauth}`
        };

        const taskList = await axios.get("https://api.catsdogs.live/tasks/list", { headers });
        for (const task of taskList.data) {
            if (task.transaction_id === null) {
                if (task.auto_claim) {
                    try {
                        let data = JSON.stringify({
                            "task_id": task.id
                        });

                        let config = {
                            method: 'post',
                            maxBodyLength: Infinity,
                            url: 'https://api.catsdogs.live/tasks/claim',
                            headers: headers,
                            data: data
                        };

                        axios.request(config)
                            .then((response) => {
                                this.log(`Làm nhiệm vụ: ${task.title} : Thành công thu hoạch ${task.amount} token`, 'success');
                            })
                            .catch((error) => {
                                const httpStatusCode = error.response ? error.response.status : 'unknown';
                                if (httpStatusCode == 410) {
                                    this.log(`Làm nhiệm vụ: ${task.title} | ${task.id} : Hết hạn`, 'warning');
                                } else {
                                    this.log(`Làm nhiệm vụ: ${task.title} | ${task.id} : Thất bại ${error}`, 'error');
                                }
                            });

                    } catch (error) {
                        console.log(error);
                        this.log(`Làm nhiệm vụ: ${task.title} : Thất bại ${error}`, 'error');
                    }
                } else {
                    this.log(`Không thể làm nhiệm vụ này: ${task.title} : Vui lòng thực hiện thủ công`, 'custom');
                }

            }
        }
    }

    async main() {
        const dataFile = path.join(__dirname, 'data.txt');
        const data = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        while (true) {
            for (let i = 0; i < data.length; i++) {
                const telegramauth = data[i];
                const userData = JSON.parse(decodeURIComponent(telegramauth.split('user=')[1].split('&')[0]));
                const userId = userData.id;
                const firstName = userData.first_name;

                console.log(`========== Tài khoản ${i + 1} | ${firstName.green} ==========`);

                await this.claimReward(telegramauth);
                await this.doTask(telegramauth);

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            const minTime = 120 * 60; // 15 phút
            const maxTime = 200 * 60; // 60 phút
            const randomTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
            await this.countdown(randomTime);
        }
    }
}

const client = new BirdX();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});