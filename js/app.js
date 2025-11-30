// App Logic for Dashboard

// Prevent multiple executions and redirect loops
(function() {
    'use strict';
    
    if (window.dashboardInitialized) {
        return; // Already initialized, prevent re-execution
    }
    window.dashboardInitialized = true;

    document.addEventListener('DOMContentLoaded', function() {
        // Prevent redirect loops
        if (window.isRedirecting) {
            return;
        }

        // Check authentication
        const loggedIn = localStorage.getItem('ready2study_logged_in');
        if (!loggedIn || loggedIn !== 'true') {
            window.isRedirecting = true;
            setTimeout(function() {
                window.location.href = 'login.html';
            }, 100);
            return;
        }

        // Get elements safely
        const container = document.getElementById('questionsContainer');
        if (!container) {
            console.error('Questions container not found');
            return;
        }

        const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
        const toggleAllBtn = document.getElementById('toggleAllAnswers');
        const studentHeaderInfo = document.getElementById('studentHeaderInfo');
        const headerName = document.getElementById('headerName');
        const headerDetails = document.getElementById('headerDetails');
        const logoutBtn = document.getElementById('logoutBtn');

        let currentFilter = 'all';
        let allAnswersVisible = false;
        let questionsToRender = [];

        // Helper function
        function getOrdinal(n) {
            if (!n) return '';
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
        }

        // Load Student Info
        try {
            const userDataStr = localStorage.getItem('ready2study_user');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (studentHeaderInfo) studentHeaderInfo.style.display = 'block';
                if (headerName) headerName.textContent = userData.name || 'Student';
                if (headerDetails) {
                    if (userData.year) {
                        headerDetails.textContent = `${userData.course || ''} • ${userData.year}${getOrdinal(userData.year)} Year • ${userData.college || ''}`;
                    } else {
                        headerDetails.textContent = `${userData.course || ''} • ${userData.college || ''}`;
                    }
                }

                // Logout handler - clear all session data and redirect to login
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Set redirecting flag to prevent loops
                        window.isRedirecting = true;
                        
                        // Clear all user session data
                        localStorage.removeItem('ready2study_user');
                        localStorage.removeItem('ready2study_logged_in');
                        localStorage.removeItem('ready2study_login_email');
                        localStorage.removeItem('ready2study_questions');
                        localStorage.removeItem('ready2study_pdf');
                        localStorage.removeItem('ready2study_pdf_name');
                        localStorage.removeItem('ready2study_pdf_data');
                        
                        // Clear all localStorage (optional - more thorough)
                        // localStorage.clear();
                        
                        // Redirect to login page immediately
                        window.location.href = 'login.html';
                    });
                }
            }
        } catch (e) {
            console.error('Error loading user data:', e);
        }

        // Load questions
        try {
            const storedQuestions = localStorage.getItem('ready2study_questions');
            if (storedQuestions) {
                questionsToRender = JSON.parse(storedQuestions);
                if (!Array.isArray(questionsToRender)) {
                    throw new Error('Invalid questions format');
                }
            }
        } catch (e) {
            console.error('Error loading questions:', e);
            questionsToRender = [];
        }

        // Use mock data if no stored questions
        if (questionsToRender.length === 0 && typeof mockQuestions !== 'undefined' && Array.isArray(mockQuestions)) {
            questionsToRender = mockQuestions;
        }

        // Render questions
        function renderQuestions(questions) {
            if (!container) return;
            
            container.innerHTML = '';

            if (!questions || questions.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 4rem; color: var(--text-muted);"><h3>No questions available.</h3><p>Please upload a PDF to generate questions.</p><a href="index.html" class="btn btn-primary" style="margin-top: 1rem;">Upload PDF</a></div>';
                return;
            }

            questions.forEach(function(q) {
                if (!q || !q.question || !q.answer) return;

                const card = document.createElement('div');
                card.className = 'question-card';

                const formattedAnswer = (q.answer || '').replace(/\n/g, '<br>');
                
                // Enhanced image display - support single image or array of images
                let imageHtml = '';
                if (q.image) {
                    if (Array.isArray(q.image) && q.image.length > 0) {
                        // Multiple images
                        imageHtml = '<div class="answer-images-grid">';
                        q.image.forEach(function(imgSrc, idx) {
                            imageHtml += '<div class="answer-image-container"><img src="' + imgSrc + '" alt="Diagram ' + (idx + 1) + '" class="answer-image" onclick="openImageModal(this.src)"></div>';
                        });
                        imageHtml += '</div>';
                    } else if (typeof q.image === 'string') {
                        // Single image
                        imageHtml = '<div class="answer-image-container"><img src="' + q.image + '" alt="Diagram" class="answer-image" onclick="openImageModal(this.src)"></div>';
                    }
                }

                // Check if question is already marked as important
                const isImportant = isQuestionImportant(q.id);
                const starIcon = isImportant ? 
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' :
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
                
                card.innerHTML = '<div class="card-header"><div style="display: flex; align-items: center; gap: 0.5rem;"><span class="badge mark-' + (q.marks || 1) + '">' + (q.marks || 1) + ' Mark' + ((q.marks || 1) > 1 ? 's' : '') + '</span><span class="exam-date-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px; vertical-align:text-bottom;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' + (q.examDate || '') + '</span></div><button class="mark-important-btn ' + (isImportant ? 'marked' : '') + '" data-question-id="' + (q.id || '') + '" title="Mark as Important"><span class="star-icon">' + starIcon + '</span></button></div><div class="question-text">' + (q.question || '') + '</div><button class="btn btn-secondary toggle-answer-btn" style="font-size: 0.875rem; padding: 0.5rem 1rem;">Show Answer</button><div class="answer-section"><div class="answer-controls" style="margin-bottom: 0.5rem; display: flex; justify-content: flex-end;"><button class="btn-icon listen-btn" title="Listen to Answer"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg><span style="margin-left: 0.5rem; font-size: 0.875rem;">Listen</span></button></div><div class="answer-text"><strong>Answer:</strong><br>' + formattedAnswer + imageHtml + '</div></div>';

                const toggleBtn = card.querySelector('.toggle-answer-btn');
                const answerSection = card.querySelector('.answer-section');
                const listenBtn = card.querySelector('.listen-btn');
                const markImportantBtn = card.querySelector('.mark-important-btn');

                if (toggleBtn && answerSection) {
                    toggleBtn.addEventListener('click', function() {
                        const isVisible = answerSection.classList.toggle('visible');
                        toggleBtn.textContent = isVisible ? "Hide Answer" : "Show Answer";
                        if (!isVisible && window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                        }
                    });
                }

                if (listenBtn && q.answer) {
                    listenBtn.addEventListener('click', function() {
                        if (!window.speechSynthesis) return;
                        if (window.speechSynthesis.speaking) {
                            window.speechSynthesis.cancel();
                            return;
                        }
                        try {
                            const utterance = new SpeechSynthesisUtterance(q.answer);
                            utterance.rate = 1;
                            utterance.pitch = 1;
                            window.speechSynthesis.speak(utterance);
                        } catch (e) {
                            console.error('Speech error:', e);
                        }
                    });
                }

                // Mark Important functionality
                if (markImportantBtn) {
                    markImportantBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const questionId = this.getAttribute('data-question-id');
                        const questionData = q;
                        
                        if (isQuestionImportant(questionId)) {
                            // Already marked, remove it
                            removeImportantQuestion(questionId);
                            this.classList.remove('marked');
                            this.querySelector('.star-icon').innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
                        } else {
                            // Show subject selection modal
                            openSubjectModal(questionId, questionData);
                        }
                    });
                }

                container.appendChild(card);
            });
        }

        // Initial render
        renderQuestions(questionsToRender);

        // Filter handlers
        if (filterBtns && filterBtns.length > 0) {
            filterBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    filterBtns.forEach(function(b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    currentFilter = btn.dataset.filter;
                    const filtered = currentFilter === 'all' ? questionsToRender : questionsToRender.filter(function(q) { return q.marks == currentFilter; });
                    renderQuestions(filtered);
                });
            });
        }

        // Toggle all answers
        if (toggleAllBtn) {
            toggleAllBtn.addEventListener('click', function() {
                allAnswersVisible = !allAnswersVisible;
                toggleAllBtn.textContent = allAnswersVisible ? "Hide All Answers" : "Show All Answers";
                const answerSections = document.querySelectorAll('.answer-section');
                const toggleBtns = document.querySelectorAll('.toggle-answer-btn');
                answerSections.forEach(function(section) {
                    if (allAnswersVisible) section.classList.add('visible');
                    else section.classList.remove('visible');
                });
                toggleBtns.forEach(function(btn) {
                    btn.textContent = allAnswersVisible ? "Hide Answer" : "Show Answer";
                });
            });
        }

        // Important Questions Management Functions
        function isQuestionImportant(questionId) {
            const saved = getSavedImportantQuestions();
            return saved.some(function(item) {
                return item.question && item.question.id === questionId;
            });
        }

        function getSavedImportantQuestions() {
            try {
                const saved = localStorage.getItem('ready2study_important_questions');
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                return [];
            }
        }

        function saveImportantQuestion(questionData, subject) {
            const saved = getSavedImportantQuestions();
            const newItem = {
                question: questionData,
                subject: subject.trim(),
                savedDate: new Date().toISOString()
            };
            
            // Check if already exists
            const exists = saved.findIndex(function(item) {
                return item.question && item.question.id === questionData.id && item.subject === subject.trim();
            });
            
            if (exists === -1) {
                saved.push(newItem);
                localStorage.setItem('ready2study_important_questions', JSON.stringify(saved));
                updateSubjectList();
                return true;
            }
            return false;
        }

        function removeImportantQuestion(questionId) {
            const saved = getSavedImportantQuestions();
            const filtered = saved.filter(function(item) {
                return !(item.question && item.question.id === questionId);
            });
            localStorage.setItem('ready2study_important_questions', JSON.stringify(filtered));
            updateSubjectList();
        }

        function updateSubjectList() {
            const saved = getSavedImportantQuestions();
            const subjects = [...new Set(saved.map(function(item) { return item.subject; }))];
            const subjectList = document.getElementById('subjectList');
            if (subjectList) {
                subjectList.innerHTML = '';
                subjects.forEach(function(subject) {
                    const option = document.createElement('option');
                    option.value = subject;
                    subjectList.appendChild(option);
                });
            }
        }

        function openSubjectModal(questionId, questionData) {
            const modal = document.getElementById('subjectModal');
            const subjectInput = document.getElementById('subjectInput');
            const saveBtn = document.getElementById('saveImportantBtn');
            
            if (modal && subjectInput && saveBtn) {
                modal.style.display = 'flex';
                subjectInput.value = '';
                subjectInput.focus();
                updateSubjectList();
                
                // Remove old event listeners by cloning
                const newSaveBtn = saveBtn.cloneNode(true);
                saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
                
                newSaveBtn.addEventListener('click', function() {
                    const subject = subjectInput.value.trim();
                    if (!subject) {
                        alert('Please enter a subject name');
                        return;
                    }
                    
                    if (saveImportantQuestion(questionData, subject)) {
                        closeSubjectModal();
                        // Update the star icon
                        const markBtn = document.querySelector('[data-question-id="' + questionId + '"]');
                        if (markBtn) {
                            markBtn.classList.add('marked');
                            markBtn.querySelector('.star-icon').innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
                        }
                    } else {
                        alert('This question is already saved in this subject');
                    }
                });
            }
        }

        function closeSubjectModal() {
            const modal = document.getElementById('subjectModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        // Make functions globally available
        window.openSubjectModal = openSubjectModal;
        window.closeSubjectModal = closeSubjectModal;
        
        // Initialize subject list
        updateSubjectList();
    });
})();
