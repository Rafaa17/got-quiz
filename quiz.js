const removeElements = (elms) => elms.forEach((el) => el.remove());

const QUESTION_TYPES = {
  MULTIPLE: "mutiplechoice-multiple",
  SINGLE: "mutiplechoice-single",
  BOOLEAN: "truefalse",
};

const QUESTION_DELAY = 3000;

class Quiz {
  questions = null;
  results = null;
  questionIndex = 0;
  score = 0;
  maxPoints = 0;
  title = "";
  description = "";

  constructor(quiz) {
    const { title, description, questions } = quiz;
    this.title = title;
    this.description = description;
    this.questions = questions;
    this.calculateMaxPoints();
  }

  /** Set Quiz results
   * @param  {string} results
   */
  setResults = (results) => {
    this.results = results;
  };

  /**
   * Clear any previous quiz content and start new quiz
   */
  startQuiz = () => {
    document.getElementById("restart").style.display = "none";
    document.getElementById("score").innerHTML = ``;
    document.getElementById("resultTitle").innerHTML = "";
    document.getElementById("resultImg").src = "";
    document.getElementById("resultDescription").innerHTML = "";
    document.getElementById("title").innerHTML = this.title;
    document.getElementById("description").innerHTML = this.description;
    this.score = 0;
    this.questionIndex = 0;
    this.nextQuestion();
  };

  /**
   * Calculates the percentage score and displays it
   */
  endQuiz = () => {
    let percentageScore = Math.round((this.score / this.maxPoints) * 100);

    let result = this.results.filter(
      (result) =>
        percentageScore >= result.minpoints &&
        percentageScore <= result.maxpoints
    );

    const { img, title, message } = result[0];

    document.getElementById("score").innerHTML = `Score: ${percentageScore}%`;
    document.getElementById("resultTitle").innerHTML = title;
    document.getElementById("resultImg").src = img;
    document.getElementById("resultDescription").innerHTML = message;
    document.getElementById("questionImg").setAttribute("src", "");
    document.getElementById("question").innerHTML = "";
    document.getElementById("restart").style.display = "block";
    document
      .getElementById("restart")
      .addEventListener("click", this.startQuiz);
  };

  /**
   * Calculates the maximum possible points of the quiz
   */
  calculateMaxPoints = () => {
    this.maxPoints = this.questions.reduce(
      (acc, question) => acc + question.points,
      0
    );
  };

  /**
   * Gets the next question and displays it to the user
   */
  nextQuestion = () => {
    if (this.questionIndex !== this.questions.length) {
      var question = this.questions[this.questionIndex];
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
        this.questionIndex + 1
      }. ${title}`;
      document.getElementById("questionImg").style.display = "none";
      document.getElementById("questionImg").setAttribute("src", img);
      document.getElementById("questionImg").style.display = "inline-block";
      const answersElements = this.generateQuestionAnswers(
        question_type,
        possible_answers
      );
      answersElements.forEach((answer) =>
        document.getElementById("answers").appendChild(answer)
      );
    } else {
      this.endQuiz();
    }
  };

  /**
   *  Returns a questions possible answers as an array of DOM elements;
   *
   * @param  {} question_type
   * @param  {} possible_answers
   */
  generateQuestionAnswers = (question_type, possible_answers) => {
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
      answerElement.addEventListener("click", this.clickAnswer);
      answers.push(answerElement);
    });

    let answerElement = document.createElement("div");
    answerElement.className = `multiple-submit`;
    answerElement.innerHTML = "Next Question";
    answerElement.addEventListener("click", this.validateAnswer);
    answers.push(answerElement);

    return answers;
  };

  /**
   *  Selects or deselects the answer user has clicked
   *
   * @param  {} event
   */
  clickAnswer = (event) => {
    if (
      this.questions[this.questionIndex].question_type !=
      QUESTION_TYPES.MULTIPLE
    ) {
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

  /**
   * Validates the current question
   *
   * @param  {} event
   */
  validateAnswer = (event) => {
    var question = this.questions[this.questionIndex];
    const { correct_answer, points } = question;

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

    if (isCorrect) this.increaseScore(points);

    setTimeout(() => {
      removeElements(document.querySelectorAll(".answer,.multiple-submit"));
      this.questionIndex++;
      this.nextQuestion();
    }, QUESTION_DELAY);
  };

  /**
   * Increases current score based on given points
   *
   * @param  {} points
   * @param  {} =>(this.score+=points
   */
  increaseScore = (points) => (this.score += points);
}

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
      results = JSON.parse(responseBody)["results"];
      resolve({ quiz, results });
    } else {
      reject();
    }
  });
};

(async () => {
  const { quiz: quizData, results } = await fetchQuiz();
  let quiz = new Quiz(quizData);
  quiz.setResults(results);
  quiz.startQuiz();
})();
