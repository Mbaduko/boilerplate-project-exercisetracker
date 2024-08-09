const express = require('express')
const app = express()
const cors = require('cors');
const { createUser, allUsers, createExercise, logs } = require('./connection');
require('dotenv').config()

app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users')
  .post( async (req, res) => {
    const {username} = req.body;
    if (!username)
      return res.json({error: "username required"});
    const result = await createUser(username);
    res.json({username: result.username, _id: result._id})
  })

  .get(async (req, res) => {
    const result= await allUsers();
    return res.json(result)
  })

app.route('/api/users/:_id/exercises')
  .post(async (req, res) =>{
    const user = req.params._id;
    const { description, duration} = req.body;
    if (!user)
      return res.json({error:'UserId is required'});
    if (!description || !duration)
      return res.json({error:"description and duration are required"})
    return res.json(await createExercise({user, ...req.body}))
  })

app.route('/api/users/:_id/logs')
  .get(async (req, res) => {
    const {_id} = req.params;
    const {from, to , limit} = req.query;
    if (!_id)
      return res.json({error:'UserId is required'});
    return res.json(await logs(_id,limit || null, from? new Date(from) : null, to ||null));
  })

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
