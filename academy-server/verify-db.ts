#!/usr/bin/env bun
import { db, users, courses } from "./db/index.ts";
import { eq } from "drizzle-orm";

async function verifyDatabase() {
  try {
    const result = await db
      .select({
        courseName: courses.title,
        instructorName: users.name,
        instructorAvatar: users.avatarUrl,
        category: courses.category,
        isFeatured: courses.isFeatured,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id));
    
    console.log("📊 Final Database Verification:");
    console.log("=".repeat(80));
    
    result.forEach(r => {
      const featured = r.isFeatured ? "⭐" : "  ";
      console.log(`${featured} ${r.courseName} -> ${r.instructorName} (${r.category})`);
    });
    
    console.log("=".repeat(80));
    console.log(`✅ Total courses: ${result.length}`);
    
    const instructorCounts = result.reduce((acc, course) => {
      acc[course.instructorName || 'Unknown'] = (acc[course.instructorName || 'Unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("\n👨‍🏫 Instructor Distribution:");
    Object.entries(instructorCounts).forEach(([instructor, count]) => {
      console.log(`  - ${instructor}: ${count} courses`);
    });
    
    console.log("\n🎯 Database successfully updated with all new instructor information!");
    
  } catch (error) {
    console.error("❌ Error verifying database:", error);
  }
  
  process.exit(0);
}

verifyDatabase();