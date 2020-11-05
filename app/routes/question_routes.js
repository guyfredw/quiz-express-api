// require middlewares
const express = require('express')
const passport = require('passport')

// take in the mongoose model
const Question = require('../models/question')

// take in the custom errors
const customErrors = require('../../lib/custom_errors')

// this function will be used to handle 404 errors
const handle404 = customErrors.handle404
// this function will be used to send a 401 error request to a user trying to modify a resource that is not his
const requireOwnership = customErrors.requireOwnership

// passing this as an argument next to the router verb
// will make it required to provide a token for that route to be availabe
// it will set `req.user`
const requireToken = passport.authenticate('bearer', {
  session: false
})

const router = express.Router()

// CREATE
// POST /questions
router.post('/questions', requireToken, (req, res, next) => {
  // assign the owner key of the question to the currently signed in user
  req.body.question.owner = req.user.id
  Question.create(req.body.question)
    .then(question => {
      // respond with the status and the new question
      res.status(200).json({ question })
    })
})

// INDEX
// GET /questions
router.get('/questions', requireToken, (req, res, next) => {
  Question.find()
    .then(questions => {
      // `examples` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return questions.map(question => question.toObject())
    })
    // provide the response status and the questions object in json
    .then(questions => res.status(200).json({ questions }))
    // catch any errors
    .catch(next)
})

// SHOW
// GET /questions/:id
router.get('/questions/:id', requireToken, (req, res, next) => {
  // req.params.id is the id set in the route
  Question.findById(req.params.id)
    // if the question cannot be found throw an error
    .then(handle404)
    .then(question => res.status(200).json({ question }))
    // error handler
    .catch(next)
})

// UPDATE
// PATCH /questions/:id
router.patch('/questions/:id', requireToken, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.question.owner

  Question.findById(req.params.id)
    .then(handle404)
    .then(question => {
      // check to see if the request object's user is the same as the owner
      // if it is not it will throw an error
      requireOwnership(req, question)

      return question.updateOne(req.body.question)
    })
    // if the request succeeds, return 204
    .then(() => res.sendStatus(204))
    .catch(next)
})

// DESTROY
// DELETE /questions/:id

router.delete('/questions/:id', requireToken, (req, res, next) => {
  Question.findById(req.params.id)
    // if the question cannot be found throw an error
    .then(handle404)
    .then(question => {
      // throw an error if the user doesn't own the question
      requireOwnership(req, question)
      // if the user is the same as the owner continue below
      question.deleteOne()
    })
    .then(() => res.sendStatus(200))
    .catch(next)
})

module.exports = router
