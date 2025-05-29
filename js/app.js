// 定义类别数据
const categories = {
    expense: [
        { id: 'food', name: '餐饮', icon: 'fas fa-utensils' },
        { id: 'shopping', name: '购物', icon: 'fas fa-shopping-bag' },
        { id: 'transport', name: '交通', icon: 'fas fa-bus' },
        { id: 'entertainment', name: '娱乐', icon: 'fas fa-film' },
        { id: 'health', name: '医疗健康', icon: 'fas fa-heartbeat' },
        { id: 'education', name: '教育', icon: 'fas fa-book' },
        { id: 'bills', name: '账单', icon: 'fas fa-file-invoice' },
        { id: 'other-expense', name: '其他支出', icon: 'fas fa-ellipsis-h' }
    ],
    income: [
        { id: 'salary', name: '工资', icon: 'fas fa-money-check-alt' },
        { id: 'bonus', name: '奖金', icon: 'fas fa-gift' },
        { id: 'gift', name: '礼金', icon: 'fas fa-donate' },
        { id: 'other-income', name: '其他收入', icon: 'fas fa-ellipsis-h' }
    ]
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 初始化日期选择器为今天
    const today = new Date();
    document.getElementById('transactionDate').valueAsDate = today;
    
    // 初始化当前月份显示
    updateCurrentMonthDisplay(today);
    
    // 从本地存储加载交易数据
    loadTransactions();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化类别选择器
    populateCategorySelect('expense');
});

// 设置事件监听器
function setupEventListeners() {
    // 添加交易按钮
    document.getElementById('addTransactionBtn').addEventListener('click', function() {
        document.getElementById('addTransactionModal').style.display = 'block';
    });
    
    // 快速记账按钮
    document.getElementById('quickAddBtn').addEventListener('click', function() {
        document.getElementById('quickAddModal').style.display = 'block';
    });
    
    // 关闭模态框
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('addTransactionModal').style.display = 'none';
            document.getElementById('quickAddModal').style.display = 'none';
            document.getElementById('editTransactionModal').style.display = 'none';
            // 重置表单
            document.getElementById('transactionForm').reset();
            document.getElementById('quickAddForm').reset();
            resetPreview();
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('addTransactionModal')) {
            document.getElementById('addTransactionModal').style.display = 'none';
            document.getElementById('transactionForm').reset();
        }
        if (event.target === document.getElementById('quickAddModal')) {
            document.getElementById('quickAddModal').style.display = 'none';
            document.getElementById('quickAddForm').reset();
            resetPreview();
        }
        if (event.target === document.getElementById('editTransactionModal')) {
            document.getElementById('editTransactionModal').style.display = 'none';
            document.getElementById('editTransactionForm').reset();
        }
    });
    
    // 交易类型切换
    const transactionTypeRadios = document.querySelectorAll('input[name="transactionType"]');
    transactionTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            populateCategorySelect(this.value);
        });
    });
    
    // 编辑交易类型切换
    const editTransactionTypeRadios = document.querySelectorAll('input[name="editTransactionType"]');
    editTransactionTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            populateEditCategorySelect(this.value);
        });
    });
    
    // 提交表单
    document.getElementById('transactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addTransaction();
    });
    
    // 快速记账表单
    document.getElementById('quickAddForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addQuickTransaction();
    });
    
    // 编辑交易表单
    document.getElementById('editTransactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateTransaction();
    });
    
    // 快速记账文本输入实时解析
    document.getElementById('quickAddText').addEventListener('input', function() {
        parseQuickAddText(this.value);
    });
    
    // 月份切换
    document.getElementById('prevMonth').addEventListener('click', function() {
        changeMonth(-1);
    });
    
    document.getElementById('nextMonth').addEventListener('click', function() {
        changeMonth(1);
    });
}

