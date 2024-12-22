const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//* middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    await client.connect();

    const volunteerCollection = client.db('volunteerDB').collection('volunteer_posts');

    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    // get api
    app.get("/volunteerPosts", async (req, res) => {
      const result = await volunteerCollection.find().toArray()
      res.send(result);
    });


    app.post('/volunteerPosts', async (req, res) => {
      const newVolunteerPost = req.body;
      const result = await volunteerCollection.insertOne(newVolunteerPost)
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
