(function () {
    var overlay = document.getElementById('kai-overlay');
    var btn = document.getElementById('kai-fab');
    var closeBtn = document.getElementById('kai-close');
    var form = document.getElementById('kai-form');
    var input = document.getElementById('kai-input');
    var sendBtn = document.getElementById('kai-send');
    var messagesEl = document.getElementById('kai-messages');

    if (!overlay || !btn || !form || !input || !messagesEl) return;

    function openModal() {
        overlay.classList.add('kai-open');
        input.focus();
    }

    function closeModal() {
        overlay.classList.remove('kai-open');
    }

    function addMessage(content, role) {
        var div = document.createElement('div');
        div.className = 'kai-msg kai-msg-' + role;
        div.textContent = content;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addLoading() {
        var div = document.createElement('div');
        div.className = 'kai-msg kai-msg-loading';
        div.id = 'kai-loading';
        div.innerHTML = '<span class="kai-spinner"></span><span>Thinking...</span>';
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
    }

    function removeLoading() {
        var el = document.getElementById('kai-loading');
        if (el) el.remove();
    }

    function setLoading(loading) {
        sendBtn.disabled = loading;
        input.disabled = loading;
    }

    btn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text) return;

        input.value = '';
        addMessage(text, 'user');

        var loadingEl = addLoading();
        setLoading(true);

        try {
            var res = await fetch('/api/kai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message: text })
            });
            var data = await res.json();
            removeLoading();
            var reply = (data && data.text) ? data.text : (data && data.error ? data.error : 'Sorry, I could not respond.');
            addMessage(reply, 'ai');
        } catch (err) {
            removeLoading();
            addMessage('Network error. Please try again.', 'ai');
        } finally {
            setLoading(false);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }
    });
})();
