# Installation Steps for AI Question Generation

## Prerequisites
- PHP 8.1 or higher
- Composer installed
- Laravel Framework

## Step 1: Install PDF Parser Library

Run the following command in your project root directory:

```bash
composer require smalot/pdfparser
```

Or if you prefer to install manually, add it to `composer.json` and run `composer install`:

```json
{
    "require": {
        "smalot/pdfparser": "^2.0"
    }
}
```

## Step 2: Configure Environment Variables

Add the following to your `.env` file:

```env
# OpenRouter API Configuration for AI Question Generation
OPENROUTER_API_KEY=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
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
```

## Step 3: Verify Installation

1. Check that `vendor/smalot/pdfparser` directory exists after running `composer install`
2. Verify `.env` file has the OpenRouter API key configured
3. Clear Laravel config cache (if applicable):
   ```bash
   php artisan config:clear
   ```

## Step 4: Test the Feature

1. Start your Laravel server:
   ```bash
   php artisan serve
   ```

2. Navigate to the dashboard
3. Upload a PDF file
4. Click the "Generate Questions" button
5. Wait for questions to be generated (may take 30-60 seconds)
6. Verify questions appear with answers

## Troubleshooting

### PDF Parser Not Found
- Ensure `composer install` completed successfully
- Check `vendor/` directory exists
- Verify `composer.json` includes `smalot/pdfparser`

### API Key Issues
- Verify `.env` file has correct API key
- Check `config/services.php` is loading environment variables
- Clear config cache: `php artisan config:clear`

### PDF Text Extraction Fails
- Ensure PDF has extractable text (not just images)
- Check file permissions on uploaded PDFs
- Verify `storage/app/public/pdfs` directory exists and is writable

### Question Generation Fails
- Check Laravel logs: `storage/logs/laravel.log`
- Verify internet connection (OpenRouter API requires internet)
- Check API key is valid and has credits
- Ensure PDF content is not empty

## Files Created/Modified

### New Files:
- `app/Services/QuestionGeneratorService.php` - AI service for question generation
- `config/services.php` - OpenRouter API configuration
- `composer.json` - PHP dependencies configuration

### Modified Files:
- `app/Http/Controllers/Api/PDFController.php` - Added text extraction and generation endpoint
- `routes/api.php` - Added generate-questions route
- `js/api-service.js` - Added generateQuestions API method
- `dashboard.html` - Added Generate Questions button
- `js/app.js` - Added button handler and question loading logic
- `SETUP_GUIDE.md` - Updated with AI generation setup instructions

## Implementation Status

✅ PDF Parser dependency added to composer.json
✅ QuestionGeneratorService created with OpenRouter integration
✅ PDF text extraction implemented
✅ Generate questions endpoint added
✅ API route configured
✅ Frontend API method added
✅ Generate Questions button added to UI
✅ Event handlers implemented
✅ Error handling and loading states added

## Next Steps

1. Run `composer install` to install dependencies
2. Configure `.env` with OpenRouter API key
3. Test the complete flow
4. Monitor Laravel logs for any issues
5. Adjust question generation prompts if needed



