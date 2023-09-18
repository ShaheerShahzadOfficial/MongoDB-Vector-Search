import express from "express";
import morgan from 'morgan';
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from "openai";
import { client } from "./config/mongodbConfig.js";
import { ObjectId } from "mongodb";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors(["http://localhost:5173"]));

app.use(morgan('combined'));

const postCollection = client.db("todo").collection("post")


 const openai = new OpenAI({
  // organization: process.env.OPENAI_API_ORGANIZATION,
  apiKey: process.env.OPENAI_API_KEY
});

// Getting All Post Here

app.get("/api/v1/stories", async (req, res) => {
  const cursor = postCollection
    .find({})
    .sort({ _id: -1 })
    .project({ post_embedding: 0 })

  try {
    const allStories = await cursor.toArray();
    res.send(allStories);

  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to get stories, please try later" });
  }
});



//  Searching Data

app.get("/api/v1/search", async (req, res) => {

  const queryText = req.query.queryText;

  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: queryText,
  });
  const vector = response?.data[0]?.embedding
  console.log("vector: ", vector);
  // [ 0.0023063174, -0.009358601, 0.01578391, ... , 0.01678391, ]


  const documents = await postCollection.aggregate([
    {
      "$search": {
        "index": "default",
        "knnBeta": {
          "vector": vector,
          "path": "post_embedding",
          "k": 2147483647
        },
        "scoreDetails": true
      }
    },
    {
      "$project": {
        "post_embedding": 0,
        "score": { "$meta": "searchScore" },
        "scoreDetails": { "$meta": "searchScoreDetails" }
      },

    }
  ]).toArray();


  res.send(documents)
});


app.post("/api/v1/story", async (req, res) => {

  try {
    const doc = {
      title: req?.body?.title,
      text: req?.body?.text,
      $currentDate: {
        createdOn: true
      },
    }

    const result = await postCollection.insertOne(doc);
    console.log("result: ", result);
    res.send({
      message: "story created successfully"
    });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send({ message: "Failed to add, please try later" })
  }
});

app.put("/api/v1/story/:id", async (req, res) => {

  if (!ObjectId.isValid(req.params.id)) {
    res.status(403).send({ message: "incorrect product id" });
    return;
  }

  let story = {}

  if (req.body.title) story.title = req.body.title;
  if (req.body.text) story.text = req.body.text;

  try {
    const updateResponse = await postCollection
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: story }
      );

    console.log("Product updated: ", updateResponse);

    res.send({
      message: "story updated successfully"
    });

  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to update story, please try later" });
  }
});


app.delete("/api/v1/story/:id", async (req, res) => {

  if (!ObjectId.isValid(req.params.id)) {
    res.status(403).send({ message: "incorrect product id" });
    return;
  }

  try {
    const deleteResponse = await postCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    console.log("Product deleted: ", deleteResponse);

    res.send({
      message: "story deleted successfully"
    });

  } catch (error) {
    console.log("error", error);
    res.status(500).send({ message: "failed to delete story, please try later" });
  }

})



app.use((req, res) => {
    res.status(404).send("URL not found");
  })
  

export default app