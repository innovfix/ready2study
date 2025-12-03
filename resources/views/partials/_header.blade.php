<header>
    <div class="container nav-content">
        <a href="{{ route('home') }}" class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            Ready<span>2Study</span>
        </a>
        <nav>
            @if(request()->routeIs('dashboard') || request()->routeIs('test') || request()->routeIs('test.results'))
            <div id="studentHeaderInfo" style="display: none; align-items: center; gap: 1rem; margin-left: auto; justify-content: flex-end;">
                <!-- Profile Card -->
                <div style="padding: 1rem 1.25rem; background: linear-gradient(135deg, #bfdbfe 0%, #dbeafe 50%, #e0f2fe 100%); border-radius: 0.75rem; box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1); position: relative; min-height: 90px; width: auto; min-width: 400px;">
                    <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
                        <div style="display: flex; justify-content: flex-end; margin-bottom: auto;">
                            <div id="headerName" style="font-family: 'Poppins', 'Montserrat', sans-serif; font-weight: 700; font-size: 1.25rem; color: #ec4899; letter-spacing: 0.02em; text-align: right;"></div>
                        </div>
                        <div id="headerDetails" style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-top: auto;">
                            <span id="courseSpan" style="display: inline-flex; align-items: center; gap: 0.375rem; color: #7c3aed; background: rgba(167, 139, 250, 0.25); padding: 0.375rem 0.75rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.75rem; border: 1px solid rgba(167, 139, 250, 0.3);"></span>
                            <span id="yearSpan" style="display: inline-flex; align-items: center; gap: 0.375rem; color: #a855f7; font-weight: 600; font-size: 0.75rem;"></span>
                            <span id="collegeSpan" style="display: inline-flex; align-items: center; gap: 0.375rem; color: #14b8a6; font-weight: 600; font-size: 0.75rem;"></span>
                        </div>
                    </div>
                </div>
                <!-- Logout Button -->
                @if(request()->routeIs('dashboard'))
                <button id="logoutBtn" class="btn btn-secondary" style="padding: 0.625rem 1.25rem; font-size: 0.75rem; background: #ef4444; color: white; border: none; border-radius: 0.625rem; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3); font-weight: 600; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; white-space: nowrap;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                </button>
                @endif
            </div>
            @endif
        </nav>
    </div>
</header>




