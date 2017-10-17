//Game states
var app = {};
app.question = '';
app.choices = []; 
app.answer = ''; 
app.difficulty = '';
app.rights = 0;  
app.timer = 0; 
app.intervalF = function(){}; 
app.timeoutF = function(){};
app.questionNumber = 0;
app.questionsForThisGame = []; 
app.pausedTime = 0;  
//game settings
app.introWaitTime = 1; 
app.intermissionWaitTime = 5; 
app.pauseTimeBetweenQuestions = 1; 
app.difficultySetting = {
  'Easy': 1,
  'Medium': 6,
  'Hard': 3
};
app.lifelines = ['phoneAFriend','pollTheAudience', 'fiftyFifty'];
app.difficultyTimer = {
  'Easy': 2000,
  'Medium': 2000,
  'Hard': 4000
}
app.moneyLadder = ['$100', '$200', '$500', '$1,000', '$2,500', '$10,000', '$32,000', '$125,000', '$400,000', '$1 Milllion']
app.allQuestionsAnswers = [];  
app.LLavailable = false; 
app.eliminatedChoices =[];  
app.fiftyUsedThisRound = false;  

//logic for choosing questions for this round 
app.chooseQuestions = function () {
  console.log('choosing questions for this round');
  var that = this; 
  var Qs = []; 
  //for each difficulty setting
  for (var key in that.difficultySetting) {
    //take all questions of that difficulty, shuffle it, and pick n out of the set, where n is the value in the difficultySetting key-value pair
    Qs = Qs.concat(chance.pickset(chance.shuffle(_.filter(that.allQuestionsAnswers, (v) => (v.difficulty === key))), that.difficultySetting[key]));
  }
  //update game state: questions for this game 
  this.questionsForThisGame = Qs; 
}

//Logic for checking if user inputs a correct answer
app.answerCheck = function (choice) {
  console.log(`user entered ${choice}`);
  if (choice === this.answer) this.goodAnswer();
  else this.gameOver();
}

//logic for all after-question actioms
app.afterQuestion = function (){
  console.log('processing all actions between questions');
  var that = this;
  $('.ladder-row').show(); 
  $('#choices').empty();
  $('canvas').remove();
  clearTimeout(this.timeoutF);
  //logic to determine if we should trigger next question or trigger either intermission or gameover
  if (this.questionNumber === this.difficultySetting.Easy){
    this.timeoutF = setTimeout(that.intermission.bind(that), that.pauseTimeBetweenQuestions * 1000);
  } else if (this.questionNumber === _.reduce(this.difficultySetting, (memo, value) => (memo + value))){
    this.timeoutF = setTimeout(that.gameOver.bind(that, "win"), that.pauseTimeBetweenQuestions * 1000);
  } else this.timeoutF = setTimeout(that.nextQuestion.bind(that), that.pauseTimeBetweenQuestions * 1000);
  this.timer = that.pauseTimeBetweenQuestions;
  $('#timeLeft').html(`Time Left: ${that.pauseTimeBetweenQuestions}`);
}

//Logic for good answer
app.goodAnswer = function () {
  console.log("good answer!");
  this.afterQuestion();
  //update game state
  this.rights++;
  //congrates the user! 
  $('#question').text(`Good job! ${this.answer} is the correct answer.`);
}

//logic for showing solution if user waits out a question or answers incorrectly
app.noGoodAnswer = function(answered) {
  console.log("display solution due to wrong choice or no choice");
  this.gameOver();
  
}

//logic for nextQuestion method 
app.nextQuestion = function () {
  console.log('moving onto next question')
  var that = this; 
  //update states
  this.question = this.questionsForThisGame[this.questionNumber].question;
  this.choices = this.questionsForThisGame[this.questionNumber].choices;
  this.answer = this.questionsForThisGame[this.questionNumber].answer;
  this.difficulty = this.questionsForThisGame[this.questionNumber].difficulty;
  this.questionNumber++; 
  this.timer = this.difficultyTimer[this.difficulty];
  this.LLavailable = true; 
  this.fiftyUsedThisRound = false;  
  this.eliminatedChoices = [];
  //render updated states
  this.render();
  //if user times out, move to noGoodAnswer logic
  this.timeoutF = setTimeout(that.noGoodAnswer.bind(that), that.difficultyTimer[that.difficulty] * 1000);
}

