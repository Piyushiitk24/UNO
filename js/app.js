console.log('uno!')

//#region  // DOM AND GLOBAL VARIABLES
const cpuHandDom = document.querySelector('.cpu-hand')
const playerHandDom = document.querySelector('.player-hand')

const playPileDom = document.querySelector('.play-pile')
const drawPileDom = document.querySelector('.draw-pile')

const playerUno = document.querySelector('.player-animation')
const cpuUno = document.querySelector('.cpu-animation')

const questionPopup = document.querySelector('.question-popup')
const questionText = document.querySelector('#question')
const optionButtons = document.querySelectorAll('.option')

const welcomePopup = document.querySelector('.welcome-popup')
const startButton = document.querySelector('.start-button')
const rulePopup = document.querySelector('.rule-popup')
const playButton = document.querySelector('.play-button')
const namePopup = document.querySelector('.name-popup')
const nameInput = document.querySelector('.name-input')
const submitNameButton = document.querySelector('.submit-name-button')
// Correct the selector for playerNameLabel:
const playerNameLabel = document.querySelector('.player-label p') // Changed from '.player-name-label'

// hand arrays
const cpuHand = []
const playerHand = []

const deck = []
let playPile

// variables to control gameplay
let playerTurn = true
let gameOn = false // Game starts off until welcome screen is dismissed
let colorPickerIsOpen = false
let cpuDelay = Math.floor((Math.random() * cpuHand.length * 200) + 1500)
let questionActive = false
let playerName = 'Player' // Default name
//#endregion

//#region preload imgs for faster loading
const imgPreLoad = []
let preLoaded = false

const preLoadImgs = () => {
    for (let i = 0; i <= 3; i++) {
        let color
        if (i === 0) color = 'red'
        if (i === 1) color = 'green'
        if (i === 2) color = 'blue'
        if (i === 3) color = 'yellow'
        for (let n = 0; n <= 14; n++) {
            let img = new Image()
            img.src = 'images/' + color + n + '.png'
            imgPreLoad.push(img)
        }
    }

    for (let i = 0; i < imgPreLoad.length; i++) {
        playPileDom.appendChild(imgPreLoad[i])
        playPileDom.innerHTML = ''
    }
}
//#endregion

// #region AUDIO
const shuffleFX = new Audio('audio/shuffle.wav')
const playCardFX = new Audio('audio/playCardNew.wav')
const playCardFX2 = new Audio('audio/playCard2.wav')
const drawCardFX = new Audio('audio/drawCard.wav')
const winRoundFX = new Audio('audio/winRound.wav')
const winGameFX = new Audio('audio/winGame.wav')
const loseFX = new Audio('audio/lose.wav')
const plusCardFX = new Audio('audio/plusCard.wav')
const unoFX = new Audio('audio/uno.wav')
const colorButton = new Audio('audio/colorButton.wav')
const playAgain = new Audio('audio/playAgain.wav')

// Function to play different sound effects based on who played the card and card type
const playCardSound = (card, playedByPlayer) => {
    if (playedByPlayer) {
        // Player played a card
        if (card.value >= 10 || card.color === 'any' || card.value === 0 || card.value === 2 || card.value === 4 || card.value === 6 || card.value === 8) {
            // Power card (value >= 10) or wild card (color === 'any') or even number
            playCardFX.play() // Use playCardNew.wav for player power/even cards
        } else {
            // Regular card
            playCardFX2.play() // Use playCard2.wav for regular cards
        }
    } else {
        // CPU played a card
        playCardFX2.play() // Always use playCard2.wav for CPU
    }
}

// Deprecated - keeping for backward compatibility, to be removed later
const pickPlayCardSound = () => {
    playCardFX2.play()
}
//#endregion

// #region CARD AND DECK MANAGEMENT
class Card {
    constructor(rgb, value, points, changeTurn, drawValue, imgSrc) {
        this.color = rgb
        this.value = value
        this.points = points
        this.changeTurn = changeTurn
        this.drawValue = drawValue
        this.src = imgSrc
        this.playedByPlayer = false
    }
}

const createCard = (rgb, color) => {
    for (let i = 0; i <= 14; i++) {
        // number cards
        if (i === 0) {
            deck.push(new Card(rgb, i, i, true, 0, 'images/' + color + i + '.png'))
        }
        else if (i > 0 && i <= 9) {
            deck.push(new Card(rgb, i, i, true, 0, 'images/' + color + i + '.png'))
            deck.push(new Card(rgb, i, i, true, 0, 'images/' + color + i + '.png'))
        }
        // reverse/skip
        else if (i === 10 || i === 11) {
            deck.push(new Card(rgb, i, 20, false, 0, 'images/' + color + i + '.png'))
            deck.push(new Card(rgb, i, 20, false, 0, 'images/' + color + i + '.png'))
        }
        // draw 2
        else if (i === 12) {
            deck.push(new Card(rgb, i, 20, false, 2, 'images/' + color + i + '.png'))
            deck.push(new Card(rgb, i, 20, false, 2, 'images/' + color + i + '.png'))
        }
        else if (i === 13) {
            deck.push(new Card('any', i, 50, true, 0, 'images/wild' + i + '.png'))
        }
        else {
            deck.push(new Card('any', i, 50, false, 4, 'images/wild' + i + '.png'))
        }
    }
}

