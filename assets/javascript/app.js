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
//game settings
app.introWaitTime = 20; 
app.intermissionWaitTime = 5; 
app.pauseTimeBetweenQuestions = 4; 
app.difficultySetting = {
  'Easy': 4,
  'Medium': 2,
  'Hard': 2
};
app.lifelines = ['phoneAFriend','pollTheAudience', 'fiftyFifty'];
app.difficultyTimer = {
  'Easy': 2000,
  'Medium': 20,
  'Hard': 40
}
app.moneyLadder = ['$100', '$200', '$500', '$1,000', '$2,500', '$10,000', '$32,000', '$125,000', '$400,000', '$1 Milllion']
app.allQuestionsAnswers = [];  
app.LLavailable = false; 

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
  $('#choices').empty();
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
  $('#choices').empty();
  multipleChoices.forEach((v, i) => {
    var MCbutton = $('<button class="btn-primary col-xs-6">').text(`${v}.  ${that.choices[i]}`);
    MCbutton.attr('data', that.choices[i])
    MCbutton.on('click', function() {
     that.answerCheck($(this).attr('data'))
    })  
    $('#choices').append(MCbutton);
  });
  $('.yellow-background').removeClass('yellow-background');  
  $(`#ladder-${that.questionNumber}`).addClass('yellow-background');
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
  $('#timeLeft').text('');
  $('#QID').text('');
  $('#Qdiff').text('');
  if (win == 'win'){
    $('#question').html(`Game over! You won a million dollars!`);
  } else $('#question').html(`Game over! You answered:\n\n ${this.rights} questions correctly`);
  $('#choices').empty();
  $('#startButton').toggle();
}

//logic to update on screen count-down
app.updateTimer = function (){
  console.log("inside update timer");
  this.timer--;  
  $('#timeLeft').html(`Time Left: ${this.timer}`);
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
  this.intervalF = setInterval(that.updateTimer.bind(that)
  ,1000);
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
  _.each(this.lifelines, v => {
    //logic for creating lifeline divs
    var LLdiv = $('<div>');
    LLdiv.addClass('col-sm-4 col-xs-12 LLdiv text-center');
    LLdiv.attr('data', v);
    //logic for creating lifeline images
    var LLimg = $('<img>').addClass('img-fluid');
    LLimg.attr('src', `assets/images/${v}.png`);
    LLimg.css({'cursor': 'pointer'})
    LLdiv.append(LLimg);
    //attach click event listener
    LLdiv.on('click', function() {
      if(LLavailable){
        $(this).addClass('hidden');
        that[$(this).attr('data')]();
      }
    })
    //add it to DOM
    $('#LLcontainer').append(LLdiv);
  })
  //create money ladder
  _.each(this.moneyLadder, (v, i) => {
    var $moneyRowDiv = $('<div>').attr({
      class: 'row',
      id: `ladder-${i+1}`
    })
    var $qNumDiv = $('<div>').addClass('col-xs-3').attr('id', 'q-Num');
    var $qNumH6 = $('<h6>').text(i+1).addClass('float-right');
    var $prizeDiv = $('<div>').addClass('col-xs-9'); 
    var $prizeH6 = $('<h6>').text(v);
    $qNumDiv.append($qNumH6);
    $prizeDiv.append($prizeH6);
    $moneyRowDiv.append($qNumDiv, $prizeDiv);
    $('#money-ladder').prepend($moneyRowDiv);
  })
  //update timer
  $('#timeLeft').html(`Time Left: ${time}`);
  //update the question text
  $('#question').text(`Let the game begin! You have ${that.difficultyTimer.Easy} seconds to answer each easy question; easy questions are meant to be fun and funny!\n\nNote that you have three lifelines: Phone a Friend, Poll the Audience, and Fifty-fifty.`)
  
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



// EXTRA STUFF
app.fiftyFifty = function () {
  console.log('invoking fiftyFifty')
  var that = this;  
  this.LLusedThisRound = true;
  var copyArr = this.choices.slice();
  copyArr.splice((copyArr.indexOf(that.answer)),1);
  copyArr.splice(Math.floor(Math.random() *3),1);
  for (var i = 0; i< 2 ; i++){
   $('.btn-primary').filter(function(){
     return $(this).attr('data') == copyArr[i]; 
   }).addClass('hidden');

  }
}

// logic for "Phone a friend" life line
app.phoneAFriend = function(){
  console.log('invoking phoneAFriend')
  this.LLusedThisRound = true;
  var sentences = {};
  var friendGuess; 
  //Confidence-related logic, to randomize what the friend would say  
    //confidence levels 
    var confidenceArr = ['high', 'mid', 'low'];
    //randomly assigns a confidence level to the "friend"
    var friendConfidence = confidenceArr[Math.floor(Math.random() * 3)];
    //for high confidence, the friend would always give the correct answer 
    if (friendConfidence === 'high') {
      friendGuess = this.answer; 
    //for mid confidence, the friend gives the correct answer 70% of the time for 4 choices
    } else if (friendConfidence === 'mid') {
      var midConfidenceRandom = Math.random(); 
      if (midConfidenceRandom < 0.6) {
        friendGuess = this.answer;
      } else {
        friendGuess = this.choices[_.random(0,3)];
      }
    //for low confidence, the friend gives the correct answer 25% of the time for 4 choices
    } else {
        friendGuess = this.choices[_.random(0,3)];
    }
    sentences.high = `The answer is ${friendGuess}, final answer.`;
    sentences.mid = `I just read about this, let's see; I believe the answer is ${friendGuess}.`;  
    sentences.low = `uhh, I would guess the answer is ${friendGuess}, but I really don't know.`;
  //Logic for choosing a specific friend & voice
    //array of names and associated voices
    var voices = [["UK English Female", "Isabelle"], ["UK English Male", "Archie"],["US English Female", "Carol Ann"],["US English Male", "Billy"]];
    //randomly choose a friend 
    var friendProps = voices[Math.floor(Math.random() * voices.length)];
    var friendName = friendProps[1];
    var friendVoice = friendProps[0];
  //TODO: rendering logic
  console.log(`Using the 'Phone A Friend Lifeline' to call ${friendName}...`)
  //responsiveVoice specific logic
  responsiveVoice.speak(sentences[friendConfidence], friendVoice);

}

// logic for 'Poll The Audience' life line
app.pollTheAudience = function (){
  console.log('invoking pollTheAudience')
  var that = this;  
  this.LLusedThisRound = true;  
  //logic for swapping Regis picture with the bar chart 
  $('#IMGcontainer').empty();
  var canvas = $('<canvas>');
  canvas.attr('id', 'pollChart');
  $('#IMGcontainer').append(canvas);
  var pollDataArr = [];
  // logic to generate random vote numbers for poll data 
  var leftOver = 80;
  _.each(this.choices, function (v) {
    var votes = 0; 
    var rand = Math.floor(Math.random()*leftOver);
    if (v === that.answer){
      votes += 20; 
    }
    votes += rand;  
    leftOver -=rand; 
    pollDataArr.push(votes)
  })

  // chart.js logic
  var ctx = document.getElementById("pollChart").getContext('2d');
  var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          //red, blue, yellow, green
          labels: ['A', 'B', 'C','D'],
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
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }]
          }
      }
  });
}