const express =require('express');
const app=express();
const jwt=require('jsonwebtoken')
const cors=require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =process.env.PORT || 5000

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x9xlpou.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // Send a ping to confirm a successful connection
    const usersCollection=client.db('parmasmartDB').collection('users')
   
      // jwt related api
      app.post("/jwt",async(req,res)=>{
        const user=req.body;
        // console.log(user);
        const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECREAT,{expiresIn:'1h'})
        // console.log(token);
        res.send({token})
      })

          // const verify token midelware
  const varifyToken=(req,res,next)=>{
    // console.log("inside verify token",req.headers.authorization);
    if (!req.headers.authorization) {
      return res.status(401).send({message:'forbiden access'})
    }
    const token=req.headers.authorization.split(' ')[1];
   jwt.verify(token,process.env.Access_Token_secret,(err,decoded)=>{
     if (err) {
      return res.status(401).send({message:"forbiden access"})
     }
     req.decoded=decoded;
     next()
   })
   
  };


  // varify admin
  const verifyAdmin= async(req,res,next)=>{
    const email=req.decoded.email;
   const quary={email:email};
   const user =await usersCollection.findOne(quary);
   const isAdmin= user?.role==='admin';
   if (!isAdmin) {
    return res.status(403).send({message:"forbiden access"})
   }
   next()
  }

    // User related api  collection post or insert
    app.post("/users",async(req,res)=>{
        const user=req.body;
        // insert email if users dosent exist
        const queary={email:user.email}
        const exestingUser=await usersCollection.findOne(queary);
        if (exestingUser) {
          return res.send({message:"User already exist",insertedId:null})
        }
        const result=await usersCollection.insertOne(user);
        res.send(result)
    })


  app.get("/users",varifyToken,verifyAdmin,async(req,res)=>{
    const result =await usersCollection.find().toArray();
      res.send(result);
  })

  app.patch("/users/seller/:id",varifyToken,verifyAdmin,async(req,res)=>{
    const id=req.params.id;
    const queary={_id:new ObjectId(id)};
    const updateddoc={
      $set:{
        role:"seller"
      }
    }
    const result =await usersCollection.updateOne(queary,updateddoc);
    res.send(result)
  })
  app.patch("/users/user/:id",varifyToken,verifyAdmin,async(req,res)=>{
    const id=req.params.id;
    const queary={_id:new ObjectId(id)};
    const updateddoc={
      $set:{
        role:"user"
      }
    }
    const result =await usersCollection.updateOne(queary,updateddoc);
    res.send(result)
  })











    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

  }
}
run().catch(console.dir);












app.get("/",(req,res)=>{
    res.send("parmasmart is running")
})

app.listen(port,()=>{
console.log(`parmasmart is running on ${port}`);
})