const createDeck = () => {
    // destroy previous deck
    deck.length = 0
    // create new deck
    for (let i = 0; i <= 3; i++){
        if (i === 0) {
            createCard('rgb(255, 6, 0)', 'red')
        }
        else if (i === 1) {
            createCard('rgb(0, 170, 69)', 'green')
        }
        else if (i === 2) {
            createCard('rgb(0, 150, 224)', 'blue')
        }
        else {
            createCard('rgb(255, 222, 0)', 'yellow')
        }
    }

    console.log(deck) // TODO: remove
}

const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        deck[i].playedByPlayer = false
        let j = Math.floor(Math.random() * (i + 1))
        let temp = deck[i]
        deck[i] = deck[j]
        deck[j] = temp
    }
 
    shuffleFX.play()
}
//#endregion

// #region GAME BEHAVIOURS
const dealCards = () => {
    for (let i = 0; i < 7; i++) {
        // deal cards into cpu/player arrays
        cpuHand.push(deck.shift())       
        playerHand.push(deck.shift())

        // put cards on the DOM
        const cpuCard = document.createElement('img')
        cpuCard.setAttribute('src', 'images/back.png')
        cpuCard.setAttribute('class', 'cpu')
        cpuHandDom.appendChild(cpuCard)

        const playerCard = document.createElement('img')
        playerCard.setAttribute('src', playerHand[i].src)
        playerCard.setAttribute('class', 'player')
        
        // assign cards an id = their index in the playerHand array 
        playerCard.setAttribute('id', i)
        playerHandDom.appendChild(playerCard)
    }
}

const startPlayPile = () => {
    const playCard = document.createElement('img')
    
    // find first card that isn't an action card
    for (let i = 0; i < deck.length; i++) {
        if (deck[i].color !== "any" && deck[i].value <= 9) {
            // begin playPile array with first valid card
            playPile = deck.splice(i, 1)
            break
        }
    }

    // set playCard to correct image
    playCard.setAttribute('src', playPile[0].src)
    // play card to the playPile
    playPileDom.appendChild(playCard)
}

const newHand = () => {
    console.log('new hand')
    gameOn = true
    // clear hands and play pile
    cpuHandDom.innerHTML = ''
    cpuHand.length = 0
    playerHandDom.innerHTML = ''
    playerHand.length = 0
    playPileDom.innerHTML = ''

    // create new deck
    createDeck()
    // shuffle deck
    shuffleDeck(deck)
    // deal cards and first play card
    dealCards()
    // set down first play card that isn't an action card
    startPlayPile()

    if (colorPickerIsOpen) hideColorPicker()
    if (questionActive) hideQuestionPopup()
}

const updatePlayPileDom = () => {
    playPileDom.innerHTML = ''

    // add played card to playPile
    const newCardImg = document.createElement('img')
    const imgSrc = playPile[playPile.length - 1].src
    newCardImg.setAttribute('src', imgSrc)
    playPileDom.appendChild(newCardImg)
}

const updateHand = (handToUpdate) => {
    let domToUpdate, cardClass;

    if (handToUpdate === cpuHand) {
        domToUpdate = cpuHandDom
        cardClass = 'cpu'
        if (cpuVisible) cpuVisible = false
    }
    else {
        domToUpdate = playerHandDom
        cardClass = 'player'
    }
    
    // clear the selected dom
    domToUpdate.innerHTML = ''

    // update dom
    for (let i = 0; i < handToUpdate.length; i++) {
        let src

        if (domToUpdate === cpuHandDom) {
            src = 'images/back.png'
        } 
        else {
            src = handToUpdate[i].src
        } 

        const updatedCard = document.createElement('img')
        updatedCard.setAttribute('src', src)
        updatedCard.setAttribute('class', cardClass)
        // update ID's to match playerHand indexes
        updatedCard.setAttribute('id', i)
        domToUpdate.appendChild(updatedCard)
    }

    // keep dom element from collapsing when hand is empty
    if (handToUpdate.length === 0) {
        const updatedCard = document.createElement('img')
        updatedCard.setAttribute('src', 'images/empty.png')
        updatedCard.setAttribute('class', 'empty')
        // update ID's to match playerHand indexes
        domToUpdate.appendChild(updatedCard)
    }
}

const drawCard = (handGetsCard) => {
    animateDrawCard(handGetsCard)
    // check if the deck has card to draw
    if (deck.length > 0) {
        // pull the top card
        const newCard = deck.shift()
        handGetsCard.push(newCard)
        console.log(handGetsCard, 'drew one card') // TODO: remove
        
    }
    else {
        // shuffle playPile
        shuffleDeck(playPile)
        for (let i = 0; i <= playPile.length - 1; i++) {
            // shuffled playPile becomes the new deck
            deck.push(playPile[i])
        }
        // leave the last played card on the playPile
        playPile.length = 1

        // pull the top card from the deck
        const newCard = deck.shift()
        handGetsCard.push(newCard)
        console.log(handGetsCard, 'drew one card') // TODO: remove
        
    }
    drawCardFX.play()
    setTimeout(() => {
        updateHand(handGetsCard)
    }, 500)
}

