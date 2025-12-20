// App Logic for Dashboard

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('questionsContainer');
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    const toggleAllBtn = document.getElementById('toggleAllAnswers');
    const toggleHighlightModeBtn = document.getElementById('toggleHighlightMode');
    const clearAllHighlightsBtn = document.getElementById('clearAllHighlights');

    let currentFilter = 'all';
    let allAnswersVisible = true; // Answers visible by default
    let selectedText = null;
    let selectedRange = null;
    let highlightMode = false;
    let viewMode = 'grid'; // ALWAYS 'grid' to show all questions
    let currentQuestionIndex = 0;
    let filteredQuestionsList = [];
    
    // All questions - will be loaded from localStorage or mockData
    let allQuestions = [];

    // Storage keys
    const HIGHLIGHTS_STORAGE_KEY = 'ready2study_highlights';
    const IMPORTANT_STORAGE_KEY = 'ready2study_important';
    const QUESTION_MEDIA_STORAGE_KEY = 'ready2study_question_media';

    // Load Student Info from API
    let userData = null;
    (async () => {
        try {
            const userResponse = await AuthAPI.getUser();
            userData = userResponse.user;
            localStorage.setItem('ready2study_user', JSON.stringify(userData));
        } catch (error) {
            // Silently fail - API endpoints may not exist (404 is expected for static HTML)
            // Fallback to localStorage if API fails
            try {
                const stored = localStorage.getItem('ready2study_user');
                if (stored) {
                    userData = JSON.parse(stored);
                } else {
                    // Only redirect if no user data at all
                    const currentPath = window.location.pathname;
                    if (!currentPath.includes('student-info.html') && !currentPath.includes('index.html')) {
                        // Don't redirect if already on registration pages
                    }
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        if (userData) {
            const headerInfo = document.getElementById('studentHeaderInfo');
            if (headerInfo) headerInfo.style.display = 'flex';
            
            // Set colorful, bold name
            const headerName = document.getElementById('headerName');
            if (headerName) headerName.textContent = userData.name;
            
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
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        await AuthAPI.logout();
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                    localStorage.removeItem('ready2study_user');
                    window.location.href = 'student-info.html';
                });
            }
        }
    })();
    

    function getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

    // Helper function for HTML escaping - must be defined before use
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Highlight Management Functions
    function getHighlights() {
        const stored = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    }

    function saveHighlights(highlights) {
        localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlights));
    }

    async function getQuestionHighlights(questionId) {
        // Use localStorage only - API endpoints don't exist for static HTML
        // This prevents 404 errors from showing in console
        const highlights = getHighlights();
        const questionHighlights = highlights[questionId] || [];
        // Ensure it's an array
        return Array.isArray(questionHighlights) ? questionHighlights : [];
    }

    async function saveQuestionHighlights(questionId, highlightData) {
        const highlights = getHighlights();
        highlights[questionId] = highlightData;
        saveHighlights(highlights);
        
        // Note: API endpoints don't exist for static HTML, so we only use localStorage
        // This prevents 404 errors from showing in console
    }

    async function applyHighlights(questionId, answerElement) {
        let highlights = [];
        try {
            highlights = await getQuestionHighlights(questionId);
        } catch (error) {
            console.error('Error getting highlights:', error);
            // Fallback to localStorage
            const highlightsData = getHighlights();
            highlights = highlightsData[questionId] || [];
        }
        
        // Ensure highlights is an array
        if (!Array.isArray(highlights)) {
            highlights = [];
        }
        
        if (highlights.length === 0) {
            // If no highlights, just ensure the element has clean text
            const currentText = answerElement.textContent || answerElement.innerText || '';
            if (currentText) {
                const answerLabel = answerElement.querySelector('strong');
                if (answerLabel && answerLabel.textContent.includes('Answer:')) {
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
        
        // escapeHtml function is already defined at the top of the file

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
    
    // escapeHtml function is already defined at the top of the file

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

        // Get the parent container that has the full answer (including "Answer:" label)
        const answerContainer = answerElement.parentElement;
        
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
                    // Get highlights asynchronously
                    getQuestionHighlights(questionId).then(highlights => {
                        highlights.push({
                            id: adjustedHighlightId,
                            start: startOffset,
                            end: adjustedEnd,
                            text: normalizedSelectedText
                        });
                        saveQuestionHighlights(questionId, highlights);
                        return applyHighlights(questionId, answerElement);
                    }).catch(err => {
                        console.error('Error adding highlight:', err);
                    });
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
                    // Get highlights asynchronously
                    getQuestionHighlights(questionId).then(highlights => {
                        highlights.push({
                            id: adjustedHighlightId,
                            start: adjustedStart,
                            end: adjustedEnd,
                            text: normalizedSelectedText
                        });
                        saveQuestionHighlights(questionId, highlights);
                        return applyHighlights(questionId, answerElement);
                    }).catch(err => {
                        console.error('Error adding highlight:', err);
                    });
                    selection.removeAllRanges();
                    return true;
                }
            }
            console.warn('Selected text mismatch:', { expectedText, selectedText: normalizedSelectedText });
            return false;
        }
        const highlightId = Date.now();

        // Save highlight (use normalized text) - get highlights asynchronously
        getQuestionHighlights(questionId).then(highlights => {
            highlights.push({
                id: highlightId,
                start: startOffset,
                end: endOffset,
                text: normalizedSelectedText
            });
            saveQuestionHighlights(questionId, highlights);

            // Re-apply all highlights to ensure proper rendering
            // This ensures highlights work correctly even when there are existing highlights
            return applyHighlights(questionId, answerElement);
        }).catch(err => {
            console.error('Error adding highlight:', err);
        });

        // Clear selection but keep highlight mode enabled for multiple highlights
        selection.removeAllRanges();
        
        // Don't disable highlight mode automatically - let user disable it manually
        // highlightMode = false;
        // updateHighlightButtons();

        return true;
    }

    function removeHighlight(questionId, highlightId) {
        // Get highlights asynchronously
        getQuestionHighlights(questionId).then(highlights => {
            const filtered = highlights.filter(h => h.id !== highlightId);
            saveQuestionHighlights(questionId, filtered);
            
            // Re-render the question
            const answerElement = document.querySelector(`.answer-text[data-question-id="${questionId}"]`);
            if (answerElement) {
                return applyHighlights(questionId, answerElement);
            }
        }).catch(err => {
            console.error('Error removing highlight:', err);
        });
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

        // Update sidebar highlight button
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

    // Toggle Highlight Mode from Sidebar
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

    // Clear All Highlights - Remove highlights from ALL questions
    if (clearAllHighlightsBtn) {
        clearAllHighlightsBtn.addEventListener('click', () => {
            if (!confirm('Are you sure you want to clear all highlights from all questions? This action cannot be undone.')) {
                return;
            }

            // Clear all highlights from localStorage
            saveHighlights({});
            
            // Re-render all questions to remove highlights
            const filteredQuestions = currentFilter === 'all'
                ? allQuestions
                : currentFilter === 'important'
                    ? allQuestions.filter(q => isImportant(q.id))
                    : allQuestions.filter(q => q.marks == currentFilter);
            
            renderQuestions(filteredQuestions);
            
            console.log('✅ All highlights cleared from all questions');
        });
    }

    // Important Management Functions
    function getImportantQuestions() {
        const stored = localStorage.getItem(IMPORTANT_STORAGE_KEY);
        if (!stored) return [];
        const data = JSON.parse(stored);
        // Handle old format (array of IDs) and new format (array of objects)
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
            // Convert old format to new format
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
            return false; // Removed
        } else {
            important.push({ id: questionId, name: name });
            saveImportantQuestions(important);
            return true; // Added
        }
    }

    function isImportant(questionId) {
        const important = getImportantQuestions();
        return important.some(i => i.id === questionId);
    }

    // Filter questions by marks
    function filterQuestionsByMarks(questions, filter) {
        if (filter === 'all') {
            return questions;
        } else if (filter === 'important') {
            return questions.filter(q => isImportant(q.id));
        } else {
            return questions.filter(q => q.marks == filter);
        }
    }

    // Load questions from API or localStorage fallback
    let allQuestionsLoaded = false;
    const pdfId = localStorage.getItem('ready2study_current_pdf_id');
    
    console.log('=== DASHBOARD LOADING QUESTIONS ===');
    console.log('PDF ID from localStorage:', pdfId);
    console.log('PDF ID type:', typeof pdfId);
    
    // Function to load and display questions
    async function loadAndDisplayQuestions() {
        if (pdfId) {
            try {
                console.log('→ Fetching questions from API for PDF ID:', pdfId);
                const questionsResponse = await QuestionAPI.getByPDF(pdfId);
                console.log('✓ API Response received:', questionsResponse);
                console.log('  Questions count:', questionsResponse.questions?.length || 0);
                
                if (questionsResponse.questions && questionsResponse.questions.length > 0) {
                    allQuestions = questionsResponse.questions.map(q => ({
                        id: q.id,
                        question: q.question_text || q.question || 'No question text',
                        answer: q.answer_text || q.answer || 'No answer provided',
                        marks: q.marks || 1,
                        examDate: q.exam_date,
                    }));
                    
                    console.log('✓ Questions mapped successfully:', allQuestions.length);
                    console.log('  Sample question:', {
                        id: allQuestions[0]?.id,
                        question: allQuestions[0]?.question?.substring(0, 50) + '...',
                        answer: allQuestions[0]?.answer?.substring(0, 50) + '...',
                        marks: allQuestions[0]?.marks
                    });
                    
                    allQuestionsLoaded = true;
                    localStorage.setItem('ready2study_pdf_questions', JSON.stringify(allQuestions));
                    console.log('✓ Questions saved to localStorage');
                    
                    // Display questions immediately
                    displayQuestionSummary();
                    const initialFiltered = filterQuestionsByMarks(allQuestions, currentFilter);
                    renderQuestions(initialFiltered);
                    return true; // Success
                } else {
                    console.warn('⚠ No questions found in API response');
                    return false;
                }
            } catch (error) {
                console.error('✗ Failed to load questions from API:', error);
                console.error('  Error details:', {
                    message: error.message,
                    stack: error.stack
                });
                return false;
            }
        } else {
            console.warn('⚠ No PDF ID found in localStorage');
            return false;
        }
    }
    
    // Try to load from API first, then fallback to localStorage
    loadAndDisplayQuestions().then(success => {
        if (!success) {
            console.log('→ Falling back to localStorage...');
            // Fallback logic continues below
        }
    });
    
    // Load questions from localStorage immediately (for instant display)
    const storedQuestions = localStorage.getItem('ready2study_pdf_questions');
    if (storedQuestions) {
        try {
            const parsed = JSON.parse(storedQuestions);
            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log('→ Found questions in localStorage, displaying immediately...');
                allQuestions = parsed;
                console.log('  Questions count:', allQuestions.length);
                
                // Display questions immediately from localStorage
                displayQuestionSummary();
                const initialFiltered = filterQuestionsByMarks(allQuestions, currentFilter);
                renderQuestions(initialFiltered);
            }
        } catch (e) {
            console.error('Error parsing stored questions:', e);
        }
    }
    
    // Fallback to localStorage if API fails (will be checked after async load completes)
    setTimeout(() => {
        if (!allQuestionsLoaded && storedQuestions) {
            try {
                const parsed = JSON.parse(storedQuestions);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    allQuestions = parsed;
                } else {
                    allQuestions = mockQuestions;
                    localStorage.setItem('ready2study_pdf_questions', JSON.stringify(mockQuestions));
                    console.log('✅ Loaded all questions from mockData');
                }
            } catch (e) {
                console.error('Error parsing stored questions:', e);
                allQuestions = mockQuestions;
                localStorage.setItem('ready2study_pdf_questions', JSON.stringify(mockQuestions));
                console.log('✅ Reset to mockData due to error');
            }
        } else if (!allQuestionsLoaded && !storedQuestions) {
            // Store mockQuestions in localStorage as PDF questions (for testing)
            allQuestions = mockQuestions;
            localStorage.setItem('ready2study_pdf_questions', JSON.stringify(mockQuestions));
            console.log('✅ Initialized with mockData questions:', allQuestions.length);
        }
        
        // Only re-render if we didn't already render from localStorage
        if (!allQuestionsLoaded && allQuestions.length > 0) {
            displayQuestionSummary();
            const initialFiltered = filterQuestionsByMarks(allQuestions, currentFilter);
            renderQuestions(initialFiltered);
        }
    }, 500); // Wait 500ms for API call to complete

    // Initialize - make sure we have questions to display
    if (allQuestions.length === 0) {
        allQuestions = mockQuestions;
    }
    
    console.log('Loaded questions from storage:', allQuestions.length, 'questions');
    console.log('Questions sample:', allQuestions.slice(0, 2));
    
    // Display question summary by marks
    displayQuestionSummary();
    
    // Hide PDF status card - show questions and answers instead
    const pdfStatusCard = document.getElementById('pdfStatusCard');
    if (pdfStatusCard) {
        pdfStatusCard.style.display = 'none';
    }
    
    // Set view mode to grid - show all questions on same page (DEFAULT)
    // FORCE grid mode - always show all questions
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
    
    // Ensure questions are rendered immediately if we have them
    if (allQuestions.length > 0 && container) {
        const initialFiltered = filterQuestionsByMarks(allQuestions, currentFilter);
        console.log('→ Rendering questions immediately on page load:', initialFiltered.length);
        renderQuestions(initialFiltered);
    } else if (container) {
        // Show message if no questions
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                <h3>No questions found.</h3>
                <p style="margin-top: 1rem;">Please upload a PDF and generate questions first.</p>
                <a href="index.html" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--gradient-primary); color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">
                    Upload PDF
                </a>
            </div>
        `;
    }
    
    // Display PDF Content First with Questions and Answers
    function displayPDFContent() {
        const pdfContentSection = document.getElementById('pdfContentSection');
        const pdfContentDisplay = document.getElementById('pdfContentDisplay');
        const togglePDFBtn = document.getElementById('togglePDFContent');
        
        if (!pdfContentSection || !pdfContentDisplay) return;
        
        const pdfContent = localStorage.getItem('ready2study_pdf_content');
        const pdfData = JSON.parse(localStorage.getItem('ready2study_pdf')) || {};
        const pdfName = pdfData.name || 'Uploaded Document';
        const storedQuestions = localStorage.getItem('ready2study_pdf_questions');
        let pdfQuestions = [];
        
        if (storedQuestions) {
            try {
                pdfQuestions = JSON.parse(storedQuestions);
            } catch (e) {
                console.error('Error parsing PDF questions:', e);
            }
        }
        
        console.log('Checking PDF content:', pdfContent ? pdfContent.substring(0, 50) + '...' : 'No content');
        console.log('PDF questions found:', pdfQuestions.length);
        
        if ((pdfContent && pdfContent.trim().length > 0) || pdfQuestions.length > 0) {
            // escapeHtml function is already defined at the top of the file
            
            let formattedHTML = '';
            
            // PDF Header
            formattedHTML += `
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border-radius: 0.5rem; border-left: 4px solid var(--primary); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary);">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        <div style="flex: 1;">
                            <h3 style="color: var(--primary); font-size: 1rem; font-weight: 600; margin: 0;">📖 Uploaded PDF Content</h3>
                            <p style="color: #64748b; font-size: 0.8rem; margin: 0.15rem 0 0 0;">${escapeHtml(pdfName)}</p>
                        </div>
                        <span style="background: rgba(99, 102, 241, 0.15); color: var(--primary); padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">${pdfQuestions.length} Questions</span>
                    </div>
                </div>
            `;
            
            // Display Questions and Answers from PDF - Organized by Marks
            if (pdfQuestions.length > 0) {
                // Group questions by marks
                const questionsByMarks = {
                    1: pdfQuestions.filter(q => q.marks === 1),
                    2: pdfQuestions.filter(q => q.marks === 2),
                    3: pdfQuestions.filter(q => q.marks === 3),
                    10: pdfQuestions.filter(q => q.marks === 10)
                };
                
                // Display questions organized by marks (1, 2, 3, 10)
                [1, 2, 3, 10].forEach(marks => {
                    const questions = questionsByMarks[marks];
                    if (questions.length > 0) {
                        const markColor = marks === 1 ? '#10b981' : marks === 2 ? '#3b82f6' : marks === 3 ? '#8b5cf6' : '#f59e0b';
                        const markLabel = marks === 1 ? '1 Mark' : marks === 2 ? '2 Marks' : marks === 3 ? '3 Marks' : '10 Marks';
                        
                        // Section Header
                        formattedHTML += `
                            <div style="margin-top: 2rem; margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, ${markColor}15 0%, ${markColor}08 100%); border-radius: 0.75rem; border-left: 5px solid ${markColor};">
                                <h3 style="color: ${markColor}; font-size: 1.5rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.75rem;">
                                    <span style="background: ${markColor}; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 1rem;">
                                        ${markLabel}
                                    </span>
                                    <span style="color: var(--text-muted); font-size: 0.875rem; font-weight: 600;">
                                        (${questions.length} Question${questions.length > 1 ? 's' : ''})
                                    </span>
                                </h3>
                            </div>
                        `;
                        
                        // Display each question one by one
                        questions.forEach((q, index) => {
                            const questionNumber = index + 1;
                            const isImportantQuestion = isImportant(q.id);
                            
                            formattedHTML += `
                                <div class="pdf-question-card" data-question-id="${q.id}" data-marks="${marks}" style="margin-bottom: 2rem; padding: 1.5rem; background: white; border-radius: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; border-left: 4px solid ${markColor};">
                                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                                        <span style="background: ${markColor}; color: white; padding: 0.4rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem;">
                                            ${marks} Mark${marks > 1 ? 's' : ''}
                                        </span>
                                        <span style="color: var(--text-muted); font-size: 0.875rem; font-weight: 600;">
                                            ${markLabel} - Q${questionNumber}
                                        </span>
                                    </div>
                                    
                                    <!-- Question -->
                                    <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a; line-height: 1.6; padding: 1rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid ${markColor}; margin-bottom: 1rem;">
                                        ${escapeHtml(q.question)}
                                    </div>
                                    
                                    <!-- Answer - Always Visible -->
                                    <div class="pdf-answer-section visible" style="font-size: 1rem; color: #1e293b; line-height: 1.8; padding: 1rem; background: #f0fdf4; border-radius: 0.5rem; border-left: 4px solid #10b981; margin-bottom: 1rem; display: block !important; visibility: visible !important; opacity: 1 !important;">
                                        <span style="color: #10b981; font-weight: 700;">Answer:</span> 
                                        <span class="pdf-answer-text" data-question-id="${q.id}" style="color: #334155;">
                                            ${escapeHtml(q.answer)}
                                        </span>
                                    </div>
                                    
                                    <!-- Buttons -->
                                    <div class="pdf-answer-controls" style="padding-top: 1rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-start; gap: 0.5rem; flex-wrap: wrap;">
                                        <button class="btn-icon pdf-chat-btn" title="Ask AI to clarify doubt" data-question-id="${q.id}" style="background: #dbeafe; color: #1e40af; border: 1px solid #60a5fa; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                            Clarify Doubt
                                        </button>
                                        <button class="btn-icon pdf-sources-btn" title="Video Sources" data-question-id="${q.id}" data-question-text="${q.question.replace(/"/g, '&quot;')}" style="background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>
                                            Sources
                                        </button>
                                        <button class="btn-icon pdf-highlight-btn" title="Highlight text" data-question-id="${q.id}" style="background: #fef9c3; color: #854d0e; border: 1px solid #fde047; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                                            Highlight
                                        </button>
                                        <button class="btn-icon pdf-listen-btn" title="Listen" data-question-id="${q.id}" style="background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                            Listen
                                        </button>
                                        <button class="btn-icon pdf-translate-btn" title="Translate to Tamil" data-question-id="${q.id}" data-question-text="${q.question.replace(/"/g, '&quot;')}" data-answer-text="${q.answer.replace(/"/g, '&quot;')}" style="background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path></svg>
                                            Translate
                                        </button>
                                        <button class="btn-icon pdf-save-btn ${isImportantQuestion ? 'active' : ''}" title="Important" data-question-id="${q.id}" style="background: ${isImportantQuestion ? '#fef2f2' : '#fff'}; color: ${isImportantQuestion ? '#ef4444' : '#64748b'}; border: 1px solid ${isImportantQuestion ? '#fecaca' : '#e2e8f0'}; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isImportantQuestion ? '#ef4444' : 'none'}" stroke="${isImportantQuestion ? '#ef4444' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                            ${isImportantQuestion ? 'Saved' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            `;
                        });
                    }
                });
            } else if (pdfContent && pdfContent.trim().length > 0) {
                // Show full PDF content (no truncation in inline display)
                const displayContent = pdfContent;
                const lines = displayContent.split('\n');
                
                formattedHTML += `<div style="font-family: 'Inter', sans-serif; font-size: 0.95rem; line-height: 1.8; color: var(--text-main); padding: 0.5rem;">`;
                
                lines.forEach((line, index) => {
                    const trimmedLine = line.trim();
                    
                    if (trimmedLine.length === 0) {
                        formattedHTML += '<br>';
                    } else if (trimmedLine.match(/^(Chapter|Section|Part|Unit|CHAPTER|SECTION)\s+\d+/i)) {
                        formattedHTML += `<h3 style="color: var(--primary); margin-top: ${index === 0 ? '0' : '1.5rem'}; margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: 700; padding-top: 0.5rem; border-top: 2px solid #e2e8f0;">${escapeHtml(trimmedLine)}</h3>`;
                    } else if (trimmedLine.match(/^\d+[\.\)]\s/)) {
                        formattedHTML += `<div style="margin-left: 1.5rem; margin-bottom: 0.5rem; padding-left: 0.5rem;">${escapeHtml(trimmedLine)}</div>`;
                    } else if (trimmedLine.match(/^[-•*]\s/)) {
                        formattedHTML += `<div style="margin-left: 1.5rem; margin-bottom: 0.5rem; padding-left: 0.5rem;">${escapeHtml(trimmedLine)}</div>`;
                    } else {
                        formattedHTML += `<p style="margin-bottom: 0.75rem; text-align: justify;">${escapeHtml(trimmedLine)}</p>`;
                    }
                });
                
                formattedHTML += '</div>';
            }
            
            pdfContentDisplay.innerHTML = formattedHTML;
            // Hide PDF content section - keep questions visible
            pdfContentSection.style.display = 'none';
            pdfContentSection.style.visibility = 'hidden';
            pdfContentSection.style.opacity = '0';
            console.log('PDF content section hidden - questions remain visible');
            
            // Add event handlers for PDF question buttons
            addPDFQuestionButtonHandlers();
            
            // Toggle button functionality
            if (togglePDFBtn) {
                const newToggleBtn = togglePDFBtn.cloneNode(true);
                togglePDFBtn.parentNode.replaceChild(newToggleBtn, togglePDFBtn);
                
                let isVisible = true;
                newToggleBtn.addEventListener('click', () => {
                    isVisible = !isVisible;
                    pdfContentDisplay.style.display = isVisible ? 'block' : 'none';
                    newToggleBtn.textContent = isVisible ? 'Hide PDF' : 'Show PDF';
                });
            }
        } else {
            pdfContentSection.style.display = 'none';
        }
    }
    
    // Add button handlers for PDF question cards
    function addPDFQuestionButtonHandlers() {
        // Chat button
        document.querySelectorAll('.pdf-chat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                openChatForQuestion(questionId);
            });
        });
        
        // Sources button
        document.querySelectorAll('.pdf-sources-btn').forEach(btn => {
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
        
        // Highlight button
        document.querySelectorAll('.pdf-highlight-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const answerText = document.querySelector(`.pdf-answer-text[data-question-id="${questionId}"]`);
                if (answerText) {
                    btn.dataset.highlightEnabled = btn.dataset.highlightEnabled === 'true' ? 'false' : 'true';
                    if (btn.dataset.highlightEnabled === 'true') {
                        answerText.style.cursor = 'text';
                        answerText.style.userSelect = 'text';
                        answerText.style.background = '#fefce8';
                        answerText.addEventListener('mouseup', function highlightHandler() {
                            setTimeout(() => {
                                highlightSelectedText(questionId, answerText);
                            }, 100);
                        });
                    } else {
                        answerText.style.cursor = '';
                        answerText.style.userSelect = '';
                        answerText.style.background = '';
                    }
                }
            });
        });
        
        // Listen button
        document.querySelectorAll('.pdf-listen-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const question = allQuestions.find(q => q.id === questionId);
                if (question && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const text = `Question: ${question.question}. Answer: ${question.answer}`;
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.rate = 0.9;
                    window.speechSynthesis.speak(utterance);
                }
            });
        });
        
        // Helper function to translate long text by splitting into chunks (for PDF translate buttons)
        async function translateTextChunked(text, langpair = 'en|ta', maxLength = 500) {
            if (!text || text.trim().length === 0) {
                return '';
            }
            
            // Ensure maxLength doesn't exceed 500 (API limit)
            maxLength = Math.min(maxLength, 500);
            
            // Clean and trim text
            text = text.trim();
            
            if (text.length <= maxLength) {
                // Text is short enough, translate directly
                try {
                    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`);
                    const data = await response.json();
                    
                    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                        return data.responseData.translatedText;
                    } else {
                        const errorMsg = data.responseDetails || data.responseStatus || 'Unknown error';
                        throw new Error('Translation failed: ' + errorMsg);
                    }
                } catch (error) {
                    throw new Error('Translation failed: ' + error.message);
                }
            }
            
            // Text is too long, split into chunks intelligently
            const chunks = [];
            let remainingText = text;
            
            while (remainingText.length > 0) {
                if (remainingText.length <= maxLength) {
                    // Last chunk
                    chunks.push(remainingText.trim());
                    break;
                }
                
                // Try to split at sentence boundaries first
                let chunk = remainingText.substring(0, maxLength);
                let lastPeriod = chunk.lastIndexOf('.');
                let lastQuestion = chunk.lastIndexOf('?');
                let lastExclamation = chunk.lastIndexOf('!');
                let lastNewline = chunk.lastIndexOf('\n');
                
                // Find the best split point
                let splitPoint = Math.max(lastPeriod, lastQuestion, lastExclamation, lastNewline);
                
                if (splitPoint > maxLength * 0.5) {
                    // Good split point found (at least halfway through)
                    chunk = remainingText.substring(0, splitPoint + 1).trim();
                    remainingText = remainingText.substring(splitPoint + 1).trim();
                } else {
                    // No good sentence boundary, try comma
                    let lastComma = chunk.lastIndexOf(',');
                    if (lastComma > maxLength * 0.5) {
                        chunk = remainingText.substring(0, lastComma + 1).trim();
                        remainingText = remainingText.substring(lastComma + 1).trim();
                    } else {
                        // No good punctuation, split at space
                        let lastSpace = chunk.lastIndexOf(' ');
                        if (lastSpace > maxLength * 0.5) {
                            chunk = remainingText.substring(0, lastSpace).trim();
                            remainingText = remainingText.substring(lastSpace + 1).trim();
                        } else {
                            // Force split at maxLength
                            chunk = remainingText.substring(0, maxLength).trim();
                            remainingText = remainingText.substring(maxLength).trim();
                        }
                    }
                }
                
                if (chunk.length > 0) {
                    chunks.push(chunk);
                }
            }
            
            // Translate each chunk sequentially
            const translatedChunks = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                // Double-check chunk length (should never exceed maxLength, but be safe)
                const safeChunk = chunk.length > maxLength ? chunk.substring(0, maxLength - 3) + '...' : chunk;
                
                try {
                    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(safeChunk)}&langpair=${langpair}`);
                    const data = await response.json();
                    
                    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                        translatedChunks.push(data.responseData.translatedText);
                    } else {
                        const errorMsg = data.responseDetails || data.responseStatus || 'Unknown error';
                        throw new Error('Translation failed for chunk ' + (i + 1) + ': ' + errorMsg);
                    }
                } catch (error) {
                    throw new Error('Translation failed for chunk ' + (i + 1) + ': ' + error.message);
                }
            }
            
            // Join all translated chunks with spaces
            return translatedChunks.join(' ');
        }
        
        // Translate button
        document.querySelectorAll('.pdf-translate-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const questionText = btn.getAttribute('data-question-text');
                const answerText = btn.getAttribute('data-answer-text');
                
                btn.disabled = true;
                btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path></svg> Translating...';
                
                try {
                    // Translate question and answer using chunked translation for long texts
                    const questionTranslation = await translateTextChunked(questionText, 'en|ta', 500);
                    const answerTranslation = await translateTextChunked(answerText, 'en|ta', 500);
                    
                    const card = document.querySelector(`.pdf-question-card[data-question-id="${questionId}"]`);
                    if (card) {
                        const questionEl = card.querySelector('.pdf-question-card > div:has(strong)');
                        const answerEl = card.querySelector(`.pdf-answer-text[data-question-id="${questionId}"]`);
                        if (questionEl && answerEl) {
                            questionEl.innerHTML = `<strong>Question:</strong> ${questionTranslation}<br><small style="color: #64748b;">(${questionText})</small>`;
                            answerEl.innerHTML = `${answerTranslation}<br><small style="color: #64748b;">(${answerText})</small>`;
                        }
                    }
                } catch (error) {
                    console.error('Translation error:', error);
                    alert('Translation failed. Please try again. Error: ' + error.message);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path></svg> Translate';
                }
            });
        });
        
        // Save button
        document.querySelectorAll('.pdf-save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const question = allQuestions.find(q => q.id === questionId);
                if (question) {
                    const isNowImportant = toggleImportant(questionId, question.question.substring(0, 50));
                    btn.classList.toggle('active', isNowImportant);
                    btn.style.background = isNowImportant ? '#fef2f2' : '#fff';
                    btn.style.color = isNowImportant ? '#ef4444' : '#64748b';
                    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="${isNowImportant ? '#ef4444' : 'none'}" stroke="${isNowImportant ? '#ef4444' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> ${isNowImportant ? 'Saved' : 'Save'}`;
                }
            });
        });
    }
    
    // Generate Questions Button Handler
    function setupGenerateQuestionsButton() {
        const generateBtn = document.getElementById('generateQuestionsBtn');
        if (!generateBtn) return;

        generateBtn.addEventListener('click', async () => {
            // Get current PDF ID from localStorage or API
            let pdfId = null;
            const pdfData = JSON.parse(localStorage.getItem('ready2study_pdf') || '{}');
            
            if (pdfData.id) {
                pdfId = pdfData.id;
            } else {
                // Try to get the latest PDF from API
                try {
                    const pdfsResponse = await PDFAPI.getAll();
                    if (pdfsResponse.pdfs && pdfsResponse.pdfs.length > 0) {
                        pdfId = pdfsResponse.pdfs[0].id;
                        // Store it for future use
                        localStorage.setItem('ready2study_pdf', JSON.stringify({
                            id: pdfId,
                            name: pdfsResponse.pdfs[0].original_name || 'Uploaded Document'
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching PDFs:', error);
                    alert('Unable to find uploaded PDF. Please upload a PDF first.');
                    return;
                }
            }

            if (!pdfId) {
                alert('No PDF found. Please upload a PDF first.');
                return;
            }

            // Disable button and show loading state
            const generateIcon = document.getElementById('generateQuestionsIcon');
            const generateText = document.getElementById('generateQuestionsText');
            const originalText = generateText.textContent;
            const originalHTML = generateBtn.innerHTML;

            generateBtn.disabled = true;
            generateBtn.style.opacity = '0.7';
            generateBtn.style.cursor = 'not-allowed';
            generateText.textContent = 'Generating Questions...';
            
            // Add spinner icon
            if (generateIcon) {
                generateIcon.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinner">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
                    </svg>
                `;
            }

            try {
                // Call API to generate questions
                const response = await PDFAPI.generateQuestions(pdfId);
                
                if (response.questions && response.questions.length > 0) {
                    // Store PDF ID for future use
                    localStorage.setItem('ready2study_current_pdf_id', pdfId);

                    // Reload questions from API to get all questions (including newly generated ones)
                    try {
                        const questionsResponse = await QuestionAPI.getByPDF(pdfId);
                        allQuestions = questionsResponse.questions.map(q => ({
                            id: q.id,
                            question: q.question_text || q.question,
                            answer: q.answer_text || q.answer,
                            marks: q.marks,
                            examDate: q.exam_date || new Date().toLocaleDateString()
                        }));
                        
                        // Update localStorage
                        localStorage.setItem('ready2study_pdf_questions', JSON.stringify(allQuestions));
                    } catch (loadError) {
                        console.error('Error reloading questions:', loadError);
                        // Fallback: use generated questions
                        const generatedQuestions = response.questions.map((q, index) => ({
                            id: q.id || `gen_${Date.now()}_${index}`,
                            question: q.question_text || q.question,
                            answer: q.answer_text || q.answer,
                            marks: q.marks || 1,
                            examDate: q.exam_date || new Date().toLocaleDateString()
                        }));
                        allQuestions = [...allQuestions, ...generatedQuestions];
                        localStorage.setItem('ready2study_pdf_questions', JSON.stringify(allQuestions));
                    }

                    // Show success message
                    alert(`Successfully generated ${response.count || response.questions.length} questions!`);

                    // Refresh the display
                    displayPDFContent();
                    renderQuestions(allQuestions);
                    updateQuestionProgress();

                    // Update filter counts
                    applyFilter(currentFilter);
                } else {
                    throw new Error('No questions were generated');
                }
            } catch (error) {
                console.error('Error generating questions:', error);
                alert('Failed to generate questions: ' + (error.message || 'Unknown error. Please try again.'));
            } finally {
                // Restore button state
                generateBtn.disabled = false;
                generateBtn.style.opacity = '1';
                generateBtn.style.cursor = 'pointer';
                generateText.textContent = originalText;
                if (generateIcon) {
                    generateIcon.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="18" x2="12" y2="12"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                    `;
                }
            }
        });
    }

    // Display PDF content first - ensure it runs after DOM is ready and questions are loaded
    function initializeDashboard() {
        console.log('Initializing dashboard...');
        
        // Setup Generate Questions button
        setupGenerateQuestionsButton();
        
        // First, display PDF content
        displayPDFContent();
        
        // Then render questions (only if not already rendered)
        const container = document.getElementById('questionsContainer');
        if (container) {
            if (container.children.length === 0) {
                const initialFiltered = allQuestions;
                console.log('Rendering questions:', initialFiltered.length);
    renderQuestions(initialFiltered);
            } else {
                console.log('Questions already rendered');
            }
        }
    }
    
    // Initialize dashboard immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => initializeDashboard(), 100);
        });
    } else {
        // DOM is already ready
        setTimeout(() => initializeDashboard(), 100);
    }
    
    // Also call after a delay to ensure everything is loaded
    setTimeout(() => {
        initializeDashboard();
    }, 500);
    
    // Initial render - show first question in one-by-one view
    const initialFiltered = allQuestions;
    currentQuestionIndex = 0; // Start from first question
    
    console.log('Initial render - One-by-one view, Questions count:', initialFiltered.length);
    
    // Render questions on page load - show first question (only if not already rendered)
    if (container && container.children.length === 0 && initialFiltered.length > 0) {
        renderQuestions(initialFiltered);
    }
    
    function displayPDFStatusCard() {
        const pdfUploaded = localStorage.getItem('ready2study_pdf_uploaded');
        const pdfName = localStorage.getItem('ready2study_pdf_name');
        const statusCard = document.getElementById('pdfStatusCard');
        const marksSummary = document.getElementById('marksSummary');
        const pdfFileName = document.getElementById('pdfFileName');
        
        if (pdfUploaded === 'true' && statusCard && marksSummary && allQuestions.length > 0) {
            statusCard.style.display = 'block';
            
            // Display PDF file name if available
            if (pdfFileName && pdfName) {
                pdfFileName.textContent = `File: ${pdfName}`;
            }
            
            const summary = {
                1: allQuestions.filter(q => q.marks === 1).length,
                2: allQuestions.filter(q => q.marks === 2).length,
                3: allQuestions.filter(q => q.marks === 3).length,
                10: allQuestions.filter(q => q.marks === 10).length
            };
            
            marksSummary.innerHTML = `
                <div style="background: rgba(255,255,255,0.25); padding: 1.25rem; border-radius: 0.75rem; text-align: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${summary[1]}</div>
                    <div style="font-size: 1rem; opacity: 0.95; font-weight: 600;">1 Mark Question${summary[1] !== 1 ? 's' : ''}</div>
                </div>
                <div style="background: rgba(255,255,255,0.25); padding: 1.25rem; border-radius: 0.75rem; text-align: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${summary[2]}</div>
                    <div style="font-size: 1rem; opacity: 0.95; font-weight: 600;">2 Marks Question${summary[2] !== 1 ? 's' : ''}</div>
                </div>
                <div style="background: rgba(255,255,255,0.25); padding: 1.25rem; border-radius: 0.75rem; text-align: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${summary[3]}</div>
                    <div style="font-size: 1rem; opacity: 0.95; font-weight: 600;">3 Marks Question${summary[3] !== 1 ? 's' : ''}</div>
                </div>
                <div style="background: rgba(255,255,255,0.25); padding: 1.25rem; border-radius: 0.75rem; text-align: center; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${summary[10]}</div>
                    <div style="font-size: 1rem; opacity: 0.95; font-weight: 600;">10 Marks Question${summary[10] !== 1 ? 's' : ''}</div>
                </div>
            `;
        } else if (statusCard) {
            statusCard.style.display = 'none';
        }
    }
    
    // Initialize view mode toggle
    const viewModeToggle = document.getElementById('viewModeToggle');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (viewModeToggle) {
        viewModeToggle.addEventListener('click', () => {
            viewMode = viewMode === 'one-by-one' ? 'grid' : 'one-by-one';
            currentQuestionIndex = 0;
            
            if (viewMode === 'one-by-one') {
                viewModeToggle.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    Grid View
                `;
            } else {
                viewModeToggle.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    One-by-One View
                `;
            }
            
            // Re-render with new view mode
            const filtered = currentFilter === 'all'
                ? allQuestions
                : currentFilter === 'important'
                ? allQuestions.filter(q => isImportant(q.id))
                : allQuestions.filter(q => q.marks == currentFilter);
            renderQuestions(filtered);
        });
    }
    
    // Navigation controls
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
            } else {
                currentQuestionIndex = filteredQuestionsList.length - 1;
            }
            const filtered = currentFilter === 'all'
                ? allQuestions
                : currentFilter === 'important'
                ? allQuestions.filter(q => isImportant(q.id))
                : allQuestions.filter(q => q.marks == currentFilter);
            renderQuestions(filtered);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentQuestionIndex < filteredQuestionsList.length - 1) {
                currentQuestionIndex++;
            } else {
                currentQuestionIndex = 0;
            }
            const filtered = currentFilter === 'all'
                ? allQuestions
                : currentFilter === 'important'
                ? allQuestions.filter(q => isImportant(q.id))
                : allQuestions.filter(q => q.marks == currentFilter);
            renderQuestions(filtered);
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (viewMode === 'one-by-one') {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                prevBtn?.click();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                nextBtn?.click();
            }
        }
    });
    
    function updateProgressIndicator() {
        const progressEl = document.getElementById('questionProgress');
        if (progressEl && filteredQuestionsList.length > 0) {
            const currentQ = filteredQuestionsList[currentQuestionIndex];
            const markGroup = {
                1: filteredQuestionsList.filter(q => q.marks === 1),
                2: filteredQuestionsList.filter(q => q.marks === 2),
                3: filteredQuestionsList.filter(q => q.marks === 3),
                10: filteredQuestionsList.filter(q => q.marks === 10)
            };
            
            const sameMarkQuestions = markGroup[currentQ.marks] || [];
            const indexInGroup = sameMarkQuestions.findIndex(q => q.id === currentQ.id) + 1;
            
            progressEl.innerHTML = `
                <span style="color: var(--primary); font-weight: 700;">Question ${currentQuestionIndex + 1} of ${filteredQuestionsList.length}</span>
                <span style="margin: 0 0.5rem; color: var(--border);">|</span>
                <span style="color: var(--text-muted);">${currentQ.marks} Mark${currentQ.marks > 1 ? 's' : ''} - ${indexInGroup} of ${sameMarkQuestions.length}</span>
            `;
        }
    }
    
    function updateNavigationControls() {
        const navControls = document.getElementById('navigationControls');
        if (navControls) {
            // Always show navigation controls for one-by-one view
            if (viewMode === 'one-by-one') {
                navControls.style.display = 'flex';
            } else {
                navControls.style.display = 'none';
            }
        }
    }
    
    // Note: Initial render is already done above, viewMode is already set to 'one-by-one'
    
    // Function to display question summary
    function displayQuestionSummary() {
        const summary = {
            1: allQuestions.filter(q => q.marks === 1).length,
            2: allQuestions.filter(q => q.marks === 2).length,
            3: allQuestions.filter(q => q.marks === 3).length,
            10: allQuestions.filter(q => q.marks === 10).length
        };
        
        // Update filter buttons with counts
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
            // Generate full PDF content from questions
            let fullContent = '<div style="max-width: 800px; margin: 0 auto;">';
            fullContent += '<h2 style="color: var(--primary); margin-bottom: 2rem; text-align: center;">Complete Study Material</h2>';
            
            // Group questions by marks
            const questionsByMarks = {
                1: allQuestions.filter(q => q.marks === 1),
                2: allQuestions.filter(q => q.marks === 2),
                3: allQuestions.filter(q => q.marks === 3),
                10: allQuestions.filter(q => q.marks === 10)
            };

            // Display all questions organized by marks
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

    // Image Viewer Modal Functions
    window.openImageModal = function(imageSrc, title) {
        const modal = document.getElementById('imageViewerModal');
        const img = document.getElementById('imageViewerImg');
        const titleEl = document.getElementById('imageViewerTitle');
        
        if (modal && img) {
            img.src = imageSrc;
            if (titleEl) titleEl.textContent = title || 'View Image';
            modal.classList.add('active');
        }
    };
    
    const imageViewerClose = document.getElementById('imageViewerClose');
    const imageViewerModal = document.getElementById('imageViewerModal');
    
    if (imageViewerClose) {
        imageViewerClose.addEventListener('click', () => {
            imageViewerModal.classList.remove('active');
        });
    }
    
    if (imageViewerModal) {
        imageViewerModal.addEventListener('click', (e) => {
            if (e.target === imageViewerModal) {
                imageViewerModal.classList.remove('active');
            }
        });
    }
    
    // Question Navigation for One-by-One View
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    
    if (prevQuestionBtn) {
        prevQuestionBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                const filteredQuestions = currentFilter === 'all'
                    ? allQuestions
                    : currentFilter === 'important'
                    ? allQuestions.filter(q => isImportant(q.id))
                    : allQuestions.filter(q => q.marks == currentFilter);
                renderQuestions(filteredQuestions);
                
                // Update button states
                updateNavigationButtons(filteredQuestions.length);
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    
    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', () => {
            const filteredQuestions = currentFilter === 'all'
                ? allQuestions
                : currentFilter === 'important'
                ? allQuestions.filter(q => isImportant(q.id))
                : allQuestions.filter(q => q.marks == currentFilter);
                
            if (currentQuestionIndex < filteredQuestions.length - 1) {
                currentQuestionIndex++;
                renderQuestions(filteredQuestions);
                
                // Update button states
                updateNavigationButtons(filteredQuestions.length);
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    
    // Update navigation button states
    function updateNavigationButtons(totalQuestions) {
        if (prevQuestionBtn) {
            prevQuestionBtn.disabled = currentQuestionIndex === 0;
            prevQuestionBtn.style.opacity = currentQuestionIndex === 0 ? '0.5' : '1';
            prevQuestionBtn.style.cursor = currentQuestionIndex === 0 ? 'not-allowed' : 'pointer';
        }
        
        if (nextQuestionBtn) {
            nextQuestionBtn.disabled = currentQuestionIndex >= totalQuestions - 1;
            nextQuestionBtn.style.opacity = currentQuestionIndex >= totalQuestions - 1 ? '0.5' : '1';
            nextQuestionBtn.style.cursor = currentQuestionIndex >= totalQuestions - 1 ? 'not-allowed' : 'pointer';
        }
    }

    // Filter Click Handlers
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter Data
            currentFilter = btn.dataset.filter;
            currentQuestionIndex = 0; // Reset to first question
            let filtered;
            
            if (currentFilter === 'all') {
                filtered = allQuestions;
            } else if (currentFilter === 'important') {
                filtered = allQuestions.filter(q => isImportant(q.id));
            } else {
                filtered = allQuestions.filter(q => q.marks == currentFilter);
            }

            // Reset to first question when filtering
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
        // Show all regular answer sections
        const answerSections = document.querySelectorAll('.answer-section');
        answerSections.forEach(section => {
            section.classList.add('visible');
            section.style.display = 'block';
            section.style.visibility = 'visible';
            section.style.opacity = '1';
        });
        
        // Show all PDF answer sections
        const pdfAnswerSections = document.querySelectorAll('.pdf-answer-section');
        pdfAnswerSections.forEach(section => {
            section.classList.add('visible');
            section.style.display = 'block';
            section.style.visibility = 'visible';
            section.style.opacity = '1';
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
        const pdfAnswerSections = document.querySelectorAll('.pdf-answer-section');
        const toggleBtns = document.querySelectorAll('.toggle-answer-btn');

        answerSections.forEach(section => {
                if (allAnswersVisible) {
                    section.classList.add('visible');
                    section.style.display = 'block';
                    section.style.visibility = 'visible';
                    section.style.opacity = '1';
                } else {
                    section.classList.remove('visible');
                    section.style.display = 'none';
                }
        });
        
        pdfAnswerSections.forEach(section => {
                if (allAnswersVisible) {
                    section.classList.add('visible');
                    section.style.display = 'block';
                    section.style.visibility = 'visible';
                    section.style.opacity = '1';
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
        
        // Clear container first to remove old elements and prevent duplicate handlers
        if (container) {
            container.innerHTML = '';
        } else {
            console.error('Questions container not found!');
            return;
        }
        
        // Store filtered questions for navigation
        filteredQuestionsList = questions;
        
        console.log('=== RENDERING QUESTIONS ===');
        console.log('Questions count:', questions.length);
        if (questions.length > 0) {
            console.log('First question:', {
                id: questions[0].id,
                question: questions[0].question?.substring(0, 50) + '...',
                answer: questions[0].answer?.substring(0, 50) + '...',
                hasAnswer: !!questions[0].answer && questions[0].answer.length > 0
            });
        }

        if (questions.length === 0) {
            if (currentFilter === 'important') {
                // Show test section even when no important questions
                container.innerHTML = `
                    <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                        <h3>No important questions yet.</h3>
                        <p style="margin-top: 1rem;">Mark questions as important to see them here.</p>
                    </div>
                `;
                return;
            } else {
                // Check if we have questions in allQuestions but they're filtered out
                const pdfId = localStorage.getItem('ready2study_current_pdf_id');
                if (pdfId && allQuestions.length === 0) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                            <h3>No questions found.</h3>
                            <p style="margin-top: 1rem;">Please upload a PDF and generate questions first.</p>
                            <a href="index.html" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--gradient-primary); color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">
                                Upload PDF
                            </a>
                        </div>
                    `;
                } else {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                            <h3>No questions found for this category.</h3>
                            <p style="margin-top: 1rem;">Try selecting "All Questions" to see all available questions.</p>
                        </div>
                    `;
                }
                return;
            }
        }

        // Group questions by marks
        const questionsByMarks = {
            1: questions.filter(q => q.marks === 1),
            2: questions.filter(q => q.marks === 2),
            3: questions.filter(q => q.marks === 3),
            10: questions.filter(q => q.marks === 10)
        };
        
        const progressEl = document.getElementById('questionProgress');
        const navControls = document.getElementById('navigationControls');
        
        // Check if we have questions
        if (questions.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 4rem; color: var(--text-muted);"><h3>No questions available.</h3><p>Please upload a PDF or add questions.</p></div>';
            return;
        }
        
        // GRID MODE: Show ALL questions at once
        let questionsToRender = questions;
        
        // Remove one-by-one view class and add grid view class
        container.classList.remove('one-by-one-view');
        container.classList.add('questions-grid');
        
        // Hide navigation controls in grid mode
        if (navControls) {
            navControls.style.display = 'none';
        }
        
        // Update progress indicator to show total count
        if (progressEl) {
            progressEl.textContent = `Showing ${questions.length} question${questions.length !== 1 ? 's' : ''}`;
            progressEl.style.display = 'block';
        }
        
        console.log(`✅ Rendering ALL ${questions.length} questions in grid mode`);

        // Ensure container is visible
        if (container) {
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.visibility = 'visible';
        }
        
        console.log('About to render', questionsToRender.length, 'questions');
        
        questionsToRender.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.style.display = 'block';
            card.style.visibility = 'visible';
            card.style.opacity = '1';

            // Format answer with line breaks if needed
            const answerText = q.answer || q.answer_text || 'No answer provided';
            
            // Format answer as list if it contains list items
            let formattedAnswer = answerText;
            
            // Check if answer contains comma-separated list items (common pattern)
            // Pattern: "item1, item2, item3" or "item1,item2,item3"
            if (answerText.includes(',') && !answerText.includes('\n')) {
                // Split by comma and format as list
                const items = answerText.split(',').map(item => item.trim()).filter(item => item.length > 0);
                if (items.length > 1) {
                    // Format as list with each item on a new line
                    formattedAnswer = items.map(item => {
                        // Remove leading numbers/bullets if present
                        item = item.replace(/^[\d]+[\.\)]\s*/, '').replace(/^[-•]\s*/, '');
                        return item;
                    }).join('<br>');
                } else {
                    formattedAnswer = answerText.replace(/\n/g, '<br>');
                }
            } 
            // Check for numbered lists (1. item, 2. item, etc.)
            else if (answerText.match(/^\d+[\.\)]\s+/m) || answerText.match(/\n\d+[\.\)]\s+/)) {
                formattedAnswer = answerText
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
            else if (answerText.match(/^[-•]\s+/m) || answerText.match(/\n[-•]\s+/)) {
                formattedAnswer = answerText
                    .split(/\n/)
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('<br>');
            }
            // Regular text - just replace newlines with <br>
            else {
                formattedAnswer = answerText.replace(/\n/g, '<br>');
            }
            
            // Ensure question text exists
            let questionText = q.question || q.question_text || 'No question text';
            
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
            
            // Check if question contains pronouns and fix it
            const pronounPattern = /\b(what is|explain|describe|write about|discuss)\s+(this|these|that|those|then|there|their|they|them|it|its|he|she|him|her|his|hers|we|us|our|ours|you|your|yours|i|me|my|mine)\b/gi;
            if (pronounPattern.test(questionText)) {
                const noun = extractNounFromAnswer(answerText);
                if (noun) {
                    // Replace pronoun with actual noun
                    questionText = questionText.replace(/\b(this|these|that|those|then|there|their|they|them|it|its|he|she|him|her|his|hers|we|us|our|ours|you|your|yours|i|me|my|mine)\b/gi, noun);
                    console.log(`Fixed pronoun in question: "${q.question || q.question_text}" → "${questionText}"`);
                } else {
                    // If no noun found, try to extract from answer text more aggressively
                    const sentences = answerText.split(/[.!?]+/).filter(s => s.trim().length > 20);
                    for (const sentence of sentences) {
                        const noun = extractNounFromAnswer(sentence);
                        if (noun) {
                            questionText = questionText.replace(/\b(this|these|that|those|then|there|their|they|them|it|its|he|she|him|her|his|hers|we|us|our|ours|you|your|yours|i|me|my|mine)\b/gi, noun);
                            console.log(`Fixed pronoun in question using sentence: "${q.question || q.question_text}" → "${questionText}"`);
                            break;
                        }
                    }
                }
            }
            
            console.log(`Rendering question ${index + 1}:`, {
                id: q.id,
                question: questionText?.substring(0, 50) + '...',
                answer: answerText?.substring(0, 50) + '...',
                hasAnswer: !!answerText && answerText !== 'No answer provided' && answerText.length > 0,
                marks: q.marks
            });

            // Image HTML if exists - clickable to expand
            const imageHtml = q.image ? `<div class="answer-image-container" style="cursor: pointer;" onclick="openImageModal('${q.image}', 'Answer Diagram')"><img src="${q.image}" alt="Diagram for ${q.question}" class="answer-image" style="cursor: zoom-in;"></div>` : '';
            
            // Media HTML if exists (user-uploaded) - displayed on the side with click to expand
            const questionMedia = getQuestionMedia(q.id);
            const mediaHtml = questionMedia ? `
                <div class="question-media-container" style="cursor: pointer;" onclick="openImageModal('${questionMedia.data}', 'Uploaded Image')">
                    ${questionMedia.type === 'image' 
                        ? `<img src="${questionMedia.data}" alt="Question representation" style="cursor: zoom-in;">`
                        : `<video src="${questionMedia.data}" controls></video>`
                    }
                </div>
            ` : '';

            const isImportantQuestion = isImportant(q.id);
            const importantName = isImportantQuestion ? getImportantQuestionName(q.id) : '';

            // Get the mark badge color
            const markColors = {
                1: '#3b82f6',
                2: '#10b981',
                3: '#f59e0b',
                10: '#ef4444'
            };
            const markColor = markColors[q.marks] || '#6366f1';

            // Get question number in the list
            const questionNumber = index + 1;

            // Optional: Show which PDF a question came from (multi-PDF upload flow)
            const pdfNameBadge = q.pdfName ? `
                <span style="background: rgba(30, 64, 175, 0.10); color: var(--primary); padding: 0.35rem 0.75rem; border-radius: 999px; font-weight: 700; font-size: 0.75rem; max-width: 340px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    📄 ${escapeHtml(q.pdfName)}
                </span>
            ` : '';
            
            card.innerHTML = `
                <!-- Question and Answer Display with Mark Badge -->
                <div style="margin-bottom: 1rem;">
                    <!-- Mark Badge and Question Number -->
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <span style="background: ${markColor}; color: white; padding: 0.4rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.875rem;">
                            ${q.marks} Mark${q.marks > 1 ? 's' : ''}
                        </span>
                        <span style="color: #64748b; font-size: 0.875rem; font-weight: 600;">
                            Q${questionNumber}
                        </span>
                        ${pdfNameBadge}
                    </div>
                    
                    <!-- Question Box with Blue Border - Displayed FIRST -->
                    <div style="font-size: 1rem; font-weight: 600; color: #0f172a; line-height: 1.6; padding: 1.25rem; background: #ffffff; border-radius: 0.5rem; border: 2px solid #3b82f6; margin-bottom: 1rem;">
                        ${questionText}
                    </div>
                    
                    ${mediaHtml}
                    
                    <!-- Dotted Separator Line -->
                    <div style="border-top: 2px dotted #cbd5e1; margin: 1rem 0;"></div>
                    
                    <!-- Answer Box with Green Border - Displayed BELOW Question -->
                    <div class="answer-section visible" style="display: block !important; visibility: visible !important; opacity: 1 !important; margin-top: 1rem;">
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
                        
                <!-- Answer Controls -->
                <div class="answer-controls" style="padding-top: 0.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-start; gap: 0.3rem; flex-wrap: wrap;">
                    <button class="btn-icon chat-question-btn" title="Ask AI to clarify doubt" data-question-id="${q.id}" style="background: #dbeafe; color: #1e40af; border: 1px solid #60a5fa; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.2rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Clarify Doubt
                    </button>
                    <button class="btn-icon youtube-btn" title="Video Sources" data-question-id="${q.id}" data-question-text="${q.question.replace(/"/g, '&quot;')}" style="background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>
                        Sources
                    </button>
                    <button class="btn-icon highlight-mode-btn" title="Highlight text" data-question-id="${q.id}" style="background: #fef9c3; color: #854d0e; border: 1px solid #fde047; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                        Highlight
                    </button>
                    <button class="btn-icon unhighlight-question-btn" title="Remove highlights from this question" data-question-id="${q.id}" style="background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>
                        Unhighlight
                    </button>
                    <button class="btn-icon listen-btn" title="Listen" data-question-id="${q.id}" style="background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        Listen
                    </button>
                    <button class="btn-icon stop-listen-btn" title="Stop Listening" data-question-id="${q.id}" style="background: #fecaca; color: #991b1b; border: 1px solid #ef4444; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: none; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                        Stop
                    </button>
                    <button class="btn-icon translate-question-btn" title="Translate to Tamil" data-question-id="${q.id}" data-question-text="${q.question.replace(/"/g, '&quot;')}" data-answer-text="${q.answer.replace(/"/g, '&quot;')}" style="background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path></svg>
                        Translate
                    </button>
                    <button class="btn-icon untranslate-question-btn" title="Untranslate (Show English)" data-question-id="${q.id}" style="background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: none; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 8l-6 6"></path><path d="M20 14l-6-6 2-3"></path></svg>
                        Untranslate
                    </button>
                    <button class="btn-icon important-btn ${isImportantQuestion ? 'active' : ''}" title="Important" data-question-id="${q.id}" style="background: ${isImportantQuestion ? '#fef2f2' : '#fff'}; color: ${isImportantQuestion ? '#ef4444' : '#64748b'}; border: 1px solid ${isImportantQuestion ? '#fecaca' : '#e2e8f0'}; padding: 0.35rem 0.6rem; border-radius: 0.375rem; font-size: 0.7rem; display: flex; align-items: center; gap: 0.25rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isImportantQuestion ? '#ef4444' : 'none'}" stroke="${isImportantQuestion ? '#ef4444' : 'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        ${isImportantQuestion ? 'Saved' : 'Save'}
                    </button>
                </div>
            `;

            // Get answer text element for highlight functionality
            const answerTextElement = card.querySelector('.answer-text');
            const answerSection = card.querySelector('.answer-section');
            
            // Ensure answer is ALWAYS visible by default for reading
            if (answerSection) {
                answerSection.classList.add('visible');
                answerSection.style.display = 'block';
                answerSection.style.visibility = 'visible';
                answerSection.style.opacity = '1';
            }
            
            // Apply saved highlights - always show them
            if (answerTextElement) {
                // Apply highlights asynchronously (don't block rendering)
                applyHighlights(q.id, answerTextElement).catch(err => {
                    console.error('Error applying highlights:', err);
                });
            }
            
            container.appendChild(card);
            console.log('✓ Question card appended:', questionText.substring(0, 50) + '...');
            console.log('  Answer visible:', answerText !== 'No answer provided' ? 'Yes' : 'No');
        });
        
        // After rendering, ensure all answers are visible and attach all event handlers
        setTimeout(() => {
            const allAnswerSections = document.querySelectorAll('.answer-section');
            console.log(`✓ Ensuring ${allAnswerSections.length} answer sections are visible`);
            allAnswerSections.forEach((section, idx) => {
                section.style.display = 'block';
                section.style.visibility = 'visible';
                section.classList.add('visible');
            });
            
            // Ensure all event handlers are attached (they should be attached in the code below)
            // This is a safety check to ensure everything is connected
            
            // Verify all buttons exist
            const chatBtns = document.querySelectorAll('.chat-question-btn');
            const youtubeBtns = document.querySelectorAll('.youtube-btn');
            const highlightBtns = document.querySelectorAll('.highlight-mode-btn');
            const unhighlightBtns = document.querySelectorAll('.unhighlight-question-btn');
            const listenBtns = document.querySelectorAll('.listen-btn');
            const stopListenBtns = document.querySelectorAll('.stop-listen-btn');
            const translateBtns = document.querySelectorAll('.translate-question-btn');
            const untranslateBtns = document.querySelectorAll('.untranslate-question-btn');
            const importantBtns = document.querySelectorAll('.important-btn');
            console.log('✅ ALL FEATURES LOADED AND READY:');
            console.log(`  📊 Total Questions: ${questions.length}`);
            console.log(`  📝 View Mode: Grid (All questions displayed)`);
            console.log(`  💬 Chat Buttons: ${chatBtns.length}`);
            console.log(`  🎥 Sources Buttons: ${youtubeBtns.length}`);
            console.log(`  🖊️ Highlight Buttons: ${highlightBtns.length}`);
            console.log(`  🗑️ Unhighlight Buttons: ${unhighlightBtns.length}`);
            console.log(`  🔊 Listen Buttons: ${listenBtns.length}`);
            console.log(`  ⏹️ Stop Listen Buttons: ${stopListenBtns.length}`);
            console.log(`  🌐 Translate Buttons: ${translateBtns.length}`);
            console.log(`  🔄 Untranslate Buttons: ${untranslateBtns.length}`);
            console.log(`  ❤️ Save Buttons: ${importantBtns.length}`);
            console.log('\n✅ All questions and answers are displayed with all features ready!');
        }, 100);

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

        // Add Sources button handlers - Show sidebar with links and images
        document.querySelectorAll('.youtube-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const questionText = btn.getAttribute('data-question-text');
                console.log('✅ Sources (YouTube) clicked for question:', questionId);
                const question = allQuestions.find(q => q.id === questionId);
                
                if (question) {
                    showSourcesSidebar(questionText, question);
                }
            });
        });

        // Add chat button handlers for each question (Clarify Doubt)
        document.querySelectorAll('.chat-question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                console.log('✅ Clarify Doubt clicked for question:', questionId);
                const question = allQuestions.find(q => q.id === questionId);
                if (!question) return;

                currentChatQuestionId = questionId;
                if (chatHeaderTitle) {
                    chatHeaderTitle.textContent = `Clarify Doubt: Q${questionId}`;
                }

                if (chatMessages) {
                    chatMessages.innerHTML = `
                        <div class="chat-message bot-message">
                            <div class="message-content">
                                <p>Hi! I'm here to help you understand this question. Ask me anything specific!</p>
                            </div>
                        </div>
                    `;
                }

                chatModal.classList.add('active');
                if (chatInput) chatInput.focus();

                setTimeout(() => {
                    const answerPreview = question.answer.length > 200
                        ? question.answer.substring(0, 200) + '...'
                        : question.answer;
                    const aiResponse = `**Question:** ${question.question}\n\n**Quick Explanation:**\n${answerPreview}\n\nTell me what part confuses you and I'll break it down for you!`;
                    addMessage(aiResponse, 'bot');
                }, 400);
            });
        });

        // Attach media button removed

        // Add unhighlight button handlers (per question card)
        document.querySelectorAll('.unhighlight-question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                if (!questionId) return;
                
                // Clear all highlights for this question
                saveQuestionHighlights(questionId, []);
                
                // Find all answer elements for this question
                const allAnswerElements = document.querySelectorAll(`.answer-text[data-question-id="${questionId}"]`);
                
                allAnswerElements.forEach(answerElement => {
                    // Remove all highlight spans from the DOM
                    const highlightSpans = answerElement.querySelectorAll('span.highlight');
                    highlightSpans.forEach(span => {
                        const parent = span.parentNode;
                        if (parent) {
                            parent.replaceChild(document.createTextNode(span.textContent), span);
                        }
                    });
                    
                    // Normalize the DOM
                    answerElement.normalize();
                    
                    // Re-apply the answer text without highlights
                    const question = allQuestions.find(q => q.id === questionId);
                    if (question && question.answer) {
                        const hasAnswerLabel = answerElement.textContent.includes('Answer:');
                        const formattedAnswer = question.answer.replace(/\n/g, '<br>');
                        if (hasAnswerLabel) {
                            answerElement.innerHTML = '<strong>Answer:</strong> ' + escapeHtml(question.answer).replace(/\n/g, '<br>');
                        } else {
                            answerElement.innerHTML = escapeHtml(question.answer).replace(/\n/g, '<br>');
                        }
                    } else {
                        // If no question data, just remove highlights from current content
                        const cleanText = answerElement.textContent || answerElement.innerText || '';
                        answerElement.innerHTML = escapeHtml(cleanText);
                    }
                });
                
                console.log(`✅ All highlights removed from question ${questionId}`);
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
            
            // Store reference to the mouseup handler so we can remove it later
            let mouseUpHandler = null;
            
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('✅ Highlight Text clicked for question:', questionId);
                
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
                    mouseUpHandler = function(e) {
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
                        
                        // Remove mouseup listener
                        if (mouseUpHandler) {
                            answerSection.removeEventListener('mouseup', mouseUpHandler);
                        }
                    }
                    
                    currentAnswerText.style.cursor = '';
                    currentAnswerText.style.userSelect = '';
                    currentAnswerText.style.webkitUserSelect = '';
                    currentAnswerText.style.mozUserSelect = '';
                    currentAnswerText.style.msUserSelect = '';
                    currentAnswerText.style.background = '';
                    
                    // Remove mouseup listener
                    if (mouseUpHandler) {
                        currentAnswerText.removeEventListener('mouseup', mouseUpHandler);
                        mouseUpHandler = null;
                        }
                    }
                });
        });

        // Unhighlight button removed

        // Add listen button handlers (text-to-speech)
        document.querySelectorAll('.listen-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                console.log('✅ Listen (Text-to-Speech) clicked for question:', questionId);
                const question = allQuestions.find(q => q.id === questionId);
                if (question && 'speechSynthesis' in window) {
                    // Stop any ongoing speech
                    window.speechSynthesis.cancel();
                    
                    const text = `Question: ${question.question}. Answer: ${question.answer}`;
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    
                    // Hide listen button, show stop button
                    btn.style.display = 'none';
                    const stopBtn = document.querySelector(`.stop-listen-btn[data-question-id="${questionId}"]`);
                    if (stopBtn) {
                        stopBtn.style.display = 'flex';
                    }
                    
                    utterance.onend = () => {
                        // Show listen button, hide stop button
                        btn.style.display = 'flex';
                        if (stopBtn) {
                            stopBtn.style.display = 'none';
                        }
                    };
                    
                    utterance.onerror = () => {
                        // Show listen button, hide stop button on error
                        btn.style.display = 'flex';
                        if (stopBtn) {
                            stopBtn.style.display = 'none';
                        }
                    };
                    
                    window.speechSynthesis.speak(utterance);
                } else {
                    alert('Text-to-speech is not supported in your browser.');
                }
            });
        });

        // Add stop listen button handlers
        document.querySelectorAll('.stop-listen-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                console.log('✅ Stop Listening clicked for question:', questionId);
                
                // Stop speech
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
                
                // Hide stop button, show listen button
                btn.style.display = 'none';
                const listenBtn = document.querySelector(`.listen-btn[data-question-id="${questionId}"]`);
                if (listenBtn) {
                    listenBtn.style.display = 'flex';
                }
            });
        });

        // Helper function to translate long text by splitting into chunks
        async function translateLongText(text, langpair = 'en|ta', maxLength = 500) {
            if (!text || text.trim().length === 0) {
                return '';
            }
            
            // Ensure maxLength doesn't exceed 500 (API limit)
            maxLength = Math.min(maxLength, 500);
            
            // Clean and trim text
            text = text.trim();
            
            if (text.length <= maxLength) {
                // Text is short enough, translate directly
                try {
                    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`);
                    const data = await response.json();
                    
                    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                        return data.responseData.translatedText;
                    } else {
                        const errorMsg = data.responseDetails || data.responseStatus || 'Unknown error';
                        throw new Error('Translation failed: ' + errorMsg);
                    }
                } catch (error) {
                    throw new Error('Translation failed: ' + error.message);
                }
            }
            
            // Text is too long, split into chunks intelligently
            const chunks = [];
            let remainingText = text;
            
            while (remainingText.length > 0) {
                if (remainingText.length <= maxLength) {
                    // Last chunk
                    chunks.push(remainingText.trim());
                    break;
                }
                
                // Try to split at sentence boundaries first
                let chunk = remainingText.substring(0, maxLength);
                let lastPeriod = chunk.lastIndexOf('.');
                let lastQuestion = chunk.lastIndexOf('?');
                let lastExclamation = chunk.lastIndexOf('!');
                let lastNewline = chunk.lastIndexOf('\n');
                
                // Find the best split point
                let splitPoint = Math.max(lastPeriod, lastQuestion, lastExclamation, lastNewline);
                
                if (splitPoint > maxLength * 0.5) {
                    // Good split point found (at least halfway through)
                    chunk = remainingText.substring(0, splitPoint + 1).trim();
                    remainingText = remainingText.substring(splitPoint + 1).trim();
                } else {
                    // No good sentence boundary, try comma
                    let lastComma = chunk.lastIndexOf(',');
                    if (lastComma > maxLength * 0.5) {
                        chunk = remainingText.substring(0, lastComma + 1).trim();
                        remainingText = remainingText.substring(lastComma + 1).trim();
                    } else {
                        // No good punctuation, split at space
                        let lastSpace = chunk.lastIndexOf(' ');
                        if (lastSpace > maxLength * 0.5) {
                            chunk = remainingText.substring(0, lastSpace).trim();
                            remainingText = remainingText.substring(lastSpace + 1).trim();
                        } else {
                            // Force split at maxLength
                            chunk = remainingText.substring(0, maxLength).trim();
                            remainingText = remainingText.substring(maxLength).trim();
                        }
                    }
                }
                
                if (chunk.length > 0) {
                    chunks.push(chunk);
                }
            }
            
            // Translate each chunk sequentially
            const translatedChunks = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                // Double-check chunk length (should never exceed maxLength, but be safe)
                const safeChunk = chunk.length > maxLength ? chunk.substring(0, maxLength - 3) + '...' : chunk;
                
                try {
                    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(safeChunk)}&langpair=${langpair}`);
                    const data = await response.json();
                    
                    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                        translatedChunks.push(data.responseData.translatedText);
                    } else {
                        const errorMsg = data.responseDetails || data.responseStatus || 'Unknown error';
                        throw new Error('Translation failed for chunk ' + (i + 1) + ': ' + errorMsg);
                    }
                } catch (error) {
                    throw new Error('Translation failed for chunk ' + (i + 1) + ': ' + error.message);
                }
            }
            
            // Join all translated chunks with spaces
            return translatedChunks.join(' ');
        }
        
        // Add translate question button handlers - Translate FULL answer to Tamil
        document.querySelectorAll('.translate-question-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                const questionText = btn.getAttribute('data-question-text');
                const answerText = btn.getAttribute('data-answer-text');
                console.log('✅ Translate to Tamil (full answer) clicked for question:', questionId);
                
                // Show loading state
                btn.disabled = true;
                btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path></svg> Translating...';
                
                try {
                    // Find the question card
                    const questionCard = document.querySelector(`.question-card:has(.answer-controls .translate-question-btn[data-question-id="${questionId}"])`);
                    if (!questionCard) {
                        throw new Error('Question card not found');
                    }
                    
                    const answerElement = questionCard.querySelector('.answer-text');
                    
                    if (!answerElement) {
                        throw new Error('Answer element not found');
                    }
                    
                    // Get full answer text - remove HTML and get clean text
                    let fullAnswerText = '';
                    if (answerElement.textContent) {
                        fullAnswerText = answerElement.textContent.trim();
                    } else if (answerText) {
                        fullAnswerText = answerText.trim();
                    } else {
                        throw new Error('Could not find answer text');
                    }
                    
                    // Remove "Answer:" label if present
                    fullAnswerText = fullAnswerText.replace(/^Answer:\s*/i, '').trim();
                    
                    if (!fullAnswerText) {
                        throw new Error('Answer text is empty');
                    }
                    
                    // Translate the FULL answer text to Tamil (handles long text automatically)
                    const tamilTranslation = await translateLongText(fullAnswerText, 'en|ta', 500);
                        
                    // Store original answer for reverting
                    answerElement.setAttribute('data-original-text', fullAnswerText);
                    answerElement.setAttribute('data-translated-text', tamilTranslation);
                    
                    // Update answer display - Show Tamil translation prominently
                    answerElement.innerHTML = `
                        <div style="padding: 0.75rem; background: #f0fdf4; border-radius: 0.5rem; border-left: 4px solid #10b981; margin-bottom: 0.75rem; font-family: 'Noto Sans Tamil', sans-serif; font-size: 1rem; line-height: 1.8; color: #1e293b;">
                            <strong style="color: #10b981; font-size: 1.1rem; display: block; margin-bottom: 0.5rem;">தமிழ்:</strong>
                            <div style="font-size: 1rem; line-height: 1.8;">${escapeHtml(tamilTranslation)}</div>
                        </div>
                        <div style="padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid #64748b; font-size: 0.9rem; line-height: 1.6; color: #64748b;">
                            <strong style="color: #64748b; display: block; margin-bottom: 0.5rem;">English:</strong>
                            <div>${escapeHtml(fullAnswerText)}</div>
                        </div>
                    `;
                    
                    // Show untranslate button, hide translate button
                    const untranslateBtn = questionCard.querySelector(`.untranslate-question-btn[data-question-id="${questionId}"]`);
                    if (untranslateBtn) {
                        untranslateBtn.style.display = 'flex';
                    }
                    btn.style.display = 'none';
                    
                    console.log(`✅ Full answer translated to Tamil for question ${questionId}`);
                } catch (error) {
                    console.error('Translation error:', error);
                    alert('Translation failed. Please try again. Error: ' + error.message);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path></svg> Translate';
                }
            });
        });

        // Add untranslate button handlers
        document.querySelectorAll('.untranslate-question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                
                // Find the question card
                const questionCard = document.querySelector(`.question-card:has(.answer-controls .untranslate-question-btn[data-question-id="${questionId}"])`);
                if (questionCard) {
                    const questionElement = questionCard.querySelector('.question-card > div > div:has(strong)');
                    const answerElement = questionCard.querySelector('.answer-text');
                    
                    // Restore original question text
                    if (questionElement && questionElement.getAttribute('data-original-text')) {
                        questionElement.textContent = questionElement.getAttribute('data-original-text');
                        questionElement.removeAttribute('data-original-text');
                        questionElement.removeAttribute('data-translated-text');
                    }
                    
                    // Restore original answer text
                    if (answerElement && answerElement.getAttribute('data-original-text')) {
                        answerElement.textContent = answerElement.getAttribute('data-original-text');
                        answerElement.removeAttribute('data-original-text');
                        answerElement.removeAttribute('data-translated-text');
                    }
                    
                    // Show translate button, hide untranslate button
                    const translateBtn = questionCard.querySelector(`.translate-question-btn[data-question-id="${questionId}"]`);
                    if (translateBtn) {
                        translateBtn.style.display = 'flex';
                        translateBtn.disabled = false;
                        translateBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path></svg> Translate';
                    }
                    btn.style.display = 'none';
                    console.log('✅ Untranslate clicked - reverted to English');
                }
            });
        });

        // Add important button handlers
        document.querySelectorAll('.important-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questionId = parseInt(btn.getAttribute('data-question-id'));
                console.log('✅ Save as Important clicked for question:', questionId);
                const isNowImportant = toggleImportant(questionId);
                
                // Update button appearance
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
                
                // Update sidebar count
                displayQuestionSummary();
            });
        });

        // Add attach media button handlers
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
    const mediaUploadZone = document.getElementById('mediaUploadZone');
    const mediaFileInput = document.getElementById('mediaFileInput');
    const mediaPreview = document.getElementById('mediaPreview');
    const mediaPreviewContent = document.getElementById('mediaPreviewContent');
    const removeMediaBtn = document.getElementById('removeMediaBtn');
    const saveMediaBtn = document.getElementById('saveMediaBtn');
    let currentMediaFile = null;

    // Open media modal for specific question
    function openMediaModal(questionId) {
        currentMediaQuestionId = questionId;
        const existingMedia = getQuestionMedia(questionId);
        
        if (existingMedia) {
            mediaPreviewContent.innerHTML = existingMedia.type === 'image'
                ? `<img src="${existingMedia.data}" alt="Question media" style="max-width: 100%; border-radius: var(--radius-lg);">`
                : `<video src="${existingMedia.data}" controls style="max-width: 100%; border-radius: var(--radius-lg);"></video>`;
            mediaPreview.style.display = 'block';
        } else {
            mediaPreview.style.display = 'none';
        }
        
        mediaModal.classList.add('active');
    }

    // Close media modal
    if (mediaClose) {
        mediaClose.addEventListener('click', () => {
            mediaModal.classList.remove('active');
            currentMediaQuestionId = null;
            currentMediaFile = null;
            mediaFileInput.value = '';
            mediaPreview.style.display = 'none';
        });
    }

    // Close on outside click
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

    // Handle file selection
    if (mediaFileInput) {
        mediaFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file type
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

    // Remove media
    if (removeMediaBtn) {
        removeMediaBtn.addEventListener('click', () => {
            if (currentMediaQuestionId) {
                removeQuestionMedia(currentMediaQuestionId);
                // Re-render questions
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

    // Save media
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
                    
                    // Re-render questions
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

    // Open chat for specific question
    function openChatForQuestion(questionId) {
        currentChatQuestionId = questionId;
        const question = allQuestions.find(q => q.id === questionId);
        
        if (question) {
            chatHeaderTitle.textContent = `Chat: Question ${questionId}`;
            chatWelcomeMessage.textContent = `I'm here to help you with this question: "${question.question.substring(0, 100)}${question.question.length > 100 ? '...' : ''}". What would you like to know?`;
        }
        
        // Clear previous messages except welcome
        chatMessages.innerHTML = `
            <div class="chat-message bot-message">
                <div class="message-content">
                    <p id="chatWelcomeMessage">${chatWelcomeMessage.textContent}</p>
                </div>
            </div>
        `;
        
        chatModal.classList.add('active');
        chatInput.focus();
    }

    // Open general chat
    function openGeneralChat() {
        currentChatQuestionId = null;
        chatHeaderTitle.textContent = 'Chat About Questions';
        chatWelcomeMessage.textContent = 'Hello! I\'m here to help you with questions. Ask me anything!';
        
        // Clear previous messages except welcome
        chatMessages.innerHTML = `
            <div class="chat-message bot-message">
                <div class="message-content">
                    <p id="chatWelcomeMessage">${chatWelcomeMessage.textContent}</p>
                </div>
            </div>
        `;
        
        chatModal.classList.add('active');
        chatInput.focus();
    }

    // Open chat modal
    if (chatButton) {
        chatButton.addEventListener('click', () => {
            openGeneralChat();
        });
    }

    // Close chat modal
    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatModal.classList.remove('active');
            currentChatQuestionId = null;
        });
    }

    // Close on outside click
    if (chatModal) {
        chatModal.addEventListener('click', (e) => {
            if (e.target === chatModal) {
                chatModal.classList.remove('active');
                currentChatQuestionId = null;
            }
        });
    }

    // ChatGPT API Configuration
    // Note: For production, store API key securely on backend
    // For now, user can set it in localStorage: localStorage.setItem('chatgpt_api_key', 'your-api-key')
    const CHATGPT_API_KEY = localStorage.getItem('chatgpt_api_key') || '';
    const CHATGPT_API_URL = 'https://api.openai.com/v1/chat/completions';

    // Send message function with ChatGPT integration
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
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
            
            // Build context for ChatGPT
            let systemPrompt = 'You are a helpful study assistant helping students understand exam questions. Provide clear, detailed explanations in a friendly and encouraging manner.';
            let userPrompt = message;
            
            if (question) {
                systemPrompt = `You are a helpful study assistant. A student is asking about this ${question.marks}-mark question: "${question.question}". The correct answer is: "${question.answer}". Help them understand the question and answer clearly. Provide explanations in simple terms, give examples if helpful, and encourage their learning.`;
                userPrompt = `Question: ${question.question}\n\nAnswer: ${question.answer}\n\nStudent's question: ${message}`;
            }

            // Call ChatGPT API
            if (CHATGPT_API_KEY) {
                const response = await fetch(CHATGPT_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${CHATGPT_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.7,
                        max_tokens: 500
                    })
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                const botResponse = data.choices[0].message.content;
                
                // Remove typing indicator
                const indicator = document.getElementById('typing-indicator');
                if (indicator) indicator.remove();
                
                addMessage(botResponse, 'bot');
                } else {
                // Fallback: Use local responses if no API key
                throw new Error('No API key configured');
            }
        } catch (error) {
            console.error('ChatGPT API Error:', error);
            
            // Remove typing indicator
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();
            
            // Fallback to local responses
            let botResponse = '';
            const question = currentChatQuestionId ? allQuestions.find(q => q.id === currentChatQuestionId) : null;
            
            if (question) {
                botResponse = `**Question:** ${question.question}\n\n**Answer:**\n${question.answer}\n\n**Note:** To get AI-powered explanations, please add your ChatGPT API key. For now, here's the answer. Feel free to ask specific questions!\n\n**Your Question:** ${message}\n\nI can help explain any part of this question in detail. What would you like to know more about?`;
            } else {
                botResponse = `I'm here to help! However, to get AI-powered responses, please configure your ChatGPT API key.\n\n**To add API key:**\nOpen browser console and run:\nlocalStorage.setItem('chatgpt_api_key', 'your-api-key-here')\n\n**Your Question:** ${message}\n\nHow can I help you with your studies?`;
            }
            
            addMessage(botResponse, 'bot');
        } finally {
            // Re-enable input
            if (chatInput) chatInput.disabled = false;
            if (chatSend) chatSend.disabled = false;
            if (chatInput) chatInput.focus();
        }
    }

    // Add message to chat
    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;
        
        // Format text with line breaks and bold text
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
            .replace(/\n/g, '<br>'); // Line breaks
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <p style="white-space: pre-wrap;">${formattedText}</p>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Send on button click
    if (chatSend) {
        chatSend.addEventListener('click', sendMessage);
    }

    // Send on Enter key
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
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library not loaded. Please refresh the page and try again.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Get user data for header
        const userData = JSON.parse(localStorage.getItem('ready2study_user')) || {};
        const userName = userData.name || 'Student';
        const course = userData.course || '';
        const college = userData.college || '';
        
        // Get PDF file info
        const pdfData = JSON.parse(localStorage.getItem('ready2study_pdf')) || {};
        const pdfName = pdfData.name || 'Study Material';
        
        // Page settings
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let yPos = margin;
        const lineHeight = 7;
        const spacing = 5;
        
        // Helper function to add text with word wrap
        function addText(text, x, y, maxWidth, fontSize = 11, isBold = false) {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return lines.length * (fontSize * 0.4);
        }
        
        // Helper function to check if we need a new page
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
        doc.setTextColor(99, 102, 241); // Primary color
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
        
        // Group questions by marks
        const questionsByMarks = {
            1: allQuestions.filter(q => q.marks === 1),
            2: allQuestions.filter(q => q.marks === 2),
            3: allQuestions.filter(q => q.marks === 3),
            10: allQuestions.filter(q => q.marks === 10)
        };
        
        // Add questions organized by marks
        [1, 2, 3, 10].forEach(marks => {
            const questions = questionsByMarks[marks];
            if (questions.length === 0) return;
            
            // Add new page for each section
            if (yPos > margin + 20) {
                doc.addPage();
                yPos = margin;
            }
            
            // Section header
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(99, 102, 241);
            yPos += addText(`${marks} Mark${marks > 1 ? 's' : ''} Questions`, margin, yPos, maxWidth, 16, true);
            yPos += spacing * 2;
            
            // Add each question
            questions.forEach((q, index) => {
                checkNewPage(30);
                
                // Question number and text
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                const questionText = `Q${index + 1}: ${q.question}`;
                yPos += addText(questionText, margin, yPos, maxWidth, 12, true);
                yPos += spacing;
                
                // Exam date badge
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                yPos += addText(`Exam Date: ${q.examDate}`, margin, yPos, maxWidth, 9, false);
                yPos += spacing;
                
                // Answer label
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(0, 0, 0);
                yPos += addText('Answer:', margin, yPos, maxWidth, 11, true);
                yPos += spacing / 2;
                
                // Answer text
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                // Clean answer text (remove markdown formatting)
                const cleanAnswer = q.answer
                    .replace(/\*\*/g, '') // Remove bold markers
                    .replace(/\n/g, ' ') // Replace newlines with spaces
                    .trim();
                yPos += addText(cleanAnswer, margin, yPos, maxWidth, 10, false);
                yPos += spacing * 2;
                
                // Add separator line
                if (index < questions.length - 1) {
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, yPos, pageWidth - margin, yPos);
                    yPos += spacing;
                }
            });
            
            yPos += spacing;
        });
        
        // Save the PDF
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
