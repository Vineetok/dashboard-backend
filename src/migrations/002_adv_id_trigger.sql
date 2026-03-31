-- Add a sequence for incremental number tracking
CREATE SEQUENCE IF NOT EXISTS adv_id_seq START 2619;

-- Add ADV_ID column if not already present
ALTER TABLE tbl_registeredusers ADD COLUMN IF NOT EXISTS adv_id VARCHAR(20) UNIQUE;

-- Create trigger function to auto-generate ADV_ID
CREATE OR REPLACE FUNCTION generate_adv_id()
RETURNS TRIGGER AS $$
DECLARE
    next_num INT;   
BEGIN
    IF NEW.adv_id IS NULL THEN
        next_num := nextval('adv_id_seq');
        NEW.adv_id := 'ADV_' || LPAD(next_num::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call function before insert
DROP TRIGGER IF EXISTS adv_id_trigger ON tbl_registeredusers;
CREATE TRIGGER adv_id_trigger
BEFORE INSERT ON tbl_registeredusers
FOR EACH ROW
EXECUTE FUNCTION generate_adv_id();

-- Use this query when sequence is mismatched
-- ALTER SEQUENCE adv_id_seq RESTART WITH 2696;
-- ALTER SEQUENCE public.tbl_registeredusers_id_seq RESTART WITH 2723;

-- ================= LIVE CHANGES (2026-02-12) =================

-- 🔹 Drop existing unique constraint (if any)
ALTER TABLE tbl_registeredusers
DROP CONSTRAINT IF EXISTS tbl_registeredusers_adv_id_key;


-- 🔹 Ensure adv_id is NOT NULL (remove default 'NA')
ALTER TABLE tbl_registeredusers
ALTER COLUMN adv_id DROP DEFAULT,
ALTER COLUMN adv_id SET NOT NULL;


-- 🔹 Create sequences (if not exists)
CREATE SEQUENCE IF NOT EXISTS cus_id_seq START 1;


-- 🔹 Create / Replace Function
CREATE OR REPLACE FUNCTION generate_adv_id()
RETURNS TRIGGER AS $$
DECLARE
    next_num INT;
BEGIN
    IF NEW.role = 'DSA' AND (NEW.adv_id IS NULL OR NEW.adv_id = 'NA') THEN
        next_num := nextval('adv_id_seq');
        NEW.adv_id := 'ADV_' || LPAD(next_num::TEXT, 4, '0');

    ELSIF NEW.role = 'CUSTOMER' AND (NEW.adv_id IS NULL OR NEW.adv_id = 'NA') THEN
        next_num := nextval('cus_id_seq');
        NEW.adv_id := 'CUS_' || LPAD(next_num::TEXT, 4, '0');

    ELSE
        NEW.adv_id := 'NA';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 🔹 Recreate Trigger
DROP TRIGGER IF EXISTS adv_id_trigger ON tbl_registeredusers;

CREATE TRIGGER adv_id_trigger
BEFORE INSERT ON tbl_registeredusers
FOR EACH ROW
EXECUTE FUNCTION generate_adv_id();
