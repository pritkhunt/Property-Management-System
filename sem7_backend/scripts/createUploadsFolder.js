const fs = require('fs');
const path = require('path');

console.log('📁 CREATING UPLOADS FOLDER STRUCTURE');
console.log('═'.repeat(60));

// Define upload directories
const uploadDir = path.join(__dirname, '../uploads');
const profilePicsDir = path.join(uploadDir, 'profile-pictures');
const agentDocsDir = path.join(uploadDir, 'agent-documents');
const propertyImagesDir = path.join(uploadDir, 'property-images');

// Create directories
const directories = [
  { path: uploadDir, name: 'uploads' },
  { path: profilePicsDir, name: 'uploads/profile-pictures' },
  { path: agentDocsDir, name: 'uploads/agent-documents' },
  { path: propertyImagesDir, name: 'uploads/property-images' }
];

let created = 0;
let existing = 0;

directories.forEach(dir => {
  if (!fs.existsSync(dir.path)) {
    fs.mkdirSync(dir.path, { recursive: true });
    console.log(`✅ Created: ${dir.name}`);
    created++;
  } else {
    console.log(`⏭️  Already exists: ${dir.name}`);
    existing++;
  }
});

console.log('\n' + '═'.repeat(60));
console.log(`📊 Summary: ${created} created, ${existing} already existed`);
console.log('✅ Uploads folder structure is ready!');
console.log('\n📁 Location: sem7_backend/uploads/');
console.log('   ├── profile-pictures/   (for user/agent/admin avatars)');
console.log('   ├── agent-documents/    (for agent registration docs)');
console.log('   └── property-images/    (for property photos)');
console.log('');
