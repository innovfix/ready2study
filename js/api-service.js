// API Service Layer for Ready2Study
// Handles all backend API calls

const API_BASE_URL = 'api';
// Fallback: try standalone endpoint if Laravel routes fail
const API_FALLBACK_URL = '';

// Helper function to get CSRF token
function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
}

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const csrfToken = getCSRFToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        credentials: 'same-origin',
    };
    
    // Only add CSRF token if available (for protected routes)
    if (csrfToken) {
        defaultOptions.headers['X-CSRF-TOKEN'] = csrfToken;
    }

    // Merge options
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {}),
        },
    };

    // Handle FormData (for file uploads)
    if (options.body instanceof FormData) {
        delete finalOptions.headers['Content-Type'];
    }

    try {
        const response = await fetch(url, finalOptions);
        
        // Get response text first to check if it's JSON
        const responseText = await response.text();
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // Check if this is a highlight endpoint (404 is expected for static HTML)
            const isHighlightEndpoint = url.includes('/highlights');
            
            if (!isHighlightEndpoint) {
                // Response is not JSON (likely HTML error page)
                console.error('Non-JSON response:', responseText.substring(0, 500));
            }
            
            // Try to extract error message from HTML if possible
            const errorMatch = responseText.match(/<b>([^<]+)<\/b>/i) || responseText.match(/Error[:\s]+([^<\n]+)/i);
            const errorMsg = errorMatch ? errorMatch[1] : 'Server returned an error page. Please check if the API endpoint exists.';
            throw new Error(errorMsg);
        }
        
        // Try to parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error. Response text:', responseText.substring(0, 500));
            throw new Error('Invalid JSON response from server: ' + parseError.message);
        }

        if (!response.ok) {
            // Check if this is a highlight endpoint (404 is expected for static HTML)
            const isHighlightEndpoint = url.includes('/highlights');
            
            if (!isHighlightEndpoint || response.status !== 404) {
                throw new Error(data.message || `API request failed with status ${response.status}`);
            } else {
                // For highlight endpoints, return empty data instead of throwing
                return { highlight: [], highlights: [] };
            }
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication API
const AuthAPI = {
    register: async (userData) => {
        console.log('→ AuthAPI.register() called with data:', userData);
        
        // Try standalone endpoint first (more reliable for static HTML)
        // Try multiple possible paths
        const possiblePaths = [
            'api/register-simple.php',  // Simplified version first
            'api/register.php',  // Full version
            '/api/register-simple.php', // Absolute simplified
            '/api/register.php', // Absolute full
            '/Ready2Study/api/register-simple.php', // Full path simplified
            '/Ready2Study/api/register.php', // Full path
        ];
        
        console.log('→ Attempting registration via standalone PHP endpoints...');
        let lastError = null;
        let attemptNumber = 0;
        
        for (const path of possiblePaths) {
            attemptNumber++;
            try {
                console.log(`  Attempt ${attemptNumber}/${possiblePaths.length}: ${path}`);
                const response = await fetch(path, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                });
                
                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // Not JSON, try next path
                    console.log(`  ✗ Invalid JSON response from ${path}`);
                    lastError = new Error('Server returned invalid response: ' + text.substring(0, 100));
                    continue;
                }
                
                if (!response.ok) {
                    console.log(`  ✗ Error response (${response.status}) from ${path}:`, data);
                    const errorMsg = data.error || data.message || `Registration failed (${response.status})`;
                    const details = data.details ? ` Details: ${data.details}` : '';
                    lastError = new Error(errorMsg + details);
                    continue;
                }
                
                // Success!
                console.log(`  ✓ SUCCESS via ${path}`);
                console.log('✓ Registration response:', data);
                return data;
            } catch (error) {
                console.log(`  ✗ Request failed for ${path}:`, error.message);
                lastError = error;
                continue; // Try next path
            }
        }
        
        // All standalone paths failed, try Laravel route
        console.warn('✗ All standalone endpoints failed, trying Laravel route');
        console.warn('Last standalone error:', lastError);
        try {
            console.log('→ Attempting Laravel route: /register');
            const result = await apiCall('/register', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
            console.log('✓ SUCCESS via Laravel route');
            return result;
        } catch (laravelError) {
            console.error('✗ Laravel route also failed:', laravelError);
            const errorMsg = lastError?.message || laravelError.message || 'Registration failed. Please check server configuration and database connection.';
            console.error('=== REGISTRATION COMPLETELY FAILED ===');
            console.error('Attempted paths:', possiblePaths);
            console.error('Standalone error:', lastError);
            console.error('Laravel error:', laravelError);
            throw new Error(errorMsg);
        }
    },

    login: async (credentials) => {
        return await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    logout: async () => {
        return await apiCall('/logout', {
            method: 'POST',
        });
    },

    getUser: async () => {
        return await apiCall('/user');
    },
};

// User API
const UserAPI = {
    getProfile: async () => {
        return await apiCall('/profile');
    },

    updateProfile: async (userData) => {
        return await apiCall('/profile', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },
};

// PDF API
const PDFAPI = {
    upload: async (file, contentText = null) => {
        console.log('→ PDFAPI.upload() called');
        console.log('  File:', file.name, '(' + file.size + ' bytes)');
        console.log('  Content text length:', contentText ? contentText.length : 0);
        
        const formData = new FormData();
        formData.append('file', file);
        if (contentText) {
            formData.append('content_text', contentText);
        }
        
        // Add user ID if available in localStorage
        const storedUser = localStorage.getItem('ready2study_user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                if (userData.id) {
                    formData.append('user_id', userData.id);
                    console.log('  User ID:', userData.id);
                }
            } catch (e) {
                console.warn('Could not parse user data from localStorage');
            }
        }

        console.log('→ Uploading to /pdfs/upload...');
        const result = await apiCall('/pdfs/upload', {
            method: 'POST',
            body: formData,
        });
        console.log('✓ PDF uploaded successfully:', result);
        return result;
    },

    getAll: async () => {
        return await apiCall('/pdfs');
    },

    getById: async (id) => {
        return await apiCall(`/pdfs/${id}`);
    },

    updateContent: async (id, contentText) => {
        return await apiCall(`/pdfs/${id}/content`, {
            method: 'PUT',
            body: JSON.stringify({ content_text: contentText }),
        });
    },

    delete: async (id) => {
        return await apiCall(`/pdfs/${id}`, {
            method: 'DELETE',
        });
    },

    generateQuestions: async (id) => {
        return await apiCall(`/pdfs/${id}/generate-questions`, {
            method: 'POST',
        });
    },
};

