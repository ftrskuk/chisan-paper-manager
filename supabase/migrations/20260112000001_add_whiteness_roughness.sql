ALTER TABLE product_specs
  ADD COLUMN whiteness FLOAT CHECK (whiteness >= 0),
  ADD COLUMN roughness FLOAT CHECK (roughness >= 0);
