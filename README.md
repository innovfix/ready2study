# Ready2Study

A comprehensive web application for students to upload PDFs, generate practice questions, and take automated tests with AI-powered answer evaluation.

## Features

### 📚 Core Functionality
- **Student Registration & Login**: Secure user authentication system
- **PDF Upload & Processing**: Upload PDFs and extract text/images
- **Question Generation**: Automatically generates questions (1, 2, 3, 10 marks) from PDF content
- **Practice Tests**: 20-mark test pattern (1×2 + 2×1 + 3×2 + 1×10)
- **Answer Evaluation**: AI-powered grading system with detailed feedback
- **Voice & Text Input**: Answer questions by typing or speaking

### 🎯 Dashboard Features
- Filter questions by marks (1, 2, 3, 10 marks)
- Mark important questions and organize by subject
- View saved important questions
- Print/Save PDF functionality
- Image display with full-screen modal

### 🎨 UI/UX
- Modern, responsive design
- Decorative book and pen images
- Clean gradient backgrounds
- Smooth animations
- Intuitive navigation

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **PDF Processing**: PDF.js library
- **Storage**: LocalStorage (client-side)
- **Speech Recognition**: Web Speech API

## Installation

1. Clone the repository:
```bash
git clone https://github.com/innovfix/ready2study.git
```

2. Navigate to the project directory:
```bash
cd ready2study
```

3. Set up a local web server (XAMPP, WAMP, or any web server)

4. Place the files in your web server's document root (e.g., `htdocs/Ready2Study`)

5. Open in browser:
```
http://localhost/Ready2Study/login.html
```

## Usage

1. **Register**: Enter your student details (name, college, course, year)
2. **Upload PDF**: Upload your study material PDF
3. **Generate Questions**: System automatically generates questions from PDF
4. **Practice**: Take practice tests and get evaluated
5. **Organize**: Mark important questions and save by subject

## File Structure

```
Ready2Study/
├── css/
│   └── style.css          # Main stylesheet
├── js/
│   ├── app.js             # Dashboard logic
│   ├── pdfProcessor.js    # PDF processing
│   ├── questionGenerator.js # Question generation
│   ├── test.js            # Test page logic
│   ├── testEvaluator.js   # Answer evaluation
│   └── mockData.js        # Sample data
├── dashboard.html         # Main dashboard
├── index.html            # PDF upload page
├── login.html            # Login page
├── student-info.html     # Registration page
├── test.html             # Practice test page
└── saved-questions.html  # Saved questions page
```

## Features in Detail

### Question Generation
- Extracts topics and key concepts from PDF
- Generates questions of varying difficulty (1-10 marks)
- Provides comprehensive answers from PDF content

### Test Evaluation
- Compares user answers with correct answers
- Calculates similarity scores
- Evaluates answer length and key points
- Provides detailed feedback and suggestions

### Mark Important
- Click star icon to mark questions as important
- Organize by subject/category
- View all saved questions in one place

## Browser Support

- Chrome (recommended)
- Firefox
- Edge
- Safari

## License

This project is open source and available for educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

InnovFix

## Repository

https://github.com/innovfix/ready2study

