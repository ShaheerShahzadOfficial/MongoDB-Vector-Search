import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()
const uri = process.env.MONGODB_URI
export const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        console.log("Successfully connected to Atlas");

    } catch (err) {
        console.log(err);
        await client.close();
        process.exit(1)
    }
}
run().catch(console.dir);