import { db } from "../server/db";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";
import { storage } from "../server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    console.log("Checking for admin user...");
    
    // Check if admin user exists
    const existingUser = await storage.getUserByUsername("mayankgawali445@gmail.com");
    
    if (existingUser) {
      console.log("Admin user already exists, updating...");
      
      // Update user with Admin role and new password
      await db
        .update(users)
        .set({ 
          role: "Admin",
          password: await hashPassword("dingdong10")
        })
        .where(eq(users.id, existingUser.id));
      
      console.log("Admin user updated successfully!");
    } else {
      console.log("Admin user does not exist, creating...");
      
      // Create new admin user
      await storage.createUser({
        username: "mayankgawali445@gmail.com",
        email: "mayankgawali445@gmail.com",
        password: await hashPassword("dingdong10"),
        role: "Admin"
      });
      
      console.log("Admin user created successfully!");
    }
    
    // Verify admin user
    const adminUser = await storage.getUserByUsername("mayankgawali445@gmail.com");
    
    console.log("Admin user verified:", adminUser?.username, "with role:", adminUser?.role);
    
  } catch (error) {
    console.error("Error updating admin user:", error);
  } finally {
    process.exit(0);
  }
}

main();