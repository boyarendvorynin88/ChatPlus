let currentUser = localStorage.getItem('chatwave_active_user') || '';
let currentChat = '';
let currentChatType = 'user';

let users = JSON.parse(localStorage.getItem('chatwave_users')) || {};
let messages = JSON.parse(localStorage.getItem('chatwave_messages')) || {};
let contacts = JSON.parse(localStorage.getItem('chatwave_contacts')) || {};
let blacklist = JSON.parse(localStorage.getItem('chatwave_blacklist')) || {};
let groups = JSON.parse(localStorage.getItem('chatwave_groups')) || {};

const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
const groupAvatar = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop';

function saveData() {
    localStorage.setItem('chatwave_users', JSON.stringify(users));
    localStorage.setItem('chatwave_messages', JSON.stringify(messages));
    localStorage.setItem('chatwave_contacts', JSON.stringify(contacts));
    localStorage.setItem('chatwave_blacklist', JSON.stringify(blacklist));
    localStorage.setItem('chatwave_groups', JSON.stringify(groups));
}

window.addEventListener('storage', function() {
    users = JSON.parse(localStorage.getItem('chatwave_users')) || {};
    messages = JSON.parse(localStorage.getItem('chatwave_messages')) || {};
    contacts = JSON.parse(localStorage.getItem('chatwave_contacts')) || {};
    blacklist = JSON.parse(localStorage.getItem('chatwave_blacklist')) || {};
    groups = JSON.parse(localStorage.getItem('chatwave_groups')) || {};
    
    if (currentUser) {
        updateProfileUI();
        renderContacts();
        renderChats();
        renderBlacklist();
        renderGroups();
        if (currentChat) openChat(currentChat, currentChatType);
    }
});

function getTime() {
    let d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

function getMsgKey(user1, user2) {
    let arr = [user1, user2].sort();
    return arr[0] + '_' + arr[1];
}

let btnLogin = document.getElementById('btnLogin');
let btnReg = document.getElementById('btnReg');
let btnGoReg = document.getElementById('btnGoReg');
let btnGoLogin = document.getElementById('btnGoLogin');
let authError = document.getElementById('authError');

if (currentUser && users[currentUser]) {
    startApp();
}

btnGoReg.addEventListener('click', () => {
    btnLogin.style.display = 'none';
    btnGoReg.style.display = 'none';
    btnReg.style.display = 'block';
    btnGoLogin.style.display = 'block';
    authError.textContent = '';
});

btnGoLogin.addEventListener('click', () => {
    btnLogin.style.display = 'block';
    btnGoReg.style.display = 'block';
    btnReg.style.display = 'none';
    btnGoLogin.style.display = 'none';
    authError.textContent = '';
});

btnReg.addEventListener('click', () => {
    let login = document.getElementById('authLogin').value.trim();
    let pass = document.getElementById('authPass').value.trim();
    if (!login || !pass) return authError.textContent = 'Заполните все поля';
    if (users[login]) return authError.textContent = 'Пользователь уже существует';
    
    users[login] = { password: pass, status: 'online', nickname: login, about: '', avatar: defaultAvatar };
    contacts[login] = [];
    blacklist[login] = [];
    saveData();
    authError.textContent = 'Успешная регистрация! Теперь войдите.';
    authError.style.color = '#2ecc71';
});

btnLogin.addEventListener('click', () => {
    let login = document.getElementById('authLogin').value.trim();
    let pass = document.getElementById('authPass').value.trim();
    if (!login || !pass) return authError.textContent = 'Заполните все поля';
    if (!users[login] || users[login].password !== pass) return authError.textContent = 'Неверный логин или пароль';
    
    currentUser = login;
    users[currentUser].status = 'online';
    localStorage.setItem('chatwave_active_user', currentUser);
    saveData();
    startApp();
});

function startApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'flex';
    document.getElementById('myStatus').value = users[currentUser].status || 'online';
    updateProfileUI();
    renderContacts();
    renderChats();
    renderBlacklist();
    renderGroups();
}

document.getElementById('btnLogout').addEventListener('click', () => {
    users[currentUser].status = 'offline';
    saveData();
    currentUser = '';
    currentChat = '';
    localStorage.removeItem('chatwave_active_user');
    location.reload();
});

document.getElementById('myStatus').addEventListener('change', function() {
    if (currentUser) {
        users[currentUser].status = this.value;
        saveData();
    }
});

