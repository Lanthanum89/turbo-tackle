const HIGH_SCORE_KEY = "turbo-tackle-high-score";

export function getHighScore() {
  return Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
}

export function setHighScoreIfBetter(score) {
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
    return score;
  }
  return current;
}
