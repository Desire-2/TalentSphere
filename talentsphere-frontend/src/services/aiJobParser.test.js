// Test the AI Job Parser Service
// Run this in browser console or create a test file

import { parseJobWithAI } from './src/services/aiJobParser';

// Sample job posting for testing
const sampleJobPosting = `
Senior Full Stack Developer
TechFlow Solutions · San Francisco, CA (Hybrid)
$140,000 - $180,000/year · Full-time

About TechFlow Solutions
We're a rapidly growing fintech startup revolutionizing digital payments. Our platform processes over $2B in transactions annually.

The Role
We're seeking an experienced Full Stack Developer to join our engineering team. You'll work on building scalable microservices and modern web applications that power our payment infrastructure.

Key Responsibilities
• Design and develop high-performance web applications using React and Node.js
• Build and maintain RESTful APIs and microservices architecture
• Collaborate with product managers and designers to deliver exceptional user experiences
• Write clean, maintainable, and well-tested code
• Participate in code reviews and mentor junior developers

Required Qualifications
• 5+ years of professional software development experience
• Strong proficiency in JavaScript/TypeScript, React, Node.js
• Experience with PostgreSQL, Redis, and MongoDB
• Solid understanding of RESTful APIs and microservices
• Bachelor's degree in Computer Science or related field

Preferred Skills
• Experience with AWS, Docker, and Kubernetes
• Knowledge of GraphQL and WebSockets
• Familiarity with CI/CD pipelines
• Previous fintech or payments industry experience

What We Offer
• Competitive salary and equity package
• Comprehensive health, dental, and vision insurance
• Flexible PTO and remote work options
• Professional development budget ($5,000/year)
• Latest MacBook Pro and equipment
• Catered lunches and snacks

How to Apply
Visit https://techflow.com/careers/senior-fullstack or email jobs@techflow.com with your resume and portfolio.
`;

// Test the parser
async function testAIParser() {
  console.log('🧪 Testing AI Job Parser...\n');
  
  try {
    console.log('📝 Input:\n', sampleJobPosting.substring(0, 200) + '...\n');
    
    console.log('🤖 Sending to AI for parsing...');
    const result = await parseJobWithAI(sampleJobPosting);
    
    console.log('✅ Success! Parsed data:\n');
    console.log(JSON.stringify(result, null, 2));
    
    // Validate key fields
    console.log('\n📊 Validation:');
    console.log('✓ Title:', result.title);
    console.log('✓ Company:', result.external_company_name);
    console.log('✓ Location:', `${result.location_city}, ${result.location_type}`);
    console.log('✓ Salary:', `${result.salary_currency} ${result.salary_min} - ${result.salary_max}`);
    console.log('✓ Employment:', result.employment_type);
    console.log('✓ Experience:', result.experience_level);
    console.log('✓ Skills:', result.required_skills.substring(0, 50) + '...');
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    return null;
  }
}

// Expected output structure
const expectedOutput = {
  title: "Senior Full Stack Developer",
  summary: "Join TechFlow Solutions as a Senior Full Stack Developer...",
  description: "## About TechFlow Solutions\n\nWe're a rapidly growing...",
  external_company_name: "TechFlow Solutions",
  external_company_website: "https://techflow.com",
  employment_type: "full-time",
  experience_level: "senior",
  location_type: "hybrid",
  location_city: "San Francisco",
  location_state: "CA",
  location_country: "USA",
  salary_min: 140000,
  salary_max: 180000,
  salary_currency: "USD",
  salary_period: "yearly",
  required_skills: "JavaScript, TypeScript, React, Node.js, PostgreSQL, Redis, MongoDB, RESTful APIs, Microservices",
  preferred_skills: "AWS, Docker, Kubernetes, GraphQL, WebSockets, CI/CD",
  years_experience_min: 5,
  education_requirement: "Bachelor's degree in Computer Science or related field",
  application_type: "external",
  application_url: "https://techflow.com/careers/senior-fullstack",
  application_email: "jobs@techflow.com"
};

console.log('Expected fields to be extracted:', Object.keys(expectedOutput));

// Run the test (uncomment to execute)
// testAIParser();

export { testAIParser, sampleJobPosting, expectedOutput };
