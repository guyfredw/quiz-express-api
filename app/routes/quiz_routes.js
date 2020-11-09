// require middlewares
const express = require('express')
const passport = require('passport')

// take in the mongoose model
const Quiz = require('../models/quiz')

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
// POST /quizzes
router.post('/quizzes', requireToken, (req, res, next) => {
  // assign the owner key of the quiz to the currently signed in user
  req.body.quiz.owner = req.user.id
  Quiz.create(req.body.quiz)
    .then(quiz => {
      // respond with the status and the new quiz
      res.status(200).json({ quiz })
    })
})

// INDEX
// GET /quizzes
router.get('/quizzes', requireToken, (req, res, next) => {
  // Find the quizzes with the same owner
  Quiz.find({ owner: req.user.id })
    .then(quizzes => {
      // `examples` will be an array of Mongoose documents
      // we want to convert each one to a POJO, so we use `.map` to
      // apply `.toObject` to each one
      return quizzes.map(quiz => quiz.toObject())
    })
    // provide the response status and the quizzes object in json
    .then(quizzes => res.status(200).json({ quizzes }))
    // catch any errors
    .catch(next)
})

// SHOW
// GET /quizzes/:id
router.get('/quizzes/:id', requireToken, (req, res, next) => {
  // req.params.id is the id set in the route
  Quiz.findById(req.params.id)
    // if the quiz cannot be found throw an error
    .then(handle404)
    .then(quiz => res.status(200).json({ quiz }))
    // error handler
    .catch(next)
})

// UPDATE
// PATCH /quizzes/:id
router.patch('/quizzes/:id', requireToken, (req, res, next) => {
  // if the client attempts to change the `owner` property by including a new
  // owner, prevent that by deleting that key/value pair
  delete req.body.quiz.owner

  Quiz.findById(req.params.id)
    .then(handle404)
    .then(quiz => {
      // check to see if the request object's user is the same as the owner
      // if it is not it will throw an error
      requireOwnership(req, quiz)

      return quiz.updateOne(req.body.quiz)
    })
    // if the request succeeds, return 204
    .then(() => res.sendStatus(204))
    .catch(next)
})

// DESTROY
// DELETE /quizzes/:id

router.delete('/quizzes/:id', requireToken, (req, res, next) => {
  Quiz.findById(req.params.id)
    // if the quiz cannot be found throw an error
    .then(handle404)
    .then(quiz => {
      // throw an error if the user doesn't own the quiz
      requireOwnership(req, quiz)
      // if the user is the same as the owner continue below
      quiz.deleteOne()
    })
    .then(() => res.sendStatus(200))
    .catch(next)
})

module.exports = router
