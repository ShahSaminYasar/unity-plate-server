const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// MongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jazz428.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodsCollection = client.db("unityPlate").collection("foods");
    const requestsCollection = client.db("unityPlate").collection("requests");

    // Post Food
    app.post("/api/v1/add-food", async (req, res) => {
      const food = req.body;
      const result = await foodsCollection.insertOne(food);
      res.send(result);
    });

    // Post Food Request
    app.post("/api/v1/add-request", async (req, res) => {
      const request = req.body;
      const result = await requestsCollection.insertOne(request);
      res.send(result);
    });

    // Get Foods
    app.get("/api/v1/get-foods", async (req, res) => {
      const query = {};
      const sort = {};
      const limit = Number(req.query.limit) || 500;

      if (req.query.id) {
        const id = Number(req.query.id);
        query._id = new ObjectId(id);
        console.log(query);
      }

      if (req.query.email) {
        query["donor.email"] = req.query.email;
      }
      if (req.query.sortBy && req.query.sortOrder) {
        sort[req.query.sortBy] = req.query.sortOrder;
        console.log(sort);
      }
      const cursor = foodsCollection.find(query).sort(sort).limit(limit);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get Food Requests
    app.get("/api/v1/get-requests", async (req, res) => {
      const query = { "donor.email": req.query.email };
      const cursor = requestsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World from Unity Plate's server!");
});

app.listen(port, () => {
  console.log(`Unity Plate Server is running on port ${port}`);
});
