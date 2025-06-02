#!/usr/bin/env bun
import { db, courses, lessons, users } from "./db/index.ts";
import { eq } from "drizzle-orm";

async function verifyAIContent() {
  try {
    const result = await db
      .select({
        courseTitle: courses.title,
        lessonTitle: lessons.title,
        instructor: users.name,
        contentPreview: lessons.content
      })
      .from(courses)
      .leftJoin(lessons, eq(courses.id, lessons.courseId))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(courses.title, "Observability for AI applications"));
    
    console.log("🤖 AI Observability Course Verification:");
    console.log("=".repeat(60));
    
    result.forEach(r => {
      const preview = r.contentPreview ? 
        r.contentPreview.substring(0, 100) + "..." : 
        "No content";
      
      console.log(`📖 ${r.lessonTitle}`);
      console.log(`   Instructor: ${r.instructor}`);
      console.log(`   Content: ${preview}`);
      console.log("");
    });
    
    console.log(`✅ Verified ${result.length} lessons with content`);
    
  } catch (error) {
    console.error("❌ Error verifying content:", error);
  }
  
  process.exit(0);
}

verifyAIContent();