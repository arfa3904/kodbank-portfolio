const express = require('express');
const router = express.Router();

const HF_API_KEY = process.env.HF_API_KEY;
const MODELS = [
    'google/flan-t5-small',
    'google/flan-t5-base',
    'microsoft/DialoGPT-small'
];

function parseGeneratedText(data, inputPrompt) {
    if (!data) return '';
    let raw = '';
    if (typeof data === 'string') raw = data;
    else if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        if (typeof first === 'string') raw = first;
        else if (first && typeof first.generated_text === 'string') raw = first.generated_text;
    } else if (typeof data.generated_text === 'string') {
        raw = data.generated_text;
    }
    if (!raw || !raw.trim()) return '';
    raw = raw.trim();
    if (inputPrompt && raw.toLowerCase().startsWith(inputPrompt.toLowerCase())) {
        raw = raw.slice(inputPrompt.length).trim();
    }
    return raw;
}

async function tryModel(modelUrl, inputText) {
    const res = await fetch(modelUrl, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + HF_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: inputText })
    });
    const raw = await res.text();
    let data = null;
    try {
        data = raw ? JSON.parse(raw) : null;
    } catch (_) {
        return { ok: false, status: res.status, error: 'Invalid JSON' };
    }
    if (!res.ok) {
        return { ok: false, status: res.status, error: data?.error || data?.message || raw };
    }
    const text = parseGeneratedText(data, inputText);
    return { ok: true, text: text || null };
}

router.post('/api/kai-chat', async (req, res) => {
    const userMessage = req.body && (req.body.message !== undefined ? req.body.message : req.body.inputs);
    const text = typeof userMessage === 'string' ? userMessage.trim() : '';

    if (!text) {
        return res.status(400).json({ error: 'Message is required', text: '' });
    }

    if (!HF_API_KEY) {
        console.error('KAI: HF_API_KEY is not set in .env');
        return res.status(500).json({
            error: 'Assistant unavailable',
            text: 'KAI is not configured. Set HF_API_KEY in backend/.env'
        });
    }

    const modelList = process.env.MODEL_NAME
        ? [process.env.MODEL_NAME].concat(MODELS.filter(m => m !== process.env.MODEL_NAME))
        : MODELS;

    for (const modelId of modelList) {
        const url = 'https://api-inference.huggingface.co/models/' + modelId;
        try {
            let result = await tryModel(url, text);
            if (result.ok && result.text) {
                return res.json({ text: result.text });
            }
            if (result.status === 503) {
                await new Promise(r => setTimeout(r, 3000));
                result = await tryModel(url, text);
                if (result.ok && result.text) {
                    return res.json({ text: result.text });
                }
            }
        } catch (err) {
            console.error('KAI: model failed', modelId, err.message);
        }
    }

    return res.json({
        text: "I'm here! I couldn't reach the AI model right now. Try again in a moment, or ask: 'What can you do?'"
    });
});

module.exports = router;
