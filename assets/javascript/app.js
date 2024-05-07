//Game states
var app = {};
app.question = "";
app.choices = [];
app.answer = "";
app.difficulty = "";
app.rights = 0;
app.timer = 0;
app.intervalF = function () {};
app.timeoutF = function () {};
app.questionNumber = 0;
app.questionsForThisGame = [];
app.pausedTime = 0;
//game settings
app.introWaitTime = 8;
app.intermissionWaitTime = 8;
app.pauseTimeBetweenQuestions = 2;
app.difficultySetting = {
  Easy: 4,
  Medium: 3,
  Hard: 3,
};
app.lifelines = ["phoneAFriend", "pollTheAudience", "fiftyFifty"];
app.difficultyTimer = {
  Easy: 20,
  Medium: 30,
  Hard: 40,
};
app.moneyLadder = [
  "$100",
  "$200",
  "$500",
  "$1,000",
  "$2,500",
  "$10,000",
  "$32,000",
  "$125,000",
  "$400,000",
  "$1 Milllion",
];
app.allQuestionsAnswers = [];
app.LLavailable = false;
app.eliminatedChoices = [];
app.fiftyUsedThisRound = false;

//logic for choosing questions for this round
app.chooseQuestions = function () {
  console.log("choosing questions for this round");
  var that = this;
  var Qs = [];
  //for each difficulty setting
  for (var key in that.difficultySetting) {
    //take all questions of that difficulty, shuffle it, and pick n out of the set, where n is the value in the difficultySetting key-value pair
    Qs = Qs.concat(
      chance.pickset(
        chance.shuffle(
          _.filter(that.allQuestionsAnswers, (v) => v.difficulty === key)
        ),
        that.difficultySetting[key]
      )
    );
  }
  //update game state: questions for this game
  this.questionsForThisGame = Qs;
};

//Logic for checking if user inputs a correct answer
app.answerCheck = function (choice) {
  console.log(`user entered ${choice}`);
  if (choice === this.answer) this.goodAnswer();
  else this.gameOver();
};

//logic for all after-question actioms
app.afterQuestion = function () {
  // console.log('processing all actions between questions');
  var that = this;
  $(".ladder-row").show();
  $("#choices").empty();
  $("canvas").remove();
  clearTimeout(this.timeoutF);
  //logic to determine if we should trigger next question or trigger either intermission or gameover
  if (this.questionNumber === this.difficultySetting.Easy) {
    this.timeoutF = setTimeout(
      that.intermission.bind(that),
      that.pauseTimeBetweenQuestions * 1000
    );
  } else if (
    this.questionNumber ===
    _.reduce(this.difficultySetting, (memo, value) => memo + value)
  ) {
    this.timeoutF = setTimeout(
      that.gameOver.bind(that, "win"),
      that.pauseTimeBetweenQuestions * 1000
    );
  } else
    this.timeoutF = setTimeout(
      that.nextQuestion.bind(that),
      that.pauseTimeBetweenQuestions * 1000
    );
  this.timer = that.pauseTimeBetweenQuestions;
  $("#timeLeft").html(`Time Left: ${that.pauseTimeBetweenQuestions}`);
};

//Logic for good answer
app.goodAnswer = function () {
  // console.log("good answer!");
  this.afterQuestion();
  //update game state
  this.rights++;
  //congrates the user!
  $("#question").text(`Good job! ${this.answer} is the correct answer.`);
};

//logic for showing solution if user waits out a question or answers incorrectly
app.noGoodAnswer = function (answered) {
  // console.log("display solution due to wrong choice or no choice");
  this.gameOver();
};

//logic for nextQuestion method
app.nextQuestion = function () {
  // console.log('moving onto next question')
  var that = this;
  //update states
  this.question = this.questionsForThisGame[this.questionNumber].question;
  this.choices = chance.shuffle(
    that.questionsForThisGame[that.questionNumber].choices
  );
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
  this.timeoutF = setTimeout(
    that.noGoodAnswer.bind(that),
    that.difficultyTimer[that.difficulty] * 1000
  );
};

