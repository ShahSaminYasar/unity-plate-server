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
    const usersCollection = client.db("unityPlate").collection("users");

    // User Update and JWT Sign
    app.put("/api/v1/user", async (req, res) => {
      const user = req.body;
      const user_email = user?.email;
      const user_name = user?.name;
      const user_dp = user?.dp;

      const query = { email: user_email };

      const check = await usersCollection.find(query).toArray();

      if (check.length === 0) {
        const addUser = await usersCollection.insertOne(user);
        res.send({ user: "added", addUser });
      } else {
        if (req.query.update) {
          console.log("Updating with DP");
          const updateUser = await usersCollection.updateOne(query, {
            $set: {
              name: user_name,
              dp: user_dp,
            },
            $currentDate: {
              lastModified: true,
            },
          });
        } else {
          const updateUser = await usersCollection.updateOne(query, {
            $set: {
              name: user_name,
            },
            $currentDate: {
              lastModified: true,
            },
          });
        }
        res.send({ user: "updated" });
      }
    });

    // Post Food
    app.post("/api/v1/add-food", async (req, res) => {
      const food = req.body;
      const result = await foodsCollection.insertOne(food);
      res.send(result);
    });

    // Post Food Request
    app.post("/api/v1/add-request", async (req, res) => {
      const request = req.body;
      const food_id = request.id;
      const request_by = request.requester_email;
      const query = { id: food_id, requester_email: request_by };
      const check = await requestsCollection.find(query).toArray();
      if (check.length === 0) {
        const result = await requestsCollection.insertOne(request);
        res.send(result);
      } else {
        res.send({ alreadyRequested: true });
      }
    });

    // Get Foods
    app.get("/api/v1/get-foods", async (req, res) => {
      const query = {};
      const sort = {};
      const limit = parseInt(req.query.limit) || 500;

      if (req.query.id) {
        query._id = new ObjectId(req.query.id);
        // console.log(query);
      }

      if (req.query.email) {
        query["donor.email"] = req.query.email;
      }
      if (req.query.sortBy && req.query.sortOrder) {
        sort[req.query.sortBy] = req.query.sortOrder;
        // console.log(sort);
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

    // Get User
    app.get("/api/v1/get-user/:email", async (req, res) => {
      const query = { email: req.params.email };
      // console.log(query);
      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Edit Food
    app.put("/api/v1/edit-food/:food_id", async (req, res) => {
      const food = req.body;
      const food_id = req.params.food_id;
      // console.log("Food: ", food_id, food);

      const filter = { _id: new ObjectId(food_id) };

      const result = await foodsCollection.replaceOne(filter, food);

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