const animateDrawCard = (player) => {
    let playerClass
    if (player === cpuHand) playerClass = 'cpu-draw'
    else playerClass = 'player-draw'
    
    const drawCardEl = document.querySelector('#draw-card')
    drawCardEl.classList.remove('hidden')
    setTimeout(() => {
        drawCardEl.classList.add(playerClass)
        setTimeout(() => {
            drawCardEl.classList.add('hidden')
            drawCardEl.classList.remove(playerClass)
            clearInterval()
        }, 500)
    }, 30)
}

const showUno = (unoHand) => {
    // remove hidden class from player-uno div
    unoHand.classList.remove('hidden')
    unoFX.play()
    console.log('removed HIDDEN from', unoHand)

    // add shout class
    setTimeout(() => {
        unoHand.classList.add('shout')
        console.log('added SHOUT to', unoHand)
        //setTimeout = after x seconds remove shout
        setTimeout(() => {
            unoHand.classList.remove('shout')
            console.log('removed SHOUT from', unoHand)

            setTimeout(() => {
                unoHand.classList.add('hidden')
                console.log('added HIDDEN to', unoHand)
            }, 1000)
        }, 1000)
    }, 10) 
}

const setupColorPickerListeners = () => {
    document.querySelector('.red').addEventListener('click', () => {
        chooseColor('rgb(255, 6, 0)')
    })
    document.querySelector('.green').addEventListener('click', () => {
        chooseColor('rgb(0, 170, 69)')
    })
    document.querySelector('.blue').addEventListener('click', () => {
        chooseColor('rgb(0, 150, 224)')
    })
    document.querySelector('.yellow').addEventListener('click', () => {
        chooseColor('rgb(255, 222, 0)')
    })
}

const chooseColor = (color) => {
    console.log('Color chosen:', color)
    colorButton.play() // Play sound effect
    
    // Hide the color picker
    hideColorPicker()
    
    // Update the wild card with the chosen color
    const wildCardDom = playPileDom.childNodes[0]
    wildCardDom.style.border = '5px solid ' + color
    wildCardDom.style.width = '105px'
    
    // Update the card color in the play pile
    playPile[playPile.length - 1].color = color
    
    // Switch to CPU turn since player's turn is complete
    playerTurn = false
    setTimeout(playCPU, cpuDelay)
}

const showColorPicker = () => {
    console.log('showColorPicker called')
    const colorPicker = document.querySelector('.color-picker')
    if (!colorPicker) {
        console.error('Color picker element not found')
        return
    }
    colorPicker.style.opacity = '1'
    colorPicker.style.pointerEvents = 'auto'
    colorPickerIsOpen = true
}

function hideColorPicker() {
    const colorPicker = document.querySelector('.color-picker')
    colorPicker.style.opacity = '0'
    colorPicker.style.pointerEvents = 'none'
    colorPickerIsOpen = false
}

const skipOrEndTurn = () => {
    if (playPile[playPile.length - 1].changeTurn) {
        playerTurn = false
        console.log('Skipping/ending turn, CPU turn next')
        setTimeout(playCPU, cpuDelay)
    }
}

const showTurnOnDom = () => {
    const playerLabel = document.querySelector('.player-label')
    const cpuLabel = document.querySelector('.cpu-label')
    
    if (playerTurn) {
        playerLabel.classList.add('active-turn')
        cpuLabel.classList.remove('active-turn')
    } else {
        cpuLabel.classList.add('active-turn')
        playerLabel.classList.remove('active-turn')
    }
}
//#endregion