//regular rendering logic
app.render = function () {
  // console.log("rendering question info to DOM");
  var that = this;
  var multipleChoices = ["A", "B", "C", "D"];
  $("#QID").text(`Question : #${that.questionNumber}`);
  $("#Qdiff").text(`Difficulty: ${that.difficulty}`);
  $("#timeLeft").text(`Time Left: ${that.difficultyTimer[that.difficulty]}`);
  $("#question").html(that.question);
  //logic to render the multiple choice buttons
  $("#choices-div").empty();
  multipleChoices.forEach((v, i) => {
    var MCbutton = $('<button class="btn-primary col-xs-6 choices">').text(
      `${v}.  ${that.choices[i]}`
    );
    MCbutton.attr({
      data: that.choices[i],
      letter: v,
    });
    MCbutton.on("click", function () {
      that.answerCheck($(this).attr("data"));
    });
    $("#choices-div").append(MCbutton);
  });
  $(".yellow-background").removeClass("yellow-background");
  $(`#ladder-${that.questionNumber}`).addClass("yellow-background");
  // $('.ladder-row').show();
};
//intermission logic
app.intermission = function () {
  // console.log('intermission time!');
  var that = this;
  intermissionAudio.play();
  this.LLavailable = false;
  $("#question").text(
    `Now the game gets a lot tougher!  You have ${that.difficultyTimer.Medium} seconds to answer medium questions and ${that.difficultyTimer.Hard} seconds to answer hard questions. I hope you\'ve been saving your lifelines...`
  );
  this.timeoutF = setTimeout(
    that.nextQuestion.bind(that),
    that.intermissionWaitTime * 1000
  );
  this.timer = that.intermissionWaitTime;
  $("#timeLeft").html(`Time Left: ${that.intermissionWaitTime}`);
};

//game over logic
app.gameOver = function (win) {
  // console.log('game over!');
  this.LLavailable = false;
  clearInterval(this.intervalF);
  clearTimeout(this.timeoutF);
  $("canvas").remove();
  $("#timeLeft").text("");
  $("#QID").text("");
  $("#Qdiff").text("");
  if (win == "win") {
    winAudio.play();
    $("#question").html(`Game over! You won a million dollars!`);
  } else {
    loseAudio.play();
    $("#question").html(
      `Game over! You answered:\n\n ${this.rights} questions correctly.\n\nPlay again?`
    );
  }
  $("#choices-div").empty();
  $("#startButton").toggle();
};

//logic to update on screen count-down
app.updateTimer = function (str) {
  // console.log("inside update timer");
  this.timer--;
  $("#timeLeft").html(`Time Left: ${this.timer}`);
  // console.log(str)
};

//initializing logic
app.initialize = function () {
  // console.log('Game is starting')
  var that = this;
  //reset values
  this.questionsForThisGame = [];
  this.rights = 0;
  this.questionNumber = 0;
  //active intro wait time trigger;
  this.timer = this.introWaitTime;
  this.initRender(this.timer);
  this.timeoutF = setTimeout(
    that.nextQuestion.bind(that),
    that.introWaitTime * 1000
  );
  //activate non-stop timer logic
  this.intervalF = setInterval(
    that.updateTimer.bind(that, "before resuming"),
    1000
  );
  this.chooseQuestions();
};

