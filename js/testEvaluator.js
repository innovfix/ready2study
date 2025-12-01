// Test Answer Evaluator - Evaluates user answers and assigns marks

class TestEvaluator {
    constructor() {
        this.maxMarks = 20;
    }

    // Main evaluation function
    evaluateAnswer(userAnswer, correctAnswer, maxMarks = 20) {
        if (!userAnswer || !correctAnswer) {
            return {
                marks: 0,
                percentage: 0,
                grade: 'F',
                gradeColor: '#ef4444',
                feedback: 'Please provide an answer to evaluate.'
            };
        }

        // Normalize answers
        const userNormalized = this.normalizeText(userAnswer);
        const correctNormalized = this.normalizeText(correctAnswer);

        // Calculate similarity score (0-1)
        const similarity = this.calculateSimilarity(userNormalized, correctNormalized);

        // Calculate marks based on similarity
        let marks = Math.round(similarity * maxMarks);

        // Additional factors
        const wordCount = userAnswer.split(/\s+/).filter(w => w.length > 0).length;
        const lengthScore = this.evaluateLength(wordCount, maxMarks);
        
        // Key points matching
        const keyPointsScore = this.matchKeyPoints(userNormalized, correctNormalized);
        
        // Combine scores
        marks = Math.round((similarity * 0.5 + lengthScore * 0.2 + keyPointsScore * 0.3) * maxMarks);
        
        // Ensure marks are within range
        marks = Math.max(0, Math.min(maxMarks, marks));

        // Calculate percentage and grade
        const percentage = Math.round((marks / maxMarks) * 100);
        const grade = this.calculateGrade(percentage);
        const gradeColor = this.getGradeColor(grade);

        // Generate feedback
        const feedback = this.generateFeedback(marks, maxMarks, similarity, wordCount, userAnswer, correctAnswer);

        return {
            marks: marks,
            percentage: percentage,
            grade: grade,
            gradeColor: gradeColor,
            feedback: feedback
        };
    }