//#region QUESTION LOGIC
const questions = [
    {
        question: "Which maxim states that students should move from direct observation to deeper reasoning?",
        options: ["Simple to Complex", "Induction to Deduction", "Empirical to Rational", "Abstract to Concrete"],
        correct: "Empirical to Rational"
    },
    {
        question: "Which phase of the Basic Teaching Model involves the teacher delivering new information or content?",
        options: ["Conclusion", "Presentation", "Application", "Evaluation"],
        correct: "Presentation"
    },
    {
        question: "Which of the following is NOT part of the Basic Teaching Model?",
        options: ["Introduction", "Application", "Research", "Evaluation"],
        correct: "Research"
    },
    {
        question: "What does SMART in objectives stand for?",
        options: ["Specific, Measurable, Achievable, Relevant, Time-bound", "Simple, Measurable, Achievable, Reliable, Time-bound", "Specific, Measurable, Accurate, Reliable, Time-bound", "Simple, Motivated, Attainable, Relevant, Time-bound"],
        correct: "Specific, Measurable, Achievable, Relevant, Time-bound"
    },
    {
        question: "Which learning style is best supported by ed-tech tools like videos and animations?",
        options: ["Auditory", "Visual", "Kinesthetic", "Reading/Writing"],
        correct: "Visual"
    },
    {
        question: "What is pedagogy primarily concerned with?",
        options: ["Teaching animals", "Teaching children", "Teaching elders", "Teaching adults"],
        correct: "Teaching children"
    },
    {
        question: "In a pedagogical approach, who directs the learning process?",
        options: ["The learner", "The community", "The teacher", "Artificial Intelligence"],
        correct: "The teacher"
    },
    {
        question: "In Andragogy, learners are typically",
        options: ["Dependent on the teacher", "Passive recipients", "Self-directed", "Uninterested in content"],
        correct: "Self-directed"
    },
    {
        question: "What is Andragogy?",
        options: ["A method of teaching teenagers", "A teaching approach for young children", "The science of teaching adults", "Teaching animals with AI"],
        correct: "The science of teaching adults"
    },
    {
        question: "The first stage of the memory process is:",
        options: ["Retrieval", "Storage", "Encoding", "Application"],
        correct: "Encoding"
    },
    {
        question: "Chunking in memory means:",
        options: ["Forgetting data quickly", "Breaking learning into small lessons", "Grouping information for better memory", "Memorising long answers"],
        correct: "Grouping information for better memory"
    },
    {
        question: "Solving a math problem mentally involves:",
        options: ["Sensory memory", "Procedural memory", "Working memory", "Long-term memory"],
        correct: "Working memory"
    },
    {
        question: "The psychomotor domain focusses on:",
        options: ["Knowledge retention", "Emotional response", "Physical skills and actions", "Moral reasoning"],
        correct: "Physical skills and actions"
    },
    {
        question: "The main purpose of Bloom's Taxonomy in education is:",
        options: ["To grade students", "To punish incorrect answers", "To classify educational objectives", "To assign homework"],
        correct: "To classify educational objectives"
    },
    {
        question: "SAT stands for:",
        options: ["Student Ability Test", "System Approach to Training", "Standard Academic Test", "School Aptitude Technique"],
        correct: "System Approach to Training"
    },
    {
        question: "The main aim of the System Approach to training is to:",
        options: ["Increase lecture hours", "Promote casual learning", "Improve teaching effectiveness", "Reduce teacher involvement"],
        correct: "Improve teaching effectiveness"
    },
    {
        question: "The Basic Teaching Model includes:",
        options: ["Input, Process, Output", "Teaching, Talking, Testing", "Play, Practice, Perform", "Lecture, Discussion, Exam"],
        correct: "Input, Process, Output"
    },
    {
        question: "In BTM, \"output\" refers to:",
        options: ["Teacher's effort", "Student's achievement", "Classroom size", "Homework quality"],
        correct: "Student's achievement"
    },
    {
        question: "Learning through rewards and punishments refers to?",
        options: ["Constructivist theory", "Cognitive theory", "Behaviorist theory", "Humanistic theory"],
        correct: "Behaviorist theory"
    },
    {
        question: "Humanistic theory of learning emphasizes:",
        options: ["External control", "Passive reception", "Learner's personal growth and self-actualization", "Repetition and drill"],
        correct: "Learner's personal growth and self-actualization"
    },
    {
        question: "Short-term memory typically retains information for:",
        options: ["A few seconds", "20–30 seconds", "Several hours", "A few minutes"],
        correct: "20–30 seconds"
    },
    {
        question: "Memory responsible for problem-solving and reasoning during tasks:",
        options: ["Long-term memory", "Working memory", "Sensory memory", "Semantic memory"],
        correct: "Working memory"
    },
    {
        question: "The process of converting information into a form that can be stored in memory is called:",
        options: ["Storage", "Encoding", "Retrieval", "Recognition"],
        correct: "Encoding"
    },
    {
        question: "Memory used by learners for recall or use of stored information is:",
        options: ["Encoding", "Storage", "Retrieval", "Attention"],
        correct: "Retrieval"
    },
    {
        question: "Which type of memory includes facts and general knowledge?",
        options: ["Procedural memory", "Sensory memory", "Semantic memory", "Episodic memory"],
        correct: "Semantic memory"
    },
    {
        question: "Which activity can improve learner's attention span?",
        options: ["Long lectures", "Repetitive tasks", "Interactive and varied learning", "Passive reading"],
        correct: "Interactive and varied learning"
    },
    {
        question: "Attention span is influenced by:",
        options: ["Age and interest level", "Textbook weight", "Number of class breaks", "Trainer"],
        correct: "Age and interest level"
    },
    {
        question: "What role does feedback play in the learning process?",
        options: ["It replaces assessment", "It reduces teacher workload", "Helps learners assess progress and areas to improve", "To reorganise classroom seating arrangement"],
        correct: "Helps learners assess progress and areas to improve"
    },
    {
        question: "Blended learning refers to:",
        options: ["A mix of various learning techniques", "Combining traditional face-to-face instruction with online learning", "A method to discipline students", "Teaching multiple subjects at the same time"],
        correct: "Combining traditional face-to-face instruction with online learning"
    },
    {
        question: "What is the core of teaching-learning process?",
        options: ["Instruction", "Feedback", "Interaction", "Discipline"],
        correct: "Interaction"
    }
]

// Add a new array to track used questions
let usedQuestions = []

// Function to get a random unused question
const getRandomUnusedQuestion = () => {
    // If all questions have been used, reset the used questions array
    if (usedQuestions.length >= questions.length) {
        usedQuestions = []
    }
    
    // Get available questions (not used yet)
    const availableQuestions = questions.filter((_, index) => !usedQuestions.includes(index))
    
    // Pick a random available question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    const selectedQuestion = availableQuestions[randomIndex]
    
    // Find the original index and mark it as used
    const originalIndex = questions.findIndex(q => q === selectedQuestion)
    usedQuestions.push(originalIndex)
    
    return selectedQuestion
}

