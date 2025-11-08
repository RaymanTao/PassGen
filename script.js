// 密码生成器核心功能
class PasswordGenerator {
    constructor() {
        this.init();
    }

    init() {
        // DOM元素
        this.elements = {
            passwordOutput: document.getElementById('passwordOutput'),
            passwordLength: document.getElementById('passwordLength'),
            lengthValue: document.getElementById('lengthValue'),
            includeUppercase: document.getElementById('includeUppercase'),
            includeLowercase: document.getElementById('includeLowercase'),
            includeNumbers: document.getElementById('includeNumbers'),
            includeSymbols: document.getElementById('includeSymbols'),
            excludeSimilar: document.getElementById('excludeSimilar'),
            excludeAmbiguous: document.getElementById('excludeAmbiguous'),
            generateBtn: document.getElementById('generateBtn'),
            copyBtn: document.getElementById('copyPassword'),
            refreshBtn: document.getElementById('refreshPassword'),
            toggleVisibility: document.getElementById('toggleVisibility'),
            copyFeedback: document.getElementById('copyFeedback'),
            strengthText: document.getElementById('strengthText'),
            strengthFill: document.getElementById('strengthFill'),
            strengthScore: document.getElementById('strengthScore'),
            statsSection: document.getElementById('statsSection'),
            themeToggle: document.getElementById('themeToggle'),
            presetButtons: document.querySelectorAll('.preset-btn')
        };

        // 字符集定义
        this.charSets = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
            similar: '0O1lI',
            ambiguous: '{}[]()/\\\'"`~,;:.<>'
        };

        // 绑定事件
        this.bindEvents();
        
        // 初始化主题
        this.initTheme();
        
