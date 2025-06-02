#!/usr/bin/env bun
// Test script to verify API throws errors without database

async function testAPIErrors() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testing API error handling...');
  
  try {
    // Test courses endpoint
    console.log('\n📚 Testing /courses endpoint...');
    const coursesResponse = await fetch(`${baseUrl}/courses`);
    
    if (coursesResponse.ok) {
      const courses = await coursesResponse.json();
      console.log(`✅ Courses endpoint working: ${courses.length} courses found`);
    } else {
      console.log(`❌ Courses endpoint failed: ${coursesResponse.status} ${coursesResponse.statusText}`);
    }
    
    // Test categories endpoint
    console.log('\n📂 Testing /courses/categories endpoint...');
    const categoriesResponse = await fetch(`${baseUrl}/courses/categories`);
    
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log(`✅ Categories endpoint working: ${categories.length} categories found`);
    } else {
      console.log(`❌ Categories endpoint failed: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
    }
    
    // Test single course endpoint
    console.log('\n📖 Testing /courses/:id endpoint...');
    const courseResponse = await fetch(`${baseUrl}/courses/1`);
    
    if (courseResponse.ok) {
      const course = await courseResponse.json();
      console.log(`✅ Single course endpoint working: ${course.title}`);
    } else {
      console.log(`❌ Single course endpoint failed: ${courseResponse.status} ${courseResponse.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testAPIErrors();