@extends('layouts.app')

@section('title', 'Dashboard - Ready2Study')

@section('content')
<div class="dashboard-layout container">
    <aside class="sidebar">
        <div class="filter-group">
            <h3>Filter by Marks</h3>
            <button class="filter-btn active" data-filter="all">All Questions</button>
            <button class="filter-btn" data-filter="1">1 Mark</button>
            <button class="filter-btn" data-filter="2">2 Marks</button>
            <button class="filter-btn" data-filter="3">3 Marks</button>
            <button class="filter-btn" data-filter="10">10 Marks</button>
        </div>
        <div class="filter-group" style="margin-top: 2rem;">
            <h3>My Collections</h3>
            <button class="filter-btn" data-filter="important">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem; vertical-align: middle;">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Important
            </button>
        </div>
        <div class="filter-group" style="margin-top: 2rem;">
            <h3>Practice Test</h3>
            <a href="{{ route('test') }}" class="filter-btn" style="background: var(--gradient-primary); color: white; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Start Practice Test
            </a>
            <div style="margin-top: 0.75rem; padding: 0.75rem; background: #f8fafc; border-radius: 0.5rem; font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;">
                <div style="margin-bottom: 0.25rem;"><strong>📊</strong> 20 Marks</div>
                <div style="margin-bottom: 0.25rem;"><strong>⏱️</strong> 60 Minutes</div>
                <div><strong>🎤</strong> Text/Voice Input</div>
            </div>
            <a href="{{ route('test') }}" class="filter-btn" style="margin-top: 0.75rem; background: var(--gradient-primary); color: white; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Start
            </a>
        </div>
        <div class="filter-group" style="margin-top: 2rem;">
            <h3>Actions</h3>
            <button class="filter-btn" id="toggleHighlightMode" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                </svg>
                Highlight Key Points
            </button>
            <button class="filter-btn" id="toggleAllAnswers">Show All Answers</button>
            <button class="filter-btn" id="viewFullPDF" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                View Full PDF Content
            </button>
            <button class="filter-btn" id="exportPDFBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem; vertical-align: middle;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Export Questions & Answers to PDF
            </button>
        </div>
    </aside>

    <section class="content-area">
        <!-- Questions and Answers Container - Simple Display -->
        <div class="questions-grid" id="questionsContainer" style="min-height: 500px; width: 100%; max-width: 900px; margin: 0 auto;">
            <!-- Questions and Answers will be displayed here one by one -->
        </div>
    </section>
</div>
@endsection

@push('modals')
    @include('partials._chat-modal')
    @include('partials._media-modal')
    @include('partials._pdf-content-modal')
@endpush

@push('scripts')
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="{{ asset('js/app.js') }}"></script>
@endpush

