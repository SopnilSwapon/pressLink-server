require('dotenv').config()
const express = require('express');
const app = express();
const  cors = require('cors');
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nshaxle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
 const AddedNewsCollection = client.db('pressLinkDB').collection('added');
 const newsCollection = client.db('pressLinkDB').collection('news');
 const usersCollection = client.db('pressLinkDB').collection('users')
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
// ______________users related api___________________//
app.post('/users', async(req, res) =>{
  const user = req.body;
  const query = {email: user.email};
  const existingUser = await usersCollection.findOne(query);
  if(existingUser){
    return res.send({message: 'This user have already exist'})
  }
  const result = await usersCollection.insertOne(user);
  res.send(result);
})
app.get('/users', async (req, res) =>{
  const result = await usersCollection.find().toArray();
  res.send(result)
});

app.get('/user/role/:email', async(req, res) =>{
  const email = req.params.email;
  const query = {email: email};
  const result = await usersCollection.findOne(query);
  res.send(result);
});
app.put('/user/role/:email', async (req, res) =>{
  const email = req.params.email;
  const userInfo = req.body;
  const options = {upsert: true}
  const query = {email: email};
  const updateUserInfo = {
    $set:{
        ...userInfo
    }
    }
  const result = await usersCollection.updateOne(query, updateUserInfo, options);
  res.send(result)
})

  // _______________news related api____________________//
    app.post('/news', async(req, res) =>{
    const singleNews = req.body;
    const result = await AddedNewsCollection.insertOne(singleNews);
    res.send(result);
    });
    app.get('/added/news', async (req, res) =>{
      const result = await AddedNewsCollection.find().toArray();
      res.send(result);
    });
    app.post('/news/approved', async(req, res) =>{
      const approvedNews = req.body;
      const result = await newsCollection.insertOne(approvedNews);
      res.send(result)
    })
    app.delete('/added/news/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await AddedNewsCollection.deleteOne(query);
      res.send(result)
    });
    app.put('/added/news/:id', async (req, res) =>{
      const id = req.params.id;
      const news = req.body
      const query = {_id: new ObjectId(id)};
      const options = {upsert: true}
      const updateDoc = {
        $set: {
          ...news
        }
      };
     const result = await AddedNewsCollection.updateOne(query, updateDoc, options);
     res.send(result)
    })
     // get all tags //
    app.get('/news', async(req, res) =>{
      const result = await newsCollection.find().toArray();
      res.send(result);
    });
    app.delete('/news/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await newsCollection.deleteOne(query)
      res.send(result)
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
    } );
    // get specific publisher's news //
    app.get('/news/:publisher', async(req, res) =>{
      const publisher = req.params.publisher;
      const query = {publisher: publisher};
      const result = await newsCollection.find(query).toArray();
      res.send(result);

    });
    // get specific news by searching headline//
    app.get('/news/search/:headline', async (req, res) => {
      const headline = req.params.headline;
      const query = {headline: {$regex: headline, $options: 'i'}}
      const result = await newsCollection.find(query).toArray();
      res.send(result);
    });
    app.get('/news-tags', async (req, res) =>{
      const result = await newsCollection.aggregate([
        { $unwind: '$tags'},
        { $group: {_id: '$tags'}},
        { $project: {_id: 0, tag: "$_id"} }
      ]).toArray();
      res.send(result)
    });
    app.get('/newsTags/:tag', async (req, res) =>{
      const tag = req.params.tag;
      const query = {tags: tag}
      const result = await newsCollection.find(query).toArray();
      res.send(result)

    })
    
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