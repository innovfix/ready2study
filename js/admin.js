// Admin page logic: Admin-only Important Questions (typed question text)

document.addEventListener('DOMContentLoaded', () => {
    const IMPORTANT_STORAGE_KEY = 'ready2study_important';
    const QUESTIONS_STORAGE_KEY = 'ready2study_pdf_questions';

    const importantFormEl = document.getElementById('importantForm');
    const importantInputEl = document.getElementById('importantInput');
    const savedImportantListEl = document.getElementById('savedImportantList');
    const clearAllImportantBtn = document.getElementById('clearAllImportantBtn');

    function safeJsonParse(value, fallback) {
        try {
            if (!value) return fallback;
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text ?? '');
        return div.innerHTML;
    }

    function normalizeText(text) {
        return String(text ?? '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getQuestionsMapById() {
        const stored = localStorage.getItem(QUESTIONS_STORAGE_KEY);
        const parsed = safeJsonParse(stored, []);
        const map = new Map();
        if (!Array.isArray(parsed)) return map;
        parsed.forEach(q => {
            if (!q || typeof q !== 'object') return;
            const id = Number(q.id);
            const questionText = q.question || q.question_text || '';
            if (Number.isFinite(id) && id > 0 && typeof questionText === 'string' && questionText.trim()) {
                map.set(id, questionText.trim());
            }
        });
        return map;
    }

    // Storage format (new): ["what is AI?", "Explain TCP/IP", ...]
    // We also auto-migrate older formats (IDs / objects) into text if possible.
    function getImportantTextList() {
        const raw = localStorage.getItem(IMPORTANT_STORAGE_KEY);
        const data = safeJsonParse(raw, []);
        const questionsById = getQuestionsMapById();

        const texts = [];
        if (!Array.isArray(data)) return [];

        data.forEach(item => {
            if (typeof item === 'string') {
                if (item.trim()) texts.push(item.trim());
                return;
            }

            if (typeof item === 'number') {
                const text = questionsById.get(item);
                if (text) texts.push(text);
                return;
            }

            if (item && typeof item === 'object') {
                if (typeof item.text === 'string' && item.text.trim()) {
                    texts.push(item.text.trim());
                    return;
                }
                const id = Number(item.id);
                if (Number.isFinite(id) && id > 0) {
                    const text = questionsById.get(id);
                    if (text) texts.push(text);
                }
            }
        });

        // De-dupe by normalized text
        const seen = new Set();
        const unique = [];
        for (const t of texts) {
            const nt = normalizeText(t);
            if (!nt) continue;
            if (seen.has(nt)) continue;
            seen.add(nt);
            unique.push(t);
        }

        return unique;
    }

    function saveImportantTextList(texts) {
        localStorage.setItem(IMPORTANT_STORAGE_KEY, JSON.stringify(texts));
    }

    function splitInputIntoQuestions(raw) {
        const lines = String(raw ?? '')
            .split(/\r?\n/g)
            .map(s => s.trim())
            .filter(Boolean);
        return lines;
    }

    function render() {
        if (!savedImportantListEl) return;
        const items = getImportantTextList();

        if (!items.length) {
            savedImportantListEl.innerHTML = `
                <div style="padding: 0.95rem; border-radius: 0.85rem; background: #f8fafc; border: 1px dashed #cbd5e1; color: var(--text-muted);">
                    No important questions added yet.
                </div>
            `;
            return;
        }

        savedImportantListEl.innerHTML = items.map((text, idx) => `
            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem; padding:0.9rem 1rem; border-radius:0.85rem; background:#fff7ed; border:1px solid #fed7aa;">
                <div style="min-width:0; flex:1;">
                    <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                        <span style="background:#ef4444; color:white; padding:0.25rem 0.65rem; border-radius:999px; font-weight:900; font-size:0.75rem;">
                            Important
                        </span>
                        <span style="color:#64748b; font-size:0.85rem; font-weight:800;">
                            #${idx + 1}
                        </span>
                    </div>
                    <div style="margin-top:0.55rem; font-weight:750; color:#0f172a; line-height:1.6;">
                        ${escapeHtml(text)}
                    </div>
                </div>
                <button type="button" class="btn btn-secondary" data-action="remove-important" data-index="${idx}"
                    style="padding:0.45rem 0.75rem; font-size:0.85rem; border-color:#fecaca; color:#b91c1c; background:#fff; flex: 0 0 auto;">
                    Remove
                </button>
            </div>
        `).join('');
    }

    // Initial migration: if older format exists, rewrite as text list (best-effort).
    (function migrateOnLoad() {
        const raw = localStorage.getItem(IMPORTANT_STORAGE_KEY);
        const data = safeJsonParse(raw, []);
        // Only migrate if it's not already a string array
        if (Array.isArray(data) && (data.length === 0 || typeof data[0] === 'string')) return;
        const migrated = getImportantTextList();
        saveImportantTextList(migrated);
    })();

    if (importantFormEl && importantInputEl) {
        importantFormEl.addEventListener('submit', (e) => {
            e.preventDefault();
            const lines = splitInputIntoQuestions(importantInputEl.value);
            if (!lines.length) return;

            const existing = getImportantTextList();
            const seen = new Set(existing.map(normalizeText));
            const next = [...existing];

            for (const line of lines) {
                const nl = normalizeText(line);
                if (!nl) continue;
                if (seen.has(nl)) continue;
                seen.add(nl);
                next.push(line);
            }

            saveImportantTextList(next);
            importantInputEl.value = '';
            render();
        });
    }

    if (savedImportantListEl) {
        savedImportantListEl.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.dataset.action !== 'remove-important') return;
            const index = Number(target.dataset.index);
            if (!Number.isFinite(index) || index < 0) return;
            const items = getImportantTextList();
            items.splice(index, 1);
            saveImportantTextList(items);
            render();
        });
    }

    if (clearAllImportantBtn) {
        clearAllImportantBtn.addEventListener('click', () => {
            if (!confirm('Clear all important questions?')) return;
            saveImportantTextList([]);
            render();
        });
    }

    render();
});



