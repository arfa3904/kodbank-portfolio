// KAI banking assistant. Proxies to the Hugging Face Inference API so the
// HF_API_KEY never reaches the browser. If HF is unavailable, unauthorized,
// rate-limited, or simply not configured, falls back to a small local
// rule-based responder — the reply is never presented as coming from a
// model that didn't actually run.

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();

const DEFAULT_MODEL = 'google/flan-t5-base';
const REQUEST_TIMEOUT_MS = 12000;

function getHfApiKey() {
    return process.env.HF_API_KEY || process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || '';
}

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
    raw = raw.trim();
    if (!raw) return '';
    if (inputPrompt && raw.toLowerCase().startsWith(inputPrompt.toLowerCase())) {
        raw = raw.slice(inputPrompt.length).trim();
    }
    return raw;
}

// Small, honest fallback: canned answers to the handful of things a KODBANK
// user is actually likely to ask, not a pretend general-purpose model.
function localKaiReply(inputText) {
    const t = inputText.toLowerCase();
    if (t.includes('balance')) return "To check your balance, open the Dashboard — your current balance is shown at the top.";
    if (t.includes('transfer') || t.includes('send money')) return "To transfer money: go to Transfer, enter the recipient's account ID or email and an amount, then confirm.";
    if (t.includes('fail')) return "If a transfer fails, check the error message — it's usually an insufficient balance or an invalid recipient. Your balance is never deducted unless the transfer fully succeeds.";
    if (t.includes('transaction') || t.includes('statement') || t.includes('history')) return "Your recent transactions are listed on the Dashboard and the Transactions page, newest first.";
    if (t.includes('register') || t.includes('sign up')) return 'Use the Register page to create an account. New accounts start with a demo balance of ₹500,000.';
    if (t.includes('login') || t.includes('sign in')) return 'Use your registered email and password on the Login page.';
    if (t.includes('who are you') || t.includes('what can you do')) {
        return "I'm KAI, your KODBANK assistant. I can help with balance, transfers, and transaction history questions.";
    }
    if (t.includes('hello') || t.includes('hi') || t.includes('hey')) return 'Hi! Ask me about your balance, a transfer, or your transaction history.';
    return "I can help with balance, transfers, and transaction questions. Could you rephrase what you'd like to know?";
}

async function callHuggingFace(modelId, inputText, apiKey) {
    const prompt = `You are KAI, a concise banking assistant for KODBANK. Answer briefly and clearly.\nUser: ${inputText}\nAssistant:`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const res = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { max_new_tokens: 200, temperature: 0.7, return_full_text: false }
            }),
            signal: controller.signal
        });

        const raw = await res.text();
        if (!res.ok) {
            return { ok: false, status: res.status };
        }
        let data;
        try {
            data = raw ? JSON.parse(raw) : null;
        } catch {
            return { ok: false, status: res.status };
        }
        const text = parseGeneratedText(data, inputText);
        return { ok: Boolean(text), text };
    } catch (err) {
        return { ok: false, error: err.message };
    } finally {
        clearTimeout(timeout);
    }
}

router.post('/kai-chat', asyncHandler(async (req, res) => {
    const userMessage = req.body && (req.body.message ?? req.body.inputs);
    const text = typeof userMessage === 'string' ? userMessage.trim() : '';

    if (!text) {
        return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const hfApiKey = getHfApiKey();
    const modelId = process.env.MODEL_NAME || DEFAULT_MODEL;

    if (hfApiKey) {
        const result = await callHuggingFace(modelId, text, hfApiKey);
        if (result.ok) {
            return res.json({ success: true, text: result.text, source: 'huggingface' });
        }
        console.warn('KAI: Hugging Face call failed, using local fallback', result.status || result.error);
    }

    res.json({ success: true, text: localKaiReply(text), source: 'fallback' });
}));

module.exports = router;
