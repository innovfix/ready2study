// App Logic for Dashboard

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('questionsContainer');
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    const toggleAllBtn = document.getElementById('toggleAllAnswers');
    const toggleHighlightModeBtn = document.getElementById('toggleHighlightMode');

    let currentFilter = 'all';
    let allAnswersVisible = false;
    let selectedText = null;
    let selectedRange = null;
    let highlightMode = false;
    let viewMode = 'one-by-one'; // 'one-by-one' or 'grid'
    let currentQuestionIndex = 0;
    let filteredQuestionsList = [];
    
    // All questions - will be loaded from localStorage or mockData
    let allQuestions = [];

    // Storage keys
    const HIGHLIGHTS_STORAGE_KEY = 'ready2study_highlights';
    const IMPORTANT_STORAGE_KEY = 'ready2study_important';
    const QUESTION_MEDIA_STORAGE_KEY = 'ready2study_question_media';

    // Load Student Info
    const userData = JSON.parse(localStorage.getItem('ready2study_user'));
    if (userData) {
        const headerInfo = document.getElementById('studentHeaderInfo');
        headerInfo.style.display = 'flex';
        
        // Set colorful, bold name
        const headerName = document.getElementById('headerName');
        headerName.textContent = userData.name;
        
        // Set colorful, attractive details with icons
        const courseSpan = document.getElementById('courseSpan');
        const yearSpan = document.getElementById('yearSpan');
        const collegeSpan = document.getElementById('collegeSpan');
        
        if (courseSpan) {
            courseSpan.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                ${userData.course}
            `;
        }
        
        if (yearSpan) {
            yearSpan.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${userData.year}${getOrdinal(userData.year)} Year
            `;
        }
        
        if (collegeSpan) {
            collegeSpan.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${userData.college}
            `;
        }

        // Logout / Edit Profile Logic
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('ready2study_user');
                window.location.href = '/student-info';
            });
        }
    }

    function getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

    // Highlight Management Functions
    function getHighlights() {
        const stored = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    }

    function saveHighlights(highlights) {
        localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlights));
    }

    function getQuestionHighlights(questionId) {
        const highlights = getHighlights();
        return highlights[questionId] || [];
    }

    function saveQuestionHighlights(questionId, highlightData) {
        const highlights = getHighlights();
        highlights[questionId] = highlightData;
        saveHighlights(highlights);
    }

    function applyHighlights(questionId, answerElement) {
        const highlights = getQuestionHighlights(questionId);
        if (highlights.length === 0) {
            // If no highlights, just ensure the element has clean text
            const currentText = answerElement.textContent || answerElement.innerText || '';
            if (currentText) {
                const answerLabel = answerElement.querySelector('strong');
                if (answerLabel && answerElement.textContent.includes('Answer:')) {
                    const textOnly = answerElement.textContent.replace('Answer:', '').trim();
                    answerElement.innerHTML = '<strong>Answer:</strong> ' + escapeHtml(textOnly);
                } else {
                    answerElement.innerHTML = escapeHtml(currentText);
                }
            }
            return;
        }

        // Get clean text content (without HTML tags or existing highlights)
        // First, get the original text from the question data if available
        let cleanText = '';
        const question = allQuestions.find(q => q.id === questionId);
        
        if (question && question.answer) {
            // Use original answer text
            cleanText = question.answer.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        } else {
            // Fallback: extract text from current element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = answerElement.innerHTML;
            // Remove highlight spans
            tempDiv.querySelectorAll('.highlight').forEach(span => {
                span.replaceWith(document.createTextNode(span.textContent));
            });
            cleanText = tempDiv.textContent || tempDiv.innerText || '';
            cleanText = cleanText.replace(/\s+/g, ' ').trim();
        }
        
        if (!cleanText) return;
        
        // Escape HTML to prevent issues
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

        // Sort highlights in reverse order to maintain correct indices when inserting
        const sortedHighlights = [...highlights].sort((a, b) => b.start - a.start);
        
        // Build segments array
        let segments = [];
        let lastIndex = cleanText.length;
        
        // Process highlights in reverse order
        sortedHighlights.forEach(highlight => {
            // Validate and adjust indices
            let start = Math.max(0, Math.min(highlight.start, cleanText.length));
            let end = Math.max(start, Math.min(highlight.end, cleanText.length));
            
            if (start >= end) return;
            
            // Add segment after this highlight (if any)
            if (end < lastIndex) {
                segments.unshift({
                    type: 'text',
                    content: cleanText.substring(end, lastIndex)
                });
            }
            
            // Add highlight segment
            segments.unshift({
                type: 'highlight',
                id: highlight.id,
                content: cleanText.substring(start, end)
            });
            
            lastIndex = start;
        });
        
        // Add any text before first highlight
        if (lastIndex > 0) {
            segments.unshift({
                type: 'text',
                content: cleanText.substring(0, lastIndex)
            });
        }
        
        // Build HTML from segments
        let htmlContent = '';
        segments.forEach(segment => {
            if (segment.type === 'highlight') {
                htmlContent += `<span class="highlight" data-highlight-id="${segment.id}">${escapeHtml(segment.content)}</span>`;
            } else {
                htmlContent += escapeHtml(segment.content);
            }
        });

        // Update the answer element with highlighted content
        // Preserve the "Answer:" label if it exists
        const answerLabel = answerElement.querySelector('strong');
        if (answerLabel && answerElement.textContent.includes('Answer:')) {
            answerElement.innerHTML = '<strong>Answer:</strong> ' + htmlContent;
        } else {
            answerElement.innerHTML = htmlContent;
        }
    }
    
    // Helper function for HTML escaping
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function highlightSelectedText(questionId, answerElement) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.toString().trim().length === 0) {
            return false;
        }

        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();
        
        if (selectedText.length === 0) return false;

        // Check if selection is within the answer element
        let container = range.commonAncestorContainer;
        while (container && container !== answerElement && !answerElement.contains(container)) {
            container = container.parentElement;
        }
        
        if (!container || !answerElement.contains(container)) {
            return false;
        }

        // Check if selection is entirely within an existing highlight
        // Allow partial selections that span highlights
        let parent = range.commonAncestorContainer;
        let isEntirelyInHighlight = false;
        while (parent && parent !== answerElement) {
            if (parent.classList && parent.classList.contains('highlight')) {
                // Check if the entire selection is within this highlight
                const highlightSpan = parent;
                const highlightText = highlightSpan.textContent || highlightSpan.innerText || '';
                if (highlightText.includes(selectedText.trim())) {
                    // Check if selection start and end are both within this highlight
                    const rangeStart = range.startContainer;
                    const rangeEnd = range.endContainer;
                    if (highlightSpan.contains(rangeStart) && highlightSpan.contains(rangeEnd)) {
                        isEntirelyInHighlight = true;
                        break;
                    }
                }
            }
            parent = parent.parentElement;
        }
        
        // If selection is entirely within an existing highlight, don't highlight again
        if (isEntirelyInHighlight) {
            return false;
        }

        // Get clean text content from the answer element only (without HTML tags)
        // Use the original question answer text for accurate offset calculation
        const question = allQuestions.find(q => q.id === questionId);
        let cleanText = '';
        
        if (question && question.answer) {
            // Use original answer text - this is the source of truth
            cleanText = question.answer.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        } else {
            // Fallback: extract text from current element
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = answerElement.innerHTML;
            // Remove highlight spans to get clean text
            tempDiv.querySelectorAll('.highlight').forEach(span => {
                span.replaceWith(document.createTextNode(span.textContent));
            });
            cleanText = tempDiv.textContent || tempDiv.innerText || '';
            cleanText = cleanText.replace(/\s+/g, ' ').trim();
        }
        
        if (!cleanText || cleanText.length === 0) {
            console.error('No text content found in answer element');
            return false;
        }
        
        // Calculate start offset within the clean text
        // Use a simpler approach: find the selected text in the clean text
        const normalizedSelectedText = selectedText.replace(/\s+/g, ' ').trim();
        const normalizedCleanText = cleanText.replace(/\s+/g, ' ');
        
        // Try to find the selected text in the clean text
        // First, try to get offset using range
        let startOffset = 0;
        try {
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(answerElement);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
            const beforeText = preCaretRange.toString().replace(/\s+/g, ' ');
            startOffset = beforeText.length;
        } catch (e) {
            console.warn('Error calculating offset with range, using text search:', e);
            // Fallback: search for the text
            const searchIndex = normalizedCleanText.indexOf(normalizedSelectedText);
            if (searchIndex >= 0) {
                startOffset = searchIndex;
            }
        }
        
        // Validate and adjust offset
        if (startOffset < 0) startOffset = 0;
        if (startOffset > normalizedCleanText.length) {
            // Try finding the text instead
            const searchIndex = normalizedCleanText.indexOf(normalizedSelectedText);
            if (searchIndex >= 0) {
                startOffset = searchIndex;
            } else {
                return false;
            }
        }
        
        const endOffset = startOffset + normalizedSelectedText.length;

        // Validate offsets against normalized clean text
        if (startOffset < 0 || endOffset > normalizedCleanText.length || startOffset >= endOffset) {
            // Try to find the text in the clean text as fallback
            const searchIndex = normalizedCleanText.indexOf(normalizedSelectedText);
            if (searchIndex >= 0) {
                startOffset = searchIndex;
                const adjustedEnd = searchIndex + normalizedSelectedText.length;
                if (adjustedEnd <= normalizedCleanText.length) {
                    const adjustedHighlightId = Date.now();
                    const highlights = getQuestionHighlights(questionId);
                    highlights.push({
                        id: adjustedHighlightId,
                        start: startOffset,
                        end: adjustedEnd,
                        text: normalizedSelectedText
                    });
                    saveQuestionHighlights(questionId, highlights);
                    applyHighlights(questionId, answerElement);
                    selection.removeAllRanges();
                    return true;
                }
            }
            console.error('Invalid highlight offsets:', { 
                startOffset, 
                endOffset, 
                cleanTextLength: normalizedCleanText.length,
                selectedText: normalizedSelectedText
            });
            return false;
        }
        
        // Verify the text at this position matches
        const expectedText = normalizedCleanText.substring(startOffset, endOffset).trim();
        if (expectedText !== normalizedSelectedText && !normalizedCleanText.substring(startOffset, endOffset).includes(normalizedSelectedText)) {
            // Try to find the text in cleanText
            const foundIndex = normalizedCleanText.indexOf(normalizedSelectedText);
            if (foundIndex >= 0) {
                // Use the found position
                const adjustedStart = foundIndex;
                const adjustedEnd = foundIndex + normalizedSelectedText.length;
                if (adjustedStart >= 0 && adjustedEnd <= normalizedCleanText.length) {
                    // Update offsets
                    const adjustedHighlightId = Date.now();
                    const highlights = getQuestionHighlights(questionId);
                    highlights.push({
                        id: adjustedHighlightId,
                        start: adjustedStart,
                        end: adjustedEnd,
                        text: normalizedSelectedText
                    });
                    saveQuestionHighlights(questionId, highlights);
                    applyHighlights(questionId, answerElement);
                    selection.removeAllRanges();
                    return true;
                }
            }
            console.warn('Selected text mismatch:', { expectedText, selectedText: normalizedSelectedText });
            return false;
        }

        const highlightId = Date.now();

        // Save highlight (use normalized text)
        const highlights = getQuestionHighlights(questionId);
        highlights.push({
            id: highlightId,
            start: startOffset,
            end: endOffset,
            text: normalizedSelectedText
        });
        saveQuestionHighlights(questionId, highlights);

        // Re-apply all highlights to ensure proper rendering
        applyHighlights(questionId, answerElement);

        // Clear selection but keep highlight mode enabled for multiple highlights
        selection.removeAllRanges();

        return true;
    }

    function removeHighlight(questionId, highlightId) {
        const highlights = getQuestionHighlights(questionId);
        const filtered = highlights.filter(h => h.id !== highlightId);
        saveQuestionHighlights(questionId, filtered);
        
        let filteredQuestions;
        if (currentFilter === 'all') {
            filteredQuestions = allQuestions;
        } else if (currentFilter === 'important') {
            filteredQuestions = allQuestions.filter(q => isImportant(q.id));
        } else {
            filteredQuestions = allQuestions.filter(q => q.marks == currentFilter);
        }
        renderQuestions(filteredQuestions);
    }

    function updateHighlightButtons() {
        document.querySelectorAll('.highlight-mode-btn').forEach(btn => {
            if (highlightMode) {
                btn.classList.add('active');
                btn.style.background = 'var(--gradient-primary)';
                btn.style.color = 'white';
            } else {
                btn.classList.remove('active');
                btn.style.background = '';
                btn.style.color = '';
            }
        });

        if (toggleHighlightModeBtn) {
            if (highlightMode) {
                toggleHighlightModeBtn.classList.add('active');
                toggleHighlightModeBtn.style.background = 'var(--gradient-primary)';
                toggleHighlightModeBtn.style.color = 'white';
            } else {
                toggleHighlightModeBtn.classList.remove('active');
                toggleHighlightModeBtn.style.background = '';
                toggleHighlightModeBtn.style.color = '';
            }
        }
    }

    if (toggleHighlightModeBtn) {
        toggleHighlightModeBtn.addEventListener('click', () => {
            highlightMode = !highlightMode;
            updateHighlightButtons();
            
            // Update cursor and highlight state for all answer texts and buttons
            document.querySelectorAll('.answer-text').forEach(answerText => {
                const questionId = parseInt(answerText.getAttribute('data-question-id'));
                const highlightBtn = document.querySelector(`.highlight-mode-btn[data-question-id="${questionId}"]`);
                
                if (highlightMode) {
                    answerText.style.cursor = 'text';
                    answerText.style.userSelect = 'text';
                    answerText.style.webkitUserSelect = 'text';
                    answerText.style.mozUserSelect = 'text';
                    answerText.style.msUserSelect = 'text';
                    answerText.style.background = '#fefce8';
                    
                    // Update individual highlight button state
                    if (highlightBtn) {
                        highlightBtn.dataset.highlightEnabled = 'true';
                        highlightBtn.style.background = '#22c55e';
                        highlightBtn.style.color = 'white';
                        highlightBtn.style.borderColor = '#16a34a';
                    }
                } else {
                    answerText.style.cursor = '';
                    answerText.style.userSelect = '';
                    answerText.style.webkitUserSelect = '';
                    answerText.style.mozUserSelect = '';
                    answerText.style.msUserSelect = '';
                    answerText.style.background = '';
                    
                    // Update individual highlight button state
                    if (highlightBtn) {
                        highlightBtn.dataset.highlightEnabled = 'false';
                        highlightBtn.style.background = '#fef9c3';
                        highlightBtn.style.color = '#854d0e';
                        highlightBtn.style.borderColor = '#fde047';
                    }
                }
            });
        });
    }

    // Important Management Functions
    function getImportantQuestions() {
        const stored = localStorage.getItem(IMPORTANT_STORAGE_KEY);
        if (!stored) return [];
        let data;
        try {
            data = JSON.parse(stored);
        } catch (e) {
            return [];
        }

        if (!Array.isArray(data)) return [];

        return data
            .map(item => {
                if (typeof item === 'number') {
                    return { id: item, name: '' };
                }
                if (typeof item === 'string') {
                    return { text: item };
                }
                if (item && typeof item === 'object') {
                    const id = Number(item.id);
                    const name = typeof item.name === 'string' ? item.name : '';
                    const text = typeof item.text === 'string' ? item.text : '';
                    if (Number.isFinite(id) && id > 0) {
                        return { id, name, text };
                    }
                    if (text && text.trim()) {
                        return { text: text.trim(), name };
                    }
                }
                return null;
            })
            .filter(Boolean);
    }

    function saveImportantQuestions(importantList) {
        localStorage.setItem(IMPORTANT_STORAGE_KEY, JSON.stringify(importantList));
    }

    function getImportantQuestionName(questionId) {
        const important = getImportantQuestions();
        const item = important.find(i => i.id === questionId);
        return item ? item.name : '';
    }

    function setImportantQuestionName(questionId, name) {
        const important = getImportantQuestions();
        const index = important.findIndex(i => i.id === questionId);
        if (index > -1) {
            important[index].name = name;
        } else {
            important.push({ id: questionId, name: name });
        }
        saveImportantQuestions(important);
    }

    function toggleImportant(questionId, name = '') {
        const important = getImportantQuestions();
        const index = important.findIndex(i => i.id === questionId);
        if (index > -1) {
            important.splice(index, 1);
            saveImportantQuestions(important);
            return false;
        } else {
            important.push({ id: questionId, name: name });
            saveImportantQuestions(important);
            return true;
        }
    }

    function normalizeImportantText(text) {
        return String(text ?? '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function isImportant(questionId) {
        const important = getImportantQuestions();
        if (important.some(i => typeof i.id === 'number' && i.id === questionId)) {
            return true;
        }

        const q = allQuestions.find(q => q.id === questionId);
        const questionText = q?.question || q?.question_text || '';
        if (!questionText) return false;
        const haystack = normalizeImportantText(questionText);
        if (!haystack) return false;

        return important.some(i => {
            if (!i.text) return false;
            const needle = normalizeImportantText(i.text);
            if (!needle || needle.length < 5) return false;
            return haystack.includes(needle);
        });
    }

    function getImportantTextEntries() {
        const important = getImportantQuestions();
        const texts = [];

        important.forEach(item => {
            if (item && typeof item.text === 'string' && item.text.trim()) {
                texts.push(item.text.trim());
                return;
            }

            if (typeof item?.id === 'number') {
                const q = allQuestions.find(q => q.id === item.id);
                const text = (q?.question || q?.question_text || '').trim();
                if (text) texts.push(text);
            }
        });

        // Dedupe by normalized text
        const seen = new Set();
        const unique = [];
        texts.forEach(t => {
            const nt = normalizeImportantText(t);
            if (!nt) return;
            if (seen.has(nt)) return;
            seen.add(nt);
            unique.push(t);
        });

        return unique;
    }

    function toggleSaveImportant(questionId) {
        const q = allQuestions.find(q => q.id === questionId);
        const questionText = (q?.question || q?.question_text || '').trim();
        if (!questionText) return null;

        const normQ = normalizeImportantText(questionText);
        const entries = getImportantTextEntries();
        const matches = entries
            .map((t, idx) => ({ idx, t, norm: normalizeImportantText(t) }))
            .filter(x => x.norm && (normQ.includes(x.norm) || x.norm.includes(normQ)));

        if (matches.length > 0) {
            // Remove the most specific match (longest)
            matches.sort((a, b) => b.norm.length - a.norm.length);
            entries.splice(matches[0].idx, 1);
            saveImportantQuestions(entries); // store as text list
            return false;
        }

        entries.push(questionText);
        saveImportantQuestions(entries);
        return true;
    }

    // Load questions
    const storedQuestions = localStorage.getItem('ready2study_pdf_questions');
    if (storedQuestions) {
        try {
            const parsed = JSON.parse(storedQuestions);
            if (Array.isArray(parsed) && parsed.length > 0) {
                allQuestions = parsed;
            } else {
                allQuestions = mockQuestions;
            }
        } catch (e) {
            console.error('Error parsing stored questions:', e);
            allQuestions = mockQuestions;
        }
    } else {
        allQuestions = mockQuestions;
        localStorage.setItem('ready2study_pdf_questions', JSON.stringify(mockQuestions));
    }

    if (allQuestions.length === 0) {
        allQuestions = mockQuestions;
    }
    
    console.log('Loaded questions from storage:', allQuestions.length, 'questions');
    
    displayQuestionSummary();
    
    const pdfStatusCard = document.getElementById('pdfStatusCard');
    if (pdfStatusCard) {
        pdfStatusCard.style.display = 'none';
    }
    
    viewMode = 'grid';
    currentQuestionIndex = 0;
    
    // Ensure "All Questions" filter is active by default
    currentFilter = 'all';
    const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
    if (allFilterBtn) {
        // Remove active class from all filter buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active class to "All Questions" button
        allFilterBtn.classList.add('active');
    }
    
    // Initial render - show ALL questions by default
    const initialFiltered = allQuestions;
    
    renderQuestions(initialFiltered);
    
    function displayQuestionSummary() {
        const summary = {
            1: allQuestions.filter(q => q.marks === 1).length,
            2: allQuestions.filter(q => q.marks === 2).length,
            3: allQuestions.filter(q => q.marks === 3).length,
            10: allQuestions.filter(q => q.marks === 10).length
        };
        
        document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
            const filter = btn.dataset.filter;
            if (filter === 'all') {
                btn.innerHTML = `All Questions <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; margin-left: 0.5rem;">${allQuestions.length}</span>`;
            } else if (filter === 'important') {
                const importantCount = allQuestions.filter(q => isImportant(q.id)).length;
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem; vertical-align: middle;">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    Important <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; margin-left: 0.5rem;">${importantCount}</span>
                `;
            } else if (filter === '1') {
                btn.innerHTML = `1 Mark <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; margin-left: 0.5rem;">${summary[1]}</span>`;
            } else if (filter === '2') {
                btn.innerHTML = `2 Marks <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; margin-left: 0.5rem;">${summary[2]}</span>`;
            } else if (filter === '3') {
                btn.innerHTML = `3 Marks <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; margin-left: 0.5rem;">${summary[3]}</span>`;
            } else if (filter === '10') {
                btn.innerHTML = `10 Marks <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; margin-left: 0.5rem;">${summary[10]}</span>`;
            }
        });
        
        console.log('Questions loaded from PDF:', {
            total: allQuestions.length,
            '1 Mark': summary[1],
            '2 Marks': summary[2],
            '3 Marks': summary[3],
            '10 Marks': summary[10]
        });
    }

    // View Full PDF Content
    const viewFullPDFBtn = document.getElementById('viewFullPDF');
    const pdfContentModal = document.getElementById('pdfContentModal');
    const pdfContentClose = document.getElementById('pdfContentClose');
    const pdfContentBody = document.getElementById('pdfContentBody');

    if (viewFullPDFBtn) {
        viewFullPDFBtn.addEventListener('click', () => {
            let fullContent = '<div style="max-width: 800px; margin: 0 auto;">';
            fullContent += '<h2 style="color: var(--primary); margin-bottom: 2rem; text-align: center;">Complete Study Material</h2>';
            
            const questionsByMarks = {
                1: allQuestions.filter(q => q.marks === 1),
                2: allQuestions.filter(q => q.marks === 2),
                3: allQuestions.filter(q => q.marks === 3),
                10: allQuestions.filter(q => q.marks === 10)
            };

            [1, 2, 3, 10].forEach(marks => {
                const questions = questionsByMarks[marks];
                if (questions.length > 0) {
                    fullContent += `<h4 style="color: var(--primary); margin-top: 2rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary);">${marks} Mark${marks > 1 ? 's' : ''} Questions</h4>`;
                    
                    questions.forEach((q, index) => {
                        fullContent += `<div style="margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: var(--radius-lg); border-left: 4px solid var(--primary);">`;
                        fullContent += `<p style="font-weight: 600; color: var(--text-main); margin-bottom: 0.75rem;"><strong>Q${index + 1}:</strong> ${q.question}</p>`;
                        fullContent += `<p style="color: var(--text-muted); margin-bottom: 0.5rem;"><strong>Answer:</strong></p>`;
                        fullContent += `<p style="color: var(--text-main); line-height: 1.8;">${q.answer.replace(/\n/g, '<br>')}</p>`;
                        if (q.image) {
                            fullContent += `<div style="margin-top: 1rem;"><img src="${q.image}" alt="Diagram" style="max-width: 100%; border-radius: var(--radius-lg);"></div>`;
                        }
                        fullContent += `</div>`;
                    });
                }
            });

            fullContent += '</div>';
            pdfContentBody.innerHTML = fullContent;
            pdfContentModal.classList.add('active');
        });
    }

    if (pdfContentClose) {
        pdfContentClose.addEventListener('click', () => {
            pdfContentModal.classList.remove('active');
        });
    }

    if (pdfContentModal) {
        pdfContentModal.addEventListener('click', (e) => {
            if (e.target === pdfContentModal) {
                pdfContentModal.classList.remove('active');
            }
        });
    }

    // Filter Click Handlers
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentFilter = btn.dataset.filter;
            let filtered;
            
            if (currentFilter === 'all') {
                filtered = allQuestions;
            } else if (currentFilter === 'important') {
                filtered = allQuestions.filter(q => isImportant(q.id));
            } else {
                filtered = allQuestions.filter(q => q.marks == currentFilter);
            }

            currentQuestionIndex = 0;
            renderQuestions(filtered);
        });
    });

    // Initialize: Show all answers by default
    allAnswersVisible = true;
    if (toggleAllBtn) {
        toggleAllBtn.textContent = "Hide All Answers";
    }
    
    // Function to show all answers
    function showAllAnswers() {
        const answerSections = document.querySelectorAll('.answer-section');
        answerSections.forEach(section => {
            section.classList.add('visible');
            section.style.display = 'block';
            section.style.visibility = 'visible';
        });
        
        const toggleBtns = document.querySelectorAll('.toggle-answer-btn');
        toggleBtns.forEach(btn => {
            btn.textContent = "Hide Answer";
        });
        
        if (toggleAllBtn) {
            toggleAllBtn.textContent = "Hide All Answers";
        }
        allAnswersVisible = true;
    }
    
    // Show all answers on page load
    setTimeout(() => {
        showAllAnswers();
    }, 100);

    // Toggle All Answers
    if (toggleAllBtn) {
        toggleAllBtn.addEventListener('click', () => {
            allAnswersVisible = !allAnswersVisible;
            toggleAllBtn.textContent = allAnswersVisible ? "Hide All Answers" : "Show All Answers";

            const answerSections = document.querySelectorAll('.answer-section');
            const toggleBtns = document.querySelectorAll('.toggle-answer-btn');

            answerSections.forEach(section => {
                if (allAnswersVisible) {
                    section.classList.add('visible');
                    section.style.display = 'block';
                    section.style.visibility = 'visible';
                } else {
                    section.classList.remove('visible');
                    section.style.display = 'none';
                }
            });

            toggleBtns.forEach(btn => {
                btn.textContent = allAnswersVisible ? "Hide Answer" : "Show Answer";
            });
        });
    }

    function renderQuestions(questions) {
        if (!container) {
            console.error('Questions container not found!');
            return;
        }
        
        container.innerHTML = '';
        filteredQuestionsList = questions;
        
        console.log('Rendering questions:', questions.length, 'questions');

        if (questions.length === 0) {
            if (currentFilter === 'important') {
                container.innerHTML = `
                    <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                        <h3>No important questions yet.</h3>
                        <p style="margin-top: 1rem;">Mark questions as important to see them here.</p>
                    </div>
                `;
                return;
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                        <h3>No questions found for this category.</h3>
                    </div>
                `;
                return;
            }
        }

        const questionsByMarks = {
            1: questions.filter(q => q.marks === 1),
            2: questions.filter(q => q.marks === 2),
            3: questions.filter(q => q.marks === 3),
            10: questions.filter(q => q.marks === 10)
        };
        
        let questionsToRender = questions;
        
        if (container) {
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.visibility = 'visible';
        }
        
        questionsToRender.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.style.display = 'block';
            card.style.visibility = 'visible';
            card.style.opacity = '1';

            // Format answer with line breaks if needed
            const answerRawText = q.answer || q.answer_text || 'No answer provided';
            
            // Format answer as list if it contains list items
            let formattedAnswer = answerRawText;
            
            // Check if answer contains comma-separated list items (common pattern)
            // Pattern: "item1, item2, item3" or "item1,item2,item3"
            if (answerRawText.includes(',') && !answerRawText.includes('\n')) {
                // Split by comma and format as list
                const items = answerRawText.split(',').map(item => item.trim()).filter(item => item.length > 0);
                if (items.length > 1) {
                    // Format as list with each item on a new line
                    formattedAnswer = items.map(item => {
                        // Remove leading numbers/bullets if present
                        item = item.replace(/^[\d]+[\.\)]\s*/, '').replace(/^[-•]\s*/, '');
                        return item;
                    }).join('<br>');
                } else {
                    formattedAnswer = answerRawText.replace(/\n/g, '<br>');
                }
            } 
            // Check for numbered lists (1. item, 2. item, etc.)
            else if (answerRawText.match(/^\d+[\.\)]\s+/m) || answerRawText.match(/\n\d+[\.\)]\s+/)) {
                formattedAnswer = answerRawText
                    .split(/\n/)
                    .map(line => {
                        // If line starts with number, keep it; otherwise add line break
                        if (line.trim().match(/^\d+[\.\)]\s+/)) {
                            return line.trim();
                        }
                        return line;
                    })
                    .filter(line => line.trim().length > 0)
                    .join('<br>');
            }
            // Check for bulleted lists (-, •, etc.)
            else if (answerRawText.match(/^[-•]\s+/m) || answerRawText.match(/\n[-•]\s+/)) {
                formattedAnswer = answerRawText
                    .split(/\n/)
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('<br>');
            }
            // Regular text - just replace newlines with <br>
            else {
                formattedAnswer = answerRawText.replace(/\n/g, '<br>');
            }
            
            // Fix pronouns in questions by extracting nouns from answer
            function extractNounFromAnswer(answer) {
                if (!answer || answer === 'No answer provided') return null;
                
                const pronouns = ['this', 'these', 'that', 'those', 'then', 'there', 'their', 'they', 'them', 'it', 'its', 'he', 'she', 'him', 'her', 'his', 'hers', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 'i', 'me', 'my', 'mine'];
                const genericWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall'];
                
                // Extract meaningful nouns (words that are 5+ chars and not pronouns)
                const words = answer.toLowerCase().split(/\s+/)
                    .map(w => w.replace(/[^a-z0-9]/g, ''))
                    .filter(w => w.length >= 5 && !pronouns.includes(w) && !genericWords.includes(w));
                
                // Look for capitalized terms (likely proper nouns/concepts)
                const capitalizedTerms = answer.match(/\b[A-Z][a-z]{4,}(?:\s+[A-Z][a-z]+)*\b/g) || [];
                const validTerms = capitalizedTerms
                    .filter(term => {
                        const lower = term.toLowerCase();
                        const words = term.split(/\s+/);
                        for (const word of words) {
                            if (pronouns.includes(word.toLowerCase())) return false;
                        }
                        return term.length >= 5;
                    })
                    .slice(0, 3);
                
                // Prefer capitalized terms, then frequent words
                if (validTerms.length > 0) {
                    return validTerms[0];
                } else if (words.length > 0) {
                    // Get most frequent meaningful word
                    const wordFreq = {};
                    words.forEach(w => wordFreq[w] = (wordFreq[w] || 0) + 1);
                    const sorted = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]);
                    if (sorted.length > 0) {
                        return sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1);
                    }
                }
                
                return null;
            }
            
            // Ensure question text exists and fix pronouns
            let questionText = q.question || q.question_text || 'No question text';
            
            // Check if question contains pronouns and fix it
            const pronounPattern = /\b(what is|explain|describe|write about|discuss)\s+(this|these|that|those|then|there|their|they|them|it|its|he|she|him|her|his|hers|we|us|our|ours|you|your|yours|i|me|my|mine)\b/gi;
            if (pronounPattern.test(questionText)) {
                const noun = extractNounFromAnswer(answerRawText);
                if (noun) {
                    // Replace pronoun with actual noun
                    questionText = questionText.replace(/\b(this|these|that|those|then|there|their|they|them|it|its|he|she|him|her|his|hers|we|us|our|ours|you|your|yours|i|me|my|mine)\b/gi, noun);
                } else {
                    // If no noun found, try to extract from answer text more aggressively
                    const sentences = answerRawText.split(/[.!?]+/).filter(s => s.trim().length > 20);
                    for (const sentence of sentences) {
                        const noun = extractNounFromAnswer(sentence);
                        if (noun) {
                            questionText = questionText.replace(/\b(this|these|that|those|then|there|their|they|them|it|its|he|she|him|her|his|hers|we|us|our|ours|you|your|yours|i|me|my|mine)\b/gi, noun);
                            break;
                        }
                    }
                }
            }
            
            const imageHtml = q.image ? `<div class="answer-image-container"><img src="${q.image}" alt="Diagram for ${q.question}" class="answer-image"></div>` : '';
            
            const questionMedia = getQuestionMedia(q.id);
            const mediaHtml = questionMedia ? `
                <div class="question-media-container">
                    ${questionMedia.type === 'image' 
                        ? `<img src="${questionMedia.data}" alt="Question representation">`
                        : `<video src="${questionMedia.data}" controls></video>`
                    }
                </div>
            ` : '';

            const isImportantQuestion = isImportant(q.id);
            const importantName = isImportantQuestion ? getImportantQuestionName(q.id) : '';
            const importantBadge = isImportantQuestion ? `
                <span style="background: #fee2e2; color: #b91c1c; padding: 0.35rem 0.75rem; border-radius: 999px; font-weight: 800; font-size: 0.75rem; border: 1px solid #fecaca;">
                    Important${importantName ? `: ${escapeHtml(importantName)}` : ''}
                </span>
            ` : '';

            const markColors = {
                1: '#3b82f6',
                2: '#10b981',
                3: '#f59e0b',
                10: '#ef4444'
            };
            const markColor = markColors[q.marks] || '#6366f1';
            const questionNumber = index + 1;
            
            card.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <!-- Mark Badge and Question Number -->
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <span style="background: ${markColor}; color: white; padding: 0.4rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem;">
                            ${q.marks} Mark${q.marks > 1 ? 's' : ''}
                        </span>
                        <span style="color: #64748b; font-size: 0.875rem; font-weight: 600;">
                            Q${questionNumber}
                        </span>
                        ${importantBadge}
                    </div>
                    
                    <!-- Question Box with Blue Border - Displayed FIRST -->
                    <div style="font-size: 1rem; font-weight: 600; color: #0f172a; line-height: 1.6; padding: 1.25rem; background: #ffffff; border-radius: 0.5rem; border: 2px solid #3b82f6; margin-bottom: 1rem;">
                        ${questionText}
                    </div>
                    
                    <!-- Related Images Section -->
                    <div class="related-images-section" data-question-id="${q.id}" style="margin-bottom: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
                        <!-- Images will be loaded here -->
                    </div>
                    
                    ${mediaHtml}
                    
                    <!-- Dotted Separator Line -->
                    <div style="border-top: 2px dotted #cbd5e1; margin: 1rem 0;"></div>
                    
                    <!-- Answer Box with Green Border - Displayed BELOW Question -->
                    <div class="answer-section visible" style="display: block !important; margin-top: 1rem;">
                        <div style="font-size: 0.875rem; color: #1e293b; line-height: 1.6; padding: 1rem; background: #ffffff; border-radius: 0.5rem; border: 2px solid #10b981;">
                            <div style="color: #10b981; font-weight: 700; font-size: 0.9rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                Answer:
                            </div>
                            <div class="answer-text" data-question-id="${q.id}" style="color: #334155; font-size: 0.875rem; line-height: 1.7;">
                                ${formattedAnswer}
                            </div>
                            ${imageHtml}
                        </div>
                    </div>
                </div>
                        
                <div class="answer-controls" style="padding-top: 1rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-start; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn-icon chat-question-btn" title="Ask AI to clarify doubt" data-question-id="${q.id}" style="background: #dbeafe; color: #1e40af; border: 1px solid #60a5fa; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Clarify Doubt
                    </button>
                    <button class="btn-icon youtube-btn" title="Video Sources" data-question-id="${q.id}" data-question-text="${q.question.replace(/"/g, '&quot;')}" style="background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>
                        Sources
                    </button>
                    <button class="btn-icon highlight-mode-btn" title="Highlight text" data-question-id="${q.id}" style="background: #fef9c3; color: #854d0e; border: 1px solid #fde047; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                        Highlight
                    </button>
                    <button class="btn-icon unhighlight-btn" title="Remove Highlights" data-question-id="${q.id}" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>
                        Clear
                    </button>
                    <button class="btn-icon listen-btn" title="Listen" data-question-id="${q.id}" style="background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        Listen
                    </button>
                    <button class="btn-icon translate-question-btn" title="Translate to Tamil" data-question-id="${q.id}" data-question-text="${q.question.replace(/"/g, '&quot;')}" data-answer-text="${q.answer.replace(/"/g, '&quot;')}" style="background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path></svg>
                        Translate
                    </button>
                    <button class="btn-icon save-important-btn ${isImportantQuestion ? 'active' : ''}" title="Save" data-question-id="${q.id}" style="background: ${isImportantQuestion ? '#ef4444' : '#fff'}; color: ${isImportantQuestion ? '#fff' : '#ef4444'}; border: 1px solid ${isImportantQuestion ? '#ef4444' : '#fecaca'}; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isImportantQuestion ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        ${isImportantQuestion ? 'Saved' : 'Save'}
                    </button>
                </div>
            `;

            const answerTextElement = card.querySelector('.answer-text');
            const answerSection = card.querySelector('.answer-section');
            
            if (answerSection) {
                answerSection.classList.add('visible');
                answerSection.style.display = 'block';
                answerSection.style.visibility = 'visible';
                answerSection.style.opacity = '1';
            }
            
            if (answerTextElement) {
                applyHighlights(q.id, answerTextElement);
            }
            
            container.appendChild(card);
            
            // Ensure answer is visible
            if (answerSection) {
                answerSection.style.display = 'block';
                answerSection.style.visibility = 'visible';
                answerSection.classList.add('visible');
            }
            
            // Load related images for this question
            loadRelatedImages(q.id, q.question);
        });
        
        // After rendering, ensure all answers are visible
        setTimeout(() => {
            const allAnswerSections = document.querySelectorAll('.answer-section');
            allAnswerSections.forEach(section => {
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.classList.add('visible');
            });
        }, 50);

        // Function to load related images for a question
        function loadRelatedImages(questionId, questionText) {
            const imagesSection = document.querySelector(`.related-images-section[data-question-id="${questionId}"]`);
            if (!imagesSection) return;

            // Extract keywords from question (first 3-4 important words)
            const words = questionText
                .split(' ')
                .filter(word => word.length > 3)
                .slice(0, 4)
                .join(' ');
            
            if (!words) return;

            // Generate Unsplash image URLs
            const imageUrls = [
                `https://source.unsplash.com/300x200/?${encodeURIComponent(words)}&education`,
                `https://source.unsplash.com/300x200/?${encodeURIComponent(words)}&study`,
                `https://source.unsplash.com/300x200/?${encodeURIComponent(words)}&learning`,
                `https://source.unsplash.com/300x200/?${encodeURIComponent(words)}&academic`
            ];

            // Display images
            imagesSection.innerHTML = imageUrls.map((url, index) => `
                <div class="related-image-item" style="position: relative; width: 100%; padding-bottom: 75%; border-radius: 0.5rem; overflow: hidden; border: 2px solid var(--border); cursor: pointer; transition: all 0.2s; background: #f1f5f9;">
                    <img src="${url}" 
                         alt="Related image ${index + 1}" 
                         style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                         loading="lazy"
                         onerror="this.parentElement.style.display='none'"
                         onclick="window.open('${url}', '_blank')"
                         onmouseover="this.style.transform='scale(1.05)'"
                         onmouseout="this.style.transform='scale(1)'">
                </div>
            `).join('');
        }

        // Add button handlers
        addButtonHandlers();
    }

    function addButtonHandlers() {
        // Add Sources button handlers - Show sidebar with links and images
        document.querySelectorAll('.youtube-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const questionText = btn.getAttribute('data-question-text');
                const question = allQuestions.find(q => q.id === questionId);
                
                if (question) {
                    showSourcesSidebar(questionText, question);
                }
            });
        });

        // Chat Doubt button handlers for each question
        document.querySelectorAll('.chat-question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const question = allQuestions.find(q => q.id === questionId);
                if (question) {
                    currentChatQuestionId = questionId;
                    if (chatHeaderTitle) chatHeaderTitle.textContent = `Clarify Doubt: Q${questionId}`;
                    
                    if (chatMessages) {
                        chatMessages.innerHTML = `
                            <div class="chat-message bot-message">
                                <div class="message-content">
                                    <p>Hi! I'm here to help you understand this question better. Let me explain it clearly for you.</p>
                                </div>
                            </div>
                        `;
                    }
                    
                    chatModal.classList.add('active');
                    if (chatInput) chatInput.focus();
                    
                    // Auto-generate initial AI response
                    setTimeout(() => {
                        const briefExplanation = question.question.substring(0, 100);
                        const answerPreview = question.answer.length > 150 
                            ? question.answer.substring(0, 150) + '...' 
                            : question.answer;
                        
                        const aiResponse = `**Question Analysis:**\n\n${briefExplanation}\n\n**Key Points to Understand:**\n- This is a ${question.marks}-mark question\n- It tests your knowledge on specific concepts\n\n**Brief Explanation:**\n${answerPreview}\n\nAsk me anything specific about this question and I'll clarify it for you!`;
                        
                        addMessage(aiResponse, 'bot');
                    }, 500);
                }
            });
        });

        // Add highlight button handlers - Find answer element within the question card
        document.querySelectorAll('.highlight-mode-btn').forEach(btn => {
            const questionId = parseInt(btn.getAttribute('data-question-id'));
            
            // Find the answer text element within the same question card - try multiple methods
            const questionCard = btn.closest('.question-card');
            let answerText = null;
            
            if (questionCard) {
                // Try finding by data attribute first
                answerText = questionCard.querySelector(`.answer-text[data-question-id="${questionId}"]`);
                // If not found, try finding any .answer-text in the card
                if (!answerText) {
                    answerText = questionCard.querySelector('.answer-text');
                }
                // If still not found, try finding within answer-section
                if (!answerText) {
                    const answerSection = questionCard.querySelector('.answer-section');
                    if (answerSection) {
                        answerText = answerSection.querySelector('.answer-text');
                    }
                }
            }
            
            if (!answerText) {
                console.warn(`Answer text not found for question ${questionId}`, {
                    questionCard: !!questionCard,
                    hasAnswerSection: questionCard ? !!questionCard.querySelector('.answer-section') : false
                });
                return;
            }
            
            // Store highlight state per question
            btn.dataset.highlightEnabled = 'false';
            
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Re-find answerText in case DOM changed (e.g., after re-rendering)
                const currentCard = btn.closest('.question-card');
                const currentAnswerText = currentCard ? 
                    (currentCard.querySelector(`.answer-text[data-question-id="${questionId}"]`) || 
                     currentCard.querySelector('.answer-text')) : null;
                
                if (!currentAnswerText) {
                    console.error(`Answer text not found when clicking highlight button for question ${questionId}`);
                    return;
                }
                
                    const isEnabled = btn.dataset.highlightEnabled === 'true';
                    
                    if (!isEnabled) {
                    // Enable highlight mode
                        btn.dataset.highlightEnabled = 'true';
                        btn.style.background = '#22c55e';
                        btn.style.color = 'white';
                        btn.style.borderColor = '#16a34a';
                    
                    // Make the entire answer section selectable
                    const answerSection = currentAnswerText.closest('.answer-section');
                    if (answerSection) {
                        answerSection.style.cursor = 'text';
                        answerSection.style.userSelect = 'text';
                        answerSection.style.webkitUserSelect = 'text';
                        answerSection.style.mozUserSelect = 'text';
                        answerSection.style.msUserSelect = 'text';
                    }
                    
                    currentAnswerText.style.cursor = 'text';
                    currentAnswerText.style.userSelect = 'text';
                    currentAnswerText.style.webkitUserSelect = 'text';
                    currentAnswerText.style.mozUserSelect = 'text';
                    currentAnswerText.style.msUserSelect = 'text';
                    currentAnswerText.style.background = '#fefce8';
                    
                    // Also make highlight spans selectable
                    currentAnswerText.querySelectorAll('.highlight').forEach(span => {
                        span.style.userSelect = 'text';
                        span.style.webkitUserSelect = 'text';
                        span.style.mozUserSelect = 'text';
                        span.style.msUserSelect = 'text';
                    });
                    
                    // Add mouseup listener for highlighting
                    // Create handler function
                    const mouseUpHandler = function(e) {
                        // Don't process if clicking on buttons or controls
                        if (e.target.closest('button') || e.target.closest('.answer-controls')) {
                            return;
                        }
                        
                        // Check if highlight mode is still enabled
                        if (btn.dataset.highlightEnabled !== 'true' && !highlightMode) {
                            return;
                        }
                        
                        // Small delay to ensure selection is complete
                        setTimeout(() => {
                            const selection = window.getSelection();
                            const selectedText = selection.toString().trim();
                            
                            // Only proceed if there's actually selected text
                            if (selectedText.length > 0) {
                                // Re-find answerText in case DOM changed
                                const card = btn.closest('.question-card');
                                const answerEl = card ? 
                                    (card.querySelector(`.answer-text[data-question-id="${questionId}"]`) || 
                                     card.querySelector('.answer-text')) : null;
                                
                                if (answerEl) {
                                    const success = highlightSelectedText(questionId, answerEl);
                                    if (success) {
                                        // Keep highlight mode on for multiple highlights
                                        if (!highlightMode) {
                                            btn.dataset.highlightEnabled = 'true';
                                            btn.style.background = '#22c55e';
                                            btn.style.color = 'white';
                                            btn.style.borderColor = '#16a34a';
                                            answerEl.style.background = '#fefce8';
                                        }
                                    }
                                }
                            }
                        }, 100); // Increased delay to ensure selection is captured
                    };
                    
                    // Attach to both answer section and answer text for better coverage
                    if (answerSection) {
                        answerSection.addEventListener('mouseup', mouseUpHandler, { passive: true });
                    }
                    currentAnswerText.addEventListener('mouseup', mouseUpHandler, { passive: true });
                    
                    // Store handler reference for removal
                    btn.dataset.mouseUpHandler = 'attached';
                    } else {
                    // Disable highlight mode
                        btn.dataset.highlightEnabled = 'false';
                        btn.style.background = '#fef9c3';
                        btn.style.color = '#854d0e';
                        btn.style.borderColor = '#fde047';
                    
                    const answerSection = currentAnswerText.closest('.answer-section');
                    if (answerSection) {
                        answerSection.style.cursor = '';
                        answerSection.style.userSelect = '';
                        answerSection.style.webkitUserSelect = '';
                        answerSection.style.mozUserSelect = '';
                        answerSection.style.msUserSelect = '';
                    }
                    
                    currentAnswerText.style.cursor = '';
                    currentAnswerText.style.userSelect = '';
                    currentAnswerText.style.webkitUserSelect = '';
                    currentAnswerText.style.mozUserSelect = '';
                    currentAnswerText.style.msUserSelect = '';
                    currentAnswerText.style.background = '';
                }
            });
            
        });

        // Unhighlight button handlers
        document.querySelectorAll('.unhighlight-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const highlights = getQuestionHighlights(questionId);
                if (highlights.length > 0) {
                    if (confirm('Remove all highlights from this answer?')) {
                        saveQuestionHighlights(questionId, []);
                        const filtered = currentFilter === 'all'
                            ? allQuestions
                            : currentFilter === 'important'
                            ? allQuestions.filter(q => isImportant(q.id))
                            : allQuestions.filter(q => q.marks == currentFilter);
                        renderQuestions(filtered);
                    }
                } else {
                    alert('No highlights to remove.');
                }
            });
        });

        // Listen button handlers (text-to-speech)
        document.querySelectorAll('.listen-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const question = allQuestions.find(q => q.id === questionId);
                if (question && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    
                    const text = `Question: ${question.question}. Answer: ${question.answer}`;
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    
                    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Stop';
                    btn.style.background = '#fecaca';
                    btn.style.color = '#991b1b';
                    
                    utterance.onend = () => {
                        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Listen';
                        btn.style.background = '#ede9fe';
                        btn.style.color = '#6d28d9';
                    };
                    
                    window.speechSynthesis.speak(utterance);
                } else {
                    alert('Text-to-speech is not supported in your browser.');
                }
            });
        });

        // Important button handlers
        // Add translate question button handlers
        document.querySelectorAll('.translate-question-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const questionText = btn.getAttribute('data-question-text');
                const answerText = btn.getAttribute('data-answer-text');
                
                // Show loading state
                btn.disabled = true;
                btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path></svg> Translating...';
                
                try {
                    // Translate question
                    const questionResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(questionText)}&langpair=en|ta`);
                    const questionData = await questionResponse.json();
                    
                    // Translate answer
                    const answerResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(answerText)}&langpair=en|ta`);
                    const answerData = await answerResponse.json();
                    
                    // Find the question card and update it
                    const questionCard = document.querySelector(`.question-card:has(.answer-controls .translate-question-btn[data-question-id="${questionId}"])`);
                    if (questionCard) {
                        const questionElement = questionCard.querySelector('.question-card > div > div:has(strong)');
                        const answerElement = questionCard.querySelector('.answer-text');
                        
                        if (questionData.responseStatus === 200 && questionElement) {
                            const originalQuestion = questionElement.textContent;
                            questionElement.innerHTML = `
                                <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: #fef3c7; border-radius: 0.25rem; font-size: 0.875rem;">
                                    <strong>Tamil:</strong> ${questionData.responseData.translatedText}
                                </div>
                                <div style="font-size: 0.875rem; color: var(--text-muted);">
                                    <strong>English:</strong> ${originalQuestion}
                                </div>
                            `;
                        }
                        
                        if (answerData.responseStatus === 200 && answerElement) {
                            const originalAnswer = answerElement.textContent;
                            answerElement.innerHTML = `
                                <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: #f0fdf4; border-radius: 0.25rem; font-size: 0.875rem;">
                                    <strong>தமிழ்:</strong> ${answerData.responseData.translatedText}
                                </div>
                                <div style="font-size: 0.875rem; color: var(--text-muted);">
                                    <strong>English:</strong> ${originalAnswer}
                                </div>
                            `;
                        }
                    }
                } catch (error) {
                    console.error('Translation error:', error);
                    alert('Translation failed. Please try again.');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path></svg> Translate';
                }
            });
        });

        // Save button handlers (Save as Important)
        document.querySelectorAll('.save-important-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                toggleSaveImportant(questionId);

                // Re-render so badge + filter count update immediately
                displayQuestionSummary();
                const filtered = currentFilter === 'all'
                    ? allQuestions
                    : currentFilter === 'important'
                    ? allQuestions.filter(q => isImportant(q.id))
                    : allQuestions.filter(q => q.marks == currentFilter);
                renderQuestions(filtered);
            });
        });

        // Important is controlled via Admin + Save button
    }

    // Media Management Functions
    function getQuestionMedia(questionId) {
        const stored = localStorage.getItem(QUESTION_MEDIA_STORAGE_KEY);
        if (!stored) return null;
        const mediaData = JSON.parse(stored);
        return mediaData[questionId] || null;
    }
    
    function saveQuestionMedia(questionId, mediaData) {
        const stored = localStorage.getItem(QUESTION_MEDIA_STORAGE_KEY);
        const mediaDataObj = stored ? JSON.parse(stored) : {};
        mediaDataObj[questionId] = mediaData;
        localStorage.setItem(QUESTION_MEDIA_STORAGE_KEY, JSON.stringify(mediaDataObj));
    }
    
    function removeQuestionMedia(questionId) {
        const stored = localStorage.getItem(QUESTION_MEDIA_STORAGE_KEY);
        if (!stored) return;
        const mediaDataObj = JSON.parse(stored);
        delete mediaDataObj[questionId];
        localStorage.setItem(QUESTION_MEDIA_STORAGE_KEY, JSON.stringify(mediaDataObj));
    }

    // Media Upload Modal Functionality
    let currentMediaQuestionId = null;
    const mediaModal = document.getElementById('mediaModal');
    const mediaClose = document.getElementById('mediaClose');
    const mediaFileInput = document.getElementById('mediaFileInput');
    const mediaPreview = document.getElementById('mediaPreview');
    const mediaPreviewContent = document.getElementById('mediaPreviewContent');
    const removeMediaBtn = document.getElementById('removeMediaBtn');
    const saveMediaBtn = document.getElementById('saveMediaBtn');
    let currentMediaFile = null;

    if (mediaClose) {
        mediaClose.addEventListener('click', () => {
            mediaModal.classList.remove('active');
            currentMediaQuestionId = null;
            currentMediaFile = null;
            mediaFileInput.value = '';
            mediaPreview.style.display = 'none';
        });
    }

    if (mediaModal) {
        mediaModal.addEventListener('click', (e) => {
            if (e.target === mediaModal) {
                mediaModal.classList.remove('active');
                currentMediaQuestionId = null;
                currentMediaFile = null;
                mediaFileInput.value = '';
                mediaPreview.style.display = 'none';
            }
        });
    }

    if (mediaFileInput) {
        mediaFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                alert('Please upload an image or video file.');
                return;
            }

            // File size validation removed - users can upload files of any size

            currentMediaFile = file;
            const reader = new FileReader();
            reader.onload = function(e) {
                const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
                mediaPreviewContent.innerHTML = mediaType === 'image'
                    ? `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: var(--radius-lg);">`
                    : `<video src="${e.target.result}" controls style="max-width: 100%; border-radius: var(--radius-lg);"></video>`;
                mediaPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeMediaBtn) {
        removeMediaBtn.addEventListener('click', () => {
            if (currentMediaQuestionId) {
                removeQuestionMedia(currentMediaQuestionId);
                const filteredQuestions = currentFilter === 'all'
                    ? allQuestions
                    : currentFilter === 'important'
                    ? allQuestions.filter(q => isImportant(q.id))
                    : allQuestions.filter(q => q.marks == currentFilter);
                renderQuestions(filteredQuestions);
            }
            mediaPreview.style.display = 'none';
            mediaFileInput.value = '';
            currentMediaFile = null;
        });
    }

    if (saveMediaBtn) {
        saveMediaBtn.addEventListener('click', () => {
            if (!currentMediaQuestionId) return;

            if (currentMediaFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const mediaType = currentMediaFile.type.startsWith('image/') ? 'image' : 'video';
                    saveQuestionMedia(currentMediaQuestionId, {
                        type: mediaType,
                        data: e.target.result,
                        filename: currentMediaFile.name
                    });
                    
                    const filteredQuestions = currentFilter === 'all'
                        ? allQuestions
                        : currentFilter === 'important'
                        ? allQuestions.filter(q => isImportant(q.id))
                        : allQuestions.filter(q => q.marks == currentFilter);
                    renderQuestions(filteredQuestions);
                    
                    mediaModal.classList.remove('active');
                    currentMediaQuestionId = null;
                    currentMediaFile = null;
                    mediaFileInput.value = '';
                    mediaPreview.style.display = 'none';
                };
                reader.readAsDataURL(currentMediaFile);
            } else {
                alert('Please select a file first.');
            }
        });
    }

    // Chat Functionality
    let currentChatQuestionId = null;
    let chatHistory = [];
    const chatButton = document.getElementById('chatButton');
    const chatModal = document.getElementById('chatModal');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');
    const chatHeaderTitle = document.getElementById('chatHeaderTitle');
    const chatWelcomeMessage = document.getElementById('chatWelcomeMessage');

    function openGeneralChat() {
        currentChatQuestionId = null;
        chatHistory = [];
        if (chatHeaderTitle) chatHeaderTitle.textContent = 'Chat About Questions';
        if (chatWelcomeMessage) chatWelcomeMessage.textContent = 'Hello! I\'m here to help you with questions. Ask me anything!';
        
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="chat-message bot-message">
                    <div class="message-content">
                        <p id="chatWelcomeMessage">Hello! I'm here to help you with questions. Ask me anything!</p>
                    </div>
                </div>
            `;
        }
        
        chatModal.classList.add('active');
        if (chatInput) chatInput.focus();
    }

    // Backend chat endpoint (server-side OpenAI proxy)
    const CHAT_API_ENDPOINT = 'api/chat.php';

    function localFallbackForGeneralChat(userMessage) {
        const m = (userMessage || '').toLowerCase();
        if (m.includes('input')) {
            return (
                "**Input (உள்ளீடு) என்றால் என்ன?**\n\n" +
                "Input என்பது ஒரு computer/program-க்கு நாம் கொடுக்கும் data அல்லது instructions.\n\n" +
                "**Examples:**\n" +
                "- Keyboard-ல type பண்ணுற text\n" +
                "- Mouse click\n" +
                "- Form-ல enter பண்ணுற name/marks\n\n" +
                "இதுக்கு எதிர் தான் **Output (வெளியீடு)** — program process பண்ணி தரும் result."
            );
        }
        return null;
    }

    if (chatButton) {
        chatButton.addEventListener('click', () => {
            openGeneralChat();
        });
    }

    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatModal.classList.remove('active');
            currentChatQuestionId = null;
        });
    }

    if (chatModal) {
        chatModal.addEventListener('click', (e) => {
            if (e.target === chatModal) {
                chatModal.classList.remove('active');
                currentChatQuestionId = null;
            }
        });
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        chatHistory.push({ role: 'user', content: message });
        chatInput.value = '';

        // Disable input while processing
        if (chatInput) chatInput.disabled = true;
        if (chatSend) chatSend.disabled = true;

        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-message bot-message';
        typingIndicator.id = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="message-content">
                <p style="color: var(--text-muted); font-style: italic;">ChatGPT is thinking...</p>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const question = currentChatQuestionId ? allQuestions.find(q => q.id === currentChatQuestionId) : null;

            const response = await fetch(CHAT_API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    question: question ? question.question : '',
                    answer: question ? question.answer : '',
                    marks: question ? question.marks : 0,
                    history: chatHistory.slice(-10),
                })
            });

            const responseText = await response.text();
            let data = null;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error('Server returned an invalid response.');
            }

            if (!response.ok) {
                const msg = (data && (data.message || data.error)) ? (data.message || data.error) : `Request failed (${response.status})`;
                throw new Error(msg);
            }

            const botResponse = (data && (data.reply || data.message)) ? (data.reply || data.message) : '';
            if (!botResponse) throw new Error('Empty AI response');

            // Remove typing indicator
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();

            chatHistory.push({ role: 'assistant', content: botResponse });
            addMessage(botResponse, 'bot');
        } catch (error) {
            console.error('ChatGPT API Error:', error);
            
            // Remove typing indicator
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();
            
            // Fallback to local responses
            let botResponse = '';
            const question = currentChatQuestionId ? allQuestions.find(q => q.id === currentChatQuestionId) : null;
            
            if (question) {
                botResponse = `**Question:** ${question.question}\n\n**Answer (from your notes):**\n${question.answer}\n\n**Note:** AI chat is not available right now. To enable it, add this to your project \`.env\` file:\nOPENAI_API_KEY=your_key_here\n\nThen refresh the page.\n\n**Your Question:** ${message}`;
            } else {
                botResponse = localFallbackForGeneralChat(message) ||
                    `AI chat is not available right now.\n\n**To enable AI:** create/update \`.env\` in the project root with:\nOPENAI_API_KEY=your_key_here\n(Optionally: OPENAI_MODEL=gpt-4o-mini)\n\nThen refresh the page.\n\n**Your Question:** ${message}`;
            }
            
            chatHistory.push({ role: 'assistant', content: botResponse });
            addMessage(botResponse, 'bot');
        } finally {
            // Re-enable input
            if (chatInput) chatInput.disabled = false;
            if (chatSend) chatSend.disabled = false;
            if (chatInput) chatInput.focus();
        }
    }

    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;
        
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p style="white-space: pre-wrap;">${formattedText}</p>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (chatSend) {
        chatSend.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // PDF Export Functionality
    const exportPDFBtn = document.getElementById('exportPDFBtn');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', () => {
            exportQuestionsToPDF();
        });
    }

    function exportQuestionsToPDF() {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library not loaded. Please refresh the page and try again.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const userData = JSON.parse(localStorage.getItem('ready2study_user')) || {};
        const userName = userData.name || 'Student';
        const course = userData.course || '';
        const college = userData.college || '';
        
        const pdfData = JSON.parse(localStorage.getItem('ready2study_pdf')) || {};
        const pdfName = pdfData.name || 'Study Material';
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let yPos = margin;
        
        function addText(text, x, y, maxWidth, fontSize = 11, isBold = false) {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return lines.length * (fontSize * 0.4);
        }
        
        function checkNewPage(requiredSpace) {
            if (yPos + requiredSpace > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
                return true;
            }
            return false;
        }
        
        // Title Page
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(99, 102, 241);
        doc.text('Ready2Study', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;
        
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text('Questions & Answers', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`PDF: ${pdfName}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        
        if (userName !== 'Student') {
            doc.text(`Student: ${userName}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
        }
        if (course) {
            doc.text(`Course: ${course}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
        }
        if (college) {
            doc.text(`College: ${college}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
        }
        
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;
        
        const questionsByMarks = {
            1: allQuestions.filter(q => q.marks === 1),
            2: allQuestions.filter(q => q.marks === 2),
            3: allQuestions.filter(q => q.marks === 3),
            10: allQuestions.filter(q => q.marks === 10)
        };
        
        [1, 2, 3, 10].forEach(marks => {
            const questions = questionsByMarks[marks];
            if (questions.length === 0) return;
            
            if (yPos > margin + 20) {
                doc.addPage();
                yPos = margin;
            }
            
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(99, 102, 241);
            yPos += addText(`${marks} Mark${marks > 1 ? 's' : ''} Questions`, margin, yPos, maxWidth, 16, true);
            yPos += 10;
            
            questions.forEach((q, index) => {
                checkNewPage(30);
                
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                const questionText = `Q${index + 1}: ${q.question}`;
                yPos += addText(questionText, margin, yPos, maxWidth, 12, true);
                yPos += 5;
                
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                yPos += addText('Answer:', margin, yPos, maxWidth, 11, true);
                yPos += 2.5;
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                const cleanAnswer = q.answer
                    .replace(/\*\*/g, '')
                    .replace(/\n/g, ' ')
                    .trim();
                yPos += addText(cleanAnswer, margin, yPos, maxWidth, 10, false);
                yPos += 10;
                
                if (index < questions.length - 1) {
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, yPos, pageWidth - margin, yPos);
                    yPos += 5;
                }
            });
            
            yPos += 5;
        });
        
        const fileName = `Ready2Study_Questions_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }

    // Sources Sidebar Functions
    function showSourcesSidebar(questionText, question) {
        const sidebar = document.getElementById('sourcesSidebar');
        const overlay = document.getElementById('sourcesSidebarOverlay');
        const loading = document.getElementById('sourcesLoading');
        const content = document.getElementById('sourcesContent');
        const videoLinks = document.getElementById('videoLinks');
        const articleLinks = document.getElementById('articleLinks');
        const relatedImages = document.getElementById('relatedImages');

        // Show sidebar and overlay
        sidebar.classList.add('active');
        overlay.classList.add('active');
        
        // Show loading
        loading.style.display = 'flex';
        content.style.display = 'none';

        // Generate sources based on question text
        setTimeout(() => {
            generateSources(questionText, question, videoLinks, articleLinks, relatedImages);
            loading.style.display = 'none';
            content.style.display = 'block';
        }, 500);
    }

    function generateSources(questionText, question, videoLinksEl, articleLinksEl, imagesEl) {
        // Extract keywords from question (first 5-7 words)
        const words = questionText.split(' ').slice(0, 7).join(' ');
        const searchQuery = encodeURIComponent(words);
        const tamilQuery = encodeURIComponent(`${words} தமிழ்`);

        // Generate YouTube video links
        const youtubeLinks = [
            {
                title: `YouTube: ${words} - Tamil Explanation`,
                url: `https://www.youtube.com/results?search_query=${tamilQuery}+explanation+tutorial`,
                icon: 'youtube'
            },
            {
                title: `YouTube: ${words} - Educational Video`,
                url: `https://www.youtube.com/results?search_query=${searchQuery}+educational`,
                icon: 'youtube'
            },
            {
                title: `YouTube: ${words} - Lecture`,
                url: `https://www.youtube.com/results?search_query=${searchQuery}+lecture`,
                icon: 'youtube'
            }
        ];

        videoLinksEl.innerHTML = youtubeLinks.map(link => `
            <a href="${link.url}" target="_blank" class="source-link">
                <div class="source-link-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
                    </svg>
                </div>
                <div class="source-link-content">
                    <div class="source-link-title">${link.title}</div>
                    <div class="source-link-url">${link.url.replace('https://www.', '').substring(0, 50)}...</div>
                </div>
            </a>
        `).join('');

        // Generate article links (Wikipedia, educational sites)
        const articleLinks = [
            {
                title: `Wikipedia: ${words}`,
                url: `https://en.wikipedia.org/wiki/Special:Search?search=${searchQuery}`,
                icon: 'wikipedia'
            },
            {
                title: `Khan Academy: ${words}`,
                url: `https://www.khanacademy.org/search?page_search_query=${searchQuery}`,
                icon: 'article'
            },
            {
                title: `Google Scholar: ${words}`,
                url: `https://scholar.google.com/scholar?q=${searchQuery}`,
                icon: 'article'
            },
            {
                title: `Britannica: ${words}`,
                url: `https://www.britannica.com/search?query=${searchQuery}`,
                icon: 'article'
            }
        ];

        articleLinksEl.innerHTML = articleLinks.map(link => `
            <a href="${link.url}" target="_blank" class="source-link">
                <div class="source-link-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 17H20v-2.5a2.5 2.5 0 0 0-2.5-2.5H9"></path>
                        <path d="M9 12H4V6.5A2.5 2.5 0 0 1 6.5 4H20v5.5a2.5 2.5 0 0 1-2.5 2.5H9z"></path>
                    </svg>
                </div>
                <div class="source-link-content">
                    <div class="source-link-title">${link.title}</div>
                    <div class="source-link-url">${link.url.replace('https://www.', '').replace('https://', '').substring(0, 50)}...</div>
                </div>
            </a>
        `).join('');

        // Generate related images (using Unsplash API with keywords)
        const imageKeywords = words.split(' ').slice(0, 3).join(' ');
        const imageUrls = [
            `https://source.unsplash.com/400x300/?${encodeURIComponent(imageKeywords)}&education`,
            `https://source.unsplash.com/400x300/?${encodeURIComponent(imageKeywords)}&study`,
            `https://source.unsplash.com/400x300/?${encodeURIComponent(imageKeywords)}&learning`,
            `https://source.unsplash.com/400x300/?${encodeURIComponent(imageKeywords)}&academic`
        ];

        imagesEl.innerHTML = imageUrls.map((url, index) => `
            <div class="source-image" onclick="window.open('${url}', '_blank')">
                <img src="${url}" alt="Related image ${index + 1}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Image+${index + 1}'">
            </div>
        `).join('');
    }

    // Close sources sidebar handlers
    const closeSourcesBtn = document.getElementById('closeSourcesSidebar');
    const sourcesOverlay = document.getElementById('sourcesSidebarOverlay');
    const sourcesSidebar = document.getElementById('sourcesSidebar');

    if (closeSourcesBtn) {
        closeSourcesBtn.addEventListener('click', () => {
            sourcesSidebar.classList.remove('active');
            sourcesOverlay.classList.remove('active');
        });
    }

    if (sourcesOverlay) {
        sourcesOverlay.addEventListener('click', () => {
            sourcesSidebar.classList.remove('active');
            sourcesOverlay.classList.remove('active');
        });
    }
});

