// Question Generator - Converts PDF text into exam questions
// Generates 1-mark, 2-mark, 3-mark, and 10-mark questions

class QuestionGenerator {
    constructor() {
        this.currentDate = new Date();
        this.monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    }

    // Split text into sentences
    splitIntoSentences(text) {
        return text.match(/[^.!?]+[.!?]+/g) || [];
    }

    // Extract key concepts and definitions
    extractKeyConcepts(text) {
        const sentences = this.splitIntoSentences(text);
        const concepts = [];
        
        // Look for definitions, important terms, and concepts
        const definitionPatterns = [
            /is (?:a|an|the) (.+?)(?:\.|,|$)/gi,
            /(?:defined as|refers to|means) (.+?)(?:\.|,|$)/gi,
            /(?:called|known as|termed) (.+?)(?:\.|,|$)/gi
        ];

        sentences.forEach(sentence => {
            definitionPatterns.forEach(pattern => {
                const matches = sentence.match(pattern);
                if (matches) {
                    concepts.push(sentence.trim());
                }
            });
        });

        return concepts.length > 0 ? concepts : sentences.slice(0, Math.min(20, sentences.length));
    }

    // Generate 1-mark questions (simple definitions, what is, name) - Original method
    generate1MarkQuestionsOriginal(text) {
        const sentences = this.splitIntoSentences(text);
        const questions = [];
        const usedSentences = new Set();

        // Extract definitions and key terms
        const definitionPatterns = [
            { pattern: /(.+?) is (?:a|an|the) (.+?)(?:\.|,|$)/gi, type: 'definition' },
            { pattern: /(.+?) (?:refers to|means|defined as) (.+?)(?:\.|,|$)/gi, type: 'definition' },
            { pattern: /(.+?) (?:called|known as|termed) (.+?)(?:\.|,|$)/gi, type: 'term' }
        ];

        sentences.forEach((sentence, index) => {
            if (questions.length >= 5 || usedSentences.has(index)) return;

            definitionPatterns.forEach(({ pattern, type }) => {
                const match = sentence.match(pattern);
                if (match && !usedSentences.has(index)) {
                    const term = match[1]?.trim() || match[2]?.trim();
                    if (term && term.length > 5 && term.length < 100) {
                        questions.push({
                            id: `1-${questions.length + 1}`,
                            marks: 1,
                            examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                            question: `What is ${term}?`,
                            answer: sentence.trim()
                        });
                        usedSentences.add(index);
                    }
                }
            });

            // Generate simple "What is" questions
            if (questions.length < 5 && !usedSentences.has(index) && sentence.length > 20 && sentence.length < 200) {
                const words = sentence.split(' ');
                if (words.length > 5 && words.length < 30) {
                    const keyTerm = words[0] || words[1];
                    if (keyTerm && keyTerm.length > 3) {
                        questions.push({
                            id: `1-${questions.length + 1}`,
                            marks: 1,
                            examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                            question: `Define ${keyTerm}.`,
                            answer: sentence.trim()
                        });
                        usedSentences.add(index);
                    }
                }
            }
        });

        // If not enough questions, create from key sentences
        while (questions.length < 3 && sentences.length > questions.length) {
            const sentence = sentences[questions.length];
            if (sentence && sentence.length > 15 && sentence.length < 150) {
                const words = sentence.split(' ').filter(w => w.length > 3);
                if (words.length > 0) {
                    questions.push({
                        id: `1-${questions.length + 1}`,
                        marks: 1,
                        examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                        question: `What is ${words[0]}?`,
                        answer: sentence.trim()
                    });
                }
            } else {
                break;
            }
        }

        return questions.slice(0, 5);
    }

