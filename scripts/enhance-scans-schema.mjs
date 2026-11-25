import { Client } from 'pg';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = 'postgres://postgres.eyzgtnahyzgotyqxgwhm:YmdsftXNPLP5Wv8q@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

async function enhanceSchema() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query(`
    ALTER TABLE public.body_scans
      ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2),
      ADD COLUMN IF NOT EXISTS reported_bmi NUMERIC(4,1),
      ADD COLUMN IF NOT EXISTS calculated_bmi NUMERIC(4,1),
      ADD COLUMN IF NOT EXISTS file_type TEXT,
      ADD COLUMN IF NOT EXISTS raw_extracted_json JSONB,
      ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'verified';
  `);

  console.log('✅ body_scans table enhanced with validation & audit columns!');
  await client.end();
}

enhanceSchema().catch(console.error);
