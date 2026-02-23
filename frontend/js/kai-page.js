(function () {
    var STORAGE_KEY = 'kodbank_kai_chats';
    var CURRENT_CHAT_KEY = 'kodbank_kai_current';

    var messagesWrap = document.getElementById('kai-messages-wrap');
    var greeting = document.getElementById('kai-greeting');
    var messagesEl = document.getElementById('kai-messages');
    var form = document.getElementById('kai-form');
    var input = document.getElementById('kai-input');
    var sendBtn = document.getElementById('kai-send');
    var btnNew = document.getElementById('kai-btn-new');
    var chatList = document.getElementById('kai-chat-list');
    var searchInput = document.getElementById('kai-search');

    function getChats() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (_) {
            return [];
        }
    }

    function saveChats(chats) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
        } catch (_) {}
    }

    function getCurrentChat() {
        try {
            var raw = localStorage.getItem(CURRENT_CHAT_KEY);
            return raw ? JSON.parse(raw) : { id: null, messages: [], title: 'New chat' };
        } catch (_) {
            return { id: null, messages: [], title: 'New chat' };
        }
    }

    function setCurrentChat(chat) {
        try {
            localStorage.setItem(CURRENT_CHAT_KEY, JSON.stringify(chat));
        } catch (_) {}
    }

    function generateId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    }

    function titleFromMessages(messages) {
        for (var i = 0; i < messages.length; i++) {
            if (messages[i].role === 'user' && messages[i].content) {
                var t = messages[i].content.trim().slice(0, 40);
                return t || 'New chat';
            }
        }
        return 'New chat';
    }

    function renderChatList() {
        var chats = getChats();
        if (!chatList) return;
        chatList.innerHTML = '';
        chats.forEach(function (c) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'kai-chat-item';
            btn.textContent = c.title || 'Chat';
            btn.dataset.id = c.id;
            btn.addEventListener('click', function () {
                loadChat(c.id);
            });
            chatList.appendChild(btn);
        });
    }

    function loadChat(id) {
        var chats = getChats();
        var chat = chats.find(function (c) { return c.id === id; });
        if (chat) {
            setCurrentChat({ id: chat.id, messages: chat.messages || [], title: chat.title });
            renderMessages(chat.messages || []);
        }
    }

    function addToChatHistory(chat) {
        var chats = getChats();
        var idx = chats.findIndex(function (c) { return c.id === chat.id; });
        if (idx >= 0) {
            chats[idx] = chat;
        } else {
            chats.unshift(chat);
        }
        if (chats.length > 50) chats = chats.slice(0, 50);
        saveChats(chats);
        renderChatList();
    }

    function renderMessages(messages) {
        if (!messagesEl) return;
        messagesEl.innerHTML = '';
        if (messages.length === 0) {
            if (messagesWrap) messagesWrap.classList.remove('has-messages');
            return;
        }
        if (messagesWrap) messagesWrap.classList.add('has-messages');
        messages.forEach(function (m) {
            var block = document.createElement('div');
            block.className = 'kai-msg-block ' + m.role;
            var bubble = document.createElement('div');
            bubble.className = 'kai-msg-bubble';
            bubble.textContent = m.content || '';
            block.appendChild(bubble);
            messagesEl.appendChild(block);
        });
        messagesEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    function addMessage(role, content) {
        if (!messagesEl) return;
        var block = document.createElement('div');
        block.className = 'kai-msg-block ' + role;
        var bubble = document.createElement('div');
        bubble.className = 'kai-msg-bubble';
        bubble.textContent = content;
        block.appendChild(bubble);
        messagesEl.appendChild(block);
        if (messagesWrap) messagesWrap.classList.add('has-messages');
        if (greeting) greeting.style.display = 'none';
        messagesEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    function addLoading() {
        if (!messagesEl) return;
        var block = document.createElement('div');
        block.className = 'kai-msg-block ai';
        block.id = 'kai-loading-block';
        block.innerHTML = '<div class="kai-msg-loading-bubble"><span class="kai-spinner"></span><span>Thinking...</span></div>';
        messagesEl.appendChild(block);
        messagesEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    function removeLoading() {
        var el = document.getElementById('kai-loading-block');
        if (el) el.remove();
    }

    function setLoading(loading) {
        if (sendBtn) sendBtn.disabled = loading;
        if (input) input.disabled = loading;
    }

    if (btnNew) {
        btnNew.addEventListener('click', function () {
            setCurrentChat({ id: generateId(), messages: [], title: 'New chat' });
            if (messagesEl) messagesEl.innerHTML = '';
            if (messagesWrap) messagesWrap.classList.remove('has-messages');
            if (greeting) greeting.style.display = 'flex';
        });
    }

    if (searchInput && chatList) {
        searchInput.addEventListener('input', function () {
            var q = searchInput.value.trim().toLowerCase();
            var items = chatList.querySelectorAll('.kai-chat-item');
            items.forEach(function (item) {
                var title = (item.textContent || '').toLowerCase();
                item.style.display = q && title.indexOf(q) === -1 ? 'none' : 'block';
            });
        });
    }

    if (form && input) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            var text = input.value.trim();
            if (!text) return;

            input.value = '';
            var current = getCurrentChat();
            if (!current.id) current.id = generateId();
            current.messages = current.messages || [];
            current.messages.push({ role: 'user', content: text });
            setCurrentChat(current);

            addMessage('user', text);
            addLoading();
            setLoading(true);

            try {
                var apiUrl = window.location.origin + '/api/kai-chat';
                var res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ message: text })
                });
                var data = await res.json();
                removeLoading();
                var reply = (data && data.text) ? data.text : (data && data.error ? data.error : 'Sorry, I could not respond.');
                current.messages.push({ role: 'ai', content: reply });
                current.title = titleFromMessages(current.messages);
                setCurrentChat(current);
                addToChatHistory(current);
                addMessage('ai', reply);
            } catch (err) {
                removeLoading();
                var errMsg = 'Network error. Please try again.';
                current.messages.push({ role: 'ai', content: errMsg });
                setCurrentChat(current);
                addMessage('ai', errMsg);
            } finally {
                setLoading(false);
                if (messagesEl) messagesEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        });
    }

    (function init() {
        renderChatList();
        var current = getCurrentChat();
        if (current.messages && current.messages.length > 0) {
            renderMessages(current.messages);
        } else {
            if (greeting) greeting.style.display = 'flex';
        }
    })();
})();
