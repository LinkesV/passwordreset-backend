import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv'
import cors from 'cors'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser';
import User from './models/user.js';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin:true
}));

dotenv.config();
const port = process.env.PORT;
const saltrounds = 10; //Bcrypt


// Connect to MongoDB 

mongoose.connect("mongodb://0.0.0.0:27017/LoginDetails" , {useNewUrlParser: true, useUnifiedTopology: true})
.then(()=>{
    console.log('Connected to MongoDb database')
})
.catch((err)=>{
    console.log(err)
})


// SIGNUP FOR ACCOUNT 

app.post('/createuser',(req,res)=>{
    bcrypt.hash(req.body.password, saltrounds, function(err,hash){
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hash, //HASH FROM Bcrypt
        })

        user.save()
        .then(()=>{
            res.send({message:"Account created successfully. You may login Now"})
        })
        .catch((err)=>{
            console.log(err)
        })
    })
})

// LOGIN TO ACCOUNT 

app.post('/login',(req,res)=>{
    User.findOne({email:req.body.email})
    .then((user)=>{
        if(!user){
            res.send({login:false,message:"Invalid email"})
        }
        else{
            bcrypt.compare(req.body.password,user.password,function (err,result){
                if(result == true){
                    res.send({login:true,username:user.username})
                }
                else{
                    res.send({login:false,message:"Invalid password"})

                }
            })
        }
    })
})

// SEND OTP EMAIL

app.post('/sendemail',async (req,res)=>{
    await User.findOne({email:req.body.email})
    .then(async (user)=>{
        if(!user){
            res.send({email:false,message:"Invalid email"})
        }
        else{
            let otp = `${Math.floor(1000 + Math.random() * 9000)}`
            res.send({email:true,message:"Check your email for OTP and click on link in the email",OTP:otp, username:user.username, useremail:user.email})


            await User.findOneAndUpdate({email:req.body.email},{forgetpsw:otp})
        }
    })
})

// CHECK OTP
app.post('/checkotp',async (req,res)=>{
    await User.findOne({username:req.body.username})
    .then(async (user)=>{
       if(user.forgetpsw == req.body.otp){
             res.send({result:true,message:"OTP is correct, enter your new password"})
        }
        else{
            res.send({result:false,message:"OTP is wrong"})
        }  
    })
})

// CHANGE PASSWORD

app.post('/changepsw',(req,res)=>{
    bcrypt.hash(req.body.password, saltrounds, function(err,hash){
        User.findOneAndUpdate({username:req.body.username},{password:hash})
        .then(()=>{
            res.send({message:'Password updated successfully'})
        })
    })
})


app.listen(port,()=>{
    console.log(`Server connected to port ${port} successfully`)
})
