CREATE SEQUENCE IF NOT EXISTS ref_id_seq START 1;


ALTER TABLE tbl_referral_leads
ADD COLUMN IF NOT EXISTS ref_id VARCHAR(20) UNIQUE;

CREATE OR REPLACE FUNCTION generate_ref_id()
RETURNS TRIGGER AS $$
DECLARE
    next_num INT;
BEGIN
    IF NEW.ref_id IS NULL THEN
        next_num := nextval('ref_id_seq');
        NEW.ref_id := 'REF_' || LPAD(next_num::TEXT, 4, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS ref_id_trigger ON tbl_referral_leads;

CREATE TRIGGER ref_id_trigger
BEFORE INSERT ON tbl_referral_leads
FOR EACH ROW
EXECUTE FUNCTION generate_ref_id();

-- ALTER SEQUENCE ref_id_seq RESTART WITH 1;
-- ALTER SEQUENCE public.tbl_referral_leads_id_seq RESTART WITH 10;