// 填充类别选择器
function populateCategorySelect(type) {
    const select = document.getElementById('transactionCategory');
    select.innerHTML = '<option value="" disabled selected>选择类别</option>';
    
    categories[type].forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

// 添加交易
function addTransaction() {
    const text = document.getElementById('transactionText').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const type = document.querySelector('input[name="transactionType"]:checked').value;
    const categoryId = document.getElementById('transactionCategory').value;
    const date = document.getElementById('transactionDate').value;
    
    // 自动分类逻辑
    let autoCategory = categoryId;
    if (!categoryId) {
        autoCategory = autoClassifyTransaction(text, type);
    }
    
    const transaction = {
        id: generateID(),
        text,
        amount,
        type,
        category: autoCategory,
        date
    };
    
    // 保存到本地存储
    saveTransaction(transaction);
    
    // 重新加载交易列表
    loadTransactions();
    
    // 重置表单并关闭模态框
    document.getElementById('transactionForm').reset();
    document.getElementById('addTransactionModal').style.display = 'none';
    
    // 重新设置日期为今天
    document.getElementById('transactionDate').valueAsDate = new Date();
    
    // 重新设置类别选择器为支出
    populateCategorySelect('expense');
}

// 自动分类交易
function autoClassifyTransaction(text, type) {
    // 扩展的关键词匹配逻辑
    const keywords = {
        expense: {
            food: [
                '餐', '饭', '吃', '菜', '食', '奶茶', '咖啡', '早餐', '午餐', '晚餐', '宵夜', '零食', '水果',
                '外卖', '点餐', '下馆子', '火锅', '烧烤', '小吃', '甜点', '饮料', '饮品', '冰淇淋', '蛋糕',
                '面包', '牛奶', '酸奶', '茶', '饼干', '巧克力', '糖果', '快餐', '自助餐', '食堂', '超市'
            ],
            shopping: [
                '买', '购', '衣', '裤', '鞋', '包', '装', '饰', '电器', '数码', '家居', '家居', '日用品',
                '超市', '商场', '网购', '淘宝', '京东', '拼多多', '服装', '服饰', '化妆品', '护肤品',
                '美妆', '首饰', '手表', '眼镜', '电子产品', '手机', '电脑', '平板', '耳机', '充电器',
                '充电宝', '相机', '家电', '洗衣机', '冰箱', '空调', '电视', '微波炉', '电饭煲'
            ],
            transport: [
                '车', '公交', '地铁', '出租', '打车', '高铁', '火车', '机票', '油费', '停车', '加油',
                '滴滴', '顺风车', '共享单车', '摩拜', '哈啰', '公共交通', '交通卡', '月票', '汽车',
                '修车', '保养', '洗车', '过路费', '过桥费', '高速费', '违章罚款', '车险', '车票'
            ],
            entertainment: [
                '电影', '游戏', '玩', '唱歌', 'KTV', '酒吧', '旅游', '景点', '门票', '演唱会', '音乐会',
                '展览', '博物馆', '美术馆', '剧院', '电玩', '网吧', '桌游', '密室逃脱', '健身', '游泳',
                '健身房', '瑜伽', '舞蹈', '跑步', '爬山', '露营', '钓鱼', '聚会', '派对', '酒', '烟'
            ],
            health: [
                '医', '药', '病', '诊', '保健', '体检', '看病', '挂号', '住院', '手术', '检查', '化验',
                '医院', '诊所', '医生', '护士', '药店', '药房', '处方', '非处方', '保健品', '维生素',
                '营养品', '口罩', '消毒', '理疗', '按摩', '针灸', '推拿', '中医', '西医', '牙医', '眼科'
            ],
            education: [
                '书', '课', '学', '培训', '教育', '辅导', '学费', '学校', '大学', '考试', '考证', '证书',
                '文具', '笔', '本', '纸', '打印', '复印', '资料', '教材', '教辅', '字典', '词典', '工具书',
                '网课', '线上课程', '补习', '家教', '学习软件', '学习APP', '图书馆', '书店', '文化用品'
            ],
            bills: [
                '水费', '电费', '煤气', '宽带', '话费', '房租', '物业', '燃气费', '暖气费', '网费',
                '手机费', '电话费', '网络费', '通讯费', '有线电视', '物业费', '管理费', '停车费',
                '维修费', '保洁费', '垃圾费', '保安费', '供暖费', '冷气费', '水电费', '燃气费'
            ]
        },
        income: {
            salary: [
                '工资', '薪水', '薪资', '月薪', '周薪', '日薪', '时薪', '基本工资', '绩效工资',
                '加班费', '津贴', '补贴', '补助', '工钱', '酬劳', '劳务费', '稿费', '讲课费', '咨询费'
            ],
            bonus: [
                '奖金', '奖励', '提成', '分红', '年终奖', '季度奖', '月度奖', '项目奖', '绩效奖',
                '销售提成', '业绩奖', '佣金', '返利', '分成', '股息', '利息', '投资收益', '理财收益'
            ],
            gift: [
                '礼金', '红包', '压岁钱', '礼物', '赠品', '中奖', '彩票', '抽奖', '赠送', '馈赠',
                '祝贺', '祝福', '贺礼', '贺金', '喜钱', '喜金', '随礼', '随份子', '份子钱'
            ]
        }
    };
    
    // 计算每个类别的匹配分数
    const scores = {};
    for (const categoryId in keywords[type]) {
        scores[categoryId] = 0;
        for (const keyword of keywords[type][categoryId]) {
            if (text.includes(keyword)) {
                // 如果关键词出现在文本开头，给予更高的分数
                if (text.indexOf(keyword) < 5) {
                    scores[categoryId] += 2;
                } else {
                    scores[categoryId] += 1;
                }
            }
        }
    }
    
    // 找出得分最高的类别
    let maxScore = 0;
    let bestCategory = type === 'expense' ? 'other-expense' : 'other-income';
    
    for (const categoryId in scores) {
        if (scores[categoryId] > maxScore) {
            maxScore = scores[categoryId];
            bestCategory = categoryId;
        }
    }
    
    return bestCategory;
}

// 生成唯一ID
function generateID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 保存交易到本地存储
function saveTransaction(transaction) {
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// 从本地存储加载交易
function loadTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const currentDate = getCurrentMonthDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // 筛选当前月份的交易
    const monthTransactions = transactions.filter(transaction => {
        const transDate = new Date(transaction.date);
        return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
    });
    
    // 更新摘要信息
    updateSummary(monthTransactions);
    
    // 渲染交易列表
    renderTransactionsList(monthTransactions);
}

// 更新摘要信息
function updateSummary(transactions) {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
        
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
        
    const balance = totalIncome - totalExpense;
    
    document.getElementById('totalIncome').textContent = `¥${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpense').textContent = `¥${totalExpense.toFixed(2)}`;
    document.getElementById('totalBalance').textContent = `¥${balance.toFixed(2)}`;
    
    // 设置结余颜色
    const balanceElement = document.getElementById('totalBalance');
    if (balance > 0) {
        balanceElement.className = 'amount income';
    } else if (balance < 0) {
        balanceElement.className = 'amount expense';
    } else {
        balanceElement.className = 'amount';
    }
}

// 渲染交易列表
function renderTransactionsList(transactions) {
    const transactionsList = document.getElementById('transactionsList');
    transactionsList.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>本月还没有记录，点击下方 + 按钮添加</p>
            </div>
        `;
        return;
    }
    
    // 按日期降序排序
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    transactions.forEach(transaction => {
        const categoryInfo = getCategoryInfo(transaction.category, transaction.type);
        const date = new Date(transaction.date);
        const formattedDate = `${date.getMonth() + 1}月${date.getDate()}日`;
        
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        transactionElement.dataset.id = transaction.id;
        transactionElement.innerHTML = `
            <div class="transaction-icon category-${transaction.category}">
                <i class="${categoryInfo.icon}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-title">${transaction.text}</div>
                <div class="transaction-category">${categoryInfo.name}</div>
            </div>
            <div class="transaction-amount ${transaction.type === 'income' ? 'income' : 'expense'}">
                ${transaction.type === 'income' ? '+' : '-'}¥${transaction.amount.toFixed(2)}
            </div>
            <div class="transaction-date">${formattedDate}</div>
            <div class="transaction-actions">
                <button class="edit-btn" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        transactionsList.appendChild(transactionElement);
        
        // 添加编辑和删除按钮的事件监听器
        transactionElement.querySelector('.edit-btn').addEventListener('click', function() {
            editTransaction(transaction.id);
        });
        
        transactionElement.querySelector('.delete-btn').addEventListener('click', function() {
            if (confirm('确定要删除这条记录吗？')) {
                deleteTransaction(transaction.id);
            }
        });
    });
}

// 获取类别信息
function getCategoryInfo(categoryId, type) {
    const category = categories[type].find(cat => cat.id === categoryId);
    return category || { name: '未分类', icon: 'fas fa-question' };
}

// 更新当前月份显示
function updateCurrentMonthDisplay(date) {
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const currentMonthElement = document.getElementById('currentMonth');
    currentMonthElement.textContent = `${date.getFullYear()}年 ${monthNames[date.getMonth()]}`;
    
    // 保存当前显示的月份到本地存储
    localStorage.setItem('currentMonth', JSON.stringify({
        month: date.getMonth(),
        year: date.getFullYear()
    }));
}

// 获取当前显示的月份日期
function getCurrentMonthDate() {
    const savedMonth = JSON.parse(localStorage.getItem('currentMonth'));
    if (savedMonth) {
        const date = new Date();
        date.setMonth(savedMonth.month);
        date.setFullYear(savedMonth.year);
        return date;
    }
    return new Date();
}

// 切换月份
function changeMonth(delta) {
    const currentDate = getCurrentMonthDate();
    currentDate.setMonth(currentDate.getMonth() + delta);
    updateCurrentMonthDisplay(currentDate);
    loadTransactions();
}

// 解析快速记账文本
function parseQuickAddText(text) {
    // 重置预览
    resetPreview();
    
    if (!text.trim()) return;
    
    // 增强的解析逻辑
    // 1. 尝试提取金额 - 支持多种格式
    let amountMatch = text.match(/\d+(\.\d+)?元?/); // 匹配数字后可能跟着"元"
    let amount = 0;
    let amountText = '';
    
    if (amountMatch) {
        amountText = amountMatch[0];
        // 去掉可能的"元"字
        amount = parseFloat(amountText.replace('元', ''));
    } else {
        // 尝试匹配中文数字
        const chineseNums = {
            '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
            '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
            '百': 100, '千': 1000, '万': 10000
        };
        
        const chineseNumPattern = /[一二三四五六七八九十百千万]+元?/;
        const chineseMatch = text.match(chineseNumPattern);
        
        if (chineseMatch) {
            amountText = chineseMatch[0];
            // 简单处理中文数字转换（仅处理简单情况）
            const numText = amountText.replace('元', '');
            if (numText.length === 1 && chineseNums[numText]) {
                amount = chineseNums[numText];
            } else if (numText === '十') {
                amount = 10;
            } else if (numText.startsWith('十') && numText.length === 2) {
                amount = 10 + chineseNums[numText[1]];
            } else if (numText.length === 2 && numText.endsWith('十')) {
                amount = chineseNums[numText[0]] * 10;
            }
        }
    }
    
    // 2. 尝试提取日期
    let date = new Date().toISOString().split('T')[0]; // 默认为今天
    let dateText = '';
    let dateMatch = null;
    
    // 匹配常见的日期格式
    // 1. 年-月-日 格式 (2023-01-01, 2023/01/01)
    dateMatch = text.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (dateMatch) {
        const year = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1; // 月份从0开始
        const day = parseInt(dateMatch[3]);
        const dateObj = new Date(year, month, day);
        if (!isNaN(dateObj.getTime())) {
            date = dateObj.toISOString().split('T')[0];
            dateText = dateMatch[0];
        }
    } else {
        // 2. 月-日 格式 (01-01, 01/01, 1-1, 1/1)
        dateMatch = text.match(/(?<!\d)(\d{1,2})[-\/](\d{1,2})(?!\d)/);
        if (dateMatch) {
            const currentYear = new Date().getFullYear();
            const month = parseInt(dateMatch[1]) - 1; // 月份从0开始
            const day = parseInt(dateMatch[2]);
            if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
                const dateObj = new Date(currentYear, month, day);
                if (!isNaN(dateObj.getTime())) {
                    date = dateObj.toISOString().split('T')[0];
                    dateText = dateMatch[0];
                }
            }
        } else {
            // 3. 中文日期格式 (今天, 昨天, 前天, X月X日)
            if (text.includes('今天')) {
                const today = new Date();
                date = today.toISOString().split('T')[0];
                dateText = '今天';
            } else if (text.includes('昨天')) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                date = yesterday.toISOString().split('T')[0];
                dateText = '昨天';
            } else if (text.includes('前天')) {
                const dayBeforeYesterday = new Date();
                dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
                date = dayBeforeYesterday.toISOString().split('T')[0];
                dateText = '前天';
            } else {
                // 4. X月X日格式
                dateMatch = text.match(/(\d{1,2})月(\d{1,2})日/);
                if (dateMatch) {
                    const currentYear = new Date().getFullYear();
                    const month = parseInt(dateMatch[1]) - 1; // 月份从0开始
                    const day = parseInt(dateMatch[2]);
                    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
                        const dateObj = new Date(currentYear, month, day);
                        if (!isNaN(dateObj.getTime())) {
                            date = dateObj.toISOString().split('T')[0];
                            dateText = dateMatch[0];
                        }
                    }
                }
            }
        }
    }
    
    // 3. 判断收支类型
    // 收入关键词
    const incomeKeywords = ['收入', '工资', '薪水', '薪资', '奖金', '收红包', '收到红包', '得到红包', '报销', '退款', '转入', '收款', '借入'];
    // 支出关键词
    const expenseKeywords = ['支出', '花费', '消费', '买', '购', '付款', '付', '交', '缴', '还款', '转出', '借出', '发红包', '给红包', '发了红包'];
    
    let type = 'expense'; // 默认为支出
    
    // 先检查是否是发红包（支出）
    if (text.includes('发红包') || text.includes('给红包') || text.includes('发了红包')) {
        type = 'expense';
    }
    // 如果不是发红包，再检查是否包含其他收入关键词
    else {
        // 检查是否包含收入关键词
        for (const keyword of incomeKeywords) {
            if (text.includes(keyword)) {
                type = 'income';
                break;
            }
        }
        
        // 如果没有判断为收入，再检查是否明确包含支出关键词
        if (type !== 'income') {
            let hasExpenseKeyword = false;
            for (const keyword of expenseKeywords) {
                if (text.includes(keyword)) {
                    hasExpenseKeyword = true;
                    break;
                }
            }
            // 如果没有明确的支出关键词，再根据上下文判断
            if (!hasExpenseKeyword) {
                // 如果文本中包含类别关键词，也可能是支出
                for (const category of categories.expense) {
                    if (text.includes(category.name)) {
                        hasExpenseKeyword = true;
                        break;
                    }
                }
            }
            // 最终确定类型
            type = hasExpenseKeyword ? 'expense' : type;
        }
    }
    
    // 4. 根据文本内容识别类别
    const category = autoClassifyTransaction(text, type);
    const categoryInfo = getCategoryInfo(category, type);
    
    // 5. 生成描述 (去掉金额和日期部分)
    let description = text;
    if (amountText) {
        description = description.replace(amountText, '').trim();
    }
    if (dateText) {
        description = description.replace(dateText, '').trim();
    }
    
    // 如果描述为空，使用类别名称
    if (!description) {
        description = categoryInfo.name;
    }
    
    // 更新预览
    document.getElementById('previewType').textContent = type === 'income' ? '收入' : '支出';
    document.getElementById('previewAmount').textContent = `¥${amount.toFixed(2)}`;
    document.getElementById('previewCategory').textContent = categoryInfo.name;
    document.getElementById('previewDescription').textContent = description;
    
    // 格式化日期显示
    const dateObj = new Date(date);
    const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
    document.getElementById('previewDate').textContent = formattedDate;
    
    // 设置预览颜色
    const amountElement = document.getElementById('previewAmount');
    if (type === 'income') {
        amountElement.className = 'preview-value income';
    } else {
        amountElement.className = 'preview-value expense';
    }
    
    return { type, amount, category, description, date };
}

// 重置预览
function resetPreview() {
    document.getElementById('previewType').textContent = '支出';
    document.getElementById('previewAmount').textContent = '¥0.00';
    document.getElementById('previewCategory').textContent = '未识别';
    document.getElementById('previewDescription').textContent = '';
    document.getElementById('previewDate').textContent = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('previewAmount').className = 'preview-value';
}

// 添加快速交易
function addQuickTransaction() {
    const text = document.getElementById('quickAddText').value.trim();
    
    if (!text) {
        alert('请输入记账内容');
        return;
    }
    
    // 使用解析函数获取交易信息
    const transactionInfo = parseQuickAddText(text);
    
    if (!transactionInfo || transactionInfo.amount <= 0) {
        alert('无法识别金额，请检查输入');
        return;
    }
    
    // 创建交易对象
    const transaction = {
        id: generateID(),
        text: transactionInfo.description,
        amount: transactionInfo.amount,
        type: transactionInfo.type,
        category: transactionInfo.category,
        date: transactionInfo.date // 使用提取的日期，如果没有则默认为今天
    };
    
    // 保存到本地存储
    saveTransaction(transaction);
    
    // 重新加载交易列表
    loadTransactions();
    
    // 重置表单并关闭模态框
    document.getElementById('quickAddForm').reset();
    document.getElementById('quickAddModal').style.display = 'none';
    resetPreview();
    
    // 显示成功提示
    alert('记账成功！');
}

// 删除交易（可以在未来版本实现）
function deleteTransaction(id) {
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions = transactions.filter(transaction => transaction.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    loadTransactions();
}

// 填充编辑类别选择器
function populateEditCategorySelect(type) {
    const select = document.getElementById('editTransactionCategory');
    select.innerHTML = '<option value="" disabled selected>选择类别</option>';
    
    categories[type].forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

// 编辑交易
function editTransaction(id) {
    // 从本地存储获取交易数据
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const transaction = transactions.find(t => t.id === id);
    
    if (!transaction) return;
    
    // 填充表单
    document.getElementById('editTransactionId').value = transaction.id;
    document.getElementById('editTransactionText').value = transaction.text;
    document.getElementById('editTransactionAmount').value = transaction.amount;
    document.getElementById('editTransactionDate').value = transaction.date;
    
    // 设置交易类型
    const typeRadio = document.querySelector(`input[name="editTransactionType"][value="${transaction.type}"]`);
    if (typeRadio) {
        typeRadio.checked = true;
    }
    
    // 填充类别选择器
    populateEditCategorySelect(transaction.type);
    
    // 设置类别
    setTimeout(() => {
        document.getElementById('editTransactionCategory').value = transaction.category;
    }, 0);
    
    // 显示模态框
    document.getElementById('editTransactionModal').style.display = 'block';
}

// 更新交易
function updateTransaction() {
    const id = document.getElementById('editTransactionId').value;
    const text = document.getElementById('editTransactionText').value;
    const amount = parseFloat(document.getElementById('editTransactionAmount').value);
    const type = document.querySelector('input[name="editTransactionType"]:checked').value;
    const categoryId = document.getElementById('editTransactionCategory').value;
    const date = document.getElementById('editTransactionDate').value;
    
    // 从本地存储获取交易数据
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    
    // 查找并更新交易
    const index = transactions.findIndex(t => t.id === id);
    
    if (index !== -1) {
        transactions[index] = {
            ...transactions[index],
            text,
            amount,
            type,
            category: categoryId,
            date
        };
        
        // 保存到本地存储
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        // 重新加载交易列表
        loadTransactions();
        
        // 关闭模态框
        document.getElementById('editTransactionModal').style.display = 'none';
        document.getElementById('editTransactionForm').reset();
        
        // 显示成功提示
        alert('修改成功！');
    }
}

// 删除交易
function deleteTransaction(id) {
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions = transactions.filter(transaction => transaction.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    loadTransactions();
    
    // 显示成功提示
    alert('删除成功！');
}