// Test Page Logic - Multiple Questions Pattern: 1×2 + 2×1 + 3×2 + 1×10 = 20 marks

(function() {
    'use strict';
    
    // Check authentication
    const loggedIn = localStorage.getItem('ready2study_logged_in');
    if (!loggedIn || loggedIn !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    document.addEventListener('DOMContentLoaded', function() {
        const testQuestion = document.getElementById('testQuestion');
        const answerText = document.getElementById('answerText');
        const wordCount = document.getElementById('wordCount');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitTestBtn = document.getElementById('submitTestBtn');
        const textModeBtn = document.getElementById('textModeBtn');
        const voiceModeBtn = document.getElementById('voiceModeBtn');
        const textInputSection = document.getElementById('textInputSection');
        const voiceInputSection = document.getElementById('voiceInputSection');
        const recordBtn = document.getElementById('recordBtn');
        const recordBtnText = document.getElementById('recordBtnText');
        const recordingStatus = document.getElementById('recordingStatus');
        const transcribedText = document.getElementById('transcribedText');
        const resultsSection = document.getElementById('resultsSection');
        const timeDisplay = document.getElementById('timeDisplay');
        const currentQuestionNum = document.getElementById('currentQuestionNum');
        const totalQuestions = document.getElementById('totalQuestions');
        const qNum = document.getElementById('qNum');
        const questionBadge = document.getElementById('questionBadge');
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        const marksCompleted = document.getElementById('marksCompleted');
        const logoutBtn = document.getElementById('logoutBtn');
        const headerName = document.getElementById('headerName');
        const studentHeaderInfo = document.getElementById('studentHeaderInfo');

        // Test structure: 1×2 + 2×1 + 3×2 + 1×10 = 20 marks
        const testPattern = [
            { marks: 2, count: 1 },   // 1 question of 2 marks
            { marks: 1, count: 2 },   // 2 questions of 1 mark
            { marks: 2, count: 3 },    // 3 questions of 2 marks
            { marks: 10, count: 1 }   // 1 question of 10 marks
        ];

        let testQuestions = [];
        let currentQuestionIndex = 0;
        let userAnswers = [];
        let startTime = null;
        let timerInterval = null;
        let recognition = null;
        let isRecording = false;

        // Load student info
        try {
            const userDataStr = localStorage.getItem('ready2study_user');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (studentHeaderInfo) studentHeaderInfo.style.display = 'block';
                if (headerName) headerName.textContent = userData.name || 'Student';
            }
        } catch (e) {
            console.error('Error loading user data:', e);
        }

        // Logout handler
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.isRedirecting = true;
                localStorage.clear();
                window.location.href = 'login.html';
            });
        }

        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = function(event) {
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

                const answer = finalTranscript || interimTranscript;
                answerText.value = answer;
                updateAnswer();
            };

            recognition.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
                stopRecording();
            };
        } else {
            voiceModeBtn.disabled = true;
            voiceModeBtn.title = 'Speech recognition not supported in your browser';
        }

        // Load and prepare test questions
        function loadTestQuestions() {
            try {
                const storedQuestions = localStorage.getItem('ready2study_questions');
                const questions = storedQuestions ? JSON.parse(storedQuestions) : [];
                
                // Group questions by marks
                const questionsByMarks = {
                    1: questions.filter(q => q.marks === 1),
                    2: questions.filter(q => q.marks === 2),
                    10: questions.filter(q => q.marks === 10)
                };

                // Fallback to mock data
                if (questions.length === 0 && typeof mockQuestions !== 'undefined') {
                    questionsByMarks[1] = mockQuestions.filter(q => q.marks === 1);
                    questionsByMarks[2] = mockQuestions.filter(q => q.marks === 2);
                    questionsByMarks[10] = mockQuestions.filter(q => q.marks === 10);
                }

                // Build test questions according to pattern
                testQuestions = [];
                
                // 1 question of 2 marks
                if (questionsByMarks[2].length > 0) {
                    testQuestions.push(questionsByMarks[2][0]);
                } else if (questionsByMarks[1].length > 0) {
                    testQuestions.push({...questionsByMarks[1][0], marks: 2});
                }

                // 2 questions of 1 mark
                for (let i = 0; i < 2 && i < questionsByMarks[1].length; i++) {
                    testQuestions.push(questionsByMarks[1][i]);
                }
                // Fill remaining if needed
                while (testQuestions.filter(q => q.marks === 1).length < 2 && questionsByMarks[2].length > 0) {
                    testQuestions.push({...questionsByMarks[2][testQuestions.length % questionsByMarks[2].length], marks: 1});
                }

                // 3 questions of 2 marks
                for (let i = 0; i < 3 && i < questionsByMarks[2].length; i++) {
                    testQuestions.push(questionsByMarks[2][i]);
                }
                // Fill remaining if needed
                while (testQuestions.filter(q => q.marks === 2).length < 4 && questionsByMarks[1].length > 0) {
                    testQuestions.push({...questionsByMarks[1][testQuestions.length % questionsByMarks[1].length], marks: 2});
                }

                // 1 question of 10 marks
                if (questionsByMarks[10].length > 0) {
                    testQuestions.push(questionsByMarks[10][0]);
                } else if (questionsByMarks[2].length > 0) {
                    testQuestions.push({...questionsByMarks[2][0], marks: 10});
                }

                // Shuffle questions but maintain pattern order
                const shuffled = [];
                let patternIndex = 0;
                let patternCount = 0;
                
                testPattern.forEach(function(pattern) {
                    const matching = testQuestions.filter(q => q.marks === pattern.marks).slice(0, pattern.count);
                    shuffled.push(...matching);
                });

                testQuestions = shuffled;

                if (testQuestions.length === 0) {
                    testQuestion.textContent = 'No test questions available. Please upload a PDF first.';
                    nextBtn.disabled = true;
                    return;
                }

                // Initialize user answers array
                userAnswers = testQuestions.map(function() {
                    return { answer: '', marks: 0 };
                });

                totalQuestions.textContent = testQuestions.length;
                displayQuestion(0);
                startTimer();
            } catch (e) {
                console.error('Error loading questions:', e);
                testQuestion.textContent = 'Error loading questions. Please try again.';
            }
        }

        // Display question
        function displayQuestion(index) {
            if (index < 0 || index >= testQuestions.length) return;

            currentQuestionIndex = index;
            const question = testQuestions[index];
            const savedAnswer = userAnswers[index];

            testQuestion.textContent = question.question || 'No question available';
            questionBadge.textContent = question.marks + ' Mark' + (question.marks > 1 ? 's' : '');
            questionBadge.className = 'badge mark-' + question.marks;
            qNum.textContent = index + 1;
            currentQuestionNum.textContent = index + 1;

            // Load saved answer
            answerText.value = savedAnswer.answer || '';
            transcribedText.textContent = savedAnswer.answer || 'Your transcribed answer will appear here...';
            updateWordCount();
            updateAnswer();

            // Update navigation buttons
            prevBtn.disabled = index === 0;
            if (index === testQuestions.length - 1) {
                nextBtn.style.display = 'none';
                submitTestBtn.style.display = 'block';
            } else {
                nextBtn.style.display = 'block';
                submitTestBtn.style.display = 'none';
            }

            // Update progress
            updateProgress();
        }

        // Update progress
        function updateProgress() {
            const answered = userAnswers.filter(a => a.answer.trim().length > 0).length;
            const progress = (answered / testQuestions.length) * 100;
            progressBar.style.width = progress + '%';
            progressPercent.textContent = Math.round(progress);

            const totalMarksAnswered = userAnswers.reduce(function(sum, ans, idx) {
                return sum + (ans.answer.trim().length > 0 ? testQuestions[idx].marks : 0);
            }, 0);
            marksCompleted.textContent = totalMarksAnswered;
        }

        // Timer
        function startTimer() {
            startTime = Date.now();
            if (timerInterval) clearInterval(timerInterval);
            
            timerInterval = setInterval(function() {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                timeDisplay.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
            }, 1000);
        }

        // Word count
        function updateWordCount() {
            const text = answerText.value.trim();
            const words = text.split(/\s+/).filter(w => w.length > 0);
            wordCount.textContent = words.length;
        }

        function updateAnswer() {
            userAnswers[currentQuestionIndex].answer = answerText.value.trim();
            updateProgress();
        }

        answerText.addEventListener('input', function() {
            updateWordCount();
            updateAnswer();
        });

        // Mode switching
        textModeBtn.addEventListener('click', function() {
            textModeBtn.classList.remove('btn-secondary');
            textModeBtn.classList.add('btn-primary');
            voiceModeBtn.classList.remove('btn-primary');
            voiceModeBtn.classList.add('btn-secondary');
            textInputSection.style.display = 'block';
            voiceInputSection.style.display = 'none';
            if (isRecording) stopRecording();
        });

        voiceModeBtn.addEventListener('click', function() {
            if (!recognition) {
                alert('Speech recognition is not supported in your browser');
                return;
            }
            voiceModeBtn.classList.remove('btn-secondary');
            voiceModeBtn.classList.add('btn-primary');
            textModeBtn.classList.remove('btn-primary');
            textModeBtn.classList.add('btn-secondary');
            textInputSection.style.display = 'none';
            voiceInputSection.style.display = 'block';
        });

        // Recording
        recordBtn.addEventListener('click', function() {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });

        function startRecording() {
            if (!recognition) return;
            
            isRecording = true;
            recognition.start();
            recordBtnText.textContent = 'Stop Recording';
            recordingStatus.style.display = 'block';
            recordBtn.style.background = 'var(--secondary)';
        }

        function stopRecording() {
            if (!recognition) return;
            
            isRecording = false;
            recognition.stop();
            recordBtnText.textContent = 'Start Recording';
            recordingStatus.style.display = 'none';
            recordBtn.style.background = '';
            updateAnswer();
        }

        // Navigation
        nextBtn.addEventListener('click', function() {
            if (currentQuestionIndex < testQuestions.length - 1) {
                displayQuestion(currentQuestionIndex + 1);
            }
        });

        prevBtn.addEventListener('click', function() {
            if (currentQuestionIndex > 0) {
                displayQuestion(currentQuestionIndex - 1);
            }
        });

        // Submit test
        submitTestBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to submit the test? You cannot change answers after submission.')) {
                stopRecording();
                if (timerInterval) clearInterval(timerInterval);
                evaluateTest();
            }
        });

        // Evaluate all answers
        function evaluateTest() {
            const evaluator = new TestEvaluator();
            let totalMarks = 0;
            const questionResults = [];

            testQuestions.forEach(function(question, index) {
                const userAnswer = userAnswers[index].answer;
                const correctAnswer = question.answer || '';
                const maxMarks = question.marks;

                const result = evaluator.evaluateAnswer(userAnswer, correctAnswer, maxMarks);
                userAnswers[index].marks = result.marks;
                totalMarks += result.marks;

                questionResults.push({
                    question: question,
                    userAnswer: userAnswer,
                    result: result,
                    index: index + 1
                });
            });

            // Calculate overall score
            const percentage = Math.round((totalMarks / 20) * 100);
            const grade = evaluator.calculateGrade(percentage);
            const gradeColor = evaluator.getGradeColor(grade);

            // Display results
            displayResults(totalMarks, percentage, grade, gradeColor, questionResults);
        }

        // Display results
        function displayResults(totalMarks, percentage, grade, gradeColor, questionResults) {
            const marksObtained = document.getElementById('marksObtained');
            const percentageScore = document.getElementById('percentageScore');
            const gradeText = document.getElementById('gradeText');
            const gradeBadge = document.getElementById('gradeBadge');
            const feedbackText = document.getElementById('feedbackText');
            const questionResultsDiv = document.getElementById('questionResults');
            const retakeBtn = document.getElementById('retakeBtn');

            marksObtained.textContent = totalMarks;
            percentageScore.textContent = percentage + '%';
            gradeText.textContent = grade;
            gradeBadge.style.background = gradeColor;
            gradeBadge.style.color = 'white';

            // Question-wise results
            let questionResultsHtml = '';
            questionResults.forEach(function(item) {
                const q = item.question;
                questionResultsHtml += '<div class="question-card" style="margin-bottom: 1rem; background: white;">';
                questionResultsHtml += '<div class="card-header"><span class="badge mark-' + q.marks + '">' + q.marks + ' Mark' + (q.marks > 1 ? 's' : '') + '</span><span style="font-weight: 600; color: ' + item.result.gradeColor + ';">' + item.result.marks + '/' + q.marks + ' marks</span></div>';
                questionResultsHtml += '<div class="question-text" style="margin-bottom: 1rem;">' + (q.question || '') + '</div>';
                questionResultsHtml += '<div style="padding: 1rem; background: #f8fafc; border-radius: var(--radius-lg); margin-bottom: 0.5rem;"><strong>Your Answer:</strong><br>' + (item.userAnswer || 'No answer provided') + '</div>';
                questionResultsHtml += '<div style="padding: 1rem; background: #eef2ff; border-radius: var(--radius-lg);"><strong>Correct Answer:</strong><br>' + (q.answer || '').replace(/\n/g, '<br>') + '</div>';
                questionResultsHtml += '</div>';
            });
            questionResultsDiv.innerHTML = questionResultsHtml;

            // Overall feedback
            let feedback = '';
            if (percentage >= 80) {
                feedback = '<p style="color: #10b981; font-weight: 600; margin-bottom: 1rem;">✓ Excellent Performance!</p><p>You have demonstrated a strong understanding across all question types. Well done!</p>';
            } else if (percentage >= 60) {
                feedback = '<p style="color: #3b82f6; font-weight: 600; margin-bottom: 1rem;">✓ Good Performance</p><p>You have a good grasp of the topics. Focus on improving detail in longer answers.</p>';
            } else if (percentage >= 40) {
                feedback = '<p style="color: #f59e0b; font-weight: 600; margin-bottom: 1rem;">⚠ Needs Improvement</p><p>Review the topics and practice more. Pay attention to providing complete answers.</p>';
            } else {
                feedback = '<p style="color: #ef4444; font-weight: 600; margin-bottom: 1rem;">⚠ Needs Significant Improvement</p><p>Review the study material thoroughly and practice answering questions in detail.</p>';
            }
            feedbackText.innerHTML = feedback;

            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Retake button
            retakeBtn.addEventListener('click', function() {
                location.reload();
            });
        }

        // Initialize
        loadTestQuestions();
    });
})();