    // Generate 2-mark questions (explanations, differences, short descriptions)
    generate2MarkQuestions(text, topics = null) {
        const sentences = this.splitIntoSentences(text);
        const questions = [];
        const usedSentences = new Set();

        // Look for comparison patterns, explanations - increased limit
        sentences.forEach((sentence, index) => {
            if (questions.length >= 12 || usedSentences.has(index)) return;

            // Difference/Comparison questions
            if (sentence.match(/(?:difference|different|compare|distinguish)/i) && sentence.length > 30) {
                const terms = sentence.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
                if (terms && terms.length >= 2) {
                    questions.push({
                        id: `2-${questions.length + 1}`,
                        marks: 2,
                        examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                        question: `Differentiate between ${terms[0]} and ${terms[1]}.`,
                        answer: sentence.trim()
                    });
                    usedSentences.add(index);
                }
            }

            // Explain questions
            if (sentence.match(/(?:explain|describe|discuss)/i) && sentence.length > 40 && sentence.length < 300) {
                const keyTerm = sentence.split(' ').find(w => w.length > 4) || 'this concept';
                questions.push({
                    id: `2-${questions.length + 1}`,
                    marks: 2,
                    examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                    question: `Explain ${keyTerm}.`,
                    answer: sentence.trim()
                });
                usedSentences.add(index);
            }
        });

        // Generate from longer sentences - increased limit
        const longSentences = sentences.filter(s => s.length > 50 && s.length < 250);
        longSentences.forEach((sentence, idx) => {
            if (questions.length >= 12) return;
            const words = sentence.split(' ').filter(w => w.length > 4);
            if (words.length > 5) {
                questions.push({
                    id: `2-${questions.length + 1}`,
                    marks: 2,
                    examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                    question: `Explain ${words[0]}.`,
                    answer: sentence.trim()
                });
            }
        });

        return questions.slice(0, 15);
    }

    // Generate 3-mark questions (detailed explanations, processes)
    generate3MarkQuestions(text, topics = null) {
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
        const questions = [];

        // Use topics if available for better questions - increased limit
        if (topics && topics.length > 0) {
            topics.slice(0, 10).forEach((topic, idx) => {
                if (questions.length >= 10) return;
                
                const term = topic.term || this.extractKeyTerm(topic.content);
                const answer = topic.content || this.findAnswerContent(text, term);
                
                questions.push({
                    id: `3-${questions.length + 1}`,
                    marks: 3,
                    examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                    question: `Describe ${term} in detail.`,
                    answer: answer.substring(0, 600)
                });
            });
        }

        paragraphs.forEach((paragraph, index) => {
            if (questions.length >= 10) return;

            const sentences = this.splitIntoSentences(paragraph);
            if (sentences.length >= 2 && paragraph.length > 100 && paragraph.length < 500) {
                const firstSentence = sentences[0];
                const keyTerm = this.extractKeyTerm(firstSentence) || firstSentence.split(' ').find(w => w.length > 4) || 'this topic';
                
                questions.push({
                    id: `3-${questions.length + 1}`,
                    marks: 3,
                    examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                    question: `Describe ${keyTerm} in detail.`,
                    answer: paragraph.trim()
                });
            }
        });

        // If not enough, create from longer text chunks - increased limit
        if (questions.length < 10) {
            const chunks = text.match(/.{200,400}/g) || [];
            chunks.slice(0, 10 - questions.length).forEach((chunk, idx) => {
                const sentences = this.splitIntoSentences(chunk);
                if (sentences.length > 0) {
                    const keyTerm = sentences[0].split(' ').find(w => w.length > 4) || 'this concept';
                    questions.push({
                        id: `3-${questions.length + 1}`,
                        marks: 3,
                        examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                        question: `Describe ${keyTerm} in detail.`,
                        answer: chunk.trim()
                    });
                }
            });
        }

        return questions.slice(0, 12);
    }

    // Generate 10-mark questions (comprehensive, multiple aspects)
    generate10MarkQuestions(text, topics = null) {
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 200);
        const questions = [];

