import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDBConnection() {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // List existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Existing tables:');
    if (tablesResult.rows.length === 0) {
      console.log('No tables found');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    // Release the client back to the pool
    client.release();
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
  } finally {
    // End the pool
    await pool.end();
  }
}

testDBConnection();