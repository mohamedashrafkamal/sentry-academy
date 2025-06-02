#!/usr/bin/env bun
import { db, users, courses } from "./db/index.ts";
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log("🔍 Querying current database state...");
    
    // Query current users
    const userList = await db.select().from(users);
    console.log("\n📋 Current Users:");
    userList.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Avatar: ${user.avatarUrl}`);
    });
    
    // Query current courses
    const courseList = await db.select().from(courses);
    console.log("\n📚 Current Courses:");
    courseList.forEach(course => {
      console.log(`  - ${course.title} - Instructor ID: ${course.instructorId}`);
    });
    
    console.log("\n🔄 Updating instructor information...");
    
    // Map of new instructor names and their avatar URLs
    const instructorUpdates = [
      { name: "Cody De Arkland", avatar: "https://ui-avatars.com/api/?name=CD&background=0ea5e9&color=fff&size=128" },
      { name: "Kyle Tryon", avatar: "https://ui-avatars.com/api/?name=KT&background=22c55e&color=fff&size=128" },
      { name: "Lazar Nikolov", avatar: "https://ui-avatars.com/api/?name=LN&background=f59e0b&color=fff&size=128" },
      { name: "Paul Jaffre", avatar: "https://ui-avatars.com/api/?name=PJ&background=8b5cf6&color=fff&size=128" }
    ];
    
    // Update each user
    for (const instructor of instructorUpdates) {
      const result = await db
        .update(users)
        .set({
          name: instructor.name,
          avatarUrl: instructor.avatar,
          updatedAt: new Date()
        })
        .where(eq(users.name, instructor.name))
        .returning();
      
      if (result.length === 0) {
        // User doesn't exist, create them
        console.log(`➕ Creating new user: ${instructor.name}`);
        await db.insert(users).values({
          name: instructor.name,
          email: `${instructor.name.toLowerCase().replace(/\s+/g, '.')}@sentryacademy.com`,
          avatarUrl: instructor.avatar,
          bio: "Expert instructor at Sentry Academy",
          role: "instructor",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        console.log(`✅ Updated user: ${instructor.name}`);
      }
    }
    
    // Query updated users to get their IDs
    const updatedUsers = await db.select().from(users);
    const userMap = new Map(updatedUsers.map(user => [user.name, user.id]));
    
    // Map course titles to instructor names
    const courseInstructorMap = {
      "Fundamentals of Observability": "Cody De Arkland",
      "Advanced Error Tracking": "Kyle Tryon", 
      "Performance Optimization Techniques": "Lazar Nikolov",
      "Distributed Tracing Systems": "Paul Jaffre",
      "Frontend Error Monitoring": "Cody De Arkland",
      "Log Analysis and Visualization": "Kyle Tryon",
      "Basics of Error Monitoring": "Lazar Nikolov",
      "Understanding and implementing Session Replay": "Paul Jaffre",
      "Using Tracing and Spans for Performance": "Cody De Arkland",
      "Observability for AI applications": "Kyle Tryon"
    };
    
    // Update course instructor assignments
    console.log("\n📝 Updating course instructor assignments...");
    for (const [courseTitle, instructorName] of Object.entries(courseInstructorMap)) {
      const instructorId = userMap.get(instructorName);
      if (instructorId) {
        const result = await db
          .update(courses)
          .set({
            instructorId: instructorId,
            updatedAt: new Date()
          })
          .where(eq(courses.title, courseTitle))
          .returning();
          
        if (result.length > 0) {
          console.log(`✅ Updated course "${courseTitle}" -> ${instructorName}`);
        } else {
          console.log(`⚠️  Course not found: "${courseTitle}"`);
        }
      }
    }
    
    console.log("\n🎉 Database update complete!");
    
    // Final verification
    console.log("\n🔍 Final verification:");
    const finalCourses = await db
      .select({
        title: courses.title,
        instructor: users.name,
        avatar: users.avatarUrl
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id));
      
    finalCourses.forEach(course => {
      console.log(`  - ${course.title} -> ${course.instructor || 'No instructor'}`);
    });
    
  } catch (error) {
    console.error("❌ Error updating database:", error);
  }
  
  process.exit(0);
}

main();