        // Use topics if available for comprehensive questions - increased limit
        if (topics && topics.length > 0) {
            topics.slice(0, 6).forEach((topic, idx) => {
                if (questions.length >= 6) return;
                
                const term = topic.term || this.extractKeyTerm(topic.content);
                // Get comprehensive answer by combining related content
                let answer = topic.content;
                
                // Find additional related content
                const relatedContent = this.findAnswerContent(text, term);
                if (relatedContent.length > answer.length) {
                    answer = relatedContent;
                }
                
                questions.push({
                    id: `10-${questions.length + 1}`,
                    marks: 10,
                    examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                    question: `Discuss ${term} comprehensively, including its key aspects, characteristics, and implications.`,
                    answer: answer.substring(0, 2000) // Longer answer for 10-mark
                });
            });
        }

        // Find comprehensive topics - increased limit
        paragraphs.forEach((paragraph, index) => {
            if (questions.length >= 6) return;

            if (paragraph.length > 300 && paragraph.length < 1500) {
                const sentences = this.splitIntoSentences(paragraph);
                const firstSentence = sentences[0];
                const keyTerm = this.extractKeyTerm(firstSentence) || firstSentence.split(' ').slice(0, 3).join(' ') || 'this topic';

                questions.push({
                    id: `10-${questions.length + 1}`,
                    marks: 10,
                    examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                    question: `Discuss ${keyTerm} comprehensively, including its key aspects and implications.`,
                    answer: paragraph.trim()
                });
            }
        });

        // If not enough, combine multiple paragraphs - increased limit
        if (questions.length < 6 && paragraphs.length >= 2) {
            const paragraphsToCombine = Math.min(paragraphs.length, 4);
            const combinedText = paragraphs.slice(0, paragraphsToCombine).join('\n\n');
            const keyTerm = paragraphs[0].split(' ').slice(0, 3).join(' ') || 'this topic';
            
            questions.push({
                id: `10-${questions.length + 1}`,
                marks: 10,
                examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                question: `Provide a comprehensive discussion on ${keyTerm}.`,
                answer: combinedText.trim()
            });
        }

