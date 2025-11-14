import dotenv from 'dotenv';
import sequelize from '../src/config/database';
import User from '../src/models/User';
import EntryLog from '../src/models/EntryLog';
import { testConnection } from '../src/config/database';

dotenv.config();

const seedUsers = async () => {
  try {
    console.log('Starting user seeder...');

    await testConnection();
    await sequelize.sync();

    // Check if users already exist
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('⚠️  Users already exist! Skipping seeding.');
      process.exit(0);
    }

    // Create sample students
    const students = await User.bulkCreate([
      {
        idNumber: '2021-0001',
        rfidTag: 'RFID001',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        email: 'juan.delacruz@ustp.edu.ph',
        userType: 'student',
        college: 'CCS',
        department: 'Computer Science',
        yearLevel: '4',
        status: 'active',
      },
      {
        idNumber: '2021-0002',
        rfidTag: 'RFID002',
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria.santos@ustp.edu.ph',
        userType: 'student',
        college: 'COE',
        department: 'Civil Engineering',
        yearLevel: '3',
        status: 'active',
      },
      {
        idNumber: '2022-0001',
        rfidTag: 'RFID003',
        firstName: 'Pedro',
        lastName: 'Reyes',
        email: 'pedro.reyes@ustp.edu.ph',
        userType: 'student',
        college: 'CCS',
        department: 'Information Technology',
        yearLevel: '2',
        status: 'active',
      },
    ]);

    // Create sample faculty
    const faculty = await User.bulkCreate([
      {
        idNumber: 'FAC-001',
        rfidTag: 'RFID_FAC001',
        firstName: 'Dr. Ana',
        lastName: 'Garcia',
        email: 'ana.garcia@ustp.edu.ph',
        userType: 'faculty',
        college: 'CCS',
        department: 'Computer Science',
        yearLevel: null,
        status: 'active',
      },
      {
        idNumber: 'FAC-002',
        rfidTag: 'RFID_FAC002',
        firstName: 'Engr. Carlos',
        lastName: 'Mendoza',
        email: 'carlos.mendoza@ustp.edu.ph',
        userType: 'faculty',
        college: 'COE',
        department: 'Civil Engineering',
        yearLevel: null,
        status: 'active',
      },
    ]);

    console.log(`✅ Created ${students.length} students`);
    console.log(`✅ Created ${faculty.length} faculty members`);

    // Create sample entry logs
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await EntryLog.bulkCreate([
      {
        userId: students[0].userId,
        entryTimestamp: new Date(today.setHours(8, 30, 0)),
        entryMethod: 'rfid',
        status: 'success',
      },
      {
        userId: students[1].userId,
        entryTimestamp: new Date(today.setHours(9, 15, 0)),
        entryMethod: 'rfid',
        status: 'success',
      },
      {
        userId: students[2].userId,
        entryTimestamp: new Date(today.setHours(10, 0, 0)),
        entryMethod: 'manual',
        status: 'success',
      },
      {
        userId: faculty[0].userId,
        entryTimestamp: new Date(today.setHours(7, 45, 0)),
        entryMethod: 'rfid',
        status: 'success',
      },
      {
        userId: students[0].userId,
        entryTimestamp: new Date(yesterday.setHours(14, 20, 0)),
        entryMethod: 'rfid',
        status: 'success',
      },
    ]);

    console.log('Created sample entry logs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Sample Data Created:');
    console.log('   - 3 Students');
    console.log('   - 2 Faculty Members');
    console.log('   - 5 Entry Logs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error);
    process.exit(1);
  }
};

seedUsers();