// Function to show the correct answer and then continue with game
const showCorrectAnswer = (correctAnswer, callback) => {
    loseFX.play() // ADD THIS LINE TO PLAY THE SOUND
    
    // First disable all buttons to prevent multiple clicks
    optionButtons.forEach(button => {
        button.disabled = true
        
        // Highlight the correct answer in green
        if (button.getAttribute('data-correct') === 'true') {
            button.style.backgroundColor = '#00ff88'
            button.style.color = '#1a1a2e'
            button.style.fontWeight = 'bold'
            button.style.border = '3px solid #00ff88'
        } else {
            // Mark wrong answers in red
            button.style.backgroundColor = '#ff4444'
            button.style.color = '#ffffff'
            button.style.border = '3px solid #ff4444'
        }
    })
    
    // Add a message about the correct answer with distinct styling
    const feedbackMsg = document.createElement('p')
    feedbackMsg.textContent = `The correct answer was: "${correctAnswer}"`
    feedbackMsg.style.color = '#ffaa00' // Orange color to distinguish from green
    feedbackMsg.style.fontWeight = 'bold'
    feedbackMsg.style.marginTop = '15px'
    feedbackMsg.style.fontSize = '1.1em'
    feedbackMsg.style.textShadow = '0 0 10px rgba(255, 170, 0, 0.5)'
    feedbackMsg.style.border = '2px solid #ffaa00'
    feedbackMsg.style.borderRadius = '10px'
    feedbackMsg.style.padding = '10px'
    feedbackMsg.style.backgroundColor = 'rgba(255, 170, 0, 0.1)'
    questionPopup.appendChild(feedbackMsg)
    
    // Wait 3 seconds before continuing with the game
    setTimeout(() => {
        // Remove the feedback message
        questionPopup.removeChild(feedbackMsg)
        
        // Reset button styles and enable them
        optionButtons.forEach(button => {
            button.disabled = false
            button.style.backgroundColor = ''
            button.style.color = ''
            button.style.fontWeight = ''
            button.style.border = ''
        })
        
        // Continue with the game
        callback()
    }, 3000)
}

// Function to show success message for correct answers
const showSuccessMessage = (callback) => {
    // Play success sound
    winRoundFX.play()
    
    // Disable all buttons to prevent multiple clicks
    optionButtons.forEach(button => {
        button.disabled = true
        
        // Highlight the correct answer in green
        if (button.getAttribute('data-correct') === 'true') {
            button.style.backgroundColor = '#00ff88'
            button.style.color = '#1a1a2e'
            button.style.fontWeight = 'bold'
            button.style.border = '3px solid #00ff88'
            button.style.transform = 'scale(1.05)'
        } else {
            // Dim the other options
            button.style.opacity = '0.5'
        }
    })
    
    // Add a success message with celebratory styling
    const successMsg = document.createElement('p')
    successMsg.textContent = `🎉 Correct! Well done! 🎉`
    successMsg.style.color = '#00ff88'
    successMsg.style.fontWeight = 'bold'
    successMsg.style.marginTop = '15px'
    successMsg.style.fontSize = '1.3em'
    successMsg.style.textShadow = '0 0 15px rgba(0, 255, 136, 0.7)'
    successMsg.style.border = '2px solid #00ff88'
    successMsg.style.borderRadius = '15px'
    successMsg.style.padding = '15px'
    successMsg.style.backgroundColor = 'rgba(0, 255, 136, 0.1)'
    successMsg.style.animation = 'pulse 1s ease-in-out'
    questionPopup.appendChild(successMsg)
    
    // Wait 2 seconds before continuing with the game
    setTimeout(() => {
        // Remove the success message
        questionPopup.removeChild(successMsg)
        
        // Reset button styles and enable them
        optionButtons.forEach(button => {
            button.disabled = false
            button.style.backgroundColor = ''
            button.style.color = ''
            button.style.fontWeight = ''
            button.style.border = ''
            button.style.transform = ''
            button.style.opacity = ''
        })
        
        // Continue with the game
        callback()
    }, 2000)
}

const showQuestionPopup = (card, callback) => {
    questionActive = true
    const randomQuestion = getRandomUnusedQuestion() // Use the new function
    questionText.textContent = randomQuestion.question
    questionPopup.classList.remove('hidden')

    const shuffledOptions = randomQuestion.options.sort(() => Math.random() - 0.5)
    optionButtons.forEach((button, index) => {
        button.textContent = shuffledOptions[index]
        button.setAttribute('data-correct', shuffledOptions[index] === randomQuestion.correct)
        button.onclick = () => callback(button.getAttribute('data-correct') === 'true', card, randomQuestion.correct)
    })
}

const hideQuestionPopup = () => {
    questionPopup.classList.add('hidden')
    questionActive = false
}

