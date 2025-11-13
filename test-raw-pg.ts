import { Client } from 'pg';

async function test() {
  console.log('Testing RAW pg connection...');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'lens_system',
    user: 'postgres',
    password: 'USTPeLib2025', // HARDCODED
  });

  try {
    console.log('Connecting...');
    await client.connect();
    console.log('✅ CONNECTED!');
    
    const result = await client.query('SELECT version()');
    console.log('Version:', result.rows[0].version);
    
    await client.end();
    console.log('✅ SUCCESS!');
  } catch (error: any) {
    console.error('❌ FAILED:', error.message);
    console.error('Code:', error.code);
  }
}

test();