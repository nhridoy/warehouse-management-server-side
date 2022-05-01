const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

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

    const cursor = client.db("myVentory").collection("items");

    app.get("/items", async (req, res) => {
      const items = await cursor.find({}).toArray();
      res.send(items);
    });

    app.post("/items", async (req, res) => {
      const { name, image, price, quantity, supplier, description, user } =
        req.body;
      const item = {
        name,
        image,
        price,
        quantity,
        supplier,
        description,
        user,
      };
      await cursor.insertOne(item);
      res.send(item);
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