let profileModal = document.getElementById('profileModal');
document.getElementById('btnEditProfile').addEventListener('click', () => {
    let u = users[currentUser];
    document.getElementById('profNickname').value = u.nickname || currentUser;
    document.getElementById('profAbout').value = u.about || '';
    document.getElementById('profAvatar').value = u.avatar === defaultAvatar ? '' : u.avatar;
    profileModal.style.display = 'flex';
});

document.getElementById('btnCloseProfile').addEventListener('click', () => {
    profileModal.style.display = 'none';
});

document.getElementById('btnSaveProfile').addEventListener('click', () => {
    let u = users[currentUser];
    u.nickname = document.getElementById('profNickname').value.trim() || currentUser;
    u.about = document.getElementById('profAbout').value.trim();
    let avatarUrl = document.getElementById('profAvatar').value.trim();
    u.avatar = avatarUrl ? avatarUrl : defaultAvatar;
    
    saveData();
    updateProfileUI();
    profileModal.style.display = 'none';
});

function updateProfileUI() {
    if(!currentUser || !users[currentUser]) return;
    let u = users[currentUser];
    document.getElementById('myName').textContent = u.nickname || currentUser;
    document.getElementById('myAvatar').src = u.avatar || defaultAvatar;
}

document.querySelectorAll('.stab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        ['Chats', 'Contacts', 'Groups', 'Black'].forEach(id => {
            document.getElementById('tab' + id).style.display = 'none';
        });
        let target = this.getAttribute('data-tab');
        document.getElementById('tab' + target.charAt(0).toUpperCase() + target.slice(1)).style.display = 'block';
    });
});

document.getElementById('btnAddContact').addEventListener('click', () => {
    let newName = document.getElementById('newContact').value.trim();
    if (newName === '' || newName === currentUser) return;
    if (!users[newName]) return alert('Пользователь не найден');
    if (blacklist[currentUser].includes(newName)) return alert('Пользователь в черном списке');
    if (!contacts[currentUser].includes(newName)) {
        contacts[currentUser].push(newName);
        saveData();
        renderContacts();
        renderChats();
    }
    document.getElementById('newContact').value = '';
});

function renderContacts() {
    let list = document.getElementById('contactList');
    list.innerHTML = '';
    (contacts[currentUser] || []).forEach(c => {
        let u = users[c] || {};
        let div = document.createElement('div');
        div.className = 'chat-item';
        div.innerHTML = `<img src="${u.avatar || defaultAvatar}" class="avatar-small"> <div class="chat-item-info"><div class="chat-item-name">${u.nickname || c}</div></div>`;
        div.addEventListener('click', () => openChat(c, 'user'));
        list.appendChild(div);
    });
}

function renderChats() {
    let list = document.getElementById('chatList');
    list.innerHTML = '';
    (contacts[currentUser] || []).forEach(c => {
        let u = users[c] || {};
        let div = document.createElement('div');
        div.className = 'chat-item';
        div.innerHTML = `<img src="${u.avatar || defaultAvatar}" class="avatar-small"> <div class="chat-item-info"><div class="chat-item-name">${u.nickname || c}</div><div class="chat-item-preview">Личные сообщения</div></div><div class="status-dot status-${u.status || 'offline'}"></div>`;
        div.addEventListener('click', () => openChat(c, 'user'));
        list.appendChild(div);
    });
}

function renderBlacklist() {
    let list = document.getElementById('blackList');
    list.innerHTML = '';
    (blacklist[currentUser] || []).forEach(c => {
        let u = users[c] || {};
        let div = document.createElement('div');
        div.className = 'chat-item';
        div.innerHTML = `
            <img src="${u.avatar || defaultAvatar}" class="avatar-small"> 
            <div class="chat-item-info"><div class="chat-item-name">${u.nickname || c}</div></div>
            <button class="btn-unblock">Разблокировать</button>
        `;
        div.querySelector('.btn-unblock').addEventListener('click', (e) => {
            e.stopPropagation();
            blacklist[currentUser] = blacklist[currentUser].filter(name => name !== c);
            contacts[currentUser].push(c);0
            saveData();
            renderBlacklist();
            renderContacts();
            renderChats();
        });
        list.appendChild(div);
    });
}

document.getElementById('btnBlock').addEventListener('click', () => {
    if (!currentChat || currentChatType === 'group') return;
    if (!blacklist[currentUser].includes(currentChat)) {
        blacklist[currentUser].push(currentChat);
        contacts[currentUser] = contacts[currentUser].filter(u => u !== currentChat);
        saveData();
        renderContacts();
        renderChats();
        renderBlacklist();
        document.getElementById('chatWindow').style.display = 'none';
        document.getElementById('noChatSelected').style.display = 'flex';
        currentChat = '';
    }
});

