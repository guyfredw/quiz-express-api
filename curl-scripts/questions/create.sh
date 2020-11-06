#!/bin/bash

API="http://localhost:4741"
URL_PATH="/quizzes"

curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "quiz": {
      "text": "'"${TEXT}"'",
      "isCorrect": "'"${ISCORRECT}"'"
    }
  }'

echo