const handleActionCardAnswer = (isCorrect, card, correctAnswer) => {
    console.log('Handling action card answer, isCorrect:', isCorrect)
    
    if (isCorrect) {
        console.log('Correct answer! CPU card effect nullified.')
        // Show success message before continuing
        showSuccessMessage(() => {
            hideQuestionPopup()
            playPile.pop()
            updatePlayPileDom()
            playerTurn = true
        })
    } else {
        console.log('Incorrect answer! Showing correct answer.')
        
        // Show the correct answer before continuing
        showCorrectAnswer(correctAnswer, () => {
            hideQuestionPopup()
            hitWithDrawCard()
            const totalDraws = card.drawValue > 0 ? card.drawValue + 1 : 1
            console.log('Total cards for player to draw:', totalDraws)

            setTimeout(() => {
                for (let i = 0; i < totalDraws; i++) {
                    drawCard(playerHand)
                }
                console.log('Player draws complete, switching to player turn')
                playerTurn = true
            }, 500 * totalDraws)
        })
    }
}

const handleEvenNumberAnswer = (isCorrect, card, correctAnswer) => {
    console.log('Handling even number answer, isCorrect:', isCorrect)
    
    if (isCorrect) {
        console.log('Correct answer! CPU even number card effect nullified.')
        // Show success message before continuing
        showSuccessMessage(() => {
            hideQuestionPopup()
            playPile.pop()
            updatePlayPileDom()
            playerTurn = true
        })
    } else {
        console.log('Incorrect answer! Showing correct answer.')
        
        // Show the correct answer before continuing
        showCorrectAnswer(correctAnswer, () => {
            hideQuestionPopup()
            hitWithDrawCard()
            setTimeout(() => {
                drawCard(playerHand)
                drawCard(playerHand)
                playerTurn = true
            }, 1000)
        })
    }
}
//#endregion

//#region END OF ROUND/GAME FUNCTIONS
const checkForWinner = () => {
    if (playerHand.length === 0) {
        winGameFX.play()
        endGame(playerHand)
    }
    if (cpuHand.length === 0) {
        loseFX.play()
        endGame(cpuHand)
    }
}

const showCpuCards = () => {
    if (cpuHand.length >= 1) {
        cpuHandDom.innerHTML = ''
        for (let i = 0; i < cpuHand.length; i++) {
            const cpuCard = document.createElement('img')
            cpuCard.setAttribute('src', cpuHand[i].src)
            cpuCard.setAttribute('class', 'cpu')
            cpuHandDom.appendChild(cpuCard)
        }
    } 
}

const hideCpuCards = () => {
    if (cpuHand.length >= 1) {
        cpuHandDom.innerHTML = ''
        for (let i = 0; i < cpuHand.length; i++) {
            const cpuCard = document.createElement('img')
            cpuCard.setAttribute('src', 'images/back.png')
            cpuCard.setAttribute('class', 'cpu')
            cpuHandDom.appendChild(cpuCard)
        }
    } 
}

const endGame = (winner) => {
    console.log('game over')
    gameOn = false
    if (cpuHand.length > 0) showCpuCards()

    const endOfGameDom = document.querySelector('.end-of-game')
    const gameDom = document.querySelector('.game')

    endOfGameDom.classList.remove('hidden')

    if (winner === playerHand) {
        gameDom.textContent = `${playerName} won the game!`
    } else {
        gameDom.textContent = `CPU won the game...`
    }

    document.querySelector('.play-again').addEventListener('click', () => {
        playAgain.play()
        endOfGameDom.classList.add('hidden')
        playerTurn = !playerTurn
        newHand()
        if (!playerTurn) setTimeout(playCPU, cpuDelay)
    })
}
//#endregion

//#region ////////CPU LOGIC////////
const letCpuDrawCards = () => {
    if (playPile[playPile.length - 1].drawValue > 0) {
        hitWithDrawCard()
        for (let i = 0; i < playPile[playPile.length - 1].drawValue; i++) {
            drawCard(cpuHand)
        }
    }
}

