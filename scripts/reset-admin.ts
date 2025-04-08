import { db } from "../server/db";
import { pool } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Starting admin user reset...");
  
  try {
    // Admin user credentials
    const adminEmail = "mayankgawali445@gmail.com";
    const adminUsername = "mayankgawali445";
    const adminPassword = "dingdong10";
    
    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existingUser) {
      console.log(`Admin user with email ${adminEmail} exists. Updating role and password...`);
      
      // Update user with admin role and specified password
      await db.update(users)
        .set({
          role: "Admin",
          password: await hashPassword(adminPassword)
        })
        .where(eq(users.id, existingUser.id));
      
      console.log(`Admin user with email ${adminEmail} has been updated with admin role and new password.`);
    } else {
      console.log(`Admin user with email ${adminEmail} does not exist. Creating...`);
      
      // Create admin user
      const [newAdmin] = await db.insert(users)
        .values({
          username: adminUsername,
          email: adminEmail,
          password: await hashPassword(adminPassword),
          role: "Admin",
          status: "Active",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      console.log(`Admin user with email ${adminEmail} has been created with ID: ${newAdmin.id}`);
    }
    
    console.log("Admin user reset completed successfully.");
  } catch (error) {
    console.error("Error during admin user reset:", error);
  } finally {
    await pool.end();
  }
}

main();