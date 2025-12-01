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
            <div id="studentHeaderInfo" style="display: none;">
                <div style="text-align: right;">
                    <div id="headerName" style="font-weight: 600; color: var(--text-main);"></div>
                    <div id="headerDetails" style="font-size: 0.875rem; color: var(--text-muted);"></div>
                </div>
                @if(request()->routeIs('dashboard'))
                <button id="logoutBtn" class="btn btn-secondary" style="margin-left: 1rem; padding: 0.5rem 1rem; font-size: 0.875rem;">
                    Logout
                </button>
                @endif
            </div>
            @endif
        </nav>
    </div>
</header>

