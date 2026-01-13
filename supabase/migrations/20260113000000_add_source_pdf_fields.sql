-- Add source PDF fields to products table
-- These fields store the original TDS document that was used to create the product specs

ALTER TABLE products
ADD COLUMN source_pdf_path TEXT,
ADD COLUMN source_pdf_filename TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.source_pdf_path IS 'Path to the source PDF file in Supabase Storage (spec-sheets bucket)';
COMMENT ON COLUMN products.source_pdf_filename IS 'Original filename of the uploaded PDF (auto-generated: {mill}_{product}_{timestamp}.pdf)';
