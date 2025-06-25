let quizData = []; // Will be loaded from en.json

// Fetch quiz data from en.json and initialize the app
document.addEventListener('DOMContentLoaded', () => {
    fetch('en.json')
        .then(response => response.json())
        .then(data => {
            quizData = data;
            init();
        })
        .catch(error => {
            console.error('Failed to load quiz data:', error);
            // Optionally show an error message to the user
        });
});

        // State variables
        let currentQuiz = null;
        let currentQuestionIndex = 0;
        let userAnswers = [];
        let quizResults = [];
        
        // DOM elements
        const quizMenu = document.getElementById('quiz-menu');
        const quizInterface = document.getElementById('quiz-interface');
        const quizHeader = document.getElementById('quiz-header');
        const questionText = document.getElementById('question-text');
        const optionsContainer = document.getElementById('options-container');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitQuizBtn = document.getElementById('submit-quiz');
        const progressText = document.getElementById('progress-text');
        const resultContainer = document.getElementById('result-container');
        const scoreElement = document.getElementById('score');
        const feedbackElement = document.getElementById('feedback');
        const correctCountElement = document.getElementById('correct-count');
        const totalQuestionsElement = document.getElementById('total-questions');
        const percentageElement = document.getElementById('percentage');
        const restartBtn = document.getElementById('restart-btn');
        
        // Initialize the application
        function init() {
            renderQuizMenu();
            setupEventListeners();
        }
        
        // Render the quiz menu
        function renderQuizMenu() {
            const quizzes = quizData[0].quizzes;
            quizMenu.innerHTML = '';
            
            quizzes.forEach((quiz, index) => {
                const quizElement = document.createElement('div');
                quizElement.className = 'quiz-item';
                quizElement.dataset.id = quiz.id;
                
                // Check if user has taken this quiz before
                const quizResult = quizResults.find(r => r.quizId === quiz.id);
                const status = quizResult ? 
                    `<span class="highlight">${quizResult.score}/${quiz.quiz.length}</span>` : 
                    '<span>Not started</span>';
                
                quizElement.innerHTML = `
                    <h3>${quiz.title}</h3>
                    <div class="quiz-info">
                        <span><i class="fas fa-question-circle"></i> ${quiz.quiz.length} questions</span>
                        <span>${status}</span>
                    </div>
                `;
                
                quizElement.addEventListener('click', () => startQuiz(quiz));
                quizMenu.appendChild(quizElement);
            });
        }
        
        // Set up event listeners
        function setupEventListeners() {
            prevBtn.addEventListener('click', showPreviousQuestion);
            nextBtn.addEventListener('click', showNextQuestion);
            submitQuizBtn.addEventListener('click', submitQuiz);
            restartBtn.addEventListener('click', resetQuiz);
        }
        
        // Start a quiz
        function startQuiz(quiz) {
            currentQuiz = quiz;
            currentQuestionIndex = 0;
            userAnswers = new Array(quiz.quiz.length).fill(null);
            
            // Update UI
            quizHeader.querySelector('.empty-state').style.display = 'none';
            quizInterface.style.display = 'block';
            document.querySelector('.quiz-title').textContent = quiz.title;
            updateProgress();
            renderQuestion();
            
            // Highlight selected quiz
            document.querySelectorAll('.quiz-item').forEach(item => {
                item.classList.remove('active');
                if (parseInt(item.dataset.id) === quiz.id) {
                    item.classList.add('active');
                }
            });
        }
        
        // Render the current question
        function renderQuestion() {
            const question = currentQuiz.quiz[currentQuestionIndex];
            questionText.textContent = question.questionText;
            optionsContainer.innerHTML = '';
            
            question.answerOptions.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                if (userAnswers[currentQuestionIndex] === index) {
                    optionElement.classList.add('selected');
                }
                
                optionElement.innerHTML = `
                    <div class="option-label">${String.fromCharCode(65 + index)}</div>
                    <div class="option-text">${option.answerText}</div>
                `;
                
                optionElement.addEventListener('click', () => selectOption(index));
                optionsContainer.appendChild(optionElement);
            });
            
            // Update button states
            prevBtn.disabled = currentQuestionIndex === 0;
            nextBtn.style.display = currentQuestionIndex < currentQuiz.quiz.length - 1 ? 'block' : 'none';
            submitQuizBtn.style.display = currentQuestionIndex === currentQuiz.quiz.length - 1 ? 'block' : 'none';
        }
        
        // Select an option
        function selectOption(optionIndex) {
            userAnswers[currentQuestionIndex] = optionIndex;
            
            // Update UI
            const options = optionsContainer.querySelectorAll('.option');
            options.forEach((option, index) => {
                option.classList.toggle('selected', index === optionIndex);
            });
        }
        
        // Show next question
        function showNextQuestion() {
            if (currentQuestionIndex < currentQuiz.quiz.length - 1) {
                currentQuestionIndex++;
                renderQuestion();
                updateProgress();
            }
        }
        
        // Show previous question
        function showPreviousQuestion() {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                renderQuestion();
                updateProgress();
            }
        }
        
        // Update progress display
        function updateProgress() {
            progressText.textContent = `${currentQuestionIndex + 1}/${currentQuiz.quiz.length}`;
        }
        
        // Submit the quiz
        function submitQuiz() {
            // Calculate score
            let correctCount = 0;
            currentQuiz.quiz.forEach((question, index) => {
                const userAnswerIndex = userAnswers[index];
                if (userAnswerIndex !== null) {
                    const userAnswer = question.answerOptions[userAnswerIndex];
                    if (userAnswer.isCorrect === "true") {
                        correctCount++;
                    }
                }
            });
            
            const score = Math.round((correctCount / currentQuiz.quiz.length) * 100);
            
            // Save result
            quizResults.push({
                quizId: currentQuiz.id,
                score: correctCount,
                total: currentQuiz.quiz.length,
                percentage: score
            });
            
            // Show results
            showResults(correctCount, currentQuiz.quiz.length, score);
        }
        
        // Show quiz results
        function showResults(correct, total, percentage) {
            quizInterface.style.display = 'none';
            resultContainer.style.display = 'block';

            scoreElement.textContent = `${percentage}%`;
            correctCountElement.textContent = correct;
            totalQuestionsElement.textContent = total;
            percentageElement.textContent = `${percentage}%`;

            if (percentage >= 80) {
                feedbackElement.textContent = "Excellent work! You have a strong understanding of this IoT topic.";
                feedbackElement.style.color = "#2ecc71";
            } else if (percentage >= 60) {
                feedbackElement.textContent = "Good job! Review the questions you missed to improve your score.";
                feedbackElement.style.color = "#f39c12";
            } else {
                feedbackElement.textContent = "Keep studying! Review the material and try again to improve.";
                feedbackElement.style.color = "#e74c3c";
            }

            // Show incorrect answers
            const incorrectAnswersDiv = document.getElementById('incorrect-answers');
            incorrectAnswersDiv.innerHTML = '';
            let incorrectCount = 0;
            currentQuiz.quiz.forEach((question, idx) => {
                const userAnswerIdx = userAnswers[idx];
                const correctOption = question.answerOptions.find(opt => opt.isCorrect === "true");
                if (userAnswerIdx === null) return; // skipped
                if (question.answerOptions[userAnswerIdx].isCorrect !== "true") {
                    incorrectCount++;
                    const userAnswerText = question.answerOptions[userAnswerIdx].answerText;
                    incorrectAnswersDiv.innerHTML += `
                        <div class="incorrect-question">
                            <strong>Q${idx + 1}:</strong> ${question.questionText}<br>
                            <span class="your-answer"><strong>Your answer:</strong> ${userAnswerText}</span><br>
                            <span class="correct-answer"><strong>Correct answer:</strong> ${correctOption.answerText}</span>
                        </div>
                    `;
                }
            });
            if (incorrectCount > 0) {
                incorrectAnswersDiv.innerHTML = `<h3>Review Incorrect Answers:</h3>` + incorrectAnswersDiv.innerHTML;
            }
            else {
                incorrectAnswersDiv.innerHTML = '';
            }
        }
        
        // Reset the quiz
        function resetQuiz() {
            resultContainer.style.display = 'none';
            quizInterface.style.display = 'none';
            quizHeader.querySelector('.empty-state').style.display = 'block';
            renderQuizMenu();
        }