document.getElementById('btnCreateGroup').addEventListener('click', () => {
    let gName = document.getElementById('newGroup').value.trim();
    if (!gName) return;
    if (!groups[gName]) {
        groups[gName] = { name: gName };
        saveData();
        renderGroups();
    }
    document.getElementById('newGroup').value = '';
});

function renderGroups() {
    let list = document.getElementById('groupList');
    list.innerHTML = '';
    Object.keys(groups).forEach(gName => {
        let div = document.createElement('div');
        div.className = 'chat-item';
        div.innerHTML = `<img src="${groupAvatar}" class="avatar-small"> <div class="chat-item-info"><div class="chat-item-name">${gName}</div><div class="chat-item-preview">Общая группа</div></div>`;
        div.addEventListener('click', () => openChat(gName, 'group'));
        list.appendChild(div);
    });
}

function openChat(target, type = 'user') {
    currentChat = target;
    currentChatType = type;
    
    document.getElementById('noChatSelected').style.display = 'none';
    document.getElementById('chatWindow').style.display = 'flex';
    
    if (type === 'user') {
        let u = users[currentChat] || {};
        document.getElementById('chatName').textContent = u.nickname || currentChat;
        document.getElementById('chatAbout').textContent = u.about || 'Статус: ' + (u.status || 'offline');
        document.getElementById('chatAvatar').src = u.avatar || defaultAvatar;
        document.getElementById('btnBlock').style.display = 'inline-block';
    } else if (type === 'group') {
        document.getElementById('chatName').textContent = currentChat;
        document.getElementById('chatAbout').textContent = 'Групповой чат';
        document.getElementById('chatAvatar').src = groupAvatar;
        document.getElementById('btnBlock').style.display = 'none';
    }
    renderMessages();
}

function renderMessages() {
    if (!currentChat) return;
    let key = currentChatType === 'group' ? 'group_' + currentChat : getMsgKey(currentUser, currentChat);
    let msgs = messages[key] || [];
    let container = document.getElementById('messages');
    container.innerHTML = '';
    msgs.forEach(m => {
        let div = document.createElement('div');
        div.className = 'msg ' + (m.from === currentUser ? 'msg-out' : 'msg-in');
        
        let senderHtml = '';
        if (currentChatType === 'group' && m.from !== currentUser) {
            let senderName = (users[m.from] && users[m.from].nickname) ? users[m.from].nickname : m.from;
            senderHtml = `<div class="msg-sender">${senderName}</div>`;
        }
        
        div.innerHTML = senderHtml + (m.file ? `📎 ${m.text}` : m.text) + `<div class="msg-time">${m.time}</div>`;
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    let text = document.getElementById('msgInput').value.trim();
    if (!text || !currentChat) return;
    let key = currentChatType === 'group' ? 'group_' + currentChat : getMsgKey(currentUser, currentChat);
    if (!messages[key]) messages[key] = [];
    messages[key].push({ from: currentUser, text: text, time: getTime() });
    saveData();
    document.getElementById('msgInput').value = '';
    renderMessages();
}

document.getElementById('btnSend').addEventListener('click', sendMessage);
document.getElementById('msgInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

document.getElementById('btnEmoji').addEventListener('click', () => {
    let p = document.getElementById('emojiPicker');
    p.style.display = p.style.display === 'none' ? 'flex' : 'none';
});

document.querySelectorAll('.emoji-picker span').forEach(s => {
    s.addEventListener('click', () => {
        document.getElementById('msgInput').value += s.textContent;
        document.getElementById('emojiPicker').style.display = 'none';
    });
});

document.getElementById('fileInput').addEventListener('change', function() {
    let file = this.files[0];
    if (!file || !currentChat) return;
    let key = currentChatType === 'group' ? 'group_' + currentChat : getMsgKey(currentUser, currentChat);
    if (!messages[key]) messages[key] = [];
    messages[key].push({ from: currentUser, text: file.name, time: getTime(), file: true });
    saveData();
    renderMessages();
    this.value = '';
});

document.getElementById('btnDeleteChat').addEventListener('click', () => {
    if (!currentChat) return;
    let key = currentChatType === 'group' ? 'group_' + currentChat : getMsgKey(currentUser, currentChat);
    messages[key] = [];
    saveData();
    renderMessages();
});