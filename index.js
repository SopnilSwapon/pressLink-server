require('dotenv').config()
const express = require('express');
const app = express();
const  cors = require('cors');
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nshaxle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
 const newsCollection = client.db('pressLinkDB').collection('news');
 const usersCollection = client.db('pressLinkDB').collection('users')
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    app.post('/news', async(req, res) =>{
    const singleNews = req.body;
    const result = await newsCollection.insertOne(singleNews);
    res.send(result);
    });
    app.get('/news', async(req, res) =>{
      const result = await newsCollection.find().toArray();
      res.send(result);
    })
    app.post('/users', async(req, res) =>{
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);
    })
    // get only publisher api //
    app.get('/news/publishers', async (req, res) =>{
      const publishers = await newsCollection.aggregate([
        {
          $group : {
            _id: "$publisher"
          }
        },
        {
          $project : {
            _id: 0,
            publisher: '$_id'
          }
        }
      ]).toArray();
      res.send(publishers);
    } )
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) =>{
    res.send('news coming soon')
})
app.listen(port, () =>{
    console.log(`pressLink coming on the port ${port}`);
})