    // Normalize text for comparison
    normalizeText(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Calculate similarity between two texts
    calculateSimilarity(text1, text2) {
        // Word-based similarity
        const words1 = new Set(text1.split(' ').filter(w => w.length > 2));
        const words2 = new Set(text2.split(' ').filter(w => w.length > 2));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        const jaccardSimilarity = intersection.size / union.size;

        // N-gram similarity (bigrams)
        const bigrams1 = this.getBigrams(text1);
        const bigrams2 = this.getBigrams(text2);
        const bigramIntersection = bigrams1.filter(b => bigrams2.includes(b)).length;
        const bigramUnion = new Set([...bigrams1, ...bigrams2]).size;
        const bigramSimilarity = bigramUnion > 0 ? bigramIntersection / bigramUnion : 0;

        // Combine similarities
        return (jaccardSimilarity * 0.6 + bigramSimilarity * 0.4);
    }

    // Get bigrams (2-word sequences)
    getBigrams(text) {
        const words = text.split(' ').filter(w => w.length > 0);
        const bigrams = [];
        for (let i = 0; i < words.length - 1; i++) {
            bigrams.push(words[i] + ' ' + words[i + 1]);
        }
        return bigrams;
    }

    // Evaluate answer length
    evaluateLength(wordCount, maxMarks) {
        // For 20 marks, expect at least 150-200 words
        const minWords = 100;
        const idealWords = 200;
        const maxWords = 400;

        if (wordCount < minWords) {
            return 0.3; // Too short
        } else if (wordCount >= minWords && wordCount < idealWords) {
            return 0.5 + (wordCount - minWords) / (idealWords - minWords) * 0.3; // 0.5 to 0.8
        } else if (wordCount >= idealWords && wordCount <= maxWords) {
            return 1.0; // Ideal length
        } else {
            return 0.9; // Slightly too long but acceptable
        }
    }

    // Match key points/concepts
    matchKeyPoints(userText, correctText) {
        // Extract important terms (longer words, capitalized terms)
        const correctWords = correctText.split(' ').filter(w => w.length > 4);
        const userWords = userText.split(' ').filter(w => w.length > 4);

        const correctSet = new Set(correctWords);
        const userSet = new Set(userWords);

        const matched = [...userSet].filter(w => correctSet.has(w)).length;
        const totalImportant = correctSet.size;

        return totalImportant > 0 ? Math.min(1, matched / totalImportant) : 0.5;
    }

    // Calculate grade
    calculateGrade(percentage) {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C+';
        if (percentage >= 40) return 'C';
        if (percentage >= 30) return 'D';
        return 'F';
    }

    // Get grade color
    getGradeColor(grade) {
        const colors = {
            'A+': '#10b981', // Green
            'A': '#10b981',
            'B+': '#3b82f6', // Blue
            'B': '#3b82f6',
            'C+': '#f59e0b', // Amber
            'C': '#f59e0b',
            'D': '#f97316', // Orange
            'F': '#ef4444'  // Red
        };
        return colors[grade] || '#ef4444';
    }

    // Generate detailed feedback
    generateFeedback(marks, maxMarks, similarity, wordCount, userAnswer, correctAnswer) {
        const percentage = (marks / maxMarks) * 100;
        let feedback = '';

        // Overall performance
        if (percentage >= 80) {
            feedback += '<p style="color: #10b981; font-weight: 600; margin-bottom: 1rem;">✓ Excellent Answer!</p>';
            feedback += '<p>Your answer demonstrates a strong understanding of the topic. You covered most of the key points and provided comprehensive explanations.</p>';
        } else if (percentage >= 60) {
            feedback += '<p style="color: #3b82f6; font-weight: 600; margin-bottom: 1rem;">✓ Good Answer</p>';
            feedback += '<p>Your answer shows a good understanding, but could benefit from more detail and covering additional key concepts.</p>';
        } else if (percentage >= 40) {
            feedback += '<p style="color: #f59e0b; font-weight: 600; margin-bottom: 1rem;">⚠ Needs Improvement</p>';
            feedback += '<p>Your answer touches on some relevant points, but lacks depth and misses several important concepts. Consider expanding your explanation.</p>';
        } else {
            feedback += '<p style="color: #ef4444; font-weight: 600; margin-bottom: 1rem;">⚠ Needs Significant Improvement</p>';
            feedback += '<p>Your answer is too brief or doesn\'t adequately address the question. Review the topic and provide more comprehensive details.</p>';
        }

        // Length feedback
        feedback += '<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">';
        feedback += '<strong>Answer Length:</strong> ';
        if (wordCount < 100) {
            feedback += `Your answer is quite short (${wordCount} words). For a 20-mark question, aim for at least 150-200 words to cover all aspects thoroughly.`;
        } else if (wordCount < 150) {
            feedback += `Your answer is adequate in length (${wordCount} words), but could be more detailed.`;
        } else if (wordCount <= 300) {
            feedback += `Good length (${wordCount} words). Your answer provides sufficient detail.`;
        } else {
            feedback += `Comprehensive answer (${wordCount} words). Well-detailed response.`;
        }
        feedback += '</div>';

        // Similarity feedback
        feedback += '<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">';
        feedback += '<strong>Content Match:</strong> ';
        const similarityPercent = Math.round(similarity * 100);
        if (similarityPercent >= 70) {
            feedback += `Your answer closely matches the expected content (${similarityPercent}% similarity). Great job covering the key points!`;
        } else if (similarityPercent >= 50) {
            feedback += `Your answer partially matches the expected content (${similarityPercent}% similarity). Try to include more relevant concepts.`;
        } else {
            feedback += `Your answer has limited match with expected content (${similarityPercent}% similarity). Review the topic and include more relevant information.`;
        }
        feedback += '</div>';

        // Suggestions
        feedback += '<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">';
        feedback += '<strong>Suggestions for Improvement:</strong><ul style="margin-top: 0.5rem; padding-left: 1.5rem;">';
        
        if (wordCount < 150) {
            feedback += '<li>Expand your answer with more details and examples</li>';
        }
        if (similarity < 0.5) {
            feedback += '<li>Include more key concepts and terminology from the topic</li>';
        }
        if (percentage < 60) {
            feedback += '<li>Structure your answer with clear points and explanations</li>';
            feedback += '<li>Provide examples or applications where relevant</li>';
        }
        
        feedback += '</ul></div>';

        return feedback;
    }
}

// Export for use
window.TestEvaluator = TestEvaluator;