//regular rendering logic
app.render = function () {
  console.log("rendering question info to DOM");
  var that = this; 
  var multipleChoices = ['A', 'B', 'C', 'D']
  $('#QID').text(`Question : #${that.questionNumber}`);
  $('#Qdiff').text(`Difficulty: ${that.difficulty}`);
  $('#timeLeft').text(`Time Left: ${that.difficultyTimer[that.difficulty]}`);
  $('#question').html(that.question);
  //logic to render the multiple choice buttons
  $('#choices-div').empty();
  multipleChoices.forEach((v, i) => {
    var MCbutton = $('<button class="btn-primary col-xs-6 choices">').text(`${v}.  ${that.choices[i]}`);
    MCbutton.attr({
      'data': that.choices[i],
      'letter': v
    })
    MCbutton.on('click', function() {
     that.answerCheck($(this).attr('data'))
    })  
    $('#choices-div').append(MCbutton);
  });
  $('.yellow-background').removeClass('yellow-background');  
  $(`#ladder-${that.questionNumber}`).addClass('yellow-background');
  // $('.ladder-row').show(); 
}
//intermission logic
app.intermission = function(){
  console.log('intermission time!');
  var that = this; 
  this.LLavailable = false;  
  $('#question').text(`Now the game gets a lot tougher!  You have ${that.difficultyTimer.Medium} seconds to answer medium questions and ${that.difficultyTimer.Hard} seconds to answer hard questions. I hope you\'ve been saving your lifelines...`)
   this.timeoutF = setTimeout(that.nextQuestion.bind(that), that.intermissionWaitTime * 1000);
   this.timer = that.intermissionWaitTime;
  $('#timeLeft').html(`Time Left: ${that.intermissionWaitTime}`);
}

//game over logic
app.gameOver = function(win){
  console.log('game over!'); 
  this.LLavailable = false;  
  clearInterval(this.intervalF);
  clearTimeout(this.timeoutF);
  $('canvas').remove();  
  $('#timeLeft').text('');
  $('#QID').text('');
  $('#Qdiff').text('');
  if (win == 'win'){
    $('#question').html(`Game over! You won a million dollars!`);
  } else $('#question').html(`Game over! You answered:\n\n ${this.rights} questions correctly`);
  $('#choices-div').empty();
  $('#startButton').toggle();
}

//logic to update on screen count-down
app.updateTimer = function (str){
  // console.log("inside update timer");
  this.timer--;  
  $('#timeLeft').html(`Time Left: ${this.timer}`);
  // console.log(str)
}

//initializing logic
app.initialize = function (){
  console.log('Game is starting')
  var that = this;  
  //reset values
  this.questionsForThisGame = []; 
  this.rights = 0;  
  this.questionNumber = 0;
  //active intro wait time trigger; 
  this.timer = this.introWaitTime; 
  this.initRender(this.timer);
  this.timeoutF = setTimeout(that.nextQuestion.bind(that), that.introWaitTime * 1000);
  //activate non-stop timer logic
  this.intervalF = setInterval(that.updateTimer.bind(that, "before resuming"),1000);
  this.chooseQuestions();
}

