const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//* middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://carepoint36.netlify.app",
      "https://carepoint-b2a32.web.app",
      "https://carepoint-b2a32.firebaseapp.com",
    ],
    credentials: true,
  })
);

// app.use(cors());
app.use(express.json());
app.use(cookieParser());

// middleware for checking token
const verifyToken = (req, res, next) => {
  
  const token = req.cookies?.token;
  // console.log('token inside the verifyToken', token);
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized Access' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized access' });
    }
    req.user = decoded;
    next();
  })
  
}




// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.swu9d.mongodb.net/?retryWrites=true&w=majority`;
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7argw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();

    const volunteerCollection = client.db('volunteerDB').collection('volunteer_posts');
    const RequestCollection = client.db('volunteerDB').collection('volunteerRequests');

    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");


    // auth related apis for jwt
    
    app.post('/jwt', (req, res) => {
      const user = req.body;
     
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn:'5h'
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({success: true})
    })




    // get api
    app.get("/volunteerPosts", async (req, res) => {
      const result = await volunteerCollection.find().limit(6).sort({postDeadline: 1}).toArray()
      res.send(result);
    });

    // get all post
    app.get('/allPost',  async (req, res) => {
      const search = req.query.search || '';
    
      const result = await volunteerCollection.find({title:{$regex: search, $options: 'i'}}).toArray();
      res.send(result);
    })


    // get data by dynamic id
    app.get("/volunteerPosts/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
     
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.findOne(query);
      res.send(result);
    });


    // get my post

app.get("/myPost/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  // console.log("Email from params:", email);
  // console.log("Token from cookies:", req.cookies?.token);
  // console.log("Decoded user:", req.user);
  if (req.user.email !== email) {
    return res.status(403).send({ message: "Forbidden access" });
  }
  const query = { organizerEmail: email };
  const result = await volunteerCollection.find(query).toArray();
  res.send(result);
});


    // get request post to be a volunteer
    app.get('/myRequestPost/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      // console.log("Email from params:", email);
      // console.log("Token from cookies:", req.cookies?.token);
      // console.log("Decoded user:", req.user);
      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { volunteerEmail: email };
      const result = await RequestCollection.find(query).toArray();
      res.send(result);
    })

    // remove token from cookie if logged out user
    app.post('/logout', (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite:
          process.env.NODE_ENV === "production" ? "none" : "strict",
        })
      .send({success: true})
    })


    app.post('/volunteerPosts',verifyToken,  async (req, res) => {
      const newVolunteerPost = req.body;
      // console.log(newVolunteerPost);
      const result = await volunteerCollection.insertOne(newVolunteerPost)
      res.send(result);
    })


    // for request collection APIs
    
    app.post("/volunteerRequests", verifyToken, async (req, res) => {
      const newRequest = req.body;
      const { postId } = newRequest;
      // console.log(postId);
      const result = await RequestCollection.insertOne(newRequest);
      // console.log("Query for update:", { _id: new ObjectId(postId) });

      const updateRequest = await volunteerCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { volunteers: -1 } }
      );

      res.send({
        message: "Request created and volunteers count updated",
        insertResult: result,
        updateResult: updateRequest,
      });
    });


    // update api

    app.patch('/updatePost/:id', verifyToken, async (req, res) => {

      const id = req.params.id;
      const updateData = req.body;
         const email = req.user.email;
        //  console.log('post update',email);
         if (req.user.email !== email) {
           return res.status(403).send({ message: "Forbidden access" });
         }

      const result = await volunteerCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
      res.send(result);

    })

    // delete post by id
    app.delete('/deletePost/:id', verifyToken, async(req, res) => {
      const id = req.params.id;
      const email = req.user.email;
      // console.log('post delete',email);
       if (req.user.email !== email) {
         return res.status(403).send({ message: "Forbidden access" });
       }
      
      const result = await volunteerCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    })
app.get("/checkToken", verifyToken, (req, res) => {
  res.status(200).send({ message: "Token is valid" });
});


    // delete post by id for request 
    app.delete('/deleteRequest/:id', verifyToken, async(req, res) => {
      const id = req.params.id;
      const email = req.user.email;
      // console.log("post delete request", email);

       if (req.user.email !== email) {
         return res.status(403).send({ message: "Forbidden access" });
       }
     
      
      const result = await RequestCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    })


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send("volunteer is working");
})

app.listen(port, () =>{
    console.log(`volunteer server is running on port: ${port}`);
})