const playCPU = () => {   
    if (!playerTurn && gameOn && !questionActive && !colorPickerIsOpen) {
        console.log('CPU beginning turn, playerTurn:', playerTurn)
        const playable = determinePlayableCards()

        if (playable.length === 0) {
            console.log('CPU has no cards to play')
            drawCard(cpuHand)
            setTimeout(() => {
                console.log('CPU ending turn')
                playerTurn = true
            }, 500)
        } else if (playable.length === 1) {
            setTimeout(playCPUCard, 300, playable[0])
        } else {
            console.log('CPU has', playable.length, 'playable cards')
            let chosenCard = runStrategist(playable)
            setTimeout(playCPUCard, 300, chosenCard)
        }
    } else {
        console.log('CPU turn blocked: playerTurn=', playerTurn, 'gameOn=', gameOn, 'questionActive=', questionActive, 'colorPickerIsOpen=', colorPickerIsOpen)
    }

    function determinePlayableCards() {
        const playableCards = []
        console.log('Last card played:', playPile[playPile.length - 1])
        for (let i = 0; i < cpuHand.length; i++) {
            if (cpuHand[i].color === playPile[playPile.length - 1].color || cpuHand[i].value === playPile[playPile.length - 1].value || cpuHand[i].color === 'any' || playPile[playPile.length - 1].color === 'any') {
                let validCard = cpuHand.splice(i, 1)
                playableCards.push(validCard[0])
                i-- // Adjust index after splicing
            }
        }
        console.log('Playable cards:', playableCards)
        return playableCards
    }
    
    function runStrategist(playable) {
        let cardIndex
        let strategist = Math.random()
        console.log('Strategist:', strategist)
        if (playPile.length > 2 && (strategist > 0.7 || playerHand.length < 3 || cpuHand.length > (playerHand.length * 2) || (playPile[playPile.length - 1].playedByPlayer === true && playPile[playPile.length - 1].drawValue > 0) || (playPile[playPile.length - 2].playedByPlayer === true && playPile[playPile.length - 1].drawValue > 0))) {
            console.log('CPU chose high card')
            let highestValue = 0
            for (let i = 0; i < playable.length; i++){
                if (playable[i].value > highestValue) {
                    highestValue = playable[i].value
                    cardIndex = i
                }
            }
            chosenCard = playable.splice(cardIndex, 1)
            returnPlayablesToHand()
        } else {
            console.log('CPU chose low card')
            let lowestValue = 14
            for (let i = 0; i < playable.length; i++){
                if (playable[i].value < lowestValue) {
                    lowestValue = playable[i].value
                    cardIndex = i
                }
            }
            chosenCard = playable.splice(cardIndex, 1)
            returnPlayablesToHand()
        }
        console.log('Chosen card:', chosenCard[0])
        return chosenCard[0]

        function returnPlayablesToHand() {
            if (playable.length > 0) {
                for (const card of playable) {
                    cpuHand.push(card)
                }
            }
        }
    }

    function playCPUCard(chosenCard) {
        console.log('Playing card:', chosenCard)
        const cpuDomCards = cpuHandDom.childNodes
        cpuDomCards[Math.floor(Math.random() * cpuDomCards.length)].classList.add('cpu-play-card')
        console.log('Animating CPU card')
        playCardSound(chosenCard, false)
        
        setTimeout(() => {
            playPile.push(chosenCard)
            updatePlayPileDom()

            if (playPile[playPile.length - 1].color === 'any' && playPile[playPile.length - 1].drawValue === 0 && playPile[playPile.length - 1].playedByPlayer === false) {
                console.log('CPU played a wild')
                chooseColorAfterWild()
            }

            if (cpuHand.length >= 1) {
                updateHand(cpuHand)
                if (cpuHand.length === 1) {
                    showUno(cpuUno)
                }
            } else {
                updateHand(cpuHand)
                setTimeout(() => {
                    checkForWinner()
                }, 1200)
            }

            // When CPU plays an action, wild, or even-numbered card, prompt the player with a question
            if ([0, 2, 4, 6, 8].includes(chosenCard.value)) {
                showQuestionPopup(chosenCard, handleEvenNumberAnswer)
            } else if (chosenCard.value >= 10 || chosenCard.color === 'any') {
                showQuestionPopup(chosenCard, handleActionCardAnswer)
            } else if (chosenCard.drawValue > 0) {
                showQuestionPopup(chosenCard, handleActionCardAnswer)
            } else {
                setTimeout(checkChangeTurn, 500)
            }

            function checkChangeTurn() {
                if (chosenCard.changeTurn) {
                    console.log('CPU has finished its turn')
                    playerTurn = true
                } else {
                    console.log('CPU goes again')
                    setTimeout(playCPU, cpuDelay)
                }
            }

            function chooseColorAfterWild() {
                console.log('CPU picking new color')
                const colors = ['rgb(255, 6, 0)', 'rgb(0, 170, 69)', 'rgb(0, 150, 224)', 'rgb(255, 222, 0)']
                const colorsInHand = [0, 0, 0, 0]

                for (const card of cpuHand) {
                    if (card.color === colors[0]) colorsInHand[0]++
                    if (card.color === colors[1]) colorsInHand[1]++
                    if (card.color === colors[2]) colorsInHand[2]++
                    if (card.color === colors[3]) colorsInHand[3]++
                }

                let indexOfMax = colorsInHand.indexOf(Math.max(...colorsInHand))
                const wildCardDom = playPileDom.childNodes[0]
                wildCardDom.style.border = '5px solid ' + colors[indexOfMax]
                wildCardDom.style.width = '105px'
                playPile[playPile.length - 1].color = colors[indexOfMax]
            }
        }, 500)
    }
}

const hitWithDrawCard = () => {
    plusCardFX.play()
    playPileDom.classList.add('shout')
    setTimeout(() => {
        playPileDom.classList.remove('shout')
    }, 1000)
}

const playPlayerCard = (index) => {
    // Store the card before pushing to playPile for later reference
    const playedCard = playerHand[index]
    
    // Add to play pile and mark as played by player
    playPile.push(playedCard)
    playPile[playPile.length - 1].playedByPlayer = true
    
    // Remove from player hand
    playerHand.splice(index, 1)
    
    // Update the display
    updatePlayPileDom()
}
//#endregion

//#region ///////WELCOME AND RULE SCREEN////////
const showWelcomePopup = () => {
    welcomePopup.classList.remove('hidden')
    startButton.addEventListener('click', () => {
        playCardFX2.play() 
        welcomePopup.classList.add('hidden')
        showRulePopup()
    }, { once: true })
}

const showRulePopup = () => {
    rulePopup.classList.remove('hidden')
    playButton.addEventListener('click', () => {
        playCardFX2.play() 
        rulePopup.classList.add('hidden')
        showNamePopup()
    }, { once: true })
}

