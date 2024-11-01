const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');
const { DateTime } = require('luxon');

class Clayton {
    constructor() {
        this.headers = { "Accept": "application/json, text/plain, */*",
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
        this.firstAccountFarmEndTime = null;
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [*][Clayton] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*][Clayton] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [!][Clayton] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [*][Clayton] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [*][Clayton] ${msg}`.blue);
        }
    }

    async makeRequest(url, method, initData, data = {}) {
        const headers = { ...this.headers, "Init-Data": initData };
    
        try {
            const response = await axios({
                method,
                url,
                data,
                headers
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.message };
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

    async login(initData) {
        return this.makeRequest("https://tonclayton.fun/api/user/authorization", 'post', initData);
    }

    async dailyClaim(initData) {
        return this.makeRequest("https://tonclayton.fun/api/user/daily-claim", 'post', initData);
    }

    async getPartnerTasks(initData) {
        return this.makeRequest("https://tonclayton.fun/api/tasks/partner-tasks", 'get', initData);
    }

    async completePartnerTask(taskId, initData) {
        return this.makeRequest("https://tonclayton.fun/api/tasks/complete", 'post', initData, { task_id: taskId });
    }

    async rewardPartnerTask(taskId, initData) {
        return this.makeRequest("https://tonclayton.fun/api/tasks/claim", 'post', initData, { task_id: taskId });
    }

    async handlePartnerTasks(initData) {
        let fetchAttempts = 0;
        const maxAttempts = 5;

        while (fetchAttempts < maxAttempts) {
            fetchAttempts++;
            const tasksResult = await this.getPartnerTasks(initData);

            if (tasksResult.success) {
                const uncompletedTasks = tasksResult.data.filter(task => !task.is_completed && !task.is_claimed);
                for (const task of uncompletedTasks) {
                    let taskAttempts = 0;
                    while (taskAttempts < maxAttempts) {
                        taskAttempts++;
                        const completeResult = await this.completePartnerTask(task.task_id, initData);
                        if (completeResult.success) {
                            const rewardResult = await this.rewardPartnerTask(task.task_id, initData);
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

    async getDailyTasks(initData) {
        return this.makeRequest("https://tonclayton.fun/api/tasks/daily-tasks", 'get', initData);
    }

    async completeDailyTask(taskId, initData) {
        return this.makeRequest("https://tonclayton.fun/api/tasks/complete", 'post', initData, { task_id: taskId });
    }

    async claimDailyTask(taskId, initData) {
        return this.makeRequest("https://tonclayton.fun/api/tasks/claim", 'post', initData, { task_id: taskId });
    }

    async handleDailyTasks(initData) {
        let fetchAttempts = 0;
        const maxAttempts = 5;

        while (fetchAttempts < maxAttempts) {
            fetchAttempts++;
            const tasksResult = await this.getDailyTasks(initData);

            if (tasksResult.success) {
                const uncompletedTasks = tasksResult.data.filter(task => !task.is_completed && !task.is_claimed);
                for (const task of uncompletedTasks) {
                    let taskAttempts = 0;
                    while (taskAttempts < maxAttempts) {
                        taskAttempts++;
                        const completeResult = await this.completeDailyTask(task.task_id, initData);
                        if (completeResult.success) {
                            const claimResult = await this.claimDailyTask(task.task_id, initData);
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

    async play2048(initData) {
        const startGameResult = await this.makeRequest("https://tonclayton.fun/api/game/start", 'post', initData);
        if (!startGameResult.success || startGameResult.data.message !== "Game started successfully") {
            this.log("Không thể bắt đầu trò chơi 2048", 'error');
            return;
        }

        this.log("Trò chơi 2048 đã bắt đầu thành công", 'success');

        const fixedMilestones = [4, 8, 16, 32, 64, 128, 256, 512, 1024];
        const allMilestones = [...fixedMilestones].sort((a, b) => a - b);
        const gameEndTime = Date.now() + 150000;

        for (const milestone of allMilestones) {
            if (Date.now() >= gameEndTime) break;
            
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10000 + 5000));

            const saveGameResult = await this.makeRequest("https://tonclayton.fun/api/game/save-tile", 'post', initData, { maxTile: milestone });
            if (saveGameResult.success && saveGameResult.data.message === "MaxTile saved successfully") {
                this.log(`Đã đạt đến ô ${milestone}`, 'success');
            }
        }

        const endGameResult = await this.makeRequest("https://tonclayton.fun/api/game/over", 'post', initData, { multiplier: 1 });
        if (endGameResult.success) {
            const reward = endGameResult.data;
            this.log(`Trò chơi 2048 đã kết thúc thành công. Nhận ${reward.earn} CL và ${reward.xp_earned} XP`, 'success');
        } else {
            this.log(`Lỗi kết thúc trò chơi 2048: ${endGameResult.error || 'Lỗi không xác định'}`, 'error');
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    async playStack(initData) {
        const startGameResult = await this.makeRequest("https://tonclayton.fun/api/stack/start-game", 'post', initData);
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

            const updateResult = await this.makeRequest("https://tonclayton.fun/api/stack/update-game", 'post', initData, { score });
            if (updateResult.success) {
                this.log(`Cập nhật điểm Stack: ${score}`, 'success');
                currentScoreIndex++;
            } else {
                this.log(`Lỗi cập nhật điểm Stack: ${updateResult.error || 'Lỗi không xác định'}`, 'error');
            }

            await new Promise(resolve => setTimeout(resolve, Math.random() * 10000 + 5000));
        }

        const finalScore = scores[currentScoreIndex - 1] || 90;

        const endGameResult = await this.makeRequest("https://tonclayton.fun/api/stack/end-game", 'post', initData, { score: finalScore, multiplier: 1 });
        if (endGameResult.success) {
            const reward = endGameResult.data;
            this.log(`Trò chơi Stack đã kết thúc thành công. Nhận ${reward.earn} CL và ${reward.xp_earned} XP`, 'success');
        } else {
            this.log(`Lỗi kết thúc trò chơi Stack: ${endGameResult.error || 'Lỗi không xác định'}`, 'error');
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    async playGames(initData) {
        while (true) {
            const loginResult = await this.login(initData);
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
                await this.play2048(initData);
                if (tickets > 1) {
                    await this.playStack(initData);
                }
            } else {
                await this.play2048(initData);
            }
        }
    }

    async handleDefaultTasks(initData) {
        let tasksResult;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            attempts++;
            tasksResult = await this.makeRequest("https://tonclayton.fun/api/tasks/default-tasks", 'get', initData);
            
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
            const completeResult = await this.makeRequest("https://tonclayton.fun/api/tasks/complete", 'post', initData, { task_id: task.task_id });
            
            if (!completeResult.success) {
                continue;
            }

            const claimResult = await this.makeRequest("https://tonclayton.fun/api/tasks/claim", 'post', initData, { task_id: task.task_id });
            
            if (claimResult.success) {
                const reward = claimResult.data;
                this.log(`Làm nhiệm vụ ${task.task.title} thành công. Phần thưởng ${reward.reward_tokens} CL | Balance: ${reward.total_tokens}`, 'success');
            } else {
                this.log(`Không thể nhận phần thưởng cho nhiệm vụ ${task.task.title}: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
            }