//logic for initial rendering
app.initRender = function (time) {
  console.log('rendering initial message and images')
  var that = this;  
  //hide start button
  $('#startButton').toggle();
  $('#LLcontainer').empty(); 
  $('#money-ladder').empty();
  //create and render lifelines
  var LLBox = $('<div>').attr({id: "LL-box"});
  _.each(this.lifelines, v => {
    //logic for creating lifeline divs
    var LLdiv = $('<div>');
    LLdiv.addClass('col-xs-12 LLdiv text-center');
    LLdiv.attr('data', v);
    //logic for creating lifeline images
    var LLimg = $('<img>').addClass('img-fluid');
    LLimg.attr('src', `assets/images/${v}.png`);
    LLimg.css({'cursor': 'pointer'})
    LLdiv.append(LLimg);
    //attach click event listener
    LLdiv.on('click', function() {
      if(that.LLavailable){
        $(this).addClass('hidden');
        that[$(this).attr('data')]();
      }
    })
    //add it to DOM
    LLBox.append(LLdiv);
  })
  $('#LLcontainer').append(LLBox);
  //create money ladder
  var moneyLadderDiv = $('<div>').attr({
    id: 'money-ladder-div'
  });
  _.each(this.moneyLadder, (v, i) => {
    var $moneyRowDiv = $('<div>').attr({
      class: 'row ladder-row',
      id: `ladder-${i+1}`
    })
    var $qNumDiv = $('<div>').addClass('col-xs-4').attr('id', 'q-Num');
    var $qNumH6 = $('<h6>').text(i+1).addClass('float-right');
    var $prizeDiv = $('<div>').addClass('col-xs-8'); 
    var $prizeH6 = $('<h6>').text(v);
    $qNumDiv.append($qNumH6);
    $prizeDiv.append($prizeH6);
    $moneyRowDiv.append($qNumDiv, $prizeDiv);
    moneyLadderDiv.prepend($moneyRowDiv);
  })
  $('#money-ladder').append(moneyLadderDiv);
  //add a LL message div overlapping with money ladder
  $('#money-ladder').append($('<div>').attr({
    id: "LL-message"
  }))

  //update timer
  $('#timeLeft').html(`Time Left: ${time}`);
  //update the question text
  $('#question').text(`Let the game begin! You have ${that.difficultyTimer.Easy} seconds to answer each easy question; easy questions are meant to be fun and funny!\n\nNote that you have three lifelines: Phone a Friend, Poll the Audience, and Fifty-fifty.  Remember to turn audio on!`)
  
  $('#game').css({'background-color': 'lightblue'});
}
//event listener for start button
$('#startButton').on('click', () => (app.initialize()));


var config = {
  apiKey: "AIzaSyAcpMFjEZm9ksjolIxXkEaYYZ2XzGeEk6Q",
  authDomain: "javascriptmillionaire.firebaseapp.com",
  databaseURL: "https://javascriptmillionaire.firebaseio.com",
  projectId: "javascriptmillionaire",
  storageBucket: "javascriptmillionaire.appspot.com",
  messagingSenderId: "578154550600"
};
firebase.initializeApp(config);
var database = firebase.database();

database.ref("/QandAs").on("value", function(snapshot) {
  var results = snapshot.val();
  app.allQuestionsAnswers = _.map(results, (v) => {
    return {
      answer: v.answer,
      difficulty: v.difficulty,
      question: v.question,
      choices: [v.choice1, v.choice2,v.choice3,v.choice4]
    }
  })
  $('#startButton').removeClass('hidden');
})
var fiftyAudio = new Audio ('assets/audios/fiftyFifty.mp3');
var phoneAudio = new Audio ('assets/audios/phoneAFriend.mp3');
var pollAudio = new Audio ('assets/audios/pollTheAudience.mp3');


// EXTRA STUFF
app.fiftyFifty = function() {
  console.log('invoking fiftyFifty')
  var that = this; 
  this.fiftyUsedThisRound = true; 
  this.pauseTimer();
  fiftyAudio.play();
  var copyArr = this.choices.slice();
  copyArr.splice((copyArr.indexOf(that.answer)),1);
  copyArr.splice(Math.floor(Math.random() *3),1);
  this.eliminatedChoices = copyArr; 
  setTimeout(() => {
    for (var i = 0; i< 2 ; i++){
      $('.btn-primary').filter(function(){
        return $(this).attr('data') == copyArr[i]; 
      }).addClass('hidden fifty-eliminated');
    }
    that.resumeTimer();  
  }, 4400);
}