        return questions.slice(0, 2);
    }

    // Extract topics from text
    extractTopics(text) {
        const topics = [];
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 30);
        
        paragraphs.forEach((para, idx) => {
            const sentences = this.splitIntoSentences(para);
            if (sentences.length > 0) {
                const firstSentence = sentences[0];
                // Extract key term or topic from first sentence
                const keyTerm = this.extractKeyTerm(firstSentence);
                if (keyTerm) {
                    topics.push({
                        term: keyTerm,
                        content: para.trim(),
                        sentences: sentences
                    });
                }
            }
        });

        return topics;
    }

    // Extract key term from a sentence
    extractKeyTerm(sentence) {
        // Look for capitalized words or important terms
        const words = sentence.split(/\s+/).filter(w => w.length > 3);
        const capitalized = words.find(w => /^[A-Z]/.test(w) && w.length > 4);
        if (capitalized) return capitalized.replace(/[^\w\s]/g, '');
        
        // Look for terms before "is", "are", "refers to", etc.
        const patterns = [
            /^(.+?)\s+(?:is|are|was|were|refers to|means|defined as)/i,
            /^(.+?)\s+(?:called|known as|termed)/i
        ];
        
        for (const pattern of patterns) {
            const match = sentence.match(pattern);
            if (match && match[1]) {
                return match[1].trim().replace(/[^\w\s]/g, '').substring(0, 50);
            }
        }
        
        return words[0] || null;
    }

    // Find answer content for a topic/question
    findAnswerContent(text, topicTerm) {
        const paragraphs = text.split(/\n\n+/);
        const relevantParagraphs = [];
        
        paragraphs.forEach(para => {
            if (para.toLowerCase().includes(topicTerm.toLowerCase()) && para.length > 50) {
                relevantParagraphs.push(para.trim());
            }
        });

        if (relevantParagraphs.length > 0) {
            // Return the most relevant paragraph or combine if needed
            return relevantParagraphs[0] || relevantParagraphs.join('\n\n');
        }

        // Fallback: find sentences containing the term
        const sentences = this.splitIntoSentences(text);
        const relevantSentences = sentences.filter(s => 
            s.toLowerCase().includes(topicTerm.toLowerCase()) && s.length > 20
        );
        
        return relevantSentences.join(' ') || text.substring(0, 500);
    }

    // Enhanced 1-mark question generation with better topic detection
    generate1MarkQuestions(text, topics = null) {
        const questions = [];
        const usedTerms = new Set();
        
        if (!topics) {
            topics = this.extractTopics(text);
        }

        // Generate from topics - increased limit
        topics.slice(0, 20).forEach((topic, idx) => {
            if (questions.length >= 20) return;
            
            const term = topic.term || this.extractKeyTerm(topic.content);
            if (term && !usedTerms.has(term.toLowerCase())) {
                usedTerms.add(term.toLowerCase());
                
                // Find the best answer from topic content
                const answer = topic.content || this.findAnswerContent(text, term);
                
                questions.push({
                    id: `1-${questions.length + 1}`,
                    marks: 1,
                    examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                    question: `What is ${term}?`,
                    answer: answer.substring(0, 300) // Limit answer length for 1-mark
                });
            }
        });

        // Fallback to original method if not enough questions
        if (questions.length < 10) {
            const additional = this.generate1MarkQuestionsFallback(text);
            additional.forEach(q => {
                if (questions.length < 25 && !usedTerms.has(q.question.toLowerCase())) {
                    questions.push(q);
                    usedTerms.add(q.question.toLowerCase());
                }
            });
        }

        return questions.slice(0, 25);
    }

    // Fallback method for 1-mark questions - increased limit
    generate1MarkQuestionsFallback(text) {
        const sentences = this.splitIntoSentences(text);
        const questions = [];
        const usedSentences = new Set();

        sentences.forEach((sentence, index) => {
            if (questions.length >= 20 || usedSentences.has(index)) return;

            const definitionPatterns = [
                { pattern: /(.+?) is (?:a|an|the) (.+?)(?:\.|,|$)/gi },
                { pattern: /(.+?) (?:refers to|means|defined as) (.+?)(?:\.|,|$)/gi }
            ];

            definitionPatterns.forEach(({ pattern }) => {
                const match = sentence.match(pattern);
                if (match && !usedSentences.has(index)) {
                    const term = match[1]?.trim() || match[2]?.trim();
                    if (term && term.length > 5 && term.length < 100) {
                        questions.push({
                            id: `1-${questions.length + 1}`,
                            marks: 1,
                            examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                            question: `What is ${term}?`,
                            answer: sentence.trim()
                        });
                        usedSentences.add(index);
                    }
                }
            });
        });

        return questions;
    }

    // Enhanced question generation with topics - processes each section separately
    generateQuestions(text, pdfData = null) {
        if (!text || text.trim().length < 50) {
            return {
                success: false,
                error: 'PDF text content is too short or empty',
                questions: []
            };
        }

        try {
            // Get sections/topics from PDF data
            const sections = pdfData?.topics || [];
            const allQuestions = [];
            const sectionInfo = [];

            // Get available images from PDF data
            const availableImages = pdfData?.images || [];
            
            // Process each section/title separately
            if (sections.length > 0) {
                sections.forEach((section, sectionIdx) => {
                    const sectionTitle = section.title || `Section ${sectionIdx + 1}`;
                    const sectionContent = section.content || '';
                    
                    if (sectionContent.trim().length < 30) {
                        return; // Skip sections with too little content
                    }

                    // Generate questions for this specific section with images
                    const sectionQuestions = this.generateQuestionsForSection(
                        sectionTitle,
                        sectionContent,
                        sectionIdx,
                        availableImages
                    );

                    if (sectionQuestions.length > 0) {
                        allQuestions.push(...sectionQuestions);
                        sectionInfo.push({
                            title: sectionTitle,
                            questionCount: sectionQuestions.length
                        });
                    }
                });
            }

            // If no sections found or not enough questions, generate from full text
            if (allQuestions.length < 20) {
                const fallbackQuestions = [
                    ...this.generate1MarkQuestions(text, null),
                    ...this.generate2MarkQuestions(text, null),
                    ...this.generate3MarkQuestions(text, null),
                    ...this.generate10MarkQuestions(text, null)
                ];
                
                // Add fallback questions if we don't have enough
                if (allQuestions.length === 0) {
                    allQuestions.push(...fallbackQuestions);
                }
            }

            return {
                success: true,
                questions: allQuestions,
                total: allQuestions.length,
                sections: sectionInfo,
                topics: sections.map(s => s.title || 'Unknown').filter(Boolean)
            };
        } catch (error) {
            console.error('Error generating questions:', error);
            return {
                success: false,
                error: error.message,
                questions: []
            };
        }
    }

    // Generate questions for a specific section/title
    generateQuestionsForSection(sectionTitle, sectionContent, sectionIndex, availableImages = []) {
        const questions = [];
        
        if (!sectionContent || sectionContent.trim().length < 30) {
            return questions;
        }

        // Assign images to questions based on section/page
        const sectionImages = availableImages.filter(img => 
            img.page === sectionIndex + 1 || Math.abs(img.page - (sectionIndex + 1)) <= 2
        ).map(img => img.dataUrl);

        // Generate questions based on section content
        const oneMark = this.generate1MarkQuestionsForSection(sectionTitle, sectionContent, sectionImages);
        const twoMark = this.generate2MarkQuestionsForSection(sectionTitle, sectionContent, sectionImages);
        const threeMark = this.generate3MarkQuestionsForSection(sectionTitle, sectionContent, sectionImages);
        const tenMark = this.generate10MarkQuestionsForSection(sectionTitle, sectionContent, sectionImages);

        questions.push(...oneMark, ...twoMark, ...threeMark, ...tenMark);

        return questions;
    }

    // Generate 1-mark questions for a specific section - increased limit
    generate1MarkQuestionsForSection(sectionTitle, content) {
        const questions = [];
        const sentences = this.splitIntoSentences(content);
        const usedSentences = new Set();

        // Extract definitions and key terms from this section
        sentences.forEach((sentence, index) => {
            if (questions.length >= 8 || usedSentences.has(index)) return;

            const definitionPatterns = [
                /(.+?)\s+is\s+(?:a|an|the)\s+(.+?)(?:\.|,|$)/i,
                /(.+?)\s+(?:refers to|means|defined as)\s+(.+?)(?:\.|,|$)/i,
                /(.+?)\s+(?:called|known as|termed)\s+(.+?)(?:\.|,|$)/i
            ];

            definitionPatterns.forEach(pattern => {
                const match = sentence.match(pattern);
                if (match && !usedSentences.has(index)) {
                    const term = (match[1] || match[2] || '').trim();
                    if (term && term.length > 3 && term.length < 80) {
                        questions.push({
                            id: `1-${questions.length + 1}`,
                            marks: 1,
                            examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                            question: `What is ${term}? (From: ${sectionTitle})`,
                            answer: sentence.trim()
                        });
                        usedSentences.add(index);
                    }
                }
            });
        });

        // If not enough, create simple definition questions - generate more
        if (questions.length < 8) {
            const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 30);
            paragraphs.forEach((para, idx) => {
                if (questions.length >= 8) return;
                const keyTerm = this.extractKeyTerm(para) || para.split(' ').find(w => w.length > 4) || sectionTitle.split(' ')[0];
                if (keyTerm && para.length > 50) {
                    questions.push({
                        id: `1-${questions.length + 1}`,
                        marks: 1,
                        examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                        question: `Define ${keyTerm} in the context of ${sectionTitle}.`,
                        answer: para.substring(0, 300),
                        image: images.length > 0 ? images[0] : null
                    });
                }
            });
        }

        return questions.slice(0, 8);
    }

    // Generate 2-mark questions for a specific section - increased limit
    generate2MarkQuestionsForSection(sectionTitle, content, images = []) {
        const questions = [];
        const sentences = this.splitIntoSentences(content);
        const usedSentences = new Set();

        sentences.forEach((sentence, index) => {
            if (questions.length >= 6 || usedSentences.has(index)) return;

            if (sentence.length > 40 && sentence.length < 300) {
                const keyTerm = this.extractKeyTerm(sentence) || sentence.split(' ').find(w => w.length > 4);
                if (keyTerm) {
                    // Find related content for answer
                    const answerContent = this.findAnswerInSection(content, keyTerm) || sentence;
                    
                    questions.push({
                        id: `2-${questions.length + 1}`,
                        marks: 2,
                        examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                        question: `Explain ${keyTerm} as discussed in ${sectionTitle}.`,
                        answer: answerContent.substring(0, 400)
                    });
                    usedSentences.add(index);
                }
            }
        });

        // Generate more from paragraphs if not enough
        if (questions.length < 6) {
            const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);
            paragraphs.forEach((para, idx) => {
                if (questions.length >= 6) return;
                const keyTerm = this.extractKeyTerm(para) || para.split(' ').find(w => w.length > 4);
                if (keyTerm) {
                    questions.push({
                        id: `2-${questions.length + 1}`,
                        marks: 2,
                        examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                        question: `Explain ${keyTerm} as discussed in ${sectionTitle}.`,
                        answer: para.substring(0, 400),
                        image: images.length > 0 ? images[Math.min(questions.length, images.length - 1)] : null
                    });
                }
            });
        }

        return questions.slice(0, 6);
    }

    // Generate 3-mark questions for a specific section - increased limit
    generate3MarkQuestionsForSection(sectionTitle, content, images = []) {
        const questions = [];
        const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);

        paragraphs.forEach((paragraph, index) => {
            if (questions.length >= 4) return;

            if (paragraph.length > 100 && paragraph.length < 800) {
                const keyTerm = this.extractKeyTerm(paragraph) || sectionTitle;
                
                questions.push({
                    id: `3-${questions.length + 1}`,
                    marks: 3,
                    examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                    question: `Describe ${keyTerm} in detail based on ${sectionTitle}.`,
                    answer: paragraph.trim().substring(0, 600),
                    image: images.length > 0 ? images[Math.min(questions.length, images.length - 1)] : null
                });
            }
        });

        return questions.slice(0, 4);
    }

    // Generate 10-mark questions for a specific section - increased limit
    generate10MarkQuestionsForSection(sectionTitle, content, images = []) {
        const questions = [];
        
        if (content.length > 300) {
            const keyTerm = this.extractKeyTerm(content) || sectionTitle;
            
            // Generate one comprehensive question
            questions.push({
                id: `10-${questions.length + 1}`,
                marks: 10,
                examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                question: `Discuss ${keyTerm} comprehensively as explained in ${sectionTitle}. Include all key aspects, characteristics, and implications.`,
                answer: content.trim().substring(0, 2000),
                image: images.length > 0 ? images.slice(0, Math.min(3, images.length)) : null
            });

            // If content is very long, generate additional questions from different parts
            if (content.length > 1000) {
                const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 200);
                if (paragraphs.length >= 2) {
                    // Generate question from second half of content
                    const secondHalf = paragraphs.slice(Math.floor(paragraphs.length / 2)).join('\n\n');
                    const secondKeyTerm = this.extractKeyTerm(secondHalf) || keyTerm;
                    
                    questions.push({
                        id: `10-${questions.length + 1}`,
                        marks: 10,
                        examDate: `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`,
                        question: `Provide a detailed analysis of ${secondKeyTerm} based on ${sectionTitle}, covering all relevant aspects and applications.`,
                        answer: secondHalf.trim().substring(0, 2000)
                    });
                }
            }
        }

        return questions.slice(0, 2);
    }

    // Find answer content within a section
    findAnswerInSection(sectionContent, term) {
        const sentences = this.splitIntoSentences(sectionContent);
        const relevant = sentences.filter(s => 
            s.toLowerCase().includes(term.toLowerCase()) && s.length > 20
        );
        
        if (relevant.length > 0) {
            return relevant.join(' ');
        }
        
        return sectionContent.substring(0, 500);
    }
}

// Export for use in other scripts
window.QuestionGenerator = QuestionGenerator;

