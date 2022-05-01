const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    jwt.verify(bearerToken, process.env.SECRET, (err, authData) => {
      if (err) {
        res.sendStatus(403);
      } else {
        req.authData = authData;
      }
    });
  } else {
    res.sendStatus(403);
  }
  next();
};

const PORT = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tsoia.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();

    const items = client.db("myVentory").collection("items");

    // JWT TOKEN
    app.post("/login", async (req, res) => {
      const { email } = req.body;
      const token = jwt.sign({ email }, process.env.SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // SINGLE ITEM
    app.get("/items/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const item = await items.findOne({ _id: ObjectId(id) });
      res.send(item);
    });

    // DELETE SINGLE ITEM
    app.delete("/items/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const item = await items.deleteOne({ _id: ObjectId(id) });
      res.send(item);
    });

    // UPDATE QUANTITY OF SINGLE ITEM
    app.patch("/items/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const { quantity } = req.body;
      const item = await items.updateOne(
        { _id: ObjectId(id) },
        { $set: { quantity } }
      );
      res.send(item);
    });

    // TOP ITEMS
    app.get("/topitems", async (req, res) => {
      const allItems = await items
        .find({})
        .sort("_id", "descending")
        .limit(6)
        .toArray();
      res.send(allItems);
    });

    // ALL ITEMS
    app.get("/items", verifyToken, async (req, res) => {
      const email = req.authData.email;
      if (!email) {
        res.sendStatus(403);
      } else {
        const allItems = await items.find({}).toArray();
        res.send(allItems);
      }
    });

    // MY ITEMS
    app.get("/myitems", verifyToken, async (req, res) => {
      const email = req.authData.email;
      if (!email) {
        res.sendStatus(403);
      } else {
        const myItems = await items.find({ email }).toArray();
        res.send(myItems);
      }
    });

    // ADD ITEM
    app.post("/items", verifyToken, async (req, res) => {
      const email = req.authData.email;
      if (!email) {
        res.sendStatus(403);
      } else {
        const item = req.body;
        item.email = email;
        await items.insertOne(item);
        res.send(item);
      }
    });

    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
  } finally {
    // client.close();
  }
};

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