// logic for "Phone a friend" life line
app.phoneAFriend = function(){
  console.log('invoking phoneAFriend')
  var sentences = {};
  var that = this; 
  var friendGuess; 
  this.pauseTimer();
  this.toggleLadder();
  phoneAudio.play(); 
  //Confidence-related logic, to randomize what the friend would say  
    //confidence levels 
    var confidenceArr = ['high', 'low'];
    //randomly assigns a confidence level to the "friend"
    var friendConfidence = confidenceArr[Math.floor(Math.random() * 2)];
    //for high confidence, the friend would always give the correct answer 
    if (friendConfidence === 'high') {
      friendGuess = this.answer; 
    //for low confidence, the friend gives the correct answer 40% of the time for 4 choices
    //and 50% of the time for 2 choices
    } else if (friendConfidence === 'low') {
      var lowConfidenceRandom = Math.random(); 
      if (this.fiftyUsedThisRound) {
        if (lowConfidenceRandom < 0.5) friendGuess = this.answer;
        else {
          var friendGuessArr = _.reject(this.choices, v => {
            return (v == that.answer || that.eliminatedChoices.indexOf(v) !== -1) 
          });
          // console.log(friendGuessArr);
          friendGuess = friendGuessArr[0];  
        } 
      }
      else {
        if (lowConfidenceRandom < 0.2) friendGuess = this.answer;
        else friendGuess = this.choices[_.random(0,3)];
      }
    }
      
    sentences.high = `I know this.  The answer is ${friendGuess}, final answer.`;
    sentences.low = `uhh, I would guess the answer is ${friendGuess}, but I don't really know.`;
  //Logic for choosing a specific friend & voice
    //array of names and associated voices
    var voices = [["UK English Female", "Isabelle"], ["UK English Male", "Archie"],["US English Female", "Carol Ann"],["US English Male", "Billy"]];
    //randomly choose a friend 
    var friendProps = voices[Math.floor(Math.random() * voices.length)];
    var friendName = friendProps[1];
    var friendVoice = friendProps[0];
    
  //Rendering
  $('#money-ladder-div').append(`<p id="phone-message">Using the 'Phone A Friend Lifeline' to call ${friendName}...</p>`)
  //responsiveVoice specific logic
  setTimeout(() => {
    responsiveVoice.speak(sentences[friendConfidence], friendVoice);
  }, 4000);
  setTimeout(() => {
    $('#phone-message').remove(); 
    that.resumeTimer();  
    that.toggleLadder();
  }, 8500);

}

// logic for 'Poll The Audience' life line
app.pollTheAudience = function (){
  //4:15 ~ 4:24 of the clip
  console.log('invoking pollTheAudience')
  var that = this;  
  //logic for swapping Regis picture with the bar chart 
  this.pauseTimer();  
  this.toggleLadder();
  pollAudio.play();
  setTimeout(() => {
    var canvas = $('<canvas>');
    canvas.attr('id', 'pollChart');
    $('#money-ladder-div').append(canvas);
    var pollDataArr = [];
    // logic to generate random vote numbers for poll data 
    var leftOver = 80;
    var chartChoices = []; 
    var labelsArr = ["A", "B", "C", "D"];
    var labelsToKillArr = [];  
    if (that.fiftyUsedThisRound){
      //eliminate choices
      console.log('polling with 2 choices')
      chartChoices = _.reject(that.choices, v => (that.eliminatedChoices.includes(v)))
      console.log(chartChoices);
      that.eliminatedChoices.forEach(v => {
        var labelToEliminate = labelsArr[that.choices.indexOf(v)];
        labelsToKillArr.push(labelToEliminate);
      })
      labelsArr = _.reject(labelsArr, v => (labelsToKillArr.includes(v)));
    }
    else chartChoices = that.choices;  
    _.each(chartChoices, function (v) {
      var votes = 0; 
      var rand = Math.floor(Math.random()*leftOver);
      if (v === that.answer){
        votes += 20; 
      }
      votes += rand;  
      leftOver -=rand; 
      pollDataArr.push(votes)
    })

    console.log(pollDataArr);

    // chart.js logic
    var ctx = document.getElementById("pollChart").getContext('2d');
    var chartObj = {
        type: 'bar',
        data: {
            //red, blue, yellow, green
            labels: labelsArr,
            datasets: [{
                label: '# of Votes',
                data: pollDataArr,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
          maintainAspectRatio: false,
          legend: {
            labels: {
                fontColor: "white",
            }
          },
          scales: {
            yAxes: [{
              display: true,
              ticks: {
                fontColor: "white",
                beginAtZero: true,
                steps: 10,
                stepValue: 10,
                max: 100
              }
            }],
            xAxes: [{
              ticks: {
                  fontColor: "white"
              }
            }]
          }
        }
    };
    var myChart = new Chart(ctx, chartObj);
    this.resumeTimer(); 
  }, 9500)
}

app.toggleLadder = ()=> {
  $('.ladder-row').toggle(); 
}

app.pauseTimer = function() {
  this.pausedTime = this.timer;
  console.log('paused time is', app.pausedTime)
  clearTimeout(this.timeoutF); 
  clearInterval(this.intervalF);
  this.timeoutF = function(){};
  this.intervalF = function(){};  
  //TODO: more ? 
}

app.resumeTimer = function() {
  var that = this;  
  this.timeoutF = setTimeout(that.noGoodAnswer.bind(that), that.pausedTime * 1000);
  this.intervalF = setInterval(that.updateTimer.bind(that, "after resuming"), 1000);

}