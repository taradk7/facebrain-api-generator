const express = require('express');
const bodyparser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'Maravich14',
      database : 'facebrain'
    }
  });

const app = express();

app.use(bodyparser.json());
app.use(cors());

app.get('/', (req, res) =>{
    res.send('Hello World');
});

app.post('/signin', (req, res) => {
   db.select('email', 'hash').from('login')
   .where('email', '=', req.body.email)
    .then(data => {
       const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
       if(isValid){
           return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0]);
            })
            .catch(err => res.status(400).json('unable to get user'))
       } else{
        res.status(400).json('Wrong login credentials. Please try again.')
       }
    })
    .catch(err => res.status(400).json('Wrong login credentials. Please try again.'))
});

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !name || !password){
       return res.status(400).json('incorrect form submission.');
    }
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')  
            .insert({
                email: loginEmail[0],
                name: name,
                joined: new Date()
             })
            .then(user => {
            res.json(user[0]);
        })
        .then(trx.commit)
        .catch(trx.rollback);
     })
    })
        .catch(err => res.status(400).json('Unable to register. Please re-enter information and try again!'));
});

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({
        id: id
    }).then(user => {
        if(user.length){
            res.json(user[0]);
        } else{res.status(400).json('Profile not found.')  } 
    }).catch(err => res.status(400).json('Error getting user profile'));
});

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0])
    })
    .catch(err => res.status(400).json('unable to get entries'))
});


  
  // Load hash from your password DB.


app.listen(3000, () => {
    console.log('app is running on port 3000');
});

