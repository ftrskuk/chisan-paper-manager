-- Change gsm column from INTEGER to FLOAT to support decimal values
-- This allows TDS uploads to include values like 81.4 gsm

-- Drop the old CHECK constraint and alter column type
ALTER TABLE product_specs
  ALTER COLUMN gsm TYPE FLOAT USING gsm::FLOAT;

-- Re-add the CHECK constraint for FLOAT
ALTER TABLE product_specs
  DROP CONSTRAINT IF EXISTS product_specs_gsm_check;

ALTER TABLE product_specs
  ADD CONSTRAINT product_specs_gsm_check CHECK (gsm > 0);
