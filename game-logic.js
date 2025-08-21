/**
 * #SheBuildsOnAWS AR Poster Game Logic
 * 
 * This file contains all the game mechanics, AR interactions,
 * and AWS service integration for the poster game.
 */

class ARPosterGame {
    constructor() {
        this.currentQuestion = 0;
        this.score = 0;
        this.gameStarted = false;
        this.gameCompleted = false;
        
        // Game Questions - Customize these for different AWS services
        this.questions = [
            {
                question: "Which AWS service is used for object storage?",
                correctAnswer: "s3",
                explanation: "Amazon S3 (Simple Storage Service) provides object storage!"
            },
            {
                question: "Which service runs code without managing servers?",
                correctAnswer: "lambda",
                explanation: "AWS Lambda lets you run code serverlessly!"
            },
            {
                question: "Which service provides virtual servers in the cloud?",
                correctAnswer: "ec2",
                explanation: "Amazon EC2 provides scalable virtual servers!"
            }
        ];
        
        this.init();
    }
    
    init() {
        console.log("🚀 Initializing #SheBuildsOnAWS AR Game...");
        
        // Wait for AR.js to load
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.setupAREvents();
        });
    }
    
    setupEventListeners() {
        // Restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }
        
        // Selfie button
        const selfieBtn = document.getElementById('selfie-btn');
        if (selfieBtn) {
            selfieBtn.addEventListener('click', () => this.takeSelfie());
        }
        
        // Service icon click handlers
        const serviceIcons = document.querySelectorAll('.service-icon');
        serviceIcons.forEach(icon => {
            icon.addEventListener('click', (event) => {
                const service = event.target.getAttribute('data-service');
                this.handleServiceSelection(service);
            });
        });
    }
    
    setupAREvents() {
        const marker = document.getElementById('main-marker');
        
        if (marker) {
            // Marker found - start game
            marker.addEventListener('markerFound', () => {
                console.log("📱 AR Marker detected!");
                this.onMarkerFound();
            });
            
            // Marker lost - pause game
            marker.addEventListener('markerLost', () => {
                console.log("📱 AR Marker lost");
                this.onMarkerLost();
            });
        }
        
        // Scene loaded
        const scene = document.getElementById('ar-scene');
        if (scene) {
            scene.addEventListener('loaded', () => {
                console.log("🎮 AR Scene loaded successfully");
                this.hideLoadingScreen();
            });
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 2000); // Show loading for 2 seconds
        }
    }
    
    onMarkerFound() {
        if (!this.gameStarted) {
            this.startGame();
        }
        
        // Show game UI
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.classList.remove('hidden');
        }
        
        // Animate avatar appearance
        this.animateAvatarEntrance();
    }
    
    onMarkerLost() {
        // Hide game UI but don't reset game state
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.classList.add('hidden');
        }
    }
    
    animateAvatarEntrance() {
        const avatar = document.getElementById('avatar');
        if (avatar) {
            avatar.setAttribute('visible', 'true');
            
            // Play welcome message (you can add text-to-speech here)
            setTimeout(() => {
                this.showWelcomeMessage();
            }, 1500);
        }
    }
    
    showWelcomeMessage() {
        // Create temporary welcome text
        const marker = document.getElementById('main-marker');
        const welcomeText = document.createElement('a-text');
        welcomeText.setAttribute('value', 'Welcome to #SheBuildsOnAWS!\nLet\'s play a quick game!');
        welcomeText.setAttribute('position', '0 3 0');
        welcomeText.setAttribute('align', 'center');
        welcomeText.setAttribute('color', '#FF6B9D');
        welcomeText.setAttribute('scale', '1.5 1.5 1.5');
        welcomeText.setAttribute('animation', 'property: opacity; from: 0; to: 1; dur: 1000');
        
        marker.appendChild(welcomeText);
        
        // Remove welcome text and start first question
        setTimeout(() => {
            marker.removeChild(welcomeText);
            this.showGameIcons();
            this.askQuestion();
        }, 3000);
    }
    
    startGame() {
        console.log("🎮 Starting AR Game!");
        this.gameStarted = true;
        this.currentQuestion = 0;
        this.score = 0;
        this.gameCompleted = false;
        
        // Log game start to DynamoDB (implement this function)
        this.logGameEvent('game_started');
    }
    
    showGameIcons() {
        const gameIcons = document.getElementById('game-icons');
        if (gameIcons) {
            gameIcons.setAttribute('visible', 'true');
        }
        
        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.classList.remove('hidden');
        }
    }
    
    askQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.completeGame();
            return;
        }
        
        const question = this.questions[this.currentQuestion];
        const questionPanel = document.getElementById('question-panel');
        const questionText = document.getElementById('question-text');
        const scoreValue = document.getElementById('score-value');
        
        if (questionPanel && questionText && scoreValue) {
            questionText.textContent = question.question;
            scoreValue.textContent = this.score;
            questionPanel.classList.remove('hidden');
            questionPanel.classList.add('fade-in');
        }
        
        console.log(`❓ Question ${this.currentQuestion + 1}: ${question.question}`);
    }
    
    handleServiceSelection(selectedService) {
        const currentQ = this.questions[this.currentQuestion];
        const isCorrect = selectedService === currentQ.correctAnswer;
        
        console.log(`🎯 Selected: ${selectedService}, Correct: ${currentQ.correctAnswer}`);
        
        if (isCorrect) {
            this.score++;
            this.showCorrectAnswer();
            this.triggerConfetti();
        } else {
            this.showIncorrectAnswer();
        }
        
        // Log answer to DynamoDB
        this.logGameEvent('answer_submitted', {
            question: this.currentQuestion + 1,
            selected: selectedService,
            correct: isCorrect
        });
        
        // Move to next question after delay
        setTimeout(() => {
            this.currentQuestion++;
            this.hideQuestionPanel();
            setTimeout(() => this.askQuestion(), 500);
        }, 2000);
    }
    
    showCorrectAnswer() {
        // Animate the correct service icon
        const correctIcon = document.querySelector(`[data-service="${this.questions[this.currentQuestion].correctAnswer}"]`);
        if (correctIcon) {
            correctIcon.setAttribute('animation__correct', 'property: scale; from: 1 1 1; to: 1.5 1.5 1.5; dur: 500; direction: alternate; loop: 2');
            correctIcon.setAttribute('color', '#00FF00');
        }
        
        // Show success message
        this.showTemporaryMessage("✅ Correct! Great job!", '#4CAF50');
    }
    
    showIncorrectAnswer() {
        // Show incorrect message
        this.showTemporaryMessage("❌ Not quite right, but keep learning!", '#FF5722');
    }
    
    showTemporaryMessage(message, color) {
        const marker = document.getElementById('main-marker');
        const tempText = document.createElement('a-text');
        tempText.setAttribute('value', message);
        tempText.setAttribute('position', '0 3.5 0');
        tempText.setAttribute('align', 'center');
        tempText.setAttribute('color', color);
        tempText.setAttribute('scale', '1.2 1.2 1.2');
        tempText.setAttribute('animation', 'property: opacity; from: 0; to: 1; dur: 500');
        
        marker.appendChild(tempText);
        
        setTimeout(() => {
            if (marker.contains(tempText)) {
                marker.removeChild(tempText);
            }
        }, 2000);
    }
    
    triggerConfetti() {
        const confettiSystem = document.getElementById('confetti-system');
        if (confettiSystem) {
            confettiSystem.setAttribute('visible', 'true');
            
            // Hide confetti after animation
            setTimeout(() => {
                confettiSystem.setAttribute('visible', 'false');
            }, 3000);
        }
    }
    
    hideQuestionPanel() {
        const questionPanel = document.getElementById('question-panel');
        if (questionPanel) {
            questionPanel.classList.add('fade-out');
            setTimeout(() => {
                questionPanel.classList.add('hidden');
                questionPanel.classList.remove('fade-in', 'fade-out');
            }, 500);
        }
    }
    
    completeGame() {
        console.log(`🏆 Game completed! Final score: ${this.score}/${this.questions.length}`);
        this.gameCompleted = true;
        
        // Hide game elements
        const gameIcons = document.getElementById('game-icons');
        const instructions = document.getElementById('instructions');
        
        if (gameIcons) gameIcons.setAttribute('visible', 'false');
        if (instructions) instructions.classList.add('hidden');
        
        // Show badge
        this.showBadge();
        
        // Show completion panel
        setTimeout(() => {
            const completionPanel = document.getElementById('completion-panel');
            if (completionPanel) {
                completionPanel.classList.remove('hidden');
                completionPanel.classList.add('fade-in');
            }
        }, 2000);
        
        // Log game completion
        this.logGameEvent('game_completed', {
            final_score: this.score,
            total_questions: this.questions.length
        });
    }
    
    showBadge() {
        const badge = document.getElementById('badge');
        if (badge) {
            badge.setAttribute('visible', 'true');
        }
    }
    
    restartGame() {
        console.log("🔄 Restarting game...");
        
        // Hide completion panel
        const completionPanel = document.getElementById('completion-panel');
        if (completionPanel) {
            completionPanel.classList.add('hidden');
            completionPanel.classList.remove('fade-in');
        }
        
        // Hide badge
        const badge = document.getElementById('badge');
        if (badge) {
            badge.setAttribute('visible', 'false');
        }
        
        // Reset game state
        this.currentQuestion = 0;
        this.score = 0;
        this.gameCompleted = false;
        
        // Reset service icon colors
        const serviceIcons = document.querySelectorAll('.service-icon');
        serviceIcons.forEach(icon => {
            icon.removeAttribute('color');
            icon.removeAttribute('animation__correct');
        });
        
        // Start new game
        setTimeout(() => {
            this.showGameIcons();
            this.askQuestion();
        }, 500);
    }
    
    takeSelfie() {
        console.log("📸 Taking AR selfie...");
        
        // Get the AR scene canvas
        const scene = document.getElementById('ar-scene');
        const canvas = scene.components.screenshot.getCanvas();
        
        if (canvas) {
            // Convert canvas to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'shebuilds-ar-selfie.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showTemporaryMessage("📸 Selfie saved!", '#4CAF50');
            });
        }
        
        // Log selfie event
        this.logGameEvent('selfie_taken');
    }
    
    /**
     * Log game events to AWS DynamoDB
     * Replace this with actual AWS SDK calls
     */
    logGameEvent(eventType, eventData = {}) {
        const logData = {
            timestamp: new Date().toISOString(),
            event_type: eventType,
            session_id: this.getSessionId(),
            user_agent: navigator.userAgent,
            ...eventData
        };
        
        console.log("📊 Logging event:", logData);
        
        // TODO: Implement actual DynamoDB logging
        // Example using AWS SDK:
        /*
        const params = {
            TableName: 'ARPosterGameLogs',
            Item: logData
        };
        
        dynamodb.put(params, (err, data) => {
            if (err) {
                console.error('Error logging to DynamoDB:', err);
            } else {
                console.log('Successfully logged to DynamoDB:', data);
            }
        });
        */
    }
    
    getSessionId() {
        // Generate or retrieve session ID
        let sessionId = sessionStorage.getItem('ar-game-session-id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('ar-game-session-id', sessionId);
        }
        return sessionId;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.arGame = new ARPosterGame();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ARPosterGame;
}
