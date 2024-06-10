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
const stripe = require("stripe")(process.env.STRIPE_KEY);

// app.use(express.static("public"));



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
    const medicineCollection=client.db('parmasmartDB').collection('medicine')
    const cartCollection=client.db('parmasmartDB').collection('carts')
    const advertisementCollection=client.db('parmasmartDB').collection('advertisement')
    const managecategoryCollection=client.db('parmasmartDB').collection('managecategory')
   
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
      return res.status(401).send({message:'forbiden access1'})
    }
    const token=req.headers.authorization.split(' ')[1];
   jwt.verify(token,process.env.ACCESS_TOKEN_SECREAT,(err,decoded)=>{
     if (err) {
      return res.status(401).send({message:"forbiden access2"})
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
    return res.status(403).send({message:"forbiden access3"})
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

    // admin check
    app.get("/users/admin/:email",varifyToken,async(req,res)=>{
      const email=req.params.email;
        if (email !== req.decoded.email) {
          return res.status(403).send({message:"unautharized access"})
        }
        const queary ={email:email};
        const user=await usersCollection.findOne(queary);
        let isAdmin=false;
        if (user) {
          isAdmin=user?.role==='admin'
  
        }
        res.send({isAdmin})
      })

    // seller check
    app.get("/users/seller/:email",varifyToken,async(req,res)=>{
      const email=req.params.email;
        if (email !== req.decoded.email) {
          return res.status(403).send({message:"unautharized access"})
        }
        const queary ={email:email};
        const user=await usersCollection.findOne(queary);
        let isSeller=false;
        if (user) {
          isSeller=user?.role==='seller'
  
        }
        res.send({isSeller})
      })



      // post medicine


    app.post("/medicine",async(req,res)=>{
      const medicine=req.body;
      // insert email if users dosent exist
      // const queary={email:user.email}
      // const exestingUser=await usersCollection.findOne(queary);
      // if (exestingUser) {
      //   return res.send({message:"User already exist",insertedId:null})
      // }
      console.log(medicine);
      const result=await medicineCollection.insertOne(medicine);
      res.send(result)
    })
   
    app.get("/medicine",async(req,res)=>{
      const result =await medicineCollection.find().toArray();
        res.send(result);
    })
    // get medicine
    app.get("/medicine/:email",async(req,res)=>{
      const email=req.params.email;
      // console.log(email);
      const queary ={email:email};
      // console.log(queary);
      // const user=await usersCollection.findOne(queary);
      const result =await medicineCollection.find(queary).toArray();
      // console.log(result);
        res.send(result);
    })



    // get medicine
    app.get("/category",async(req,res)=>{
      // const email=req.params.email;
      // console.log(email);
      // const queary ={email:email};
      // const user=await usersCollection.findOne(queary);
      const result =await medicineCollection.find().toArray();
        res.send(result);
    })




    // Carts related Api 


    app.post("/carts",async(req,res)=>{
      const carts=req.body;
      // console.log(carts);
      const result=await cartCollection.insertOne(carts);
      res.send(result)
    })
    app.get("/carts",async(req,res)=>{
      const email=req.query.email;
  
      const queary ={
        buyerEmal:email};
           // const user=await usersCollection.findOne(queary);
      const result =await cartCollection.find(queary).toArray();
    
        res.send(result);
    })
 

    app.delete("/carts/cartsa/:email",async(req,res)=>{
      const email =req.params.email;
      const quary={buyerEmal:email}
      const result= await cartCollection.deleteMany(quary);
      res.send(result);
    })
    app.delete("/carts/cartsb/:id",async(req,res)=>{
      const id =req.params.id;
      const quary={_id : new ObjectId(id)}
      const result= await cartCollection.deleteOne(quary);
      res.send(result);
    })

     // update
 app.put("/carts/id/:id",async(req,res)=>{
  const id=req.params.id;
  const filter={_id:new ObjectId(id)};
  const option={upsert:true};
  const updateTotal=req.body;
  // console.log(updateBlog);
  const total={
    $set:{
      total:updateTotal.total
    }
  }
  const result =await cartCollection.updateOne(filter,total,option);
  res.send(result)
})
 app.put("/carts/ida/:id",async(req,res)=>{
  const id=req.params.id;
  const filter={_id:new ObjectId(id)};
  const option={upsert:true};
  const updateTotal=req.body;
  // console.log(updateBlog);
  const total={
    $set:{
      total:updateTotal.total
    }
  }
  const result =await cartCollection.updateOne(filter,total,option);
  res.send(result)
})

// payment

app.post("/create-payment-intent",async(req,res)=>{
  const {price}=req.body;
  const amount=parseInt(price*100);

  const paymentIntent=await stripe.paymentIntents.create({
    amount:amount,
    currency:'usd',
    payment_method_types:["card"]
  });
  res.send({
    clientSecret:paymentIntent.client_secret
  })
})



    // advertisement collection
    app.post("/advertisement",async(req,res)=>{
      const advertisement=req.body;
      console.log(advertisement);
      const result=await advertisementCollection.insertOne(advertisement);
      res.send(result)
    })

    // get medicine
    app.get("/advertisement",async(req,res)=>{
      // const email=req.params.email;
      // console.log(email);
      // const queary ={email:email};
      // const user=await usersCollection.findOne(queary);
      const result =await advertisementCollection.find().toArray();
        res.send(result);
    })



    app.get("/advertisement/:email",async(req,res)=>{
      const email=req.params.email;
      console.log(email);
      const queary ={email:email};
      console.log(queary);
      // const user=await usersCollection.findOne(queary);
      const result =await advertisementCollection.find(queary).toArray();
      console.log(result);
        res.send(result);
    })


    app.patch("/advertisement/approve/:id",varifyToken,verifyAdmin,async(req,res)=>{
      const id=req.params.id;
      console.log(id);
      const queary={_id:new ObjectId(id)};
      const updateddoc={
        $set:{
          status:"approve"
        }
      }
      const result =await advertisementCollection.updateOne(queary,updateddoc);
      res.send(result)
    })
    app.patch("/advertisement/pending/:id",varifyToken,verifyAdmin,async(req,res)=>{
      const id=req.params.id;
      console.log(id);
      const queary={_id:new ObjectId(id)};
      const updateddoc={
        $set:{
          status:"pending"
        }
      }
      const result =await advertisementCollection.updateOne(queary,updateddoc);
      res.send(result)
    })


    // category releted api 
    app.post("/managecategory",async(req,res)=>{
      const managecategory=req.body;
      console.log(managecategory);
      const result=await managecategoryCollection.insertOne(managecategory);
      res.send(result)
    })

    app.get("/managecategory",async(req,res)=>{
      const result =await managecategoryCollection.find().toArray();
        res.send(result);
    })


    app.get("/managecategory/medicine/:category",async(req,res)=>{
      const category=req.params.category;
      console.log(category);
      const filter={ category: category}
      console.log(filter);
      const result =await medicineCollection.find(filter).toArray();
      console.log(result);
        res.send(result);
    })
    // app.get("/managecategory/:id",async(req,res)=>{
    //   const id=req.params.id;
    //   console.log(id);
    //   // const queary={_id: new ObjectId(id)}
    //   const result =await managecategoryCollection.find().toArray();
    //   console.log(result);
    //     res.send(result);
    // })
    app.delete("/managecategory/category/:id",async(req,res)=>{
      const id =req.params.id;
      const quary={_id : new ObjectId(id)}
      const result= await managecategoryCollection.deleteOne(quary);
      res.send(result);
    })






    // await client.db("admin").command({ ping: 1 });
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