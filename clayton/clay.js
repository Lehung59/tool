const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');

class Clayton {
    constructor(accountIndex, initData) {
        this.accountIndex = accountIndex;
        this.initData = initData;
        this.headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "Content-Type": "application/json",
            "Origin": "https://tonclayton.fun",
            "Referer": "https://tonclayton.fun/games",
            "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        };
    }

    log(msg, type = 'info') {
        const accountPrefix = `[Tài khoản ${this.accountIndex + 1}]`;
        let logMessage = '';

        switch(type) {
            case 'success':
                logMessage = `${accountPrefix} ${msg}`.green;
                break;
            case 'error':
                logMessage = `${accountPrefix} ${msg}`.red;
                break;
            case 'warning':
                logMessage = `${accountPrefix} ${msg}`.yellow;
                break;
            default:
                logMessage = `${accountPrefix} ${msg}`.blue;
        }

        console.log(logMessage);
    }

    async makeRequest(url, method, data = {}) {
        try {
            const response = await axios({
                method,
                url,
                data,
                headers: { ...this.headers, "Init-Data": this.initData }
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async login() {
        return this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/user/authorization", 'post');
    }

    async dailyClaim() {
        return this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/user/daily-claim", 'post');
    }

    async getPartnerTasks() {
        return this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/partner-tasks", 'get');
    }

    async completePartnerTask(taskId) {
        return this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/complete", 'post', { task_id: taskId });
    }

    async rewardPartnerTask(taskId) {
        return this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/claim", 'post', { task_id: taskId });
    }

    async handlePartnerTasks() {
        let fetchAttempts = 0;
        const maxAttempts = 5;

        while (fetchAttempts < maxAttempts) {
            fetchAttempts++;
            const tasksResult = await this.getPartnerTasks();

            if (tasksResult.success) {
                const uncompletedTasks = tasksResult.data.filter(task => !task.is_completed && !task.is_claimed);
                for (const task of uncompletedTasks) {
                    let taskAttempts = 0;
                    while (taskAttempts < maxAttempts) {
                        taskAttempts++;
                        const completeResult = await this.completePartnerTask(task.task_id);
                        if (completeResult.success) {
                            const rewardResult = await this.rewardPartnerTask(task.task_id);
                            if (rewardResult.success) {
                                this.log(`Làm nhiệm vụ ${task.task.title} thành công. Nhận được ${task.task.reward_tokens} CL`, 'success');
                                break;
                            }
                        } else {
                            if (taskAttempts < maxAttempts) {
                                await new Promise(resolve => setTimeout(resolve, 5000));
                            }
                        }
                    }
                    if (taskAttempts === maxAttempts) {
                        this.log(`Không thể hoàn thành nhiệm vụ ${task.task.title} sau ${maxAttempts} lần thử. Bỏ qua nhiệm vụ này.`, 'error');
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                return;
            } else {
                if (fetchAttempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        if (fetchAttempts === maxAttempts) {
            this.log(`Không thể lấy danh sách nhiệm vụ đối tác sau ${maxAttempts} lần thử. Bỏ qua xử lý nhiệm vụ đối tác.`, 'error');
        }
    }

    async getDailyTasks() {
        return this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/daily-tasks", 'get');
    }

    async completeDailyTask(taskId) {
        return this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/complete", 'post', { task_id: taskId });
    }

    async claimDailyTask(taskId) {
        return this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/claim", 'post', { task_id: taskId });
    }

    async handleDailyTasks() {
        let fetchAttempts = 0;
        const maxAttempts = 5;

        while (fetchAttempts < maxAttempts) {
            fetchAttempts++;
            const tasksResult = await this.getDailyTasks();

            if (tasksResult.success) {
                const uncompletedTasks = tasksResult.data.filter(task => !task.is_completed && !task.is_claimed);
                for (const task of uncompletedTasks) {
                    let taskAttempts = 0;
                    while (taskAttempts < maxAttempts) {
                        taskAttempts++;
                        const completeResult = await this.completeDailyTask(task.task_id);
                        if (completeResult.success) {
                            const claimResult = await this.claimDailyTask(task.task_id);
                            if (claimResult.success) {
                                this.log(`Làm nhiệm vụ ${task.task.title} thành công. Nhận được ${claimResult.data.reward_tokens} CL`, 'success');
                                this.log(`Tổng CL: ${claimResult.data.total_tokens} | Số lượt chơi game: ${claimResult.data.game_attempts}`, 'info');
                                break;
                            } else {
                                this.log(`Không thể nhận phần thưởng cho nhiệm vụ ${task.task.title}: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
                            }
                        } else {
                            if (taskAttempts < maxAttempts) {
                                await new Promise(resolve => setTimeout(resolve, 5000));
                            }
                        }
                    }
                    if (taskAttempts === maxAttempts) {
                        this.log(`Không thể hoàn thành nhiệm vụ ${task.task.title} sau ${maxAttempts} lần thử. Bỏ qua nhiệm vụ này.`, 'error');
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                return;
            } else {
                if (fetchAttempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        if (fetchAttempts === maxAttempts) {
            this.log(`Không thể lấy danh sách nhiệm vụ hàng ngày sau ${maxAttempts} lần thử. Bỏ qua xử lý nhiệm vụ hàng ngày.`, 'error');
        }
    }

    async play2048() {
        const startGameResult = await this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/game/start", 'post');
        if (!startGameResult.success || !startGameResult.data.session_id) {
            this.log("Không thể bắt đầu trò chơi 2048", 'error');
            return;
        }
    
        const sessionId = startGameResult.data.session_id;
        this.log("Trò chơi 2048 đã bắt đầu thành công", 'success');
    
        const fixedMilestones = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
        const allMilestones = [...fixedMilestones].sort((a, b) => a - b);
        const gameEndTime = Date.now() + 150000;
        let maxTileReached = 2;
    
        for (const milestone of allMilestones) {
            if (Date.now() >= gameEndTime) break;
            
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10000 + 5000));
    
            const saveGameResult = await this.makeRequest(
                "https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/game/save-tile",
                'post',
                { session_id: sessionId, maxTile: milestone }
            );
            
            if (saveGameResult.success && saveGameResult.data.message === "MaxTile saved successfully") {
                this.log(`Đã đạt đến ô ${milestone}`, 'success');
                maxTileReached = milestone;
            }
        }
    
        const endGameResult = await this.makeRequest(
            "https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/game/over",
            'post',
            { 
                session_id: sessionId,
                multiplier: 1,
                maxTile: maxTileReached
            }
        );
    
        if (endGameResult.success) {
            const reward = endGameResult.data;
            this.log(`Trò chơi 2048 đã kết thúc thành công. Nhận ${reward.earn} CL và ${reward.xp_earned} XP`, 'success');
        } else {
            this.log(`Lỗi kết thúc trò chơi 2048: ${endGameResult.error || 'Lỗi không xác định'}`, 'error');
        }
    
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    async playStack() {
        const startGameResult = await this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/stack/st-game", 'post');
        if (!startGameResult.success) {
            this.log("Không thể bắt đầu trò chơi Stack", 'error');
            return;
        }

        this.log("Trò chơi Stack đã bắt đầu thành công", 'success');

        const gameEndTime = Date.now() + 120000;
        const scores = [10, 20, 30, 40, 50, 60, 70, 80, 90];
        let currentScoreIndex = 0;

        while (Date.now() < gameEndTime && currentScoreIndex < scores.length) {
            const score = scores[currentScoreIndex];

            const updateResult = await this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/stack/update-game", 'post', { score });
            if (updateResult.success) {
                this.log(`Cập nhật điểm Stack: ${score}`, 'success');
                currentScoreIndex++;
            } else {
                this.log(`Lỗi cập nhật điểm Stack: ${updateResult.error || 'Lỗi không xác định'}`, 'error');
            }

            await new Promise(resolve => setTimeout(resolve, Math.random() * 10000 + 5000));
        }

        const finalScore = scores[currentScoreIndex - 1] || 90;

        const endGameResult = await this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/stack/en-game", 'post', { score: finalScore, multiplier: 1 });
        if (endGameResult.success) {
            const reward = endGameResult.data;
            this.log(`Trò chơi Stack đã kết thúc thành công. Nhận ${reward.earn} CL và ${reward.xp_earned} XP`, 'success');
        } else {
            this.log(`Lỗi kết thúc trò chơi Stack: ${endGameResult.error || 'Lỗi không xác định'}`, 'error');
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    async playGames() {
        while (true) {
            const loginResult = await this.login();
            if (!loginResult.success) {
                this.log("Không kiểm tra được vé", 'error');
                return;
            }

            const tickets = loginResult.data.user.daily_attempts;
            if (tickets <= 0) {
                this.log("Không còn vé nữa. dừng chơi game.", 'info');
                return;
            }

            this.log(`Số vé hiện tại: ${tickets}`, 'info');

            if (tickets >= 2) {
                await this.play2048();
                if (tickets > 1) {
                    await this.playStack();
                }
            } else {
                await this.play2048();
            }
        }
    }

    async handleDefaultTasks() {
        let tasksResult;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            attempts++;
            tasksResult = await this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/default-tasks", 'get');
            
            if (tasksResult.success) {
                break;
            } else {
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        if (!tasksResult.success) {
            this.log(`Không thể lấy danh sách nhiệm vụ mặc định sau ${maxAttempts} lần thử. Bỏ qua xử lý nhiệm vụ mặc định.`, 'error');
            return;
        }

        const incompleteTasks = tasksResult.data.filter(task => !task.is_completed && task.task_id !== 9);

        for (const task of incompleteTasks) {
            const completeResult = await this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/complete", 'post', { task_id: task.task_id });
            
            if (!completeResult.success) {
                continue;
            }

            const claimResult = await this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/claim", 'post', { task_id: task.task_id });
            
            if (claimResult.success) {
                const reward = claimResult.data;
                this.log(`Làm nhiệm vụ ${task.task.title} thành công. Phần thưởng ${reward.reward_tokens} CL | Balance: ${reward.total_tokens}`, 'success');
            } else {
                this.log(`Không thể nhận phần thưởng cho nhiệm vụ ${task.task.title}: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
            }

            await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
        }
    }

    async handleSuperTasks() {
        let SuperTasks;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            attempts++;
            SuperTasks = await this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/super-tasks", 'get');
            
            if (SuperTasks.success) {
                break;
            } else {
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        if (!SuperTasks.success) {
            this.log(`Không thể lấy danh sách nhiệm vụ cao cấp sau ${maxAttempts} lần thử. Bỏ qua xử lý nhiệm vụ cao cấp.`, 'error');
            return;
        }

        const incompleteTasks = SuperTasks.data.filter(task => !task.is_completed);

        for (const task of incompleteTasks) {
            const completeResult = await this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/complete", 'post', { task_id: task.task_id });
            
            if (!completeResult.success) {
                continue;
            }

            const claimResult = await this.makeRequest("https://tonclayton.fun/api/cc82f330-6a6d-4deb-a16b-6a335a67ffa7/tasks/claim", 'post', { task_id: task.task_id });
            
            if (claimResult.success) {
                const reward = claimResult.data;
                this.log(`Làm nhiệm vụ ${task.task.title} thành công. Phần thưởng ${reward.reward_tokens} CL | Balance: ${reward.total_tokens}`, 'success');
            } else {
                this.log(`Không thể nhận phần thưởng cho nhiệm vụ ${task.task.title}: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
            }

            await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
        }
    }

    async processAccount() {
       
        let loginSuccess = false;
        let loginAttempts = 0;
        let loginResult;

        while (!loginSuccess && loginAttempts < 3) {
            loginAttempts++;
            this.log(`Đăng nhập... (Lần thử ${loginAttempts})`, 'info');
            loginResult = await this.login();
            if (loginResult.success) {
                loginSuccess = true;
            } else {
                this.log(`Đăng nhập thất bại: ${loginResult.error}`, 'error');
                if (loginAttempts < 3) {
                    this.log('Thử lại...', 'info');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        if (!loginSuccess) {
            this.log('Đăng nhập không thành công sau 3 lần thử. Bỏ qua tài khoản.', 'error');
            return;
        }

        const userInfo = loginResult.data.user;
        this.log(`CL: ${userInfo.tokens} CL | ${userInfo.daily_attempts} Ticket`, 'info');

        if (loginResult.data.dailyReward.can_claim_today) {
            this.log('Yêu cầu phần thưởng hàng ngày...', 'info');
            const claimResult = await this.dailyClaim();
            if (claimResult.success) {
                this.log('Phần thưởng hàng ngày đã được nhận thành công!', 'success');
            } else {
                this.log(`Không thể nhận phần thưởng hàng ngày: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
            }
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        if (userInfo.daily_attempts > 0) {
            await this.playGames();
        } else {
            this.log(`Không còn vé trò chơi`, 'success');
        }
        await this.handleDefaultTasks();
        await this.handlePartnerTasks();
        await this.handleDailyTasks();
        await this.handleSuperTasks();
    }
}

async function main() {
    const dataFile = path.join(__dirname, 'data.txt');
    const accounts = fs.readFileSync(dataFile, 'utf8')
    .replace(/\r/g, '')
    .split('\n')
    .filter(Boolean);
    for (let i = 0; i < accounts.length; i++) {
        const client = new Clayton(i, accounts[i]);
        await client.processAccount();
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('Hoàn thành xử lý tất cả tài khoản. Dừng 24 giờ trước khi bắt đầu lại...');
    setTimeout(main, 86400 * 1000);
}

main().catch(err => {
    console.error('Đã xảy ra lỗi:', err.message);
    process.exit(1);
});
