// Test Logic for Ready2Study

document.addEventListener('DOMContentLoaded', () => {
    // Initialize timer to 30 minutes FIRST, before anything else
    let timeRemaining = 30 * 60; // 30 minutes in seconds (1800 seconds)
    
    // Update timer display immediately to show 30:00
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = '30:00';
    }
    
    // Load Student Info
    const userData = JSON.parse(localStorage.getItem('ready2study_user'));
    if (userData) {
        const headerInfo = document.getElementById('studentHeaderInfo');
        const headerName = document.getElementById('headerName');
        const headerDetails = document.getElementById('headerDetails');
        
        if (headerInfo) headerInfo.style.display = 'block';
        if (headerName) headerName.textContent = userData.name;
        if (headerDetails) headerDetails.textContent = `${userData.course} • ${userData.year}${getOrdinal(userData.year)} Year • ${userData.college}`;
    }

    function getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

    // Test Pattern: 1*2 mark, 2*1 mark, 2*3 mark, 1*10 mark = 20 marks total
    const testPattern = [
        { marks: 2, count: 1 },
        { marks: 1, count: 2 },
        { marks: 3, count: 2 },
        { marks: 10, count: 1 }
    ];

    let testQuestions = [];
    let currentQuestionIndex = 0;
    let userAnswers = {};
    let inputModes = {};
    let userAnswerHighlights = {};
    let highlightMode = {};
    // timeRemaining is already initialized at the top of DOMContentLoaded
    let timerInterval = null;
    let recognition = null;
    let isRecording = false;

    const USER_ANSWER_HIGHLIGHTS_KEY = 'ready2study_user_answer_highlights';

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            const currentQuestionId = testQuestions[currentQuestionIndex]?.id;
            const currentAnswer = userAnswers[currentQuestionId] || '';
            const newAnswer = currentAnswer + finalTranscript;
            userAnswers[currentQuestionId] = newAnswer;
            
            const editableDiv = document.getElementById(`answer-editable-${currentQuestionId}`);
            const textarea = document.getElementById(`answer-${currentQuestionId}`);
            
            if (editableDiv) {
                editableDiv.textContent = newAnswer + (interimTranscript ? ' ' + interimTranscript : '');
                applyUserAnswerHighlights(currentQuestionId, editableDiv);
            }
            
            if (textarea) {
                textarea.value = newAnswer;
            }
            
            const voiceDisplay = document.getElementById(`voice-display-${currentQuestionId}`);
            if (voiceDisplay) {
                voiceDisplay.textContent = newAnswer + (interimTranscript ? ' ' + interimTranscript : '');
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopRecording();
        };

        recognition.onend = () => {
            if (isRecording) {
                try {
                    recognition.start();
                } catch (e) {
                    isRecording = false;
                    updateVoiceButton();
                }
            }
        };
    }

    // Select questions based on pattern
    function selectTestQuestions() {
        testQuestions = [];
        
        const pdfQuestionsKey = 'ready2study_pdf_questions';
        const storedPDFQuestions = localStorage.getItem(pdfQuestionsKey);
        let availableQuestions = [];
        
        if (typeof mockQuestions !== 'undefined' && Array.isArray(mockQuestions)) {
            availableQuestions = mockQuestions;
        }
        
        if (storedPDFQuestions) {
            try {
                const pdfQuestions = JSON.parse(storedPDFQuestions);
                if (Array.isArray(pdfQuestions) && pdfQuestions.length > 0) {
                    availableQuestions = pdfQuestions;
                    console.log('Using PDF questions:', pdfQuestions.length);
                }
            } catch (e) {
                console.error('Error parsing PDF questions:', e);
            }
        }
        
        if (availableQuestions.length === 0) {
            console.error('No questions available for test');
            return;
        }
        
        console.log('Available questions:', availableQuestions.length);
        
        testPattern.forEach(pattern => {
            const questionsByMarks = availableQuestions.filter(q => q.marks === pattern.marks);
            
            if (questionsByMarks.length < pattern.count) {
                console.warn(`Not enough ${pattern.marks}-mark questions. Need ${pattern.count}, found ${questionsByMarks.length}`);
            }
            
            const shuffled = questionsByMarks.sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(pattern.count, questionsByMarks.length));
            testQuestions.push(...selected);
        });

        testQuestions = testQuestions.sort(() => Math.random() - 0.5);
        
        testQuestions.forEach(q => {
            userAnswers[q.id] = '';
            inputModes[q.id] = 'text';
            highlightMode[q.id] = false;
        });

        const savedHighlights = localStorage.getItem(USER_ANSWER_HIGHLIGHTS_KEY);
        if (savedHighlights) {
            userAnswerHighlights = JSON.parse(savedHighlights);
        }
    }

    // Render questions
    function renderQuestions() {
        const container = document.getElementById('testQuestionsContainer');
        container.innerHTML = '';

        if (testQuestions.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                    <h3>No questions available.</h3>
                    <p style="margin-top: 1rem;">Please upload a PDF and generate questions first.</p>
                </div>
            `;
            return;
        }

        testQuestions.forEach((q, index) => {
            const questionCard = document.createElement('div');
            questionCard.className = 'test-question-card';
            questionCard.id = `question-${index}`;
            if (index === 0) {
                questionCard.style.display = 'block';
            } else {
                questionCard.style.display = 'none';
            }
            questionCard.style.minHeight = '400px';

            const currentMode = inputModes[q.id] || 'text';
            questionCard.className = `test-question-card input-mode-${currentMode}`;
            
            questionCard.innerHTML = `
                <div class="question-number">Question ${index + 1} of ${testQuestions.length}</div>
                <span class="question-marks">${q.marks} Mark${q.marks > 1 ? 's' : ''}</span>
                <div class="question-text">${q.question}</div>
                ${q.image ? `<div class="answer-image-container" style="margin-top: 1rem;"><img src="${q.image}" alt="Diagram" class="answer-image"></div>` : ''}
                <div class="answer-input-container">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main);">Your Answer:</label>
                    <div class="input-mode-selector">
                        <button class="mode-btn ${currentMode === 'text' ? 'active' : ''}" onclick="setInputMode(${q.id}, 'text')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Text Input
                        </button>
                        <button class="mode-btn ${currentMode === 'voice' ? 'active' : ''}" onclick="setInputMode(${q.id}, 'voice')">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                            Voice Input
                        </button>
                    </div>
                    <div style="position: relative;">
                        <div 
                            id="answer-editable-${q.id}" 
                            class="answer-textarea answer-editable ${currentMode === 'voice' ? 'disabled' : ''}" 
                            contenteditable="${currentMode === 'voice' ? 'false' : 'true'}"
                            placeholder="Type your answer here..."
                            style="min-height: 150px; padding: 1rem; border: 2px solid var(--border); border-radius: var(--radius-lg); font-family: inherit; font-size: 1rem; resize: vertical; transition: all 0.2s; white-space: pre-wrap; word-wrap: break-word; outline: none; ${currentMode === 'voice' ? 'opacity: 0.5; cursor: not-allowed; background: #f1f5f9;' : ''}"
                        >${userAnswers[q.id] || ''}</div>
                        <textarea 
                            id="answer-${q.id}" 
                            style="display: none;"
                        >${userAnswers[q.id] || ''}</textarea>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; justify-content: flex-end;">
                            <button class="highlight-mode-btn" id="highlight-btn-${q.id}" onclick="toggleHighlightMode(${q.id})" style="padding: 0.5rem 1rem; background: white; border: 1px solid var(--border); border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem; font-weight: 600; color: var(--primary); display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                    <path d="M2 17l10 5 10-5"></path>
                                    <path d="M2 12l10 5 10-5"></path>
                                </svg>
                                Highlight Key Points
                            </button>
                        </div>
                    </div>
                    <div class="voice-controls">
                        <div style="width: 100%;">
                            <div class="voice-display" id="voice-display-${q.id}">${userAnswers[q.id] || 'Click the button below to start voice recording...'}</div>
                            <button class="voice-btn" id="voice-btn-${q.id}" onclick="toggleVoiceRecognition(${q.id})">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                                <span id="voice-text-${q.id}">Start Voice Input</span>
                            </button>
                            <span class="voice-status" id="voice-status-${q.id}"></span>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(questionCard);
        });

        // Add event listeners for text input
        testQuestions.forEach(q => {
            const editableDiv = document.getElementById(`answer-editable-${q.id}`);
            const textarea = document.getElementById(`answer-${q.id}`);
            
            if (editableDiv) {
                editableDiv.addEventListener('input', (e) => {
                    const text = editableDiv.textContent || editableDiv.innerText || '';
                    userAnswers[q.id] = text;
                    if (textarea) {
                        textarea.value = text;
                    }
                });

                editableDiv.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                    document.execCommand('insertText', false, text);
                });

                applyUserAnswerHighlights(q.id, editableDiv);

                editableDiv.addEventListener('mouseup', () => {
                    if (highlightMode[q.id]) {
                        setTimeout(() => {
                            highlightSelectedTextInAnswer(q.id, editableDiv);
                        }, 100);
                    }
                });

                editableDiv.addEventListener('focus', () => {
                    if (editableDiv.style.borderColor !== 'var(--primary)') {
                        editableDiv.style.borderColor = 'var(--primary)';
                        editableDiv.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }
                });

                editableDiv.addEventListener('blur', () => {
                    editableDiv.style.borderColor = 'var(--border)';
                    editableDiv.style.boxShadow = 'none';
                });
            }
        });

        updateNavigation();
        updateProgress();
    }

    // Input Mode Selection
    window.setInputMode = function(questionId, mode) {
        inputModes[questionId] = mode;
        const questionCard = document.querySelector(`#question-${testQuestions.findIndex(q => q.id === questionId)}`);
        if (questionCard) {
            questionCard.className = `test-question-card input-mode-${mode}`;
            const editableDiv = document.getElementById(`answer-editable-${questionId}`);
            const modeBtns = questionCard.querySelectorAll('.mode-btn');
            
            modeBtns.forEach(btn => {
                btn.classList.remove('active');
            });
            questionCard.querySelector(`.mode-btn[onclick*="'${mode}'"]`).classList.add('active');
            
            if (mode === 'voice') {
                if (editableDiv) {
                    editableDiv.contentEditable = 'false';
                    editableDiv.classList.add('disabled');
                    editableDiv.style.opacity = '0.5';
                    editableDiv.style.cursor = 'not-allowed';
                    editableDiv.style.background = '#f1f5f9';
                }
                stopRecording();
            } else {
                if (editableDiv) {
                    editableDiv.contentEditable = 'true';
                    editableDiv.classList.remove('disabled');
                    editableDiv.style.opacity = '1';
                    editableDiv.style.cursor = '';
                    editableDiv.style.background = '';
                }
                stopRecording();
            }
        }
    };

    // Voice Recognition Functions
    window.toggleVoiceRecognition = function(questionId) {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser. Please use text input.');
            return;
        }

        if (isRecording) {
            stopRecording();
        } else {
            startRecording(questionId);
        }
    };

    function startRecording(questionId) {
        if (!recognition) return;

        try {
            recognition.start();
            isRecording = true;
            updateVoiceButton(questionId);
            const voiceStatus = document.getElementById(`voice-status-${questionId}`);
            if (voiceStatus) voiceStatus.textContent = 'Listening...';
        } catch (e) {
            console.error('Error starting recognition:', e);
        }
    }

    function stopRecording() {
        if (recognition && isRecording) {
            recognition.stop();
            isRecording = false;
            updateVoiceButton();
            document.querySelectorAll('.voice-status').forEach(el => {
                el.textContent = '';
            });
        }
    }

    function updateVoiceButton(questionId = null) {
        const allVoiceBtns = document.querySelectorAll('[id^="voice-btn-"]');
        allVoiceBtns.forEach(btn => {
            const btnId = btn.id.replace('voice-btn-', '');
            const textSpan = document.getElementById(`voice-text-${btnId}`);
            
            if (isRecording && questionId && parseInt(btnId) === questionId) {
                btn.classList.add('recording');
                if (textSpan) textSpan.textContent = 'Stop Recording';
            } else {
                btn.classList.remove('recording');
                if (textSpan) textSpan.textContent = 'Start Voice Input';
            }
        });
    }

    // Navigation Functions
    function updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        prevBtn.style.display = currentQuestionIndex === 0 ? 'none' : 'block';
        
        if (currentQuestionIndex === testQuestions.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
    }

    function updateProgress() {
        const progress = ((currentQuestionIndex + 1) / testQuestions.length) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
    }

    function showQuestion(index) {
        stopRecording();
        
        document.querySelectorAll('.test-question-card').forEach((card, i) => {
            card.style.display = i === index ? 'block' : 'none';
        });
        currentQuestionIndex = index;
        
        const currentQuestion = testQuestions[index];
        const currentMode = inputModes[currentQuestion.id] || 'text';
        const questionCard = document.getElementById(`question-${index}`);
        if (questionCard) {
            questionCard.className = `test-question-card input-mode-${currentMode}`;
        }
        
        updateNavigation();
        updateProgress();
    }

    // Timer Functions
    function startTimer() {
        // Clear any existing timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Always reset timer to exactly 30 minutes (1800 seconds)
        timeRemaining = 30 * 60;
        
        // Update display immediately
        updateTimer();
        
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimer();

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                submitTest();
            }
        }, 1000);
    }

    function updateTimer() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            if (timeRemaining <= 300) {
                timerEl.style.color = '#f43f5e';
            }
        }
    }

    // Answer Evaluation
    function evaluateAnswer(userAnswer, correctAnswer, marks) {
        if (!userAnswer || userAnswer.trim().length === 0) {
            return { score: 0, feedback: 'No answer provided' };
        }

        const normalizedUser = userAnswer.toLowerCase().trim().replace(/\s+/g, ' ');
        const normalizedCorrect = correctAnswer.toLowerCase().trim().replace(/\s+/g, ' ');

        const keyPhrases = extractKeyPhrases(normalizedCorrect);
        let matchedPhrases = 0;

        keyPhrases.forEach(phrase => {
            if (normalizedUser.includes(phrase.toLowerCase())) {
                matchedPhrases++;
            }
        });

        const phraseMatchRatio = keyPhrases.length > 0 ? matchedPhrases / keyPhrases.length : 0;
        const lengthRatio = Math.min(normalizedUser.length / normalizedCorrect.length, 1);
        
        const similarityScore = (phraseMatchRatio * 0.6) + (lengthRatio * 0.4);
        const score = Math.round(similarityScore * marks * 10) / 10;

        let feedback = '';
        if (similarityScore >= 0.8) {
            feedback = 'Excellent answer!';
        } else if (similarityScore >= 0.6) {
            feedback = 'Good answer, but could be more detailed.';
        } else if (similarityScore >= 0.4) {
            feedback = 'Partially correct, needs improvement.';
        } else {
            feedback = 'Answer needs significant improvement.';
        }

        return { score: Math.min(score, marks), feedback };
    }

    function extractKeyPhrases(text) {
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can'];
        const words = text.split(/\s+/).filter(word => word.length > 3 && !stopWords.includes(word));
        
        const phrases = [];
        for (let i = 0; i < words.length - 1; i++) {
            phrases.push(words[i] + ' ' + words[i + 1]);
        }
        
        return phrases.slice(0, 10);
    }

    // Highlight Management Functions for User Answers
    function getQuestionHighlights(questionId) {
        return userAnswerHighlights[questionId] || [];
    }

    function saveQuestionHighlights(questionId, highlights) {
        userAnswerHighlights[questionId] = highlights;
        localStorage.setItem(USER_ANSWER_HIGHLIGHTS_KEY, JSON.stringify(userAnswerHighlights));
    }

    function applyUserAnswerHighlights(questionId, element) {
        const highlights = getQuestionHighlights(questionId);
        if (highlights.length === 0) {
            const text = userAnswers[questionId] || '';
            element.textContent = text;
            return;
        }

        let textContent = userAnswers[questionId] || element.textContent || '';
        
        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

        const sortedHighlights = [...highlights].sort((a, b) => b.start - a.start);
        
        let segments = [];
        let lastIndex = textContent.length;
        
        sortedHighlights.forEach(highlight => {
            if (highlight.start < 0 || highlight.end > textContent.length || highlight.start >= highlight.end) {
                return;
            }
            
            if (highlight.end < lastIndex) {
                segments.unshift({
                    type: 'text',
                    content: textContent.substring(highlight.end, lastIndex)
                });
            }
            
            segments.unshift({
                type: 'highlight',
                id: highlight.id,
                content: textContent.substring(highlight.start, highlight.end)
            });
            
            lastIndex = highlight.start;
        });
        
        if (lastIndex > 0) {
            segments.unshift({
                type: 'text',
                content: textContent.substring(0, lastIndex)
            });
        }
        
        let htmlContent = '';
        segments.forEach(segment => {
            if (segment.type === 'highlight') {
                htmlContent += `<span class="user-highlight" data-highlight-id="${segment.id}">${escapeHtml(segment.content)}</span>`;
            } else {
                htmlContent += escapeHtml(segment.content);
            }
        });

        element.innerHTML = htmlContent;
    }

    function highlightSelectedTextInAnswer(questionId, element) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0 || selection.toString().trim().length === 0) {
            return false;
        }

        const range = selection.getRangeAt(0);
        const selectedText = selection.toString().trim();
        
        if (selectedText.length === 0) return false;

        if (!element.contains(range.commonAncestorContainer)) {
            return false;
        }

        if (range.commonAncestorContainer.parentElement?.classList.contains('user-highlight')) {
            return false;
        }

        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
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
            highlightSpan.className = 'user-highlight';
            highlightSpan.setAttribute('data-highlight-id', highlightId);
            highlightSpan.textContent = selectedText;
            
            range.deleteContents();
            range.insertNode(highlightSpan);
        } catch (e) {
            console.error('Error applying highlight:', e);
            applyUserAnswerHighlights(questionId, element);
        }

        selection.removeAllRanges();
        highlightMode[questionId] = false;
        updateHighlightButton(questionId);

        return true;
    }

    window.toggleHighlightMode = function(questionId) {
        highlightMode[questionId] = !highlightMode[questionId];
        updateHighlightButton(questionId);
        
        const editableDiv = document.getElementById(`answer-editable-${questionId}`);
        if (editableDiv) {
            if (highlightMode[questionId]) {
                editableDiv.style.cursor = 'text';
                editableDiv.style.userSelect = 'text';
            } else {
                editableDiv.style.cursor = '';
                editableDiv.style.userSelect = '';
            }
        }
    };

    function updateHighlightButton(questionId) {
        const btn = document.getElementById(`highlight-btn-${questionId}`);
        if (btn) {
            if (highlightMode[questionId]) {
                btn.style.background = 'var(--gradient-primary)';
                btn.style.color = 'white';
                btn.style.borderColor = 'var(--primary)';
            } else {
                btn.style.background = 'white';
                btn.style.color = 'var(--primary)';
                btn.style.borderColor = 'var(--border)';
            }
        }
    }

    // Submit Test
    function submitTest() {
        stopRecording();
        clearInterval(timerInterval);

        const results = {
            questions: testQuestions.map(q => {
                const editableDiv = document.getElementById(`answer-editable-${q.id}`);
                const answerText = editableDiv ? (editableDiv.textContent || editableDiv.innerText || '') : (userAnswers[q.id] || '');
                return {
                    id: q.id,
                    question: q.question,
                    marks: q.marks,
                    correctAnswer: q.answer,
                    userAnswer: answerText,
                    evaluation: evaluateAnswer(answerText, q.answer, q.marks),
                    highlights: getQuestionHighlights(q.id)
                };
            }),
            totalMarks: 20,
            obtainedMarks: 0,
            percentage: 0
        };

        results.obtainedMarks = results.questions.reduce((sum, q) => sum + q.evaluation.score, 0);
        results.percentage = (results.obtainedMarks / results.totalMarks) * 100;

        localStorage.setItem('ready2study_test_results', JSON.stringify(results));

        // Redirect to results page
        window.location.href = '/test-results';
    }

    // Event Listeners
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                showQuestion(currentQuestionIndex - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentQuestionIndex < testQuestions.length - 1) {
                showQuestion(currentQuestionIndex + 1);
            }
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to submit the test? You cannot change your answers after submission.')) {
                submitTest();
            }
        });
    }

    // Initialize Test
    try {
        if (typeof mockQuestions === 'undefined') {
            console.error('mockQuestions not found. Make sure mockData.js is loaded.');
            const container = document.getElementById('testQuestionsContainer');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                        <h3>Error: Questions data not found.</h3>
                        <p style="margin-top: 1rem;">Please refresh the page or upload a PDF.</p>
                        <a href="/dashboard" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;">Back to Dashboard</a>
                    </div>
                `;
            }
            return;
        }
        
        selectTestQuestions();
        
        if (testQuestions.length === 0) {
            console.error('No questions selected for test');
            const container = document.getElementById('testQuestionsContainer');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                        <h3>No questions available for test.</h3>
                        <p style="margin-top: 1rem;">Please upload a PDF and generate questions first.</p>
                        <a href="/" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;">Upload PDF</a>
                    </div>
                `;
            }
            return;
        }
        
        console.log('Test initialized with', testQuestions.length, 'questions');
        renderQuestions();
        
        // Reset timer to 30 minutes (ensure it's not cached)
        timeRemaining = 30 * 60; // 30 minutes in seconds
        console.log('⏱️ Timer set to 30 minutes:', timeRemaining, 'seconds');
        
        // Update timer display immediately to show 30:00
        updateTimer();
        console.log('⏱️ Timer display updated to:', document.getElementById('timer').textContent);
        
        setTimeout(() => {
            showQuestion(0);
        }, 50);
        
        startTimer();
    } catch (error) {
        console.error('Error initializing test:', error);
        const container = document.getElementById('testQuestionsContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                    <h3>Error loading test.</h3>
                    <p style="margin-top: 1rem;">${error.message}</p>
                    <a href="/dashboard" class="btn btn-primary" style="margin-top: 1rem; display: inline-block;">Back to Dashboard</a>
                </div>
            `;
        }
    }

    // Chat Functionality
    const chatButton = document.getElementById('chatButton');
    const chatModal = document.getElementById('chatModal');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    if (chatButton) {
        chatButton.addEventListener('click', () => {
            chatModal.classList.add('active');
            if (chatInput) chatInput.focus();
        });
    }

    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatModal.classList.remove('active');
        });
    }

    if (chatModal) {
        chatModal.addEventListener('click', (e) => {
            if (e.target === chatModal) {
                chatModal.classList.remove('active');
            }
        });
    }

    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        chatInput.value = '';

        setTimeout(() => {
            const currentQuestion = testQuestions[currentQuestionIndex];
            let botResponse = '';
            
            if (message.toLowerCase().includes('current question') || message.toLowerCase().includes('this question')) {
                botResponse = `The current question is: "${currentQuestion.question}". It's worth ${currentQuestion.marks} mark${currentQuestion.marks > 1 ? 's' : ''}.`;
            } else if (message.toLowerCase().includes('answer') || message.toLowerCase().includes('solution')) {
                const briefAnswer = currentQuestion.answer.length > 200 
                    ? currentQuestion.answer.substring(0, 200) + '...' 
                    : currentQuestion.answer;
                botResponse = `**Brief Answer:**\n\n${briefAnswer}\n\nThis is a ${currentQuestion.marks}-mark question.`;
            } else if (message.toLowerCase().includes('help') || message.toLowerCase().includes('hint')) {
                botResponse = `I'm here to help! You can ask me about:\n- Understanding what the question is asking\n- Breaking down complex questions\n- Study tips and strategies`;
            } else {
                const briefAnswer = currentQuestion.answer.length > 200 
                    ? currentQuestion.answer.substring(0, 200) + '...' 
                    : currentQuestion.answer;
                botResponse = `**Question:** ${currentQuestion.question}\n\n**Brief Answer:**\n${briefAnswer}`;
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
        if (chatMessages) {
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
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
});







