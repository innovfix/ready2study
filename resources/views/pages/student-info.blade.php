@extends('layouts.app')

@section('title', 'Student Info - Ready2Study')

@section('main-class', 'hero')

@push('styles')
<style>
.form-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    border-radius: var(--radius-xl);
    padding: 3rem;
    box-shadow: var(--shadow-lg);
    max-width: 500px;
    margin: 0 auto;
    border: 1px solid var(--border);
}

.form-group {
    margin-bottom: 1.5rem;
    text-align: left;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text-main);
    font-size: 0.875rem;
}

.form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--background);
    font-family: inherit;
    font-size: 1rem;
    transition: all 0.2s;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    background: white;
}

.welcome-text {
    margin-bottom: 2rem;
    text-align: center;
}
</style>
@endpush

@section('content')
<div class="container">
    <div class="hero-content">
        <div class="welcome-text">
            <h1>Welcome Student!</h1>
            <p>Enter your details to get started with your personalized study session.</p>
        </div>

        <div class="form-card">
            <form id="studentForm">
                <div class="form-group">
                    <label for="name" class="form-label">Full Name</label>
                    <input type="text" id="name" class="form-input" placeholder="e.g. Hariharan" required>
                </div>

                <div class="form-group">
                    <label for="college" class="form-label">College / University Name</label>
                    <input type="text" id="college" class="form-input" placeholder="e.g. Anna University" required>
                </div>

                <div class="form-group">
                    <label for="course" class="form-label">Course / Major</label>
                    <input type="text" id="course" class="form-input" placeholder="e.g. B.Tech Computer Science" required>
                </div>

                <div class="form-group">
                    <label for="year" class="form-label">Studying Year</label>
                    <select id="year" class="form-input" required>
                        <option value="" disabled selected>Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                    Continue to Upload
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        style="margin-left: 0.5rem;">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </form>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    document.getElementById('studentForm').addEventListener('submit', function (e) {
        e.preventDefault();

        // Capture Data
        const studentData = {
            name: document.getElementById('name').value,
            college: document.getElementById('college').value,
            course: document.getElementById('course').value,
            year: document.getElementById('year').value
        };

        // Save to LocalStorage (Simulating a session)
        localStorage.setItem('ready2study_user', JSON.stringify(studentData));

        // Redirect
        window.location.href = '{{ route("home") }}';
    });
</script>
@endpush


