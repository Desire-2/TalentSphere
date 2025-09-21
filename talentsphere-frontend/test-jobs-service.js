// Test file to verify jobs service import works
import jobsService from './src/services/jobs.js';

console.log('✅ Jobs service imported successfully:', jobsService);
console.log('📋 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(jobsService)));

// Test that the service has the expected methods
const expectedMethods = [
  'getJobs', 'getJob', 'createJob', 'updateJob', 'deleteJob',
  'getJobCategories', 'bookmarkJob', 'searchJobs'
];

const missingMethods = expectedMethods.filter(method => 
  typeof jobsService[method] !== 'function'
);

if (missingMethods.length === 0) {
  console.log('✅ All expected methods are available in jobs service');
} else {
  console.log('❌ Missing methods:', missingMethods);
}

export default true;