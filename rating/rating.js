const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');

class Rating {
    constructor() {
        this.headers = {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "text/plain",
            "Origin": "https://static.ratingtma.com",
            "Referer": "https://static.ratingtma.com/",
            "Sec-Ch-Ua": '"Microsoft Edge";v="129", "Not=A?Brand";v="8", "Chromium";v="129", "Microsoft Edge WebView2";v="129"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
        };
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [*] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [!] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [*] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [*] ${msg}`.blue);
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

    async authenticate(auth) {
        const url = `https://api.ratingtma.com/auth/auth.tma?${auth}`;
        try {
            const response = await axios.post(url, {}, { headers: this.headers });
            if (response.status === 200 && response.data.response && response.data.response.token) {
                return { success: true, token: response.data.response.token };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getUserInfo(token) {
        const url = "https://api.ratingtma.com/game/user.get";
        const headers = { 
            ...this.headers, 
            "Authorization": token,
            "Content-Hello": Math.random().toString(),
            "Content-Id": Math.random().toString()
        };
        try {
            const response = await axios.get(url, { headers });
            if (response.status === 200 && response.data.response) {
                return { success: true, data: response.data.response };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async spinRoulette(token) {
        const url = "https://api.ratingtma.com/game/minigame.roulette";
        const headers = { 
            ...this.headers, 
            "Authorization": token,
            "Content-Hello": Math.random().toString(),
            "Content-Id": Math.random().toString()
        };
        try {
            const response = await axios.post(url, {}, { headers });
            if (response.status === 200 && response.data.response) {
                return { success: true, data: response.data.response };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getTaskListByGroup(token, group, lang = 'en') {
        const url = "https://api.ratingtma.com/task/task.list";
        const headers = { 
            ...this.headers, 
            "Authorization": token,
            "Content-Hello": Math.random().toString(),
            "Content-Id": Math.random().toString()
        };
        const payload = { "group": group, "lang": lang };
        try {
            const response = await axios.post(url, payload, { headers });
            if (response.status === 200 && response.data.response) {
                return { success: true, data: response.data.response };
            } else {

                return { success: false, error: 401 };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async executeTaskByOrder(token, group, order) {
        const url = "https://api.ratingtma.com/task/task.execute";
        const headers = { 
            ...this.headers, 
            "Authorization": token,
            "Content-Hello": Math.random().toString(),
            "Content-Id": Math.random().toString()
        };
        const payload = { "group": group, "order": order };
        try {
            const response = await axios.post(url, payload, { headers });
            if (response.status === 200 && response.data.response) {
                return { success: true, data: response.data.response };
            } else {
                return { success: false, error: 'Invalid response format' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async processAllTaskLists(token) {
        const groups = ['daily', 'partners', 'monthly', 'main'];
        const lang = 'vi';

        for (const group of groups) {
            try {
                const response = await this.getTaskListByGroup(token, group, lang);
                if (response.success) {
                    const tasks = response.data[group]?.tasks.flat() || [];
                    const openTasks = tasks.filter(task => task.status === 'OPEN');

                    this.log(`Open tasks for ${group}:`, 'info');
                    openTasks.forEach(task => this.log(`- ${task.title} (ID: ${task.id})`, 'custom'));

                    for (const task of openTasks) {
                        if (task.action === 'link') {
                            await this.processLinkTask(token, task, group);
                        }
                    }
                } else {

                    this.log(`Failed to get tasks for ${group}: ${response.error}`, 'error');
                }
            } catch (error) {
                this.log(`Error processing ${group} tasks: ${error.message}`, 'error');
            }
        }
    }

    async processLinkTask(token, task, group) {
        try {
            await axios.post('https://api.ratingtma.com/task/task.link', 
                { group, task: task.id, action: 'link' },
                { headers: { ...this.headers, Authorization: token } }
            );

            await axios.post('https://api.ratingtma.com/task/task.data', 
                { task: task.id },
                { headers: { ...this.headers, Authorization: token } }
            );

            const response = await this.getTaskListByGroup(token, group);

            if (response.success) {
                const updatedTask = response.data[group].tasks.flat().find(t => t.id === task.id);
                
                if (updatedTask && updatedTask.order) {
                    const executeResult = await this.executeTaskByOrder(token, group, updatedTask.order);

                    if (executeResult.success && executeResult.data.result) {
                        const reward = task.item[0]?.count || 'unknown';
                        this.log(`Làm nhiệm vụ ${task.title} thành công | phần thưởng ${reward}`, 'success');
                    } else {
                        this.log(`Không thể hoàn thành nhiệm vụ ${task.title}`, 'error');
                    }
                }
            }
        } catch (error) {
            this.log(`Error processing task ${task.id}: ${error.message}`, 'error');
        }
    }

    async main() {
        const dataFile = path.join(__dirname, 'data.txt');
        const tokenFile = path.join(__dirname, 'token.json');
        const data = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        let tokens = {};
        if (fs.existsSync(tokenFile)) {
            tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
        }
        let trycount = 0;
        while (true) {
            let isRetry = 0;
            for (let i = 0; i < data.length; i++) {
                const auth = data[i];
                const userId = JSON.parse(decodeURIComponent(auth.split('user=')[1].split('&')[0])).id;

                console.log(`========== Tài khoản ${i + 1} | ID: ${userId} ==========`);
                
                this.log(`Đang xác thực tài khoản ${userId}...`, 'info');
                let token = tokens[userId];
                if (!token) {
                    const authResult = await this.authenticate(auth);
                    if (authResult.success) {
                        token = authResult.token;
                        tokens[userId] = token;
                        fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2));
                        this.log('Xác thực thành công!', 'success');
                    } else {
                        this.log(`Xác thực không thành công! ${authResult.error}`, 'error');
                        tokens[userId] = "";
                        this.log(`Thử lại lần ${trycount+=1}`)
                        if(trycount == 3) break;
                        continue;
                    }
                } else {
                    this.log('Sử dụng token đã lưu.', 'info');
                }

                const taskListResult = await this.getTaskListByGroup(token, 'calendar');
                if (taskListResult.success) {
                    const readyTask = taskListResult.data.calendar.tasks[0].find(task => task.status === 'READ');
                    if (readyTask) {
                        this.log(`Tìm thấy nhiệm vụ Daily Rewards Calendar sẵn sàng. Order: ${readyTask.order}`, 'info');
                        const executeResult = await this.executeTaskByOrder(token, 'calendar', readyTask.order);
                        if (executeResult.success && executeResult.data.result) {
                            this.log('Daily Rewards Calendar được hoàn thành', 'success');
                        } else {
                            this.log('Không thể hoàn thành Daily Rewards Calendar', 'error');
                        }
                    } else {
                        this.log('Không có nhiệm vụ Daily Rewards Calendar nào sẵn sàng', 'warning');
                    }
                } else {
                    if(taskListResult.error == 401){
                        tokens[userId] = "";
                        this.log(`Thử lại lần ${trycount+=1}`)
                        if(trycount < 3){
                            isRetry = 1;
                            break;
                        }
                        isRetry = -1;
                    }

                    this.log(`Không thể lấy danh sách nhiệm vụ: ${taskListResult.error}`, 'error');
                }

                let userInfoResult = await this.getUserInfo(token);
                if (userInfoResult.success) {
                    let energy = userInfoResult.data.balances.find(b => b.key === 'energy').count;
                    let ticket = userInfoResult.data.balances.find(b => b.key === 'ticket').count;
                    this.log(`Energy: ${energy}, Ticket: ${ticket}`, 'custom');

                    while (ticket > 0) {
                        const spinResult = await this.spinRoulette(token);
                        if (spinResult.success) {
                            this.log(`Spin thành công, nhận được ${spinResult.data.score} score`, 'success');
                            ticket--;
                        } else {
                            this.log(`Spin không thành công: ${spinResult.error}`, 'error');
                            break;
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    userInfoResult = await this.getUserInfo(token);
                    if (userInfoResult.success) {
                        energy = userInfoResult.data.balances.find(b => b.key === 'energy').count;
                        ticket = userInfoResult.data.balances.find(b => b.key === 'ticket').count;
                        this.log(`Sau khi spin - Energy: ${energy}, Ticket: ${ticket}`, 'custom');
                    }

                    await this.processAllTaskLists(token);
                } else {
                    this.log(`Không thể lấy thông tin người dùng: ${userInfoResult.error}`, 'error');
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            if(isRetry == 1) {


                continue;

            }
            if(isRetry == -1) break;

            await this.countdown(86400);
        }
    }
}

const client = new Rating();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});