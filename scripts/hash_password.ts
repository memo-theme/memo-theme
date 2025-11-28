import { getCollection } from "astro:content";
import { hash, argon2id } from "argon2";
import { MongoClient } from "mongodb";
import { env } from "cloudflare:workers";

const posts = await getCollection("blog");

const passwordProtectedPosts = posts.filter(
  (post) => post.data.password !== undefined,
);

if (passwordProtectedPosts.length === 0) {
  console.log("No password protected posts found.");
  process.exit(0);
}

const mongodbUri = await env.MONGODB_URI.get();
const client = new MongoClient(mongodbUri);

try {
  await client.connect();
  const db = client.db("theme-memories");
  const collection = db.collection("hashed-pwd");

  for (const post of passwordProtectedPosts) {
    const { slug, password } = post.data;
    if (slug && password) {
      const hashedPassword = await hash(password, {
        type: argon2id,
        timeCost: 3,
        memoryCost: 65536,
        parallelism: 4,
        hashLength: 32,
        saltLength: 16,
        encode: true,
      });
      await collection.updateOne(
        { slug },
        { $set: { hash: hashedPassword } },
        { upsert: true },
      );
      console.log(`Hashed and stored password for slug: ${slug}`);
    }
  }
} finally {
  await client.close();
}
