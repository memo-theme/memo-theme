import type { AstroIntegration } from "astro";
import { getCollection } from "astro:content";
import { hash } from "argon2";
import { MongoClient } from "mongodb";

export default function hashPasswords(): AstroIntegration {
  return {
    name: "hash-passwords",
    hooks: {
      "astro:build:start": async () => {
        console.log("Starting password hashing...");

        const mongodbUri = import.meta.env.MONGODB_URI;

        // Ensure the environment variable is available
        if (!mongodbUri) {
          console.error("MONGODB_URI environment variable is not set.");
          // Throw an error to stop the build if the URI is not found
          throw new Error("MONGODB_URI is not configured.");
        }

        const posts = await getCollection("blog");
        const passwordProtectedPosts = posts.filter(
          (post) => post.data.password !== undefined,
        );

        if (passwordProtectedPosts.length === 0) {
          console.log("No password protected posts found to hash.");
          return;
        }

        const client = new MongoClient(mongodbUri);

        try {
          await client.connect();
          const db = client.db("theme-memories");
          const collection = db.collection("hashed-pwd");

          for (const post of passwordProtectedPosts) {
            const { slug, password } = post.data;
            if (slug && password) {
              const hashedPassword = await hash(password);
              await collection.updateOne(
                { slug },
                { $set: { hash: hashedPassword } },
                { upsert: true },
              );
              console.log(`Hashed and stored password for slug: ${slug}`);
            }
          }
        } catch (error) {
          console.error("Error hashing passwords:", error);
          throw error; // Stop the build on error
        } finally {
          await client.close();
          console.log("Password hashing complete.");
        }
      },
    },
  };
}
