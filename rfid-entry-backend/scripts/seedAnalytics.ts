import dotenv from 'dotenv';
import sequelize from '../src/config/database';
import User from '../src/models/User';
import EntryLog from '../src/models/EntryLog';

dotenv.config();

console.log('DEBUG - Database Config:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'EMPTY');
console.log('---');

// Your data arrays
const colleges = [
  'College of Engineering and Architecture',
  'College of Science and Mathematics',
  'College of Information Technology and Computing',
  'College of Technology',
  'College of Education'
];

const departments: { [key: string]: string[] } = {
  'College of Engineering and Architecture': [
    'Civil Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Architecture'
  ],
  'College of Science and Mathematics': [
    'Biology',
    'Chemistry',
    'Physics',
    'Mathematics'
  ],
  'College of Information Technology and Computing': [
    'Computer Science',
    'Information Technology',
    'Technology Communication Management'
  ],
  'College of Technology': [
    'Automotive Technology',
    'Electronics Technology',
    'Food Technology'
  ],
  'College of Education': [
    'Elementary Education',
    'Secondary Education',
    'Special Education'
  ]
};

const firstNames = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Sofia', 'Miguel', 'Isabella',
  'Carlos', 'Gabriela', 'Luis', 'Valentina', 'Jorge', 'Camila', 'Ricardo',
  'Lucia', 'Fernando', 'Elena', 'Roberto', 'Carmen', 'Diego', 'Rosa',
  'Manuel', 'Patricia', 'Antonio', 'Teresa', 'Francisco', 'Laura'
];

const lastNames = [
  'Garcia', 'Cruz', 'Reyes', 'Santos', 'Ramos', 'Flores', 'Torres', 'Gonzalez',
  'Rodriguez', 'Lopez', 'Martinez', 'Hernandez', 'Perez', 'Sanchez', 'Rivera',
  'Diaz', 'Morales', 'Jimenez', 'Alvarez', 'Castillo', 'Mendoza', 'Aquino'
];

const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

// Helper function to generate random date within last N days
const getRandomDate = (daysBack: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 14) + 7);
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(Math.floor(Math.random() * 60));
  return date;
};

// Generate random RFID tag
const generateRFID = (): string => {
  return `RFID${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
};

const seedAnalytics = async (): Promise<void> => {
  try {
    console.log('Starting analytics seeder...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');

    // Sync models to ensure tables exist
    console.log('Syncing database models...');
    await sequelize.sync();
    console.log('✓ Models synced successfully.');

    // Check if data already exists
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('⚠️  Warning: User data already exists!');
      console.log(`Found ${existingUsers} existing users.`);
      console.log('To clear and reseed, run: npm run db:reset');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        readline.question('Continue and add more data? (y/N): ', resolve);
      });
      
      readline.close();

      if (answer.toLowerCase() !== 'y') {
        console.log('Seeding cancelled.');
        process.exit(0);
      }
    }

    console.log('Creating users...');
    const users: User[] = [];

    // Create 100 users
    for (let i = 0; i < 100; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const college = colleges[Math.floor(Math.random() * colleges.length)];
      const department = departments[college][Math.floor(Math.random() * departments[college].length)];
      const yearLevel = yearLevels[Math.floor(Math.random() * yearLevels.length)];
      
      const idNumber = `2023-${String(i + 1 + existingUsers).padStart(5, '0')}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + existingUsers}@ustp.edu.ph`;
      const rfidTag = generateRFID();

      try {
        const user = await User.create({
          idNumber: idNumber,
          rfidTag: rfidTag,
          firstName: firstName,
          lastName: lastName,
          email: email,
          userType: 'student',
          college: college,
          department: department,
          yearLevel: yearLevel,
          status: 'active'
        });

        users.push(user);

        if ((i + 1) % 20 === 0) {
          console.log(`  Created ${i + 1}/100 users...`);
        }
      } catch (error: any) {
        console.error(`Error creating user ${idNumber}:`, error.message);
      }
    }

    console.log(`✓ Created ${users.length} users`);

    console.log('Creating entry logs...');
    let entriesCreated = 0;

    // Create entries for the last 90 days
    for (const user of users) {
      // Each user has 5-20 random entries
      const numEntries = Math.floor(Math.random() * 16) + 5;
      
      for (let i = 0; i < numEntries; i++) {
        const timestamp = getRandomDate(90);
        const entryMethod = Math.random() > 0.7 ? 'manual' : 'rfid';

        await EntryLog.create({
          userId: user.userId,
          entryTimestamp: timestamp,
          entryMethod: entryMethod,
          status: 'success'
        });

        entriesCreated++;
      }

      if (users.indexOf(user) % 20 === 0) {
        console.log(`  Created entries for ${users.indexOf(user)}/100 users...`);
      }
    }

    console.log(`✓ Created ${entriesCreated} entry logs`);

    // Create some entries for today
    console.log('Creating today\'s entries...');
    const todayEntries = 15;
    for (let i = 0; i < todayEntries; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const now = new Date();
      now.setHours(Math.floor(Math.random() * 6) + 8);
      now.setMinutes(Math.floor(Math.random() * 60));

      await EntryLog.create({
        userId: randomUser.userId,
        entryTimestamp: now,
        entryMethod: Math.random() > 0.7 ? 'manual' : 'rfid',
        status: 'success'
      });
    }

    console.log(`✓ Created ${todayEntries} entries for today`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Analytics Data Seeded Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Users Created: ${users.length}`);
    console.log(`Total Entry Logs Created: ${entriesCreated + todayEntries}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Seeder error:', error);
    throw error;
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

// Execute the seeder
seedAnalytics().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});