@extends('layouts.app')

@section('title', 'Test Results - Ready2Study')

@push('styles')
<style>
    .results-container {
        max-width: 1000px;
        margin: 2rem auto;
        padding: 2rem;
    }

    .results-header {
        background: white;
        border-radius: var(--radius-lg);
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: var(--shadow-lg);
        text-align: center;
    }

    .score-display {
        font-size: 3rem;
        font-weight: 900;
        background: var(--gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 1rem 0;
    }

    .score-details {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-top: 1.5rem;
    }

    .score-item {
        text-align: center;
    }

    .score-item-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary);
    }

    .score-item-label {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
    }

    .result-card {
        background: white;
        border-radius: var(--radius-lg);
        padding: 2rem;
        margin-bottom: 1.5rem;
        box-shadow: var(--shadow-sm);
        border-left: 4px solid var(--border);
    }

    .result-card.correct {
        border-left-color: #10b981;
    }

    .result-card.partial {
        border-left-color: #f59e0b;
    }

    .result-card.incorrect {
        border-left-color: #f43f5e;
    }

    .question-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1rem;
    }

    .question-info {
        flex: 1;
    }

    .marks-badge {
        padding: 0.5rem 1rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.875rem;
    }

    .marks-badge.obtained {
        background: #d1fae5;
        color: #065f46;
    }

    .marks-badge.total {
        background: #e2e8f0;
        color: #475569;
    }

    .answer-section {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px dashed var(--border);
    }

    .answer-label {
        font-weight: 600;
        color: var(--text-muted);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .answer-text {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        line-height: 1.6;
    }

    .feedback {
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .feedback.excellent {
        background: #d1fae5;
        color: #065f46;
    }

    .feedback.good {
        background: #fef3c7;
        color: #92400e;
    }

    .feedback.partial {
        background: #fed7aa;
        color: #9a3412;
    }

    .feedback.poor {
        background: #fee2e2;
        color: #991b1b;
    }

    .actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
    }
</style>
@endpush

@section('content')
<div class="results-container">
    <div class="results-header">
        <h1>Test Results</h1>
        <div class="score-display" id="scoreDisplay">0%</div>
        <div class="score-details">
            <div class="score-item">
                <div class="score-item-value" id="obtainedMarks">0</div>
                <div class="score-item-label">Obtained Marks</div>
            </div>
            <div class="score-item">
                <div class="score-item-value" id="totalMarks">20</div>
                <div class="score-item-label">Total Marks</div>
            </div>
        </div>
    </div>

    <div id="resultsContainer">
        <!-- Results will be displayed here -->
    </div>

    <div class="actions">
        <a href="{{ route('test') }}" class="btn btn-primary">Take Test Again</a>
        <a href="{{ route('dashboard') }}" class="btn btn-secondary">Back to Dashboard</a>
    </div>
</div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const resultsData = JSON.parse(localStorage.getItem('ready2study_test_results'));
        
        if (!resultsData) {
            document.getElementById('resultsContainer').innerHTML = `
                <div style="text-align: center; padding: 4rem; color: var(--text-muted);">
                    <h3>No test results found.</h3>
                    <a href="{{ route('test') }}" class="btn btn-primary" style="margin-top: 1rem;">Take Test</a>
                </div>
            `;
            return;
        }

        // Display score
        document.getElementById('scoreDisplay').textContent = `${resultsData.percentage.toFixed(1)}%`;
        document.getElementById('obtainedMarks').textContent = resultsData.obtainedMarks.toFixed(1);
        document.getElementById('totalMarks').textContent = resultsData.totalMarks;

        // Display results
        const container = document.getElementById('resultsContainer');
        
        resultsData.questions.forEach((q, index) => {
            const card = document.createElement('div');
            const scoreRatio = q.evaluation.score / q.marks;
            let cardClass = 'result-card';
            let feedbackClass = 'feedback';

            if (scoreRatio >= 0.8) {
                cardClass += ' correct';
                feedbackClass += ' excellent';
            } else if (scoreRatio >= 0.6) {
                cardClass += ' partial';
                feedbackClass += ' good';
            } else if (scoreRatio >= 0.4) {
                cardClass += ' partial';
                feedbackClass += ' partial';
            } else {
                cardClass += ' incorrect';
                feedbackClass += ' poor';
            }

            card.className = cardClass;
            card.innerHTML = `
                <div class="question-header">
                    <div class="question-info">
                        <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">Question ${index + 1}</div>
                        <div class="question-text">${q.question}</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span class="marks-badge obtained">${q.evaluation.score.toFixed(1)}</span>
                        <span class="marks-badge total">/ ${q.marks}</span>
                    </div>
                </div>
                <div class="answer-section">
                    <div class="answer-label">Your Answer:</div>
                    <div class="answer-text">${q.userAnswer || '<em style="color: var(--text-muted);">No answer provided</em>'}</div>
                    <div class="answer-label">Correct Answer:</div>
                    <div class="answer-text">${q.correctAnswer}</div>
                    <div class="${feedbackClass}" style="margin-top: 1rem;">${q.evaluation.feedback}</div>
                </div>
            `;

            container.appendChild(card);
        });
    });
</script>
@endpush







