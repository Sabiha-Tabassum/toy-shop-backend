const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.udpn3wh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT = (req,res,next) => {
   const authorization = req.headers.authorization;
   if(!authorization){
         return res.status(401).send({error: true, message: 'unauthorized access'})
   }
   const token = authorization.split(' ')[1];
   console.log('token inside verifyJWT', token);
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
       if(error){
          return res.status(403).send({error: true, message: 'unauthorized access'})
       }
       req.decoded = decoded;
       next();
   })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const allToysCollection = client.db('toyShop').collection('allToys');
    const addToyCollection = client.db('toyShop').collection('addToy');

    // JWT

    app.post('/jwt', (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'});
      res.send({token});
    })



    app.get('/allToys', async (req, res) => { 
      const query = {}
      const options = {
        sort: {'price': -1}
      }
      const cursor = allToysCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);

    })

    

    app.get('/allToys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await allToysCollection.findOne(query);
      res.send(result);
    })

    

    app.post('/addToy', async (req, res) => {
      const addToy = req.body;
      console.log(addToy);
      const result = await addToyCollection.insertOne(addToy);
      res.send(result);
    })


    app.get('/addToy', verifyJWT, async (req, res) => {
      // console.log(req.headers.authorization);
      const decoded = req.decoded;
      console.log('come back after verify', decoded)

      if(decoded.email !== req.query.email){
            return res.status(403).send({error: 1, message: 'forbidden access'})
      }

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await addToyCollection.find(query).toArray();
      res.send(result);
    })

    app.delete('/addToy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await addToyCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/addToy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await addToyCollection.findOne(query);
      res.send(result);
    })

    app.put('/addToy/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true}
      const updatedDoc = req.body;
      const toyData = {
        $set: {
          title: updatedDoc.title,
          subCategory: updatedDoc.subCategory,
          image: updatedDoc.image,
          price: updatedDoc.price,
          rating: updatedDoc.rating,
          deadline: updatedDoc.deadline,
          availableQuantity: updatedDoc.availableQuantity
          
        }

      }
      console.log(toyData)
      const result = await addToyCollection.updateOne(filter, toyData, options);
      res.send(result);
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


app.get('/', (req, res) => {
    res.send('shop is running')
})

app.listen(port, () => {
    console.log(`shop is running on port${port}`)
})