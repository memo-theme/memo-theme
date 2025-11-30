import { hash } from "argon2";
import { MongoClient } from "mongodb";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import slugify from "slugify";

async function getPostsFromFiles() {
  const postsDir = path.join(process.cwd(), "src/content/blog");
  let files: string[] = [];
  try {
    files = (await fs.readdir(postsDir)).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".md";
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "ENOENT"
    ) {
      console.error(`Posts directory not found: ${postsDir}`);
      return [];
    } else {
      throw err;
    }
  }

  const posts = [];
  for (const file of files) {
    const filePath = path.join(postsDir, file);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data } = matter(fileContent);

    const slug =
      data.slug ||
      slugify(path.basename(file, path.extname(file)), { lower: true });

    posts.push({
      slug,
      data,
    });
  }
  return posts;
}

async function main() {
  console.log("Starting password hashing script...");
  const posts = await getPostsFromFiles();

  const passwordProtectedPosts = posts.filter((post) => post.data.password);

  if (passwordProtectedPosts.length === 0) {
    console.log("No password protected posts found.");
    return;
  }

  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    console.error("MONGODB_URI environment variable not set.");
    process.exit(1);
  }

  const client = new MongoClient(mongodbUri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB.");

    const db = client.db("theme-memories");
    const collection = db.collection("hashed-pwd");

    for (const post of passwordProtectedPosts) {
      const { password } = post.data;
      const { slug } = post;
      const hashedPassword = await hash(password);
      await collection.updateOne(
        { slug },
        { $set: { hash: hashedPassword } },
        { upsert: true },
      );
    }
    console.log("Finished hashing all passwords.");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

main().catch(console.error);