//logic for initial rendering
app.initRender = function (time) {
  // console.log('rendering initial message and images')
  var that = this;
  //hide start button
  $("#startButton").toggle();
  $(".boot-image").remove();
  $("#LLcontainer").empty();
  $("#money-ladder").empty();
  //create and render lifelines
  var LLBox = $("<div>").attr({ id: "LL-box" });
  _.each(this.lifelines, (v) => {
    //logic for creating lifeline divs
    var LLdiv = $("<div>");
    LLdiv.addClass("col-xs-12 LLdiv text-center");
    LLdiv.attr("data", v);
    //logic for creating lifeline images
    var LLimg = $("<img>").addClass("img-fluid");
    LLimg.attr("src", `assets/images/${v}.png`);
    LLimg.css({ cursor: "pointer" });
    LLdiv.append(LLimg);
    //attach click event listener
    LLdiv.on("click", function () {
      if (that.LLavailable) {
        $(this).addClass("hidden");
        that[$(this).attr("data")]();
      }
    });
    //add it to DOM
    LLBox.append(LLdiv);
  });
  $("#LLcontainer").append(LLBox);
  //create money ladder
  var moneyLadderDiv = $("<div>").attr({
    id: "money-ladder-div",
  });
  _.each(this.moneyLadder, (v, i) => {
    var $moneyRowDiv = $("<div>").attr({
      class: "row ladder-row",
      id: `ladder-${i + 1}`,
    });
    var $qNumDiv = $("<div>").addClass("col-xs-4").attr("id", "q-Num");
    var $qNumH6 = $("<h6>")
      .text(i + 1)
      .addClass("float-right");
    var $prizeDiv = $("<div>").addClass("col-xs-8");
    var $prizeH6 = $("<h6>").text(v);
    $qNumDiv.append($qNumH6);
    $prizeDiv.append($prizeH6);
    $moneyRowDiv.append($qNumDiv, $prizeDiv);
    moneyLadderDiv.prepend($moneyRowDiv);
  });
  $("#money-ladder").append(moneyLadderDiv);
  //add a LL message div overlapping with money ladder
  $("#money-ladder").append(
    $("<div>").attr({
      id: "LL-message",
    })
  );
  introAudio.play();
  //update timer
  $("#timeLeft").html(`Time Left: ${time}`);
  //update the question text
  $("#question").text(
    `Let the game begin! You have ${that.difficultyTimer.Easy} seconds to answer each easy question; easy questions are meant to be fun and funny!\n\nNote that you have three lifelines: Phone a Friend, Poll the Audience, and Fifty-fifty.  Remember to TURN AUDIO ON!`
  );

  $("#game").css({ "background-color": "lightblue" });
};
//event listener for start button
$("#startButton").on("click", () => app.initialize());