        // 生成初始密码
        this.generatePassword();
    }

    bindEvents() {
        // 长度滑块
        this.elements.passwordLength.addEventListener('input', (e) => {
            this.elements.lengthValue.textContent = e.target.value;
        });

        // 生成按钮
        this.elements.generateBtn.addEventListener('click', () => {
            this.generatePassword();
        });

        // 刷新按钮
        this.elements.refreshBtn.addEventListener('click', () => {
            this.generatePassword();
        });

        // 复制按钮
        this.elements.copyBtn.addEventListener('click', () => {
            this.copyPassword();
        });

        // 可见性切换
        this.elements.toggleVisibility.addEventListener('click', () => {
            this.toggleVisibility();
        });

        // 配置变化时自动生成（可选）
        [
            this.elements.passwordLength,
            this.elements.includeUppercase,
            this.elements.includeLowercase,
            this.elements.includeNumbers,
            this.elements.includeSymbols,
            this.elements.excludeSimilar,
            this.elements.excludeAmbiguous
        ].forEach(element => {
            element.addEventListener('change', () => {
                if (this.elements.passwordOutput.value) {
                    this.generatePassword();
                }
            });
        });

        // 预设按钮
        this.elements.presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyPreset(e.target.dataset.preset);
                // 更新按钮状态
                this.elements.presetButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 主题切换
        this.elements.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.generatePassword();
                } else if (e.key === 'c' && this.elements.passwordOutput.value) {
                    e.preventDefault();
                    this.copyPassword();
                }
            }
        });
    }

    // 获取可用的字符集
    getAvailableCharset() {
        let charset = '';

        if (this.elements.includeUppercase.checked) {
            charset += this.charSets.uppercase;
        }
        if (this.elements.includeLowercase.checked) {
            charset += this.charSets.lowercase;
        }
        if (this.elements.includeNumbers.checked) {
            charset += this.charSets.numbers;
        }
        if (this.elements.includeSymbols.checked) {
            charset += this.charSets.symbols;
        }

        // 排除相似字符
        if (this.elements.excludeSimilar.checked) {
            this.charSets.similar.split('').forEach(char => {
                charset = charset.replace(new RegExp(char, 'g'), '');
            });
        }

        // 排除歧义字符
        if (this.elements.excludeAmbiguous.checked) {
            this.charSets.ambiguous.split('').forEach(char => {
                charset = charset.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
            });
        }

        return charset;
    }

    // 使用Web Crypto API生成安全的随机数
    async getSecureRandomInt(max) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
    }

    // 生成密码
    async generatePassword() {
        const length = parseInt(this.elements.passwordLength.value);
        let charset = this.getAvailableCharset();

        // 验证至少选择一种字符类型
        if (charset.length === 0) {
            this.elements.passwordOutput.value = '';
            this.elements.passwordOutput.placeholder = '请至少选择一种字符类型';
            this.updateStrength('');
            this.hideStats();
            return;
        }

        // 确保至少包含每种选中的字符类型
        const requiredChars = [];
        if (this.elements.includeUppercase.checked) {
            requiredChars.push(this.getRandomChar(this.charSets.uppercase));
        }
        if (this.elements.includeLowercase.checked) {
            requiredChars.push(this.getRandomChar(this.charSets.lowercase));
        }
        if (this.elements.includeNumbers.checked) {
            requiredChars.push(this.getRandomChar(this.charSets.numbers));
        }
        if (this.elements.includeSymbols.checked) {
            requiredChars.push(this.getRandomChar(this.charSets.symbols));
        }

        // 生成剩余字符
        let password = '';
        const remainingLength = length - requiredChars.length;

        for (let i = 0; i < remainingLength; i++) {
            const randomIndex = await this.getSecureRandomInt(charset.length);
            password += charset[randomIndex];
        }

        // 添加必需字符并打乱顺序
        password += requiredChars.join('');
        password = this.shuffleString(password);

        // 更新UI
        this.elements.passwordOutput.value = password;
        this.elements.passwordOutput.placeholder = '生成的密码将显示在这里';
        this.updateStrength(password);
        this.updateStats(password);
    }

    // 获取随机字符（同步版本，用于必需字符）
    getRandomChar(charset) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        return charset[randomIndex];
    }

    // 打乱字符串
    shuffleString(str) {
        const arr = str.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
    }

    // 评估密码强度
    updateStrength(password) {
        if (!password) {
            this.elements.strengthText.textContent = '-';
            this.elements.strengthFill.className = 'strength-fill';
            this.elements.strengthScore.textContent = '0';
            return;
        }

        const score = this.calculateStrength(password);
        const { level, text } = this.getStrengthLevel(score);

        this.elements.strengthText.textContent = text;
        this.elements.strengthFill.className = `strength-fill ${level}`;
        this.elements.strengthScore.textContent = score;
    }

    // 计算密码强度分数
    calculateStrength(password) {
        let score = 0;
        const length = password.length;

        // 长度评分 (0-25分)
        if (length >= 8) score += 10;
        if (length >= 12) score += 5;
        if (length >= 16) score += 5;
        if (length >= 20) score += 5;

        // 字符类型评分 (0-40分)
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

        const typeCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;
        score += typeCount * 10;

        // 复杂度评分 (0-25分)
        const uniqueChars = new Set(password).size;
        const diversity = uniqueChars / length;
        score += Math.min(25, diversity * 25);

        // 模式检测 (扣分)
        const patterns = [
            /(.)\1{2,}/g,  // 重复字符
            /(012|123|234|345|456|567|678|789|890)/g,  // 连续数字
            /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/gi,  // 连续字母
            /(qwerty|asdfgh|zxcvbn)/gi  // 键盘模式
        ];

        patterns.forEach(pattern => {
            if (pattern.test(password)) {
                score -= 5;
            }
        });

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    // 获取强度等级
    getStrengthLevel(score) {
        if (score < 30) {
            return { level: 'weak', text: '弱' };
        } else if (score < 60) {
            return { level: 'medium', text: '中等' };
        } else if (score < 80) {
            return { level: 'strong', text: '强' };
        } else {
            return { level: 'very-strong', text: '非常强' };
        }
    }

    // 更新统计信息
    updateStats(password) {
        if (!password) {
            this.hideStats();
            return;
        }

        const stats = {
            length: password.length,
            uppercase: (password.match(/[A-Z]/g) || []).length,
            lowercase: (password.match(/[a-z]/g) || []).length,
            numbers: (password.match(/[0-9]/g) || []).length,
            symbols: (password.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g) || []).length
        };

        document.getElementById('statLength').textContent = stats.length;
        document.getElementById('statUppercase').textContent = stats.uppercase;
        document.getElementById('statLowercase').textContent = stats.lowercase;
        document.getElementById('statNumbers').textContent = stats.numbers;
        document.getElementById('statSymbols').textContent = stats.symbols;

        this.elements.statsSection.style.display = 'block';
    }

    hideStats() {
        this.elements.statsSection.style.display = 'none';
    }

    // 复制密码
    async copyPassword() {
        const password = this.elements.passwordOutput.value;
        if (!password) {
            return;
        }

        try {
            await navigator.clipboard.writeText(password);
            this.showCopyFeedback();
        } catch (err) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = password;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.showCopyFeedback();
            } catch (err) {
                console.error('复制失败:', err);
            }
            document.body.removeChild(textArea);
        }
    }

    // 显示复制反馈
    showCopyFeedback() {
        this.elements.copyFeedback.classList.add('show');
        setTimeout(() => {
            this.elements.copyFeedback.classList.remove('show');
        }, 2000);
    }

    // 切换密码可见性
    toggleVisibility() {
        const type = this.elements.passwordOutput.type === 'password' ? 'text' : 'password';
        this.elements.passwordOutput.type = type;
        const icon = this.elements.toggleVisibility.querySelector('.icon');
        icon.textContent = type === 'password' ? '👁️' : '🙈';
    }

    // 应用预设
    applyPreset(preset) {
        switch (preset) {
            case 'strong':
                this.elements.passwordLength.value = 16;
                this.elements.lengthValue.textContent = '16';
                this.elements.includeUppercase.checked = true;
                this.elements.includeLowercase.checked = true;
                this.elements.includeNumbers.checked = true;
                this.elements.includeSymbols.checked = true;
                this.elements.excludeSimilar.checked = false;
                this.elements.excludeAmbiguous.checked = false;
                break;
            case 'medium':
                this.elements.passwordLength.value = 12;
                this.elements.lengthValue.textContent = '12';
                this.elements.includeUppercase.checked = true;
                this.elements.includeLowercase.checked = true;
                this.elements.includeNumbers.checked = true;
                this.elements.includeSymbols.checked = false;
                this.elements.excludeSimilar.checked = false;
                this.elements.excludeAmbiguous.checked = false;
                break;
            case 'pin':
                this.elements.passwordLength.value = 6;
                this.elements.lengthValue.textContent = '6';
                this.elements.includeUppercase.checked = false;
                this.elements.includeLowercase.checked = false;
                this.elements.includeNumbers.checked = true;
                this.elements.includeSymbols.checked = false;
                this.elements.excludeSimilar.checked = false;
                this.elements.excludeAmbiguous.checked = false;
                break;
            case 'letters':
                this.elements.passwordLength.value = 16;
                this.elements.lengthValue.textContent = '16';
                this.elements.includeUppercase.checked = true;
                this.elements.includeLowercase.checked = true;
                this.elements.includeNumbers.checked = false;
                this.elements.includeSymbols.checked = false;
                this.elements.excludeSimilar.checked = false;
                this.elements.excludeAmbiguous.checked = false;
                break;
            case 'numbers':
                this.elements.passwordLength.value = 16;
                this.elements.lengthValue.textContent = '16';
                this.elements.includeUppercase.checked = false;
                this.elements.includeLowercase.checked = false;
                this.elements.includeNumbers.checked = true;
                this.elements.includeSymbols.checked = false;
                this.elements.excludeSimilar.checked = false;
                this.elements.excludeAmbiguous.checked = false;
                break;
        }
        this.generatePassword();
    }

    // 主题管理
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = this.elements.themeToggle.querySelector('.theme-icon');
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new PasswordGenerator();
});

