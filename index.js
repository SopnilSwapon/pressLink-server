require('dotenv').config()
const express = require('express');
const app = express();
const  cors = require('cors');
const port = process.env.PORT || 4000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

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
 const publisherCollection = client.db('pressLinkDB').collection('publisher')
 const paymentCollection = client.db('pressLinkDB').collection('payment')
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
});

app.put('/user/:email', async(req, res) =>{
  const email = req.params.email;
  const userInfo = req.body;
  const options = {upsert: true}
  const query = {email};
  const updateUserInfo = {
    $set:{
        ...userInfo
    }
    } 
  const result = await usersCollection.updateOne(query, updateUserInfo, options);
  res.send(result)
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
app.get('/users/premium', async (req, res) =>{
  const filter = {isPremium: true}
  const result = await usersCollection.find(filter).toArray();
  res.send(result)
})
app.get('/users/normal', async (req, res) =>{
  const filter = {isPremium: false || null || undefined}
  const result = await usersCollection.find(filter).toArray();
  res.send(result)
})
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
});
// _________________publisher related api________________//
   app.post('/publisher', async (req, res) =>{
    const publisher = req.body;
    const result = await publisherCollection.insertOne(publisher);
    res.send(result);
   });
   app.get('/publisher/percentages', async (req, res) => {
    const aggregation = [
        {
            $group: {
                _id: "$publisher",
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$count" },
                publications: {
                    $push: {
                        publisher: "$_id",
                        count: "$count"
                    }
                }
            }
        },
        {
            $unwind: "$publications"
        },
        {
            $project: {
                _id: 0,
                publication: "$publications.publisher",
                percentage: {
                    $multiply: [
                        { $divide: ["$publications.count", "$total"] },
                        100
                    ]
                }
            }
        }
    ];

    const publicationPercentages = await newsCollection.aggregate(aggregation).toArray();

    res.send(publicationPercentages);
});

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
  //  Get most six views News //
    app.get('/foods/six', async (req, res) => {
      const size = parseInt(req.query.size);
      const sorted = parseInt(req.query.sort);
      const result = await foodsCollection.find().sort({ purchase: sorted }).limit(size).toArray();
      res.send(result)
    });
    app.get('/news/six', async (req, res) =>{
      const size = parseInt(req.query.size);
      const sorted = parseInt(req.query.sort);
      const result = await newsCollection.find().sort({views: sorted}).limit(size).toArray();
      res.send(result)
    })
    // single news //
    app.get('/news/one/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const updateView = { $inc: { views: 1 } };
      await newsCollection.updateOne(query, updateView);
      const result = await newsCollection.findOne(query);
      res.send(result)
    });
    // currents user's News//
    app.get('/news/some/:email', async(req, res) =>{
      const email = req.params.email;
      const query = {author_email: email};
      const result = await AddedNewsCollection.find(query).toArray();
      res.send(result);
    })
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
      const news = req.body;
      console.log('from update', news, id);
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
    // Delete news by using post method//
    app.post('/news/remove', async(req, res) =>{
      const filter = req.body;
      const newsResult = await newsCollection.deleteOne(filter);
      const addedResult = await AddedNewsCollection.deleteOne(filter);
      res.send({newsResult, addedResult})
    });
    app.get('/news/premium', async (req, res) =>{
      const filter = {isPremium: true};
      const result = await newsCollection.find(filter).toArray();
      res.send(result);
    })
    // get only publisher api //
    app.get('/news/publishers', async (req, res) =>{
      const publishers = await publisherCollection.find().toArray();
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
    // payment related api //
    app.post('/payment', async (req, res) =>{
      const paymentInfo = req.body;
      // check if user has pending plan
    const isPendingPlan = await paymentCollection.findOne({ user: paymentInfo.user, status: 'pending' });

     // update pending payment if find any
     if (isPendingPlan) {
      const updated = await paymentCollection.updateOne(
          { user: paymentInfo.user },
          { $set: { ...paymentInfo } },
          { upsert: true }
      )
      return res.send(updated);
  }

      const result = await paymentCollection.insertOne(paymentInfo);
      res.send(result)
    });
    // payment intent 
    app.post('/create-payment-intent', async (req, res) =>{
      const {price} = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });
    app.get('/payment/:email', async (req, res) =>{
      const email = req.params.email;
      const query = {user: email, status: 'pending'};
      const result = await paymentCollection.findOne(query)
      res.send(result)
    });

    app.patch('/payment/:email', async (req, res) => {
      const paymentInfo = req.body;
      const filter = { user: req.params.email, status: 'pending' };
      const options = { upsert: true };
      const updatedInfo = { $set: paymentInfo };
  
      const result = await paymentCollection.updateOne(filter, updatedInfo, options);
  
      res.send(result);
  });
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