app.allQuestionsAnswers = [
  //Easy

  {
    question: "In software engineering, what is the acronym OOP referring to?",
    choices: [
      "Object-Oriented Programming",
      "Out-of-Print",
      "Outrageous Office Politics",
      "Octachlorocamphene-Only Pesticide",
    ],
    answer: "Object-Oriented Programming",
    difficulty: "Easy",
  },

  {
    question:
      "Which organization is responsible for standardizing and improving Javascript?",
    choices: [
      "European Computer Manufacturers Association",
      "The Brogrammers",
      "AsheleyMadison.com",
      "The World Of Warcraft Community",
    ],
    answer: "European Computer Manufacturers Association",
    difficulty: "Easy",
  },

  {
    question: "In software engineering, what is the acronym TDD referring to?",
    choices: [
      "Tower Defense Developer",
      "Touch-Down Drive",
      "Testosterone-Driven Development",
      "Test-Driven Development",
    ],
    answer: "Test-Driven Development",
    difficulty: "Easy",
  },

  {
    question:
      "Together with Javascript and CSS, which other language forms the 'three pillars of the Web'?",
    choices: [
      "Klingon",
      "HyperText Markup Language",
      "poor English",
      "profanity",
    ],
    answer: "HyperText Markup Language",
    difficulty: "Easy",
  },

  {
    question: "In software engineering, what is the acronym DRY referring to?",
    choices: [
      "Don't Repeat Youself",
      "Don't Reproduce Yourself",
      "Data Request, yo",
      "Decongestant Required Yearly",
    ],
    answer: "Don't Repeat Youself",
    difficulty: "Easy",
  },

  {
    question:
      "Websites sometimes send small pieces of data to be stored on the user's computer.  What are they called?",
    choices: [
      "cookies",
      "California rolls",
      "cheesy cheeseburger",
      "Chicken of the Sea",
    ],
    answer: "cookies",
    difficulty: "Easy",
  },

  {
    question:
      "In software, what is the name commonly given to a malicious softwares disguised as a legitimate software?",
    choices: [
      "Tokyo Drift",
      "Trojan Horse",
      "Italian Stallion",
      "Texas Chainsaw Massacre",
    ],
    answer: "Trojan Horse",
    difficulty: "Easy",
  },

  {
    question:
      "In computer network communication, what HTTP error message is given when the client tries to access a broken link?",
    choices: [
      "404 Not Found",
      "187 Dead on Arrival",
      "777 Lucky Sevens",
      "101 Intro to Economics",
    ],
    answer: "404 Not Found",
    difficulty: "Easy",
  },

  {
    question:
      "In software communication, what is the umbrella term for an unwanted electronic message?",
    choices: [
      "spam",
      "dick pic",
      "Amway solicitation",
      "update to Windows 10 message",
    ],
    answer: "spam",
    difficulty: "Easy",
  },

  {
    question:
      "The popular Javascript library jQuery provides many useful functions; the short-hand to call many jQuery functions is done by what symbol(s)?",
    choices: ["$", "T_T", "<3", "%"],
    answer: "$",
    difficulty: "Easy",
  },

  {
    question: "What is the full name of the popular Javascipt library D3?",
    choices: [
      "Diablo 3",
      "Double-Dash Dave",
      "Delta Delta Delta",
      "Data-Driven Documents",
    ],
    answer: "Data-Driven Documents",
    difficulty: "Easy",
  },

  {
    question:
      "The popular Javascript run-time environment Node.js runs on the same Javascript engine as what?",
    choices: [
      "Google Chrome's V8",
      "Ford Mustang's V6",
      "Microsoft Internet Explorer's Chakra",
      "James Watt's Steam Engine",
    ],
    answer: "Google Chrome's V8",
    difficulty: "Easy",
  },

  //medium
  {
    question:
      "<p>The below GIF is a fairly accurate dipiction of debugging in which language?</p> <img id='Peter-Griffin' src='assets/images/Peter-Griffin.gif'>",
    choices: ["Javascript", "CSS", "HTML", "Ruby"],
    answer: "CSS",
    difficulty: "Medium",
  },

  {
    question:
      "Programs written in plain Javascript without any Javascript framework/libraries is described as written in what?",
    choices: [
      "vanilla Javascript",
      "mint-chocalate Javascript",
      "CoffeeScript",
      "caramel Javascript",
    ],
    answer: "vanilla Javascript",
    difficulty: "Medium",
  },

  {
    question:
      "In Javascript, which Function method CANNOT be used to manually set context for 'this'?",
    choices: [".bind", ".call", ".apply", ".toSource"],
    answer: ".toSource",
    difficulty: "Medium",
  },

  {
    question:
      "In Javascript, when you are in the global scope, which technique makes it possible for you to modify a local variable?",
    choices: [
      "closure",
      "variable hoisting",
      "callback hell",
      "proper indentation",
    ],
    answer: "closure",
    difficulty: "Medium",
  },

  {
    question:
      "Which of the following Javascript keywords does something significantly different from the other three?",
    choices: ["var", "let", "const", "new"],
    answer: "new",
    difficulty: "Medium",
  },

  {
    question:
      "Which of the following technology is NOT part of a 'MEAN' stack?",
    choices: ["MongoDB", "Ember.js", "AngularJS", "Node.js"],
    answer: "Ember.js",
    difficulty: "Medium",
  },

  {
    question: "Which of the following HTML tags is NOT self-closing by nature?",
    choices: ["<img>", "<br>", "<area>", "<audio>"],
    answer: "<audio>",
    difficulty: "Medium",
  },

  {
    question:
      "In Javascript, which array method does NOT take a function argument?",
    choices: [".map", ".filter", ".reduce", ".reverse"],
    answer: ".reverse",
    difficulty: "Medium",
  },

  {
    question:
      "In Javascript, which of the following operator is not a comparison operator?",
    choices: ["=>", "!==", "===", "<="],
    answer: "=>",
    difficulty: "Medium",
  },

  {
    question: "Which operator does NOT exist prior to ECMAScript2015/ES6?",
    choices: ["...", "===", ">>", "&&"],
    answer: "...",
    difficulty: "Medium",
  },

  //hard
  {
    question:
      "Which of the following was not written by famous New York Times programmer Jeremy Ashkenas?",
    choices: ["Underscore.js", "CoffeeScript", "Backbone.js", "Bookshelf.js"],
    answer: "Bookshelf.js",
    difficulty: "Hard",
  },

  {
    question:
      "Which of the following is NOT a reliable way to check if x is an integer?",
    choices: [
      "return (x^0) === x",
      "return Math.floor(x) === x",
      "return (typeof x === 'number') && (x % 1 === 0)",
      "return parseInt(x, 10) === x",
    ],
    answer: "return parseInt(x, 10) === x",
    difficulty: "Hard",
  },

  {
    question:
      "What will the following code output to the console?<pre>var a =5;\nvar b=5;\n(function(){\n &nbsp;&nbsp;var a = b = 3;\n})()\n\nconsole.log('a = ', a, ', b = ', b)</pre>",
    choices: ["a = 3, b = 3", "a = 5, b = 3", "a = 5, b = 5", "a = 3, b = 5"],
    answer: "a = 5, b = 3",
    difficulty: "Hard",
  },

  {
    question:
      "What will the following code output to the console?<pre>var a = 1\nfunction b() {\n &nbsp;&nbsp;a = 10;\n&nbsp;&nbsp;return;\n&nbsp;&nbsp;function a() {}\n}\nb();\nconsole.log(a)</pre>",
    choices: ["1", "undefined", "10", "function (){}"],
    answer: "1",
    difficulty: "Hard",
  },

  {
    question:
      "Using the 'typeof' Javascript function, which input-output pair below is incorrect?",
    choices: [
      "null returns 'null'",
      "NaN returns 'number'",
      "undefined returns 'undefined'",
      "Array returns 'function'",
    ],
    answer: "null returns 'null'",
    difficulty: "Hard",
  },

  {
    question:
      "Which of the following is a common misconception about a hash table?",
    choices: [
      "its hashing function encrypts the keys",
      "on average, it offers constant-time lookup",
      "on average, it offers constant-time insertion",
      "it is an unordered data sctructure",
    ],
    answer: "its hashing function encrypts the keys",
    difficulty: "Hard",
  },

  {
    question:
      "Which of the following Javascript framework can NOT be considered an MVC framework",
    choices: ["Meteor.js", "Ember.js", "Angular 2", "Vue.js"],
    answer: "Meteor.js",
    difficulty: "Hard",
  },

  {
    question:
      "Which of the following 4 sorting algorithms is generally faster than the other 3 (Best Big-O complexity)",
    choices: ["merge sort", "insertion sort", "bucket sort", "bubble sort"],
    answer: "merge sort",
    difficulty: "Hard",
  },
];

$("#startButton").removeClass("hidden");

var fiftyAudio = new Audio("assets/audios/fiftyFifty.mp3");
var phoneAudio = new Audio("assets/audios/phoneAFriend.mp3");
var pollAudio = new Audio("assets/audios/pollTheAudience.mp3");
var intermissionAudio = new Audio("assets/audios/intermission.mp3");
var winAudio = new Audio("assets/audios/win.mp3");
var loseAudio = new Audio("assets/audios/wrongAnswer.mp3");
var introAudio = new Audio("assets/audios/intro.mp3");

// EXTRA STUFF
app.fiftyFifty = function () {
  console.log("invoking fiftyFifty");
  var that = this;
  this.fiftyUsedThisRound = true;
  this.pauseTimer();
  fiftyAudio.play();
  var copyArr = this.choices.slice();
  copyArr.splice(copyArr.indexOf(that.answer), 1);
  copyArr.splice(Math.floor(Math.random() * 3), 1);
  this.eliminatedChoices = copyArr;
  setTimeout(() => {
    for (var i = 0; i < 2; i++) {
      $(".btn-primary")
        .filter(function () {
          return $(this).attr("data") == copyArr[i];
        })
        .addClass("hidden fifty-eliminated");
    }
    that.resumeTimer();
  }, 4400);
};

// logic for "Phone a friend" life line
app.phoneAFriend = function () {
  console.log("invoking phoneAFriend");
  var sentences = {};
  var that = this;
  var friendGuess;
  this.pauseTimer();
  $("canvas").remove();
  $(".ladder-row").hide();
  phoneAudio.play();
  //Confidence-related logic, to randomize what the friend would say
  //confidence levels
  var confidenceArr = ["high", "low"];
  //randomly assigns a confidence level to the "friend"
  var friendConfidence = confidenceArr[Math.floor(Math.random() * 2)];
  //for high confidence, the friend would always give the correct answer
  if (friendConfidence === "high") {
    friendGuess = this.answer;
    //for low confidence, the friend gives the correct answer 40% of the time for 4 choices
    //and 50% of the time for 2 choices
  } else if (friendConfidence === "low") {
    var lowConfidenceRandom = Math.random();
    if (this.fiftyUsedThisRound) {
      if (lowConfidenceRandom < 0.5) friendGuess = this.answer;
      else {
        var friendGuessArr = _.reject(this.choices, (v) => {
          return v == that.answer || that.eliminatedChoices.indexOf(v) !== -1;
        });
        // console.log(friendGuessArr);
        friendGuess = friendGuessArr[0];
      }
    } else {
      if (lowConfidenceRandom < 0.2) friendGuess = this.answer;
      else friendGuess = this.choices[_.random(0, 3)];
    }
  }

  sentences.high = `I know this.  The answer is ${friendGuess}, final answer.`;
  sentences.low = `uhh, I would guess the answer is ${friendGuess}, but I don't really know.`;
  //Logic for choosing a specific friend & voice
  //array of names and associated voices
  var voices = [
    ["UK English Female", "Isabelle"],
    ["UK English Male", "Archie"],
    ["US English Female", "Carol Ann"],
    ["US English Male", "Billy"],
  ];
  //randomly choose a friend
  var friendProps = voices[Math.floor(Math.random() * voices.length)];
  var friendName = friendProps[1];
  var friendVoice = friendProps[0];

  //Rendering
  $("#money-ladder-div").append(
    `<p id="phone-message">Using the 'Phone A Friend Lifeline' to call ${friendName}...</p>`
  );
  //responsiveVoice specific logic
  setTimeout(() => {
    responsiveVoice.speak(sentences[friendConfidence], friendVoice);
  }, 4000);
  setTimeout(() => {
    $("#phone-message").remove();
    that.resumeTimer();
    that.toggleLadder();
  }, 8500);
};

// logic for 'Poll The Audience' life line
app.pollTheAudience = function () {
  //4:15 ~ 4:24 of the clip
  console.log("invoking pollTheAudience");
  var that = this;
  //logic for swapping Regis picture with the bar chart
  this.pauseTimer();
  $(".ladder-row").hide();
  pollAudio.play();
  setTimeout(() => {
    var canvas = $("<canvas>");
    canvas.attr("id", "pollChart");
    $("#money-ladder-div").append(canvas);
    var pollDataArr = [];
    // logic to generate random vote numbers for poll data
    var leftOver = 80;
    var chartChoices = [];
    var labelsArr = ["A", "B", "C", "D"];
    var labelsToKillArr = [];
    if (that.fiftyUsedThisRound) {
      //eliminate choices
      // console.log('polling with 2 choices')
      chartChoices = _.reject(that.choices, (v) =>
        that.eliminatedChoices.includes(v)
      );
      // console.log(chartChoices);
      that.eliminatedChoices.forEach((v) => {
        var labelToEliminate = labelsArr[that.choices.indexOf(v)];
        labelsToKillArr.push(labelToEliminate);
      });
      labelsArr = _.reject(labelsArr, (v) => labelsToKillArr.includes(v));
    } else chartChoices = that.choices;
    _.each(chartChoices, function (v, i) {
      // console.log(`${i+1} times`)
      var votes = 0;
      var rand = Math.floor(Math.random() * leftOver);
      if (v === that.answer) {
        votes += 20;
      }
      if (i + 1 === chartChoices.length) votes += leftOver;
      else votes += rand;
      leftOver -= rand;
      pollDataArr.push(votes);
    });

    // console.log(pollDataArr);

    // chart.js logic
    var ctx = document.getElementById("pollChart").getContext("2d");
    var chartObj = {
      type: "bar",
      data: {
        //red, blue, yellow, green
        labels: labelsArr,
        datasets: [
          {
            label: "# of Votes",
            data: pollDataArr,
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
            ],
            borderColor: [
              "rgba(255,99,132,1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        legend: {
          labels: {
            fontColor: "white",
          },
        },
        scales: {
          yAxes: [
            {
              display: true,
              ticks: {
                fontColor: "white",
                beginAtZero: true,
                steps: 10,
                stepValue: 10,
                max: 100,
              },
            },
          ],
          xAxes: [
            {
              ticks: {
                fontColor: "white",
              },
            },
          ],
        },
      },
    };
    var myChart = new Chart(ctx, chartObj);
    this.resumeTimer();
  }, 9500);
};

app.toggleLadder = () => {
  $(".ladder-row").toggle();
};

app.pauseTimer = function () {
  this.pausedTime = this.timer;
  // console.log('paused time is', app.pausedTime)
  clearTimeout(this.timeoutF);
  clearInterval(this.intervalF);
  this.timeoutF = function () {};
  this.intervalF = function () {};
  //TODO: more ?
};

app.resumeTimer = function () {
  var that = this;
  this.timeoutF = setTimeout(
    that.noGoodAnswer.bind(that),
    that.pausedTime * 1000
  );
  this.intervalF = setInterval(
    that.updateTimer.bind(that, "after resuming"),
    1000
  );
};