const showNamePopup = () => {
    namePopup.classList.remove('hidden')
    submitNameButton.addEventListener('click', () => {
        playCardFX2.play() 
        const inputName = nameInput.value.trim()
        // Player name is uppercased here
        playerName = inputName.length > 0 ? inputName.toUpperCase() : 'PLAYER' 
        if (playerNameLabel) { // Check if playerNameLabel exists
            playerNameLabel.textContent = playerName 
        } else {
            console.error("Error: playerNameLabel element not found.");
        }
        namePopup.classList.add('hidden')
        const welcomeMain = document.querySelector('.welcome-main');
        if (welcomeMain) {
            welcomeMain.style.display = 'none';
        }
        gameOn = true
        newHand()
        if (!playerTurn) setTimeout(playCPU, cpuDelay)
    }, { once: true })
}
//#endregion

//#region ///////MAIN GAME FUNCTION////////
const startGame = () => {
    console.log("startGame function called"); // Debug log

    // Set CPU name to COMPUTER
    const cpuLabelParagraph = document.querySelector('.cpu-label p');
    if (cpuLabelParagraph) {
        cpuLabelParagraph.textContent = 'COMPUTER'; // This sets the text to "COMPUTER"
        console.log("CPU name set to:", cpuLabelParagraph.textContent); // Debug log
    } else {
        console.error("UNO Game Error: The element '.cpu-label p' for CPU's name was not found. CPU name not updated.");
    }

    if (!preLoaded) {
        preLoadImgs()
        preLoaded = true
    } 

    listenForDevMode();
    setInterval(showTurnOnDom, 100); // This function should only manage classes, not text content
    showWelcomePopup();
    setupColorPickerListeners();

    playerHandDom.addEventListener('click', (event) => {
        if (playerTurn && !colorPickerIsOpen && !questionActive && event.target.getAttribute('id')) {
            const lastCardDom = playPileDom.childNodes[0]
            if (lastCardDom.style !== '100px') {
                lastCardDom.style.width = '100px'
                lastCardDom.style.border = 'none'
            }

            let index = parseInt(event.target.getAttribute('id'))
            if (playerHand[index].value === playPile[playPile.length - 1].value || playerHand[index].color === playPile[playPile.length - 1].color || playerHand[index].color === 'any' || playPile[playPile.length - 1].color === 'any') {     
                playCardSound(playerHand[index], true)
                event.target.classList.add('play-card')
                console.log('Player played:', event.target)

                setTimeout(() => {
                    playPlayerCard(index)
                    
                    if (playerHand.length >= 1) {
                        updateHand(playerHand)
                        if (playerHand.length === 1) showUno(playerUno)
                    } else {
                        updateHand(playerHand)
                        setTimeout(() => {
                            checkForWinner()
                        }, 1200)
                    }

                    const lastCard = playPile[playPile.length - 1]
                    console.log('Checking for wild card:', lastCard)
                    if (lastCard.color === 'any' && lastCard.drawValue === 0 && lastCard.playedByPlayer) {
                        showColorPicker()
                        return
                    }

                    // Apply the effect of the player's card directly to the CPU
                    if (lastCard.drawValue > 0) {
                        letCpuDrawCards()
                    }

                    playerTurn = lastCard.changeTurn ? false : true
                    if (!playerTurn) {
                        setTimeout(playCPU, cpuDelay)
                    }
                }, 1000)
            }
        }
    })

    drawPileDom.addEventListener('click', () => {
        if (playerTurn && !colorPickerIsOpen && !questionActive) {
            drawCard(playerHand)
            setTimeout(() => {
                playerTurn = false
                console.log('Player drew card, switching to CPU turn')
                setTimeout(playCPU, cpuDelay)
            }, 500)
        }
    })
}
//#endregion

let cpuVisible = false

const listenForDevMode = () => {
    document.addEventListener('keydown', event => {
        const key = event.key.toLowerCase()
        console.log('Dev mode key:', key)
        if (key === 'p') {
            playerTurn = true
            console.log('Forced playerTurn:', playerTurn)
        }
        if (key === 'c') {
            drawCard(cpuHand)
            updateHand(cpuHand)
        }
        if (key === 'x') {
            playerHand.pop()
            updateHand(playerHand)
        }
        if (key === 'z') {
            cpuHand.pop()
            updateHand(cpuHand)
        }
        if (key === 'w') {
            const wild = new Card('any', 13, 50, true, 0, 'images/wild13.png')
            playerHand.push(wild)
            updateHand(playerHand)
        }
        if (key === '4') {
            const wild4 = new Card('any', 14, 50, true, 0, 'images/wild14.png')
            playerHand.push(wild4)
            updateHand(playerHand)
        }
        if (key === 's') {
            if (cpuVisible) {
                hideCpuCards()
                cpuVisible = false
            } else {
                showCpuCards()
                cpuVisible = true
            }
        }
    })
}

//#region UTILITY FUNCTIONS
// Function to properly capitalize names
const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}
//#endregion

// CRITICAL: Ensure this line is at the VERY END of your js/app.js file to start the game.
// If it's wrapped in a DOMContentLoaded listener elsewhere, ensure that listener is firing correctly.
// For simplicity and to ensure it runs after the script is parsed:
startGame();