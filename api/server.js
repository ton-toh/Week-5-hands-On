const express = require('express')

const app = express()
const mysql = require('mysql2')
const cors = require('cors')
const bcrypt = require('bcrypt')
const dotenv = require('dotenv')

app.use(express.json())
app.use(cors())
dotenv.config();

//connection to the database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
})

//check if connection works
db.connect((err) => {
    if(err) return console.log("Connection failed")


    console.log("Connected to the MySql as id: ", db.threadId)

    //create a database
    db.query("CREATE DATABASE IF NOT EXISTS expense_tracker", (err, result) => {
        if(err) return console.log(err)

        console.log("database expense_tracker created successfully")  
        
        //change our database
        db.changeUser({ database: 'expense_tracker'}, (err, result) => {
            if(err) return console.log(err)

             console.log("expense_tracker is in use") 
             
             //create users table
             const usersTable = `
             CREATE TABLE IF NOT EXISTS users (
                 id INT AUTO_INCREMENT PRIMARY KEY,
                 email VARCHAR(100) UNIQUE NOT NULL,
                 username VARCHAR(255) UNIQUE NOT NULL,
                 password VARCHAR(255) NOT NULL
                 )
                 `;
                 db.query(usersTable, (err, result) => {
                 if(err) return console.log(err)
                     console.log("users table created successfully")
         
        })
      })
   })
})

//user registration route
app.post('/api/register', async(req, res) => {
    try{
        const users = `SELECT * FROM users WHERE email = ?`
        //check if user exists
        db.query(users, [req.body.email], (err, data) => {
            if(data.length > 0) return res.status(409).json("User already exists");

            //hash the password
            const salt = bcrypt.genSaltSync(10)
            const hashedPassword = bcrypt.hashSync(req.body.password, salt)

            const newUser = `INSERT INTO users(email, username, password) VALUES (?)`
            value = [ req.body.email, req.body.username, hashedPassword ]
            db.query(newUser, [value], (err, data) => {
                if(err) return res.status(400).json("Something went wrong")

                return res.status(200).json("User created successfully")
            
           })  
        })
    }
    catch(err) {
        res.status(500).json("Internal Server Error")
    }
})



//user login route
app.post('/api/login', async(req, res) => {
    try{
        const users = `SELECT * FROM users WHERE email =?`
        db.query(users, [req.body.email], async (err, data) => {
            if(err) return res.status(400).json("Something went wrong")

            if(data.length === 0) return res.status(401).json("User not found")

            const valid = bcrypt.compareSync(req.body.password, data[0].password)
            if(!valid) return res.status(400).json("Invalid credentials")

            return res.status(200).json("Logged in successfully")
        })
    }
    catch(err) {
        res.status(500).json("Internal Server Error")
    }
})

app.get('', (req, res) => {
    res.send('Hello World!')
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})