// Question API
const QuestionAPI = {
    getByPDF: async (pdfId) => {
        return await apiCall(`/questions?pdf_id=${pdfId}`);
    },

    createBulk: async (pdfId, questions) => {
        console.log('→ QuestionAPI.createBulk() called');
        console.log('  PDF ID:', pdfId);
        console.log('  Questions count:', questions.length);
        console.log('  Questions:', questions);
        
        const result = await apiCall('/questions', {
            method: 'POST',
            body: JSON.stringify({
                pdf_id: pdfId,
                questions: questions,
            }),
        });
        
        console.log('✓ Questions saved successfully:', result);
        return result;
    },

    update: async (id, questionData) => {
        return await apiCall(`/questions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(questionData),
        });
    },

    delete: async (id) => {
        return await apiCall(`/questions/${id}`, {
            method: 'DELETE',
        });
    },
};

// Highlight API
// Note: These endpoints don't exist in static HTML version
// All methods silently fail and return empty/default values to prevent 404 errors
const HighlightAPI = {
    getAll: async () => {
        try {
            return await apiCall('/highlights');
        } catch (error) {
            // Silently fail - endpoint doesn't exist for static HTML
            return { highlights: [] };
        }
    },

    getByQuestion: async (questionId) => {
        try {
            return await apiCall(`/highlights/${questionId}`);
        } catch (error) {
            // Silently fail - endpoint doesn't exist for static HTML
            return { highlight: [], highlights: [] };
        }
    },

    save: async (questionId, highlightData) => {
        try {
            return await apiCall(`/highlights/${questionId}`, {
                method: 'POST',
                body: JSON.stringify({ highlight_data: highlightData }),
            });
        } catch (error) {
            // Silently fail - endpoint doesn't exist for static HTML
            return { success: true };
        }
    },

    delete: async (questionId) => {
        try {
            return await apiCall(`/highlights/${questionId}`, {
                method: 'DELETE',
            });
        } catch (error) {
            // Silently fail - endpoint doesn't exist for static HTML
            return { success: true };
        }
    },
};

// Important Question API
const ImportantQuestionAPI = {
    getAll: async () => {
        return await apiCall('/important-questions');
    },

    add: async (questionId) => {
        return await apiCall(`/important-questions/${questionId}`, {
            method: 'POST',
        });
    },

    remove: async (questionId) => {
        return await apiCall(`/important-questions/${questionId}`, {
            method: 'DELETE',
        });
    },

    check: async (questionId) => {
        return await apiCall(`/important-questions/${questionId}/check`);
    },
};

// Media API
const MediaAPI = {
    getByQuestion: async (questionId) => {
        return await apiCall(`/questions/${questionId}/media`);
    },

    upload: async (questionId, file) => {
        const formData = new FormData();
        formData.append('file', file);

        return await apiCall(`/questions/${questionId}/media`, {
            method: 'POST',
            body: formData,
        });
    },

    delete: async (questionId, mediaId) => {
        return await apiCall(`/questions/${questionId}/media/${mediaId}`, {
            method: 'DELETE',
        });
    },
};

// Test API
const TestAPI = {
    create: async (pdfId, totalMarks, timeLimitMinutes = 60) => {
        return await apiCall('/tests', {
            method: 'POST',
            body: JSON.stringify({
                pdf_id: pdfId,
                total_marks: totalMarks,
                time_limit_minutes: timeLimitMinutes,
            }),
        });
    },

    getAll: async () => {
        return await apiCall('/tests');
    },

    getById: async (id) => {
        return await apiCall(`/tests/${id}`);
    },

    saveAnswer: async (testId, questionId, answerText, inputMode = 'text') => {
        return await apiCall(`/tests/${testId}/answers`, {
            method: 'POST',
            body: JSON.stringify({
                question_id: questionId,
                answer_text: answerText,
                input_mode: inputMode,
            }),
        });
    },

    saveAnswerHighlights: async (testId, answerId, highlightData) => {
        return await apiCall(`/tests/${testId}/answers/${answerId}/highlights`, {
            method: 'POST',
            body: JSON.stringify({ highlight_data: highlightData }),
        });
    },

    submit: async (testId) => {
        return await apiCall(`/tests/${testId}/submit`, {
            method: 'POST',
        });
    },
};

// Export API objects
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AuthAPI,
        UserAPI,
        PDFAPI,
        QuestionAPI,
        HighlightAPI,
        ImportantQuestionAPI,
        MediaAPI,
        TestAPI,
    };
}

