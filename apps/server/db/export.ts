import 'dotenv/config';
import { db, users, courses, lessons, enrollments, lessonProgress, reviews, categories, certificates } from './index';
import * as fs from 'fs';
import * as path from 'path';

async function exportDatabase() {
  console.log('Starting database export...');
  
  try {
    // Create export directory
    const exportDir = path.join(process.cwd(), 'db', 'exports');
    fs.mkdirSync(exportDir, { recursive: true });
    
    // Export tables in order (respecting foreign key dependencies)
    console.log('Exporting users...');
    const usersData = await db.select().from(users);
    fs.writeFileSync(path.join(exportDir, 'users.json'), JSON.stringify(usersData, null, 2));
    
    console.log('Exporting categories...');
    const categoriesData = await db.select().from(categories);
    fs.writeFileSync(path.join(exportDir, 'categories.json'), JSON.stringify(categoriesData, null, 2));
    
    console.log('Exporting courses...');
    const coursesData = await db.select().from(courses);
    fs.writeFileSync(path.join(exportDir, 'courses.json'), JSON.stringify(coursesData, null, 2));
    
    console.log('Exporting lessons...');
    const lessonsData = await db.select().from(lessons);
    fs.writeFileSync(path.join(exportDir, 'lessons.json'), JSON.stringify(lessonsData, null, 2));
    
    console.log('Exporting enrollments...');
    const enrollmentsData = await db.select().from(enrollments);
    fs.writeFileSync(path.join(exportDir, 'enrollments.json'), JSON.stringify(enrollmentsData, null, 2));
    
    console.log('Exporting lesson progress...');
    const lessonProgressData = await db.select().from(lessonProgress);
    fs.writeFileSync(path.join(exportDir, 'lesson_progress.json'), JSON.stringify(lessonProgressData, null, 2));
    
    console.log('Exporting reviews...');
    const reviewsData = await db.select().from(reviews);
    fs.writeFileSync(path.join(exportDir, 'reviews.json'), JSON.stringify(reviewsData, null, 2));
    
    console.log('Exporting certificates...');
    const certificatesData = await db.select().from(certificates);
    fs.writeFileSync(path.join(exportDir, 'certificates.json'), JSON.stringify(certificatesData, null, 2));
    
    // Create metadata file
    const metadata = {
      exportDate: new Date().toISOString(),
      tables: {
        users: usersData.length,
        categories: categoriesData.length,
        courses: coursesData.length,
        lessons: lessonsData.length,
        enrollments: enrollmentsData.length,
        lessonProgress: lessonProgressData.length,
        reviews: reviewsData.length,
        certificates: certificatesData.length
      }
    };
    
    fs.writeFileSync(path.join(exportDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
    
    console.log('✅ Database export completed successfully!');
    console.log(`📁 Export location: ${exportDir}`);
    console.log('📊 Export summary:');
    Object.entries(metadata.tables).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during export:', error);
    process.exit(1);
  }
}

exportDatabase();