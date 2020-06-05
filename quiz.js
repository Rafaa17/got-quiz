const QUESTION_TYPES = {
  MULTIPLE: "mutiplechoice-multiple",
  SINGLE: "mutiplechoice-single",
  BOOLEAN: "truefalse",
};

var quizData = {
  quiz: null,
  results: null,
  questionIndex: 0,
  score: 0,
  maxPoints: 0,
};

const fetchQuiz = async () => {
  return new Promise(async (resolve, reject) => {
    let quiz, results;

    let response = await fetch(
      "http://proto.io/en/jobs/candidate-questions/quiz.json"
    );
    if (response.status == 200) {
      let responseBody = await response.text();
      quiz = JSON.parse(responseBody);
    } else {
      reject();
    }

    response = await fetch(
      "http://proto.io/en/jobs/candidate-questions/result.json"
    );
    if (response.status == 200) {
      let responseBody = await response.text();
      results = JSON.parse(responseBody);
      quizData.quiz = quiz;
      quizData.results = results.results;
      resolve();
    } else {
      reject();
    }
  });
};

const loadQuiz = () => {
  const { quiz } = quizData;
  let title = quiz.title;
  let description = quiz.description;
  document.getElementById("title").innerHTML = title;
  document.getElementById("description").innerHTML = description;
};

const calculateMaxPoints = () => {
  const { quiz } = quizData;
  const { questions } = quiz;
  quizData.maxPoints = questions.reduce(
    (acc, question) => acc + question.points,
    0
  );
};

const removeElements = (elms) => elms.forEach((el) => el.remove());

const generateAnswers = (question_type, possible_answers) => {
  let answers = [];

  if (question_type === QUESTION_TYPES.BOOLEAN) {
    possible_answers = [
      { caption: "True", a_id: "true" },
      { caption: "False", a_id: "false" },
    ];
  }

  possible_answers.forEach((answer) => {
    let answerElement = document.createElement("div");
    answerElement.className = `${question_type} answer`;
    answerElement.innerHTML = answer.caption;
    answerElement.setAttribute("data-answerid", answer["a_id"]);
    answerElement.addEventListener("click", clickAnswer);
    answers.push(answerElement);
  });

  let answerElement = document.createElement("div");
  answerElement.className = `multiple-submit`;
  answerElement.innerHTML = "Next Question";
  answerElement.addEventListener("click", validateAnswer);
  answers.push(answerElement);

  return answers;
};

const clickAnswer = (event) => {
  const {
    quiz: { questions },
    questionIndex,
  } = quizData;

  if (questions[questionIndex].question_type != QUESTION_TYPES.MULTIPLE) {
    let currentAnswer = document.querySelector(".chosenAnswer");
    if (currentAnswer) {
      currentAnswer.classList.remove("chosenAnswer");
    }
  }

  let selectedAnswer = event.target;
  if (!selectedAnswer.classList.contains("chosenAnswer"))
    selectedAnswer.classList.add("chosenAnswer");
  else selectedAnswer.classList.remove("chosenAnswer");
};

const validateAnswer = (event) => {
  const { quiz, questionIndex } = quizData;
  const { questions } = quiz;
  var question = questions[questionIndex];
  const { correct_answer, question_type, points } = question;

  let correctAnswers = Array.isArray(correct_answer)
    ? correct_answer
    : [correct_answer];

  correctAnswers.forEach((correctAnswer) => {
    document
      .querySelector(`[data-answerid='${correctAnswer}']`)
      .classList.add("correctAnswer");
  });

  let correctAnswersMap = {};

  correctAnswers.forEach((answer) => (correctAnswersMap[answer] = true));

  // highlight red invalid answers
  let chosenAnswers = document.querySelectorAll(".chosenAnswer");
  let isCorrect = true;

  chosenAnswers.forEach((answer) => {
    let answerNo = answer.getAttribute("data-answerid");
    if (!correctAnswersMap[answerNo]) {
      answer.classList.add("wrongAnswer");
      isCorrect = false;
    } else {
      delete correctAnswersMap[answerNo];
    }
  });

  if (Object.keys(correctAnswersMap).length !== 0) isCorrect = false;
  if (isCorrect) quizData.score += points;

  document.getElementById("score").innerHTML = `Score: ${quizData.score}`;

  setTimeout(() => {
    removeElements(document.querySelectorAll(".answer,.multiple-submit"));
    document.getElementById("score").innerHTML = "";
    quizData.questionIndex++;
    nextQuestion();
  }, 300);
};

const nextQuestion = () => {
  const { quiz, questionIndex } = quizData;
  const { questions } = quiz;
  if (questionIndex !== questions.length) {
    var question = questions[questionIndex];
    const {
      q_id,
      title,
      img,
      question_type,
      possible_answers,
      correct_answer,
      points,
    } = question;
    document.getElementById("question").innerHTML = `${
      questionIndex + 1
    }. ${title}`;
    document.getElementById("questionImg").setAttribute("src", img);
    const answersElements = generateAnswers(question_type, possible_answers);
    answersElements.forEach((answer) =>
      document.getElementById("answers").appendChild(answer)
    );
  } else {
    endQuiz();
  }
};

const endQuiz = () => {
  const { results, score, maxPoints } = quizData;

  let percentageScore = (score / maxPoints) * 100;

  let result = results.filter(
    (result) =>
      percentageScore >= result.minpoints && percentageScore <= result.maxpoints
  );

  const { img, title, message } = result[0];

  document.getElementById("score").innerHTML = `Score: ${percentageScore}%`;
  document.getElementById("resultTitle").innerHTML = title;
  document.getElementById("resultImg").src = img;
  document.getElementById("resultDescription").innerHTML = message;
  document.getElementById("questionImg").setAttribute("src", "");
  document.getElementById("question").innerHTML = "";
  document.getElementById("restart").style.display = "block";
  document.getElementById("restart").addEventListener("click", startQuiz);
};

const startQuiz = () => {
  document.getElementById("restart").style.display = "none";
  document.getElementById("score").innerHTML = ``;
  document.getElementById("resultTitle").innerHTML = "";
  document.getElementById("resultImg").src = "";
  document.getElementById("resultDescription").innerHTML = "";
  quizData.score = 0;
  quizData.questionIndex = 0;
  nextQuestion();
};

(async () => {
  await fetchQuiz();
  loadQuiz();
  calculateMaxPoints();
  startQuiz();
})();
