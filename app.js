let quizData = []; // Will be loaded from en.json

// Fetch quiz data from en.json and initialize the app
document.addEventListener('DOMContentLoaded', () => {
    quizMenu.innerHTML = '<div style="text-align:center;padding:30px;">Loading quizzes...</div>';
    fetch('en.json')
        .then(response => response.json())
        .then(data => {
            quizData = data;
            init();
        })
        .catch(error => {
            quizMenu.innerHTML = '<div style="color:red;">Failed to load quiz data.</div>';
            console.error('Failed to load quiz data:', error);
        });
});

        // State variables
        let currentQuiz = null;
        let currentQuestionIndex = 0;
        let userAnswers = [];
        let quizResults = [];
        let lastSelectedOptions = []; // Add this near your state variables
        
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
        let quizIdMap = {};
        function renderQuizMenu() {
            const quizzes = quizData[0].quizzes;
            quizIdMap = {};
            let html = '';
            quizzes.forEach((quiz, index) => {
                quizIdMap[quiz.id] = quiz;
                const quizResult = quizResults.find(r => r.quizId === quiz.id);
                const status = quizResult ? 
                    `<span class="highlight">${quizResult.score}/${quiz.quiz.length}</span>` : 
                    '<span>Not started</span>';
                html += `
                    <div class="quiz-item" data-id="${quiz.id}">
                        <h3>${quiz.title}</h3>
                        <div class="quiz-info">
                            <span><i class="fas fa-question-circle"></i> ${quiz.quiz.length} questions</span>
                            <span>${status}</span>
                        </div>
                    </div>
                `;
            });
            quizMenu.innerHTML = html;
            // Add event listeners after DOM update
            quizMenu.querySelectorAll('.quiz-item').forEach(item => {
                item.addEventListener('click', () => startQuiz(quizIdMap[item.dataset.id]));
            });
        }
        
        // Set up event listeners
        function setupEventListeners() {
            prevBtn.addEventListener('click', debounceButton(prevBtn, showPreviousQuestion));
            nextBtn.addEventListener('click', debounceButton(nextBtn, showNextQuestion));
            submitQuizBtn.addEventListener('click', debounceButton(submitQuizBtn, submitQuiz));
            restartBtn.addEventListener('click', resetQuiz);

            // Toggle review all answers on click
            const reviewBtn = document.getElementById('review-all-btn');
            reviewBtn.addEventListener('click', function () {
                const reviewContainer = document.getElementById('review-all-container');
                if (reviewContainer.style.display === 'block') {
                    reviewContainer.style.display = 'none';
                    reviewBtn.innerHTML = '<i class="fas fa-eye"></i> Review All Answers';
                } else {
                    showAllAnswers();
                    reviewBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Review';
                }
            });
        }
        
        // Start a quiz
        function startQuiz(quiz) {
            currentQuiz = quiz;
            currentQuestionIndex = 0;
            userAnswers = new Array(quiz.quiz.length).fill(null);

            // Hide previous results if visible
            resultContainer.style.display = 'none'; // <-- Add this line

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

            // Clone and shuffle the options for this render
            let options = question.answerOptions.map((opt, idx) => ({ ...opt, origIndex: idx }));
            shuffleArray(options);

            let optionsHtml = '';
            options.forEach((option, index) => {
                // Find if this shuffled option is the user's selected answer
                const selected = userAnswers[currentQuestionIndex] === option.origIndex ? 'selected' : '';
                optionsHtml += `
                    <div class="option ${selected}" data-index="${option.origIndex}">
                        <div class="option-label">${String.fromCharCode(65 + index)}</div>
                        <div class="option-text">${option.answerText}</div>
                    </div>
                `;
            });
            optionsContainer.innerHTML = optionsHtml;

            // Use event delegation for option clicks
            optionsContainer.onclick = function(e) {
                const optionDiv = e.target.closest('.option');
                if (!optionDiv) return;
                const idx = Number(optionDiv.dataset.index);
                selectOption(idx, optionDiv);
            };

            // Update button states
            prevBtn.disabled = currentQuestionIndex === 0;
            nextBtn.style.display = currentQuestionIndex < currentQuiz.quiz.length - 1 ? 'block' : 'none';
            submitQuizBtn.style.display = currentQuestionIndex === currentQuiz.quiz.length - 1 ? 'block' : 'none';
        }
        
        // Select an option (optimized)
        function selectOption(optionIndex, optionDiv) {
            // Only update if the selection changed
            if (userAnswers[currentQuestionIndex] !== optionIndex) {
                // Deselect previous selection if any (use cache)
                if (lastSelectedOptions[currentQuestionIndex] && lastSelectedOptions[currentQuestionIndex] !== optionDiv) {
                    lastSelectedOptions[currentQuestionIndex].classList.remove('selected');
                }
                // Select the clicked option
                optionDiv.classList.add('selected');
                userAnswers[currentQuestionIndex] = optionIndex;
                lastSelectedOptions[currentQuestionIndex] = optionDiv;
            }
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
        
        // Show all answers for review
        function showAllAnswers() {
            const reviewContainer = document.getElementById('review-all-container');
            reviewContainer.innerHTML = '<h3>All Questions & Your Answers:</h3>';
            currentQuiz.quiz.forEach((question, idx) => {
                const userAnswerIdx = userAnswers[idx];
                const correctOption = question.answerOptions.find(opt => opt.isCorrect === "true");
                let userAnswerText = userAnswerIdx !== null ? question.answerOptions[userAnswerIdx].answerText : "<em>No answer</em>";
                let isCorrect = userAnswerIdx !== null && question.answerOptions[userAnswerIdx].isCorrect === "true";
                reviewContainer.innerHTML += `
                    <div class="review-question ${isCorrect ? 'correct' : 'incorrect'}">
                        <strong>Q${idx + 1}:</strong> ${question.questionText}<br>
                        <span class="your-answer ${isCorrect ? 'correct-answer' : 'wrong-answer'}">
                            Your answer: ${userAnswerText}
                        </span><br>
                        <span class="correct-answer">Correct answer: ${correctOption.answerText}</span>
                    </div>
                `;
            });
            reviewContainer.style.display = 'block';
        }

        // Hide review on reset
        function resetQuiz() {
            resultContainer.style.display = 'none';
            quizInterface.style.display = 'none';
            quizHeader.querySelector('.empty-state').style.display = 'block';
            document.getElementById('review-all-container').style.display = 'none';
            renderQuizMenu();
        }

        function debounceButton(btn, fn, delay = 300) {
            let timeout;
            return function(...args) {
                if (timeout) return;
                btn.disabled = true;
                fn(...args);
                timeout = setTimeout(() => {
                    btn.disabled = false;
                    timeout = null;
                }, delay);
            };
        }

        quizMenu.addEventListener('click', function(e) {
            const item = e.target.closest('.quiz-item');
            if (item) {
                const quiz = quizData[0].quizzes.find(q => q.id == item.dataset.id);
                if (quiz) startQuiz(quiz);
            }
        });

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }