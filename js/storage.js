const HIGH_SCORE_KEY = "turbo-tackle-high-score";

function keyFor(mode) {
  return !mode || mode === "dodge" ? HIGH_SCORE_KEY : `${HIGH_SCORE_KEY}-${mode}`;
}

export function getHighScore(mode) {
  return Number(localStorage.getItem(keyFor(mode)) || 0);
}

export function setHighScoreIfBetter(score, mode) {
  const key = keyFor(mode);
  const current = Number(localStorage.getItem(key) || 0);
  if (score > current) {
    localStorage.setItem(key, String(score));
    return score;
  }
  return current;
}
