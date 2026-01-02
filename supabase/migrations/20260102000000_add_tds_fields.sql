-- Add TDS (Technical Data Sheet) specific fields to product_specs
-- These fields are commonly found in paper industry specifications

-- Core spec fields for TDS uploads
ALTER TABLE product_specs 
  ADD COLUMN smoothness FLOAT,
  ADD COLUMN smoothness_unit TEXT DEFAULT 'sec' CHECK (smoothness_unit IN ('sec', 'ml/min', 'µm')),
  ADD COLUMN stiffness_md FLOAT,
  ADD COLUMN stiffness_cd FLOAT,
  ADD COLUMN brightness FLOAT CHECK (brightness >= 0 AND brightness <= 100),
  ADD COLUMN cobb_60 FLOAT,
  ADD COLUMN density FLOAT,
  ADD COLUMN opacity FLOAT CHECK (opacity >= 0 AND opacity <= 100),
  ADD COLUMN moisture FLOAT CHECK (moisture >= 0 AND moisture <= 100);

-- Add comment for documentation
COMMENT ON COLUMN product_specs.smoothness IS 'Smoothness value. Unit in smoothness_unit column. Bekk: sec (higher=smoother), Bendtsen: ml/min (lower=smoother), PPS: µm (lower=smoother)';
COMMENT ON COLUMN product_specs.smoothness_unit IS 'Smoothness measurement unit: sec (Bekk), ml/min (Bendtsen), µm (PPS)';
COMMENT ON COLUMN product_specs.stiffness_md IS 'Taber stiffness in machine direction (mN·m)';
COMMENT ON COLUMN product_specs.stiffness_cd IS 'Taber stiffness in cross direction (mN·m)';
COMMENT ON COLUMN product_specs.brightness IS 'ISO brightness percentage (0-100%)';
COMMENT ON COLUMN product_specs.cobb_60 IS 'Cobb 60 water absorption (g/m²)';
COMMENT ON COLUMN product_specs.density IS 'Paper density (g/cm³)';
COMMENT ON COLUMN product_specs.opacity IS 'Opacity percentage (0-100%)';
COMMENT ON COLUMN product_specs.moisture IS 'Moisture content percentage (0-100%)';

-- Indexes for frequently filtered fields
CREATE INDEX idx_specs_brightness ON product_specs(brightness) WHERE brightness IS NOT NULL;
CREATE INDEX idx_specs_cobb ON product_specs(cobb_60) WHERE cobb_60 IS NOT NULL;
CREATE INDEX idx_specs_smoothness ON product_specs(smoothness) WHERE smoothness IS NOT NULL;
