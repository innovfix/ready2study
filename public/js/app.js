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
        document.getElementById('studentHeaderInfo').style.display = 'block';
        document.getElementById('headerName').textContent = userData.name;
        document.getElementById('headerDetails').textContent = `${userData.course} • ${userData.year}${getOrdinal(userData.year)} Year • ${userData.college}`;

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
        if (highlights.length === 0) return;

        const textContent = answerElement.textContent || answerElement.innerText || '';
        if (!textContent) return;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = answerElement.innerHTML;
        const cleanText = tempDiv.textContent || tempDiv.innerText || '';
        
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

        const sortedHighlights = [...highlights].sort((a, b) => b.start - a.start);
        
        let segments = [];
        let lastIndex = cleanText.length;
        
        sortedHighlights.forEach(highlight => {
            if (highlight.start < 0 || highlight.end > cleanText.length || highlight.start >= highlight.end) {
                return;
            }
            
            if (highlight.end < lastIndex) {
                segments.unshift({
                    type: 'text',
                    content: cleanText.substring(highlight.end, lastIndex)
                });
            }
            
            segments.unshift({
                type: 'highlight',
                id: highlight.id,
                content: cleanText.substring(highlight.start, highlight.end)
            });
            
            lastIndex = highlight.start;
        });
        
        if (lastIndex > 0) {
            segments.unshift({
                type: 'text',
                content: cleanText.substring(0, lastIndex)
            });
        }
        
        let htmlContent = '';
        segments.forEach(segment => {
            if (segment.type === 'highlight') {
                htmlContent += `<span class="highlight" data-highlight-id="${segment.id}">${escapeHtml(segment.content)}</span>`;
            } else {
                htmlContent += escapeHtml(segment.content);
            }
        });

        const answerLabel = answerElement.querySelector('strong');
        if (answerLabel && answerLabel.textContent.includes('Answer:')) {
            answerElement.innerHTML = '<strong>Answer:</strong><br>' + htmlContent;
        } else {
            answerElement.innerHTML = htmlContent;
        }
    }

    function highlightSelectedText(questionId, answerElement) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.toString().trim().length === 0) {
            return false;
        }

        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();
        
        if (selectedText.length === 0) return false;

        if (!answerElement.contains(range.commonAncestorContainer)) {
            return false;
        }

        if (range.commonAncestorContainer.parentElement?.classList.contains('highlight')) {
            return false;
        }

        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(answerElement);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const startOffset = preCaretRange.toString().length;

        const endOffset = startOffset + selectedText.length;
        const highlightId = Date.now();

        const highlights = getQuestionHighlights(questionId);
        highlights.push({
            id: highlightId,
            start: startOffset,
            end: endOffset,
            text: selectedText
        });
        saveQuestionHighlights(questionId, highlights);

        try {
            const highlightSpan = document.createElement('span');
            highlightSpan.className = 'highlight';
            highlightSpan.setAttribute('data-highlight-id', highlightId);
            highlightSpan.textContent = selectedText;
            
            range.deleteContents();
            range.insertNode(highlightSpan);
        } catch (e) {
            console.error('Error applying highlight:', e);
            const filteredQuestions = currentFilter === 'all'
                ? allQuestions
                : allQuestions.filter(q => q.marks == currentFilter);
            renderQuestions(filteredQuestions);
        }

        selection.removeAllRanges();
        highlightMode = false;
        updateHighlightButtons();

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
            
            document.querySelectorAll('.answer-text').forEach(answerText => {
                if (highlightMode) {
                    answerText.style.cursor = 'text';
                    answerText.style.userSelect = 'text';
                    answerText.style.webkitUserSelect = 'text';
                    answerText.style.mozUserSelect = 'text';
                    answerText.style.msUserSelect = 'text';
                } else {
                    answerText.style.cursor = '';
                    answerText.style.userSelect = '';
                    answerText.style.webkitUserSelect = '';
                    answerText.style.mozUserSelect = '';
                    answerText.style.msUserSelect = '';
                }
            });
        });
    }

    // Important Management Functions
    function getImportantQuestions() {
        const stored = localStorage.getItem(IMPORTANT_STORAGE_KEY);
        if (!stored) return [];
        const data = JSON.parse(stored);
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
            return data.map(id => ({ id, name: '' }));
        }
        return data;
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

    function isImportant(questionId) {
        const important = getImportantQuestions();
        return important.some(i => i.id === questionId);
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
    
    const initialFiltered = currentFilter === 'all'
        ? allQuestions
        : currentFilter === 'important'
        ? allQuestions.filter(q => isImportant(q.id))
        : allQuestions.filter(q => q.marks == currentFilter);
    
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

    allAnswersVisible = true;
    if (toggleAllBtn) {
        toggleAllBtn.textContent = "Hide All Answers";
    }

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

            const formattedAnswer = q.answer.replace(/\n/g, '<br>');
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
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <span style="background: ${markColor}; color: white; padding: 0.4rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem;">
                            ${q.marks} Mark${q.marks > 1 ? 's' : ''}
                        </span>
                        <span style="color: var(--text-muted); font-size: 0.875rem; font-weight: 600;">
                            Q${questionNumber}
                        </span>
                    </div>
                    
                    <div style="font-size: 1.25rem; font-weight: 700; color: #0f172a; line-height: 1.6; padding: 1.25rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid ${markColor}; margin-bottom: 1rem;">
                        ${q.question}
                    </div>
                    
                    ${mediaHtml}
                    
                    <div class="answer-section visible" style="display: block !important;">
                        <div style="font-size: 1.1rem; color: #1e293b; line-height: 1.8; padding: 1.25rem; background: #f0fdf4; border-radius: 0.5rem; border-left: 4px solid #10b981;">
                            <span style="color: #10b981; font-weight: 700;">Answer:</span> 
                            <span class="answer-text" data-question-id="${q.id}" style="color: #334155;">
                                ${formattedAnswer}
                            </span>
                            ${imageHtml}
                        </div>
                    </div>
                </div>
                        
                <div class="answer-controls" style="padding-top: 1rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-start; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn-icon chat-question-btn" title="Ask AI to clarify doubt" data-question-id="${q.id}" style="background: #dbeafe; color: #1e40af; border: 1px solid #60a5fa; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Clarify Doubt
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
                    <button class="btn-icon important-btn ${isImportantQuestion ? 'active' : ''}" title="Important" data-question-id="${q.id}" style="background: ${isImportantQuestion ? '#fef2f2' : '#fff'}; color: ${isImportantQuestion ? '#ef4444' : '#64748b'}; border: 1px solid ${isImportantQuestion ? '#fecaca' : '#e2e8f0'}; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isImportantQuestion ? '#ef4444' : 'none'}" stroke="${isImportantQuestion ? '#ef4444' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        ${isImportantQuestion ? 'Saved' : 'Save'}
                    </button>
                </div>
            `;

            const answerText = card.querySelector('.answer-text');
            const answerSection = card.querySelector('.answer-section');
            
            if (answerSection) {
                answerSection.classList.add('visible');
                answerSection.style.display = 'block';
                answerSection.style.visibility = 'visible';
            }
            
            if (answerText) {
                applyHighlights(q.id, answerText);
            }
            
            container.appendChild(card);
        });

        // Add button handlers
        addButtonHandlers();
    }

    function addButtonHandlers() {
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

        // Highlight button handlers
        document.querySelectorAll('.highlight-mode-btn').forEach(btn => {
            const questionId = parseInt(btn.getAttribute('data-question-id'));
            const answerText = document.querySelector(`.answer-text[data-question-id="${questionId}"]`);
            
            btn.dataset.highlightEnabled = 'false';
            
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (answerText) {
                    const isEnabled = btn.dataset.highlightEnabled === 'true';
                    
                    if (!isEnabled) {
                        btn.dataset.highlightEnabled = 'true';
                        btn.style.background = '#22c55e';
                        btn.style.color = 'white';
                        btn.style.borderColor = '#16a34a';
                        answerText.style.cursor = 'text';
                        answerText.style.userSelect = 'text';
                        answerText.style.background = '#fefce8';
                    } else {
                        btn.dataset.highlightEnabled = 'false';
                        btn.style.background = '#fef9c3';
                        btn.style.color = '#854d0e';
                        btn.style.borderColor = '#fde047';
                        answerText.style.cursor = '';
                        answerText.style.userSelect = '';
                        answerText.style.background = '';
                    }
                }
            });
            
            if (answerText) {
                answerText.addEventListener('mouseup', () => {
                    if (btn.dataset.highlightEnabled === 'true') {
                        highlightSelectedText(questionId, answerText);
                    }
                });
            }
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
        document.querySelectorAll('.important-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const isNowImportant = toggleImportant(questionId);
                
                if (isNowImportant) {
                    btn.classList.add('active');
                    btn.style.background = '#fef2f2';
                    btn.style.color = '#ef4444';
                    btn.querySelector('svg').setAttribute('fill', '#ef4444');
                } else {
                    btn.classList.remove('active');
                    btn.style.background = '';
                    btn.style.color = '';
                    btn.querySelector('svg').setAttribute('fill', 'none');
                }
                
                displayQuestionSummary();
            });
        });
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

            const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 20 * 1024 * 1024;
            if (file.size > maxSize) {
                alert(`File size exceeds ${file.type.startsWith('image/') ? '5MB' : '20MB'}. Please upload a smaller file.`);
                return;
            }

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

    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        chatInput.value = '';

        setTimeout(() => {
            let botResponse = '';
            const question = currentChatQuestionId ? allQuestions.find(q => q.id === currentChatQuestionId) : null;
            
            if (question) {
                // Question-specific AI responses
                if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('understand')) {
                    botResponse = `**Detailed Explanation:**\n\n${question.question}\n\n**Answer:**\n${question.answer}\n\nDoes this clarify your doubt? Feel free to ask for specific parts if you need further clarification!`;
                } else if (message.toLowerCase().includes('answer') || message.toLowerCase().includes('solution')) {
                    const briefAnswer = question.answer.length > 200 
                        ? question.answer.substring(0, 200) + '...' 
                        : question.answer;
                    botResponse = `**Brief Answer:**\n\n${briefAnswer}\n\nThis is a ${question.marks}-mark question. To understand it better, ask me to explain any specific part!`;
                } else if (message.toLowerCase().includes('hint') || message.toLowerCase().includes('help') || message.toLowerCase().includes('stuck')) {
                    botResponse = `**Hint:**\n\nThis is a ${question.marks}-mark question. Key areas to focus on:\n- Understand the core concept\n- Break down the problem into smaller parts\n- Connect to real-world examples\n\nWould you like me to explain any specific part of "${question.question}"?`;
                } else if (message.toLowerCase().includes('difficult') || message.toLowerCase().includes('hard') || message.toLowerCase().includes('confusing')) {
                    botResponse = `**Don't worry!** Many students find this challenging. Let me break it down:\n\n**Question:** ${question.question}\n\n**Simplified Explanation:** ${question.answer.substring(0, 100)}...\n\nWhat specific part confuses you the most? I can explain that in simpler terms!`;
                } else if (message.toLowerCase().includes('example')) {
                    botResponse = `**Real-World Example:**\n\nThinking about ${question.question}:\n- It relates to practical situations in your course\n- The key concept is crucial for exams\n\n**The Answer Explains:**\n${question.answer}\n\nDoes this help you see the connection?`;
                } else if (message.toLowerCase().includes('marks') || message.toLowerCase().includes('important')) {
                    botResponse = `**Question Value:** ${question.marks} mark${question.marks > 1 ? 's' : ''}\n\n**Why It's Important:**\nThis question tests your understanding of core concepts that appear frequently in exams.\n\n**Answer:**\n${question.answer}\n\nMake sure to remember this concept!`;
                } else {
                    botResponse = `**Question:** ${question.question}\n\n**Analysis:**\nYou asked: "${message}"\n\n**Answer:**\n${question.answer}\n\nLet me know if you need clarification on any part!`;
                }
            } else {
                // General chat responses when no specific question is selected
                if (message.toLowerCase().includes('all questions') || message.toLowerCase().includes('questions')) {
                    botResponse = `You have ${allQuestions.length} questions in total. You can:\n- Filter by marks (1, 2, 3, or 10 marks)\n- View important questions you've saved\n- Click "Clarify Doubt" on any question to chat about it\n\nWhich question would you like to explore?`;
                } else if (message.toLowerCase().includes('important')) {
                    const importantCount = getImportantQuestions().length;
                    botResponse = `You have ${importantCount} important question${importantCount !== 1 ? 's' : ''} marked. These are the ones you found challenging or want to review later. Use "Clarify Doubt" button to get help on any of them!`;
                } else if (message.toLowerCase().includes('test') || message.toLowerCase().includes('practice')) {
                    botResponse = `**Practice Test Details:**\n- Total Marks: 20\n- Time: 60 minutes\n- Pattern: 1×2 marks, 2×1 marks, 2×3 marks, 1×10 marks\n- Text/Voice Input: Available\n\nGo to dashboard and click "Start Practice Test" when ready. Good luck!`;
                } else if (message.toLowerCase().includes('help') || message.toLowerCase().includes('how')) {
                    botResponse = `**How I Can Help You:**\n✓ Clarify difficult questions\n✓ Explain concepts in simple terms\n✓ Provide hints and tips\n✓ Give real-world examples\n✓ Answer test-related questions\n\nClick "Clarify Doubt" on any question card, and I'll help you understand it better!`;
                } else {
                    botResponse = `I'm your AI study assistant! I can:\n- Explain any question in simpler terms\n- Provide hints when you're stuck\n- Give real-world examples\n- Clarify confusing concepts\n\nClick "Clarify Doubt" on any question to get specific help!`;
                }
            }
            
            addMessage(botResponse, 'bot');
        }, 500);
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
});

