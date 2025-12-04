# Ready2Study MySQL Backend Setup Guide

## Prerequisites
- PHP 8.1 or higher
- MySQL 5.7 or higher
- Composer
- Laravel Framework (already partially set up)

## Database Setup

1. **Create MySQL Database**
   ```sql
   CREATE DATABASE ready2study CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Configure .env file**
   Create or update `.env` file in the root directory:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=ready2study
   DB_USERNAME=root
   DB_PASSWORD=
   
   APP_URL=http://localhost/Ready2Study
   
   # OpenRouter API Configuration for AI Question Generation
   OPENROUTER_API_KEY=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
   OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
   ```

3. **Install Dependencies**
   ```bash
   # Install PHP dependencies (including PDF parser)
   composer require smalot/pdfparser
   
   # Install Node dependencies (if any)
   npm install
   ```

4. **Run Migrations**
   ```bash
   php artisan migrate
   ```

## File Storage Setup

1. **Create Storage Directories**
   ```bash
   mkdir -p storage/app/public/pdfs
   mkdir -p storage/app/public/media
   ```

2. **Create Storage Symlink**
   ```bash
   php artisan storage:link
   ```

3. **Set Permissions** (Linux/Mac)
   ```bash
   chmod -R 775 storage
   chmod -R 775 bootstrap/cache
   ```

## API Configuration

The API routes are configured in `routes/api.php` and use session-based authentication (`auth:web` middleware).

### API Endpoints

**Authentication:**
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/user` - Get current user

**PDFs:**
- `POST /api/pdfs/upload` - Upload PDF (automatically extracts text)
- `GET /api/pdfs` - Get user's PDFs
- `GET /api/pdfs/{id}` - Get specific PDF
- `PUT /api/pdfs/{id}/content` - Update PDF content
- `POST /api/pdfs/{id}/generate-questions` - Generate questions using AI (Claude Sonnet 4.5)
- `DELETE /api/pdfs/{id}` - Delete PDF

**Questions:**
- `GET /api/questions?pdf_id={id}` - Get questions for PDF
- `POST /api/questions` - Create questions (bulk)
- `PUT /api/questions/{id}` - Update question
- `DELETE /api/questions/{id}` - Delete question

**Highlights:**
- `GET /api/highlights` - Get all highlights
- `GET /api/highlights/{questionId}` - Get highlights for question
- `POST /api/highlights/{questionId}` - Save highlights
- `DELETE /api/highlights/{questionId}` - Delete highlights

**Important Questions:**
- `GET /api/important-questions` - Get all important questions
- `POST /api/important-questions/{questionId}` - Mark as important
- `DELETE /api/important-questions/{questionId}` - Remove from important
- `GET /api/important-questions/{questionId}/check` - Check if important

**Media:**
- `GET /api/questions/{questionId}/media` - Get media for question
- `POST /api/questions/{questionId}/media` - Upload media
- `DELETE /api/questions/{questionId}/media/{mediaId}` - Delete media

**Tests:**
- `POST /api/tests` - Create test
- `GET /api/tests` - Get user's tests
- `GET /api/tests/{id}` - Get test details
- `POST /api/tests/{testId}/answers` - Save test answer
- `POST /api/tests/{testId}/answers/{answerId}/highlights` - Save answer highlights
- `POST /api/tests/{id}/submit` - Submit test

## Frontend Integration

The frontend has been updated to use the API service layer (`js/api-service.js`). All API calls are handled through this service.

### Key Changes:
1. **Authentication**: Registration/login now uses API endpoints
2. **PDF Upload**: PDFs are uploaded to server and stored in database
3. **Questions**: Questions are loaded from database instead of localStorage
4. **Highlights**: Highlights are saved to database
5. **Important Questions**: Marked questions are stored in database

## Testing

1. **Start Laravel Development Server**
   ```bash
   php artisan serve
   ```

2. **Access Application**
   - Open browser to `http://localhost:8000` or your configured URL
   - Register a new user
   - Upload a PDF
   - Generate questions
   - Test all features

## AI Question Generation Setup

The application uses OpenRouter's Claude Sonnet 4.5 model to automatically generate exam questions from PDF content.

### Features:
- **Automatic Text Extraction**: PDFs are automatically parsed to extract text content
- **Intelligent Question Distribution**: AI decides optimal mix of 1-mark, 2-mark, 3-mark, and 10-mark questions
- **Complete Answers**: Each generated question includes a detailed answer
- **One-Click Generation**: Simply click "Generate Questions" button after uploading a PDF

### How It Works:
1. Upload a PDF file
2. System automatically extracts text from PDF (using smalot/pdfparser)
3. Click "Generate Questions" button
4. AI analyzes content and generates appropriate questions
5. Questions are saved to database and displayed immediately

### Requirements:
- OpenRouter API key (configured in `.env`)
- PDF parser library (`composer require smalot/pdfparser`)

## Troubleshooting

### Database Connection Issues
- Check `.env` file has correct database credentials
- Ensure MySQL service is running
- Verify database exists

### File Upload Issues
- Check `storage/app/public` directory exists
- Run `php artisan storage:link`
- Check file permissions

### API Authentication Issues
- Ensure session middleware is enabled
- Check CSRF token is included in requests
- Verify user is logged in

### AI Question Generation Issues
- Verify `OPENROUTER_API_KEY` is set in `.env` file
- Check that `smalot/pdfparser` is installed: `composer require smalot/pdfparser`
- Ensure PDF has extractable text (scanned PDFs may not work)
- Check Laravel logs: `storage/logs/laravel.log` for detailed error messages
- Verify internet connection (OpenRouter API requires internet access)

## Next Steps

1. Configure email settings for password reset (if needed)
2. Set up queue system for PDF processing (optional)
3. Add API rate limiting
4. Implement proper error handling and logging
5. Add unit tests for API endpoints