            await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
        }
    }

    async handleSuperTasks(initData) {
        let SuperTasks;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            attempts++;
            SuperTasks = await this.makeRequest("https://tonclayton.fun/api/tasks/super-tasks", 'get', initData);
            
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
            const completeResult = await this.makeRequest("https://tonclayton.fun/api/tasks/complete", 'post', initData, { task_id: task.task_id });
            
            if (!completeResult.success) {
                continue;
            }

            const claimResult = await this.makeRequest("https://tonclayton.fun/api/tasks/claim", 'post', initData, { task_id: task.task_id });
            
            if (claimResult.success) {
                const reward = claimResult.data;
                this.log(`Làm nhiệm vụ ${task.task.title} thành công. Phần thưởng ${reward.reward_tokens} CL | Balance: ${reward.total_tokens}`, 'success');
            } else {
                this.log(`Không thể nhận phần thưởng cho nhiệm vụ ${task.task.title}: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
            }

            await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
        }
    }

    async processAccount(initData) {
        let loginSuccess = false;
        let loginAttempts = 0;
        let loginResult;

        while (!loginSuccess && loginAttempts < 3) {
            loginAttempts++;
            this.log(`Đăng nhập... (Lần thử ${loginAttempts})`, 'info');
            loginResult = await this.login(initData);
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
            const claimResult = await this.dailyClaim(initData);
            if (claimResult.success) {
                this.log('Phần thưởng hàng ngày đã được nhận thành công!', 'success');
            } else {
                this.log(`Không thể nhận phần thưởng hàng ngày: ${claimResult.error || 'Lỗi không xác định'}`, 'error');
            }
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        if (userInfo.daily_attempts > 0) {
            await this.playGames(initData);
        } else {
            this.log(`Không còn vé trò chơi`, 'success');
        }
        await this.handleDefaultTasks(initData);
        await this.handlePartnerTasks(initData);
        await this.handleDailyTasks(initData);
        await this.handleSuperTasks(initData);
    }

    async wait(seconds) {
        for (let i = seconds; i > 0; i--) {
            process.stdout.write(`\r${colors.cyan(`[*] Chờ ${Math.floor(i / 60)} phút ${i % 60} giây để tiếp tục`)}`.padEnd(80));
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(`Bắt đầu vòng lặp mới...`);
    }

    async main() {
        while (true) {
            const dataFile = path.join(__dirname, 'data.txt');
            const data = fs.readFileSync(dataFile, 'utf8')
                .replace(/\r/g, '')
                .split('\n')
                .filter(Boolean);
    
            for (let i = 0; i < data.length; i++) {
                const initData = data[i];
                const userData = JSON.parse(decodeURIComponent(initData.split('user=')[1].split('&')[0]));
                const firstName = userData.first_name;
    
                console.log(`========== Tài khoản ${i + 1} | ${firstName.green} ==========`);
                await this.processAccount(initData);
            }
    
            await this.wait(20 * 60);
        }
    }

}

const client = new Clayton();
client.main().catch(err => {
    client.log(err.message, 'error');
    process.exit(1);
});