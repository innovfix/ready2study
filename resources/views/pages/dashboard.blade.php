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
        <div class="filter-group" style="margin-top: 2rem; padding: 1.5rem; background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%); border-radius: 1rem; border: 2px solid #bae6fd;">
            <h3 style="margin-bottom: 1rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 17H20v-2.5a2.5 2.5 0 0 0-2.5-2.5H9"></path>
                    <path d="M9 12H4V6.5A2.5 2.5 0 0 1 6.5 4H20v5.5a2.5 2.5 0 0 1-2.5 2.5H9z"></path>
                </svg>
                Study Tools
            </h3>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="display: flex; gap: 0.25rem; align-items: center;">
                        <img src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80&h=80&fit=crop&crop=center" alt="Books" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.375rem; border: 2px solid #e0e7ff;">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=center" alt="Books" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.375rem; border: 2px solid #e0e7ff; margin-left: -10px; z-index: 1; position: relative;">
                        <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=80&h=80&fit=crop&crop=center" alt="Books" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.375rem; border: 2px solid #e0e7ff; margin-left: -10px; z-index: 2; position: relative;">
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-main); font-size: 0.875rem;">Books</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Study Materials</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <img src="https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=80&h=80&fit=crop&crop=center" alt="Pens" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.375rem; border: 2px solid #fee2e2; transform: rotate(-15deg);">
                        <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=80&h=80&fit=crop&crop=center" alt="Pens" style="width: 50px; height: 50px; object-fit: cover; border-radius: 0.375rem; border: 2px solid #fef3c7; transform: rotate(10deg); margin-left: -8px; z-index: 1; position: relative;">
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text-main); font-size: 0.875rem;">Pens</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Writing Tools</div>
                    </div>
                </div>
            </div>
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

@push('modals')
    @include('partials._chat-modal')
    @include('partials._media-modal')
    @include('partials._pdf-content-modal')
    
    <!-- Calculator Modal -->
    <div class="calculator-modal" id="calculatorModal">
        <div class="calculator-modal-content">
            <div class="calculator-header">
                <h3>Math Calculator</h3>
                <button class="calculator-close" id="calculatorClose">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="calculator-body">
                <div class="calculator-display" id="calculatorDisplay">0</div>
                <div class="calculator-buttons">
                    <button class="calc-btn calc-clear" onclick="clearCalculator()">C</button>
                    <button class="calc-btn calc-clear" onclick="clearEntry()">CE</button>
                    <button class="calc-btn calc-operator" onclick="appendToCalc('/')">/</button>
                    <button class="calc-btn calc-operator" onclick="appendToCalc('*')">×</button>
                    
                    <button class="calc-btn" onclick="appendToCalc('7')">7</button>
                    <button class="calc-btn" onclick="appendToCalc('8')">8</button>
                    <button class="calc-btn" onclick="appendToCalc('9')">9</button>
                    <button class="calc-btn calc-operator" onclick="appendToCalc('-')">-</button>
                    
                    <button class="calc-btn" onclick="appendToCalc('4')">4</button>
                    <button class="calc-btn" onclick="appendToCalc('5')">5</button>
                    <button class="calc-btn" onclick="appendToCalc('6')">6</button>
                    <button class="calc-btn calc-operator" onclick="appendToCalc('+')">+</button>
                    
                    <button class="calc-btn" onclick="appendToCalc('1')">1</button>
                    <button class="calc-btn" onclick="appendToCalc('2')">2</button>
                    <button class="calc-btn" onclick="appendToCalc('3')">3</button>
                    <button class="calc-btn calc-equals" onclick="calculateResult()" rowspan="2">=</button>
                    
                    <button class="calc-btn calc-zero" onclick="appendToCalc('0')">0</button>
                    <button class="calc-btn" onclick="appendToCalc('.')">.</button>
                    <button class="calc-btn calc-operator" onclick="appendToCalc('(')">(</button>
                    <button class="calc-btn calc-operator" onclick="appendToCalc(')')">)</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Translate Modal -->
    <div class="translate-modal" id="translateModal">
        <div class="translate-modal-content">
            <div class="translate-header">
                <h3>Translate to Tamil</h3>
                <button class="translate-close" id="translateClose">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="translate-body">
                <div class="translate-input-section">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-main);">English Text:</label>
                    <textarea id="translateInput" class="translate-input" placeholder="Enter text to translate to Tamil..." rows="4"></textarea>
                </div>
                <button class="btn btn-primary" id="translateBtn" style="width: 100%; margin-top: 1rem;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
                        <path d="M5 8l6 6"></path>
                        <path d="M4 14l6-6 2-3"></path>
                    </svg>
                    Translate to Tamil
                </button>
                <div class="translate-output-section" id="translateOutputSection" style="display: none; margin-top: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-main);">Tamil Translation:</label>
                    <div id="translateOutput" class="translate-output"></div>
                    <button class="btn btn-secondary" id="copyTranslationBtn" style="width: 100%; margin-top: 0.75rem;">
                        Copy Translation
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Sources Sidebar -->
    <div id="sourcesSidebar" class="sources-sidebar">
        <div class="sources-sidebar-header">
            <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
                </svg>
                Sources & Resources
            </h3>
            <button id="closeSourcesSidebar" class="close-sources-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="sources-sidebar-content">
            <div id="sourcesLoading" class="sources-loading" style="display: none;">
                <div class="loader-spinner"></div>
                <p>Loading sources...</p>
            </div>
            <div id="sourcesContent">
                <div class="sources-section">
                    <h4>Video Links</h4>
                    <div id="videoLinks" class="sources-links"></div>
                </div>
                <div class="sources-section">
                    <h4>Related Articles</h4>
                    <div id="articleLinks" class="sources-links"></div>
                </div>
                <div class="sources-section">
                    <h4>Related Images</h4>
                    <div id="relatedImages" class="sources-images"></div>
                </div>
            </div>
        </div>
    </div>
    <div id="sourcesSidebarOverlay" class="sources-sidebar-overlay"></div>
@endpush

@push('scripts')
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="{{ asset('js/app.js') }}"></script>
<script>
    // Calculator functionality
    let calculatorValue = '0';
    let shouldResetDisplay = false;

    function updateCalculatorDisplay() {
        document.getElementById('calculatorDisplay').textContent = calculatorValue;
    }

    function appendToCalc(value) {
        if (shouldResetDisplay) {
            calculatorValue = '0';
            shouldResetDisplay = false;
        }
        if (calculatorValue === '0' && value !== '.') {
            calculatorValue = value;
        } else {
            calculatorValue += value;
        }
        updateCalculatorDisplay();
    }

    function clearCalculator() {
        calculatorValue = '0';
        updateCalculatorDisplay();
    }

    function clearEntry() {
        calculatorValue = '0';
        updateCalculatorDisplay();
    }

    function calculateResult() {
        try {
            // Replace × with * for evaluation
            const expression = calculatorValue.replace(/×/g, '*');
            const result = Function('"use strict"; return (' + expression + ')')();
            calculatorValue = result.toString();
            shouldResetDisplay = true;
            updateCalculatorDisplay();
        } catch (error) {
            calculatorValue = 'Error';
            updateCalculatorDisplay();
            setTimeout(() => {
                calculatorValue = '0';
                updateCalculatorDisplay();
            }, 2000);
        }
    }

    // Calculator Modal
    const calculatorModal = document.getElementById('calculatorModal');
    const calculatorButton = document.getElementById('calculatorButton');
    const calculatorClose = document.getElementById('calculatorClose');

    if (calculatorButton) {
        calculatorButton.addEventListener('click', () => {
            calculatorModal.classList.add('active');
        });
    }

    if (calculatorClose) {
        calculatorClose.addEventListener('click', () => {
            calculatorModal.classList.remove('active');
        });
    }

    if (calculatorModal) {
        calculatorModal.addEventListener('click', (e) => {
            if (e.target === calculatorModal) {
                calculatorModal.classList.remove('active');
            }
        });
    }

    // Translation functionality
    async function translateToTamil() {
        const inputText = document.getElementById('translateInput').value.trim();
        if (!inputText) {
            alert('Please enter text to translate.');
            return;
        }

        const translateBtn = document.getElementById('translateBtn');
        const outputSection = document.getElementById('translateOutputSection');
        const output = document.getElementById('translateOutput');

        translateBtn.disabled = true;
        translateBtn.innerHTML = 'Translating...';
        outputSection.style.display = 'none';

        try {
            // Use Google Translate API (free alternative)
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=en|ta`);
            const data = await response.json();

            if (data.responseStatus === 200 && data.responseData) {
                // Extract only the translated text
                let tamilText = data.responseData.translatedText || '';
                
                // Clean the text - remove any metadata
                tamilText = tamilText.trim();
                
                // Remove any unwanted patterns
                tamilText = tamilText.replace(/%\s*\d+[மூலம்@\s]*info:.*$/gi, '').trim();
                tamilText = tamilText.replace(/@\s*info:.*$/gi, '').trim();
                tamilText = tamilText.replace(/whatsthis/gi, '').trim();
                tamilText = tamilText.replace(/^[%\d@\s:]+/, '').trim();
                
                // Decode HTML entities properly
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = tamilText;
                tamilText = tempDiv.textContent || tempDiv.innerText || tamilText;
                
                // If cleaned text is empty, use original
                if (!tamilText || tamilText.length === 0) {
                    tamilText = data.responseData.translatedText || 'Translation not available';
                }
                
                // Properly decode and set Tamil text
                // Clear output first
                output.innerHTML = '';
                
                // Create a text node to ensure proper Unicode handling
                const textNode = document.createTextNode(tamilText);
                output.appendChild(textNode);
                
                // Set Tamil-specific styling
                output.setAttribute('lang', 'ta');
                output.setAttribute('dir', 'ltr');
                output.style.fontFamily = "'Noto Sans Tamil', 'Arial Unicode MS', 'Tamil Sangam MN', sans-serif";
                output.style.fontSize = '1.125rem';
                output.style.lineHeight = '1.8';
                output.style.color = '#1e293b';
                output.style.whiteSpace = 'pre-wrap';
                output.style.wordWrap = 'break-word';
                
                outputSection.style.display = 'block';
            } else {
                throw new Error('Translation failed');
            }
        } catch (error) {
            console.error('Translation error:', error);
            // Fallback: Show message
            output.textContent = 'Translation service temporarily unavailable. Please try again later.';
            output.style.fontFamily = "'Inter', sans-serif";
            outputSection.style.display = 'block';
        } finally {
            translateBtn.disabled = false;
            translateBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
                    <path d="M5 8l6 6"></path>
                    <path d="M4 14l6-6 2-3"></path>
                </svg>
                Translate to Tamil
            `;
        }
    }

    function copyTranslation() {
        const output = document.getElementById('translateOutput');
        // Get text content properly handling Tamil characters
        const tamilText = output.innerText || output.textContent;
        navigator.clipboard.writeText(tamilText).then(() => {
            const btn = document.getElementById('copyTranslationBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy translation. Please select and copy manually.');
        });
    }

    // Translate Modal
    const translateModal = document.getElementById('translateModal');
    const translateButton = document.getElementById('translateButton');
    const translateClose = document.getElementById('translateClose');
    const translateBtn = document.getElementById('translateBtn');
    const copyBtn = document.getElementById('copyTranslationBtn');

    if (translateButton) {
        translateButton.addEventListener('click', () => {
            translateModal.classList.add('active');
            document.getElementById('translateInput').focus();
        });
    }


    if (translateClose) {
        translateClose.addEventListener('click', () => {
            translateModal.classList.remove('active');
        });
    }

    if (translateModal) {
        translateModal.addEventListener('click', (e) => {
            if (e.target === translateModal) {
                translateModal.classList.remove('active');
            }
        });
    }

    if (translateBtn) {
        translateBtn.addEventListener('click', translateToTamil);
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', copyTranslation);
    }
</script>
@endpush


