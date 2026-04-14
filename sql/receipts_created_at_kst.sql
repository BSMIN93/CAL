-- receipts.created_at: Korea (Asia/Seoul) wall clock, fractional seconds 2 digits (timestamp(2))
-- Run in Supabase SQL Editor

ALTER TABLE receipts
  ALTER COLUMN created_at TYPE timestamp(2)
  USING (timezone('Asia/Seoul', created_at)::timestamp(2));

ALTER TABLE receipts
  ALTER COLUMN created_at SET DEFAULT (
    timezone('Asia/Seoul', clock_timestamp())::timestamp(2)
  );
