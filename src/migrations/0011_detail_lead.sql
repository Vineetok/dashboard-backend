CREATE TABLE
    tbl_detail_leads (
        id SERIAL PRIMARY KEY,
        detail_lead_id VARCHAR(30) UNIQUE,
        dsa_id INT,
        rm_id INT, -- referral RM
        assigned_rm_id INT, -- working RM
        department_head_id INT,
        department VARCHAR(100),
        sub_category VARCHAR(200),
        lead_name VARCHAR(150),
        contact_number VARCHAR(15),
        email VARCHAR(255),
        status VARCHAR(30), -- INCOMING_LEAD, MY_DETAIL_LEAD
        is_self_login BOOLEAN DEFAULT false,
        form_data JSONB NOT NULL,
        product_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lead_status VARCHAR(30) DEFAULT 'NEW',
        rm_acceptance_status VARCHAR(30) DEFAULT 'PENDING',
        first_assigned_rm_id INT,
        previous_rm_id INT,
        rm_assigned_at TIMESTAMP,
        rm_accepted_at TIMESTAMP,
        rm_action_deadline TIMESTAMP,
        disbursement_amount NUMERIC(15, 4),
        gross_payout_amount NUMERIC(15, 4),
        gst_amount NUMERIC(15, 4),
        tds_amount NUMERIC(15, 4),
        net_payout_amount NUMERIC(15, 4),
        payout_date TIMESTAMP,
        payout_id VARCHAR(50),
        payment_mode VARCHAR(50),
        transaction_reference_no VARCHAR(100),
        invoice_number VARCHAR(100),
        invoice_date TIMESTAMP,
        policy_number VARCHAR(100);
    );
    
-- ALTER SEQUENCE public.tbl_detail_leads_id_seq RESTART WITH 14;
CREATE TABLE
    tbl_detail_lead_documents (
        id SERIAL PRIMARY KEY,
        detail_lead_id INT REFERENCES tbl_detail_leads (id),
        document_key VARCHAR(50) NOT NULL,
        document_label VARCHAR(100),
        file_url TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    tbl_detail_lead_required_documents (
        id SERIAL PRIMARY KEY,
        detail_lead_db_id INT NOT NULL REFERENCES tbl_detail_leads (id) ON DELETE CASCADE,
        document_key VARCHAR(50) NOT NULL,
        document_label VARCHAR(150) NOT NULL,
        is_mandatory BOOLEAN DEFAULT true,
        uploaded BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (detail_lead_db_id, document_key)
    );

CREATE TABLE
    tbl_detail_lead_document_rules (
        id SERIAL PRIMARY KEY,
        department VARCHAR(100) NOT NULL,
        product_type VARCHAR(100) NOT NULL,
        sub_category VARCHAR(200) NOT NULL,
        document_key VARCHAR(50) NOT NULL,
        document_label VARCHAR(150) NOT NULL,
        is_mandatory BOOLEAN DEFAULT true,
        conditions JSONB NOT NULL,
        UNIQUE (
            department,
            product_type,
            sub_category,
            document_key
        )
    );


CREATE INDEX idx_detail_leads_form_data ON tbl_detail_leads USING GIN (form_data);

CREATE INDEX idx_docs_lead ON tbl_detail_lead_documents (detail_lead_id);

---------------------------------------------------------------------------------------
-- RULES OF DOCUMENTS FOR HOME LOAN - BASED ON EMPLOYMENT TYPE AND OTHER CONDITIONS
-- ✅ 1️⃣ COMMON DOCUMENTS (Shared Across Employment Types)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Home Loan','Home Loan','AADHAAR','Aadhaar Card',true,'{"is_self_login": false,"employmentType":["Salaried Person","Self Employed"],"otherIncome": ["Pension"]}');

UPDATE tbl_detail_lead_document_rules
SET conditions = '{
  "is_self_login": [false],
  "employmentType": ["Salaried Person", "Self Employed","Other"],
  "otherIncome": ["Pension"]
}'
WHERE id = 11;

-- 🔹 PAN Card (shared)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Home Loan','Home Loan','PAN','Pan Card',true,'{"is_self_login": false,"employmentType":["Salaried Person","Self Employed"] ,"otherIncome": ["Pension"]}');

UPDATE tbl_detail_lead_document_rules
SET conditions = '{
  "is_self_login": [false],
  "employmentType": ["Salaried Person", "Self Employed","Other"],
  "otherIncome": ["Pension"]
}'
WHERE id = 12;


INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Home Loan','Home Loan','PHOTOGRAPH','Photograph',true,'{"employmentType":["Salaried Person","Self Employed"]}');

INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)

VALUES
('Loan','Home Loan','Home Loan','ADDRESS_PROOF','Address Proof',true,'{"employmentType":["Salaried Person","Self Employed"]}');

INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Loan',
  'Home Loan',
  'Home Loan',
  'COST_SHEET',
  'Property Cost Sheet / Index II',
  true,
  '{"employmentType":["Salaried Person","Self Employed"]}'
);

INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Loan',
  'Home Loan',
  'Home Loan',
  'CONTRIBUTION_PROOF',
  'Own Contribution Proof',
  true,
  '{"employmentType":["Salaried Person","Self Employed"]}'
);

-- ✅ 2️⃣ SALARIED-ONLY DOCUMENTS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Home Loan','Home Loan','SALARY_SLIP','3 Months Salary Slip',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Home Loan','Home Loan','FORM16','2 Years Form 16',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Home Loan','Home Loan','BANK_STATEMENT','6 Months Banking Statement',true,'{"employmentType":["Salaried Person"]}');

-- ✅ 3️⃣ SELF-EMPLOYED-ONLY DOCUMENTS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Home Loan','Home Loan','UDYAM','Udyam Registration',true,'{"employmentType":["Self Employed"]}'),
('Loan','Home Loan','Home Loan','SHOP_ACT','Shop Act Licence',true,'{"employmentType":["Self Employed"]}'),
('Loan','Home Loan','Home Loan','CURRENT_BANK_STMT','1 Current Banking Statement',true,'{"employmentType":["Self Employed"]}'),
('Loan','Home Loan','Home Loan','SAVING_BANK_STMT','Saving Bank Account',true,'{"employmentType":["Self Employed"]}'),
('Loan','Home Loan','Home Loan','ITR','3 Years ITR',true,'{"employmentType":["Self Employed"]}'),
('Loan','Home Loan','Home Loan','GST_CERTIFICATE','GST Certificate',true,'{"employmentType":["Self Employed"]}'),
('Loan','Home Loan','Home Loan','GST_RETURNS','Last 12 Months GST Returns',true,'{"employmentType":["Self Employed"]}');


-- ✅ 4️⃣ OTHER → PENSION DOCUMENTS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Home Loan','Home Loan','PPO','PPO (Pension Payment Order)',true,'{"employmentType":["Other"],"otherIncome":["Pension"]}'),
('Loan','Home Loan','Home Loan','PENSION_STMT','1 Year Pension Credit Statement',true,'{"employmentType":["Other"],"otherIncome":["Pension"]}');

-- ✅ 5️⃣ OTHER → RENTAL INCOME DOCUMENTS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Home Loan','Home Loan','RENT_AGREEMENT','Rent Agreement',true,'{"employmentType":["Other"],"otherIncome":["Rental"]}'),
('Loan','Home Loan','Home Loan','RENT_STMT','1 Year Rent Credit Statement',true,'{"employmentType":["Other"],"otherIncome":["Rental"]}');

--✅ 6️⃣ ADDITIVE RULE (ONLY ONCE)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Home Loan','Home Loan','EXISTING_LOAN','Existing Loan Statement',true,'{"hasOtherLoan":["Yes"]}');

---------------------------------------------------------------------------------------
-- RULES OF DOCUMENTS FOR PERSONAL LOAN - BASED ON EMPLOYMENT TYPE AND OTHER CONDITIONS
-- PERSONAL LOAN – DOCUMENT RULE DESIGN (FINAL)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Personal Loan','Personal Loan','AADHAAR','Aadhaar Card',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Personal Loan','Personal Loan','PAN','Pan Card',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Personal Loan','Personal Loan','SALARY_SLIP','3 Months Salary Slip',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Personal Loan','Personal Loan','FORM16','Form 16',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Personal Loan','Personal Loan','BANK_STATEMENT','6 Months Banking Statement',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Personal Loan','Personal Loan','ADDRESS_PROOF','Address Proof',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Personal Loan','Personal Loan','PHOTOGRAPH','Photograph',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Personal Loan','Personal Loan','COMPANY_ID','Company ID Card',true,'{"employmentType":["Salaried Person"]}');

-- ✅ ADDITIVE DOCUMENT (ONLY IF OTHER LOAN = YES)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Personal Loan','Personal Loan','EXISTING_LOAN','Existing Loan Statement',true,'{"hasOtherLoan":["Yes"]}');

--✅ FRONTEND → BACKEND MAPPING (VERY IMPORTANT)

Your form_data must include:

{
  "employmentType": "Salaried Person",
  "hasOtherLoan": "Yes"
}
---------------------------------------------------------------------------------------
-- RULES OF DOCUMENTS FOR BUSINESS LOAN - BASED ON EMPLOYMENT TYPE AND OTHER CONDITIONS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Business Loan','Business Loan','AADHAAR','Aadhaar Card',true,'{"employmentType":["Business"]}'),
('Loan','Business Loan','Business Loan','PAN','Pan Card',true,'{"employmentType":["Business"]}'),
('Loan','Business Loan','Business Loan','UDYAM','Udyam Aadhar Registration',true,'{"employmentType":["Business"]}'),
('Loan','Business Loan','Business Loan','SHOP_ACT','Shop Act Licence',true,'{"employmentType":["Business"]}'),
('Loan','Business Loan','Business Loan','BANK_STATEMENT','1 Year Banking Statement',true,'{"employmentType":["Business"]}'),
('Loan','Business Loan','Business Loan','ADDRESS_PROOF','Address Proof',true,'{"employmentType":["Business"]}'),
('Loan','Business Loan','Business Loan','ITR','ITR 3 Years',true,'{"employmentType":["Business"]}'),
('Loan','Business Loan','Business Loan','PHOTOGRAPH','Photograph',true,'{"employmentType":["Business"]}');

INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Loan',
  'Business Loan',
  'Business Loan',
  'EXISTING_LOAN',
  'Existing Loan Statement',
  true,
  '{"hasOtherLoan":["Yes"]}'
);

-- your frontend uses:
Your form_data must include:
{
  "employmentType": "Business",
  "hasOtherLoan": "Yes"
}

---------------------------------------------------------------------------------------
-- RULES OF DOCUMENTS FOR MORTGAGE LOAN - BASED ON EMPLOYMENT TYPE AND OTHER CONDITIONS
-- ✅ MORTGAGE LOAN – FINAL DOCUMENT RULES (ONCE & CORRECT)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Mortgage Loan','Mortgage Loan','AADHAAR','Aadhaar Card',true,
 '{"employmentType":["Self Employed","Salaried Person","Other"]}'),

('Loan','Mortgage Loan','Mortgage Loan','PAN','Pan Card',true,
 '{"employmentType":["Self Employed","Salaried Person","Other"]}'),

('Loan','Mortgage Loan','Mortgage Loan','ADDRESS_PROOF','Address Proof',true,
 '{"employmentType":["Self Employed","Salaried Person","Other"]}'),

('Loan','Mortgage Loan','Mortgage Loan','PHOTOGRAPH','Photograph',true,
 '{"employmentType":["Self Employed","Salaried Person","Other"]}'),

('Loan','Mortgage Loan','Mortgage Loan','PROPERTY_COST_SHEET','Property Cost Sheet / Index II',true,
 '{"employmentType":["Self Employed","Salaried Person","Other"]}'),

('Loan','Mortgage Loan','Mortgage Loan','CONTRIBUTION_PROOF','Own Contribution Proof',true,
 '{"employmentType":["Self Employed","Salaried Person","Other"]}');

-- ✅ BANK STATEMENT (MERGED — THIS FIXES YOUR ERROR)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Loan','Mortgage Loan','Mortgage Loan',
  'BANK_STATEMENT','6 Months Bank Statement',true,
  '{"employmentType":["Self Employed","Salaried Person"]}'
);


-- Self Employed Documents
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Mortgage Loan','Mortgage Loan','UDYAM','Udyam Registration',true,'{"employmentType":["Self Employed"]}'),
('Loan','Mortgage Loan','Mortgage Loan','SHOP_ACT','Shop Act Licence',true,'{"employmentType":["Self Employed"]}'),
('Loan','Mortgage Loan','Mortgage Loan','GST_CERTIFICATE','GST Certificate',true,'{"employmentType":["Self Employed"]}'),
('Loan','Mortgage Loan','Mortgage Loan','GST_RETURNS','Last 12 Months GST Returns',true,'{"employmentType":["Self Employed"]}'),
('Loan','Mortgage Loan','Mortgage Loan','ITR','3 Years ITR',true,'{"employmentType":["Self Employed"]}'),
('Loan','Mortgage Loan','Mortgage Loan','SAVING_BANK_STMT','Saving Bank Account',true,'{"employmentType":["Self Employed"]}'),
('Loan','Mortgage Loan','Mortgage Loan','BUSINESS_ADDRESS_PROOF','Business Office Address Proof',true,'{"employmentType":["Self Employed"]}');

-- SALARIED PERSON DOCUMENTS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Mortgage Loan','Mortgage Loan','SALARY_SLIP','3 Months Salary Slip',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Mortgage Loan','Mortgage Loan','FORM16','Form 16',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Mortgage Loan','Mortgage Loan','COMPANY_ID','Company ID Card',true,'{"employmentType":["Salaried Person"]}');

-- PENSION DOCUMENTS (CRITICAL FIX)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Loan','Mortgage Loan','Mortgage Loan',
  'PPO','PPO (Pension Payment Order)',true,
  '{"employmentType":["Other"],"otherIncome":["Pensioner"]}'
),
(
  'Loan','Mortgage Loan','Mortgage Loan',
  'PENSION_STMT','1 Year Pension Credit Statement',true,
  '{"employmentType":["Other"],"otherIncome":["Pensioner"]}'
);


-- OTHER → RENTAL DOCUMENTS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Loan','Mortgage Loan','Mortgage Loan',
  'RENT_AGREEMENT','Rent Agreement',true,
  '{"employmentType":["Other"],"otherIncome":["Rental"]}'
),
(
  'Loan','Mortgage Loan','Mortgage Loan',
  'RENT_STMT','1 Year Rent Credit Statement',true,
  '{"employmentType":["Other"],"otherIncome":["Rental"]}'
);

-- EXISTING LOAN DOCUMENT
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Loan','Mortgage Loan','Mortgage Loan',
  'EXISTING_LOAN','Existing Loan Statement',true,
  '{"employmentType":["Self Employed","Salaried Person","Other"]}'
);


---------------------------------------------------------------------------------------
-- SME LOAN DOCUMENT RULES
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','SME Loan','SME Loan','AADHAAR','Aadhaar Card',true,'{"employmentType":["Self Employed"]}'),
('Loan','SME Loan','SME Loan','PAN','Pan Card',true,'{"employmentType":["Self Employed"]}'),
('Loan','SME Loan','SME Loan','ADDRESS_PROOF','Address Proof (Rent Agreement / Light Bill)',true,'{"employmentType":["Self Employed"]}'),
('Loan','SME Loan','SME Loan','GST_CERTIFICATE','GST Registration Certificate',true,'{"employmentType":["Self Employed"]}'),
('Loan','SME Loan','SME Loan','UDYAM','Udyam Aadhar',true,'{"employmentType":["Self Employed"]}'),
('Loan','SME Loan','SME Loan','SHOP_ACT','Shop Act Licence',true,'{"employmentType":["Self Employed"]}'),
('Loan','SME Loan','SME Loan','BANK_STATEMENT','1 Year Banking Statement',true,'{"employmentType":["Self Employed"]}'),
('Loan','SME Loan','SME Loan','ITR','ITR 3 Years',true,'{"employmentType":["Self Employed"]}'),
('Loan','SME Loan','SME Loan','CONSTITUTION_DOC','Constitution Document (Partnership / MOA)',true,'{"employmentType":["Self Employed"]}'),
('Loan','SME Loan','SME Loan','PHOTOGRAPH','Photograph',true,'{"employmentType":["Self Employed"]}');

-- ADDITIVE DOCUMENT (ONLY IF OTHER LOAN = YES)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','SME Loan','SME Loan','EXISTING_LOAN','Existing Loan Statement',true,'{"hasOtherLoan":["Yes"]}');

-- ⚠️ FRONTEND → BACKEND MUST SEND
Your form_data must include:
{
  "employmentType": "Self Employed",
  "hasOtherLoan": "Yes"
}
---------------------------------------------------------------------------------------
-- ✅ EDUCATION LOAN – DOCUMENT RULES (FINAL & COMPLETE)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Education Loan','Education Loan','STUDENT_AADHAAR','Student Aadhaar Card',true,'{}'),
('Loan','Education Loan','Education Loan','STUDENT_PAN','Student PAN Card',true,'{}'),
('Loan','Education Loan','Education Loan','STUDENT_ID_PROOF','Passport / Driving License',true,'{}'),
('Loan','Education Loan','Education Loan','STUDENT_RESIDENT_PROOF','Resident Proof',true,'{}'),
('Loan','Education Loan','Education Loan','STUDENT_CURRENT_ADDRESS','Current Address Proof',true,'{}'),
('Loan','Education Loan','Education Loan','ACADEMIC_DOCS','Academic Documents',true,'{}'),
('Loan','Education Loan','Education Loan','OFFER_LETTER','Offer Letter',true,'{}'),
('Loan','Education Loan','Education Loan','FEE_STRUCTURE','Fee Structure',true,'{}'),
('Loan','Education Loan','Education Loan','VISA_I20','Visa / I20 (USA)',true,'{}'),
('Loan','Education Loan','Education Loan','ENTRANCE_SCORE','Entrance Exam Score Card',true,'{}');

-- 🧩 PART 2 — EXISTING LOAN (STUDENT, CONDITIONAL)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Education Loan','Education Loan','STUDENT_EXISTING_LOAN','Existing Loan Statement',true,'{"hasOtherLoan":["Yes"]}');

-- ✅ 1️⃣ CO-APPLICANT COMMON DOCUMENTS (ONCE)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Education Loan','Education Loan','CO_AADHAAR','Co-Applicant Aadhaar Card',true,'{"coApplicantEmploymentType":["Salaried Person","Self Employed","Retired"]}'),
('Loan','Education Loan','Education Loan','CO_PAN','Co-Applicant PAN Card',true,'{"coApplicantEmploymentType":["Salaried Person","Self Employed","Retired"]}'),
('Loan','Education Loan','Education Loan','CO_DL','Driving License',true,'{"coApplicantEmploymentType":["Salaried Person","Self Employed","Retired"]}'),
('Loan','Education Loan','Education Loan','CO_PASSPORT','Passport',true,'{"coApplicantEmploymentType":["Salaried Person","Self Employed","Retired"]}'),
('Loan','Education Loan','Education Loan','CO_PERM_ADDRESS','Permanent Address Proof',true,'{"coApplicantEmploymentType":["Salaried Person","Self Employed","Retired"]}'),
('Loan','Education Loan','Education Loan','CO_CURR_ADDRESS','Current Address Proof',true,'{"coApplicantEmploymentType":["Salaried Person","Self Employed","Retired"]}'),
('Loan','Education Loan','Education Loan','CO_BANK_STATEMENT','6 Months Bank Statement',true,'{"coApplicantEmploymentType":["Salaried Person","Self Employed","Retired"]}');


-- 🧩 PART 3 — CO-APPLICANT (SALARIED PERSON)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Education Loan','Education Loan','CO_SALARY_SLIP','3 Months Salary Slip',true,'{"coApplicantEmploymentType":["Salaried Person"]}'),
('Loan','Education Loan','Education Loan','CO_FORM16','Form 16',true,'{"coApplicantEmploymentType":["Salaried Person"]}'),
('Loan','Education Loan','Education Loan','CO_ITR_2Y','2 Years ITR',true,'{"coApplicantEmploymentType":["Salaried Person"]}');

-- 🧩 PART 4 — CO-APPLICANT (SELF EMPLOYED)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Education Loan','Education Loan','CO_GST','GST Certificate',true,'{"coApplicantEmploymentType":["Self Employed"]}'),
('Loan','Education Loan','Education Loan','CO_UDYAM','Udyog Aadhaar',true,'{"coApplicantEmploymentType":["Self Employed"]}'),
('Loan','Education Loan','Education Loan','CO_ITR_3Y','3 Years ITR',true,'{"coApplicantEmploymentType":["Self Employed"]}'),
('Loan','Education Loan','Education Loan','CO_SHOP_ACT','Shop Act Licence',true,'{"coApplicantEmploymentType":["Self Employed"]}');

--🧩 PART 5 — CO-APPLICANT (RETIRED)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Education Loan','Education Loan','CO_PENSION','Pension Slips / Certificate',true,'{"coApplicantEmploymentType":["Retired"]}'),
('Loan','Education Loan','Education Loan','CO_ITR_RET','2 Years ITR',true,'{"coApplicantEmploymentType":["Retired"]}');

--✅ FINAL CHECKLIST (VERY IMPORTANT)
Frontend must send in form_data:
{
  "hasOtherLoan": "Yes",
  "coApplicantEmploymentType": "Self Employed"
}

---------------------------------------------------------------------------------------
-- NRP LOAN DOCUMENT RULES (FINAL, COPY-PASTE SAFE)

-- ✅ 1️⃣ COMMON DOCUMENTS (ALL EMPLOYMENT TYPES, NON-SELF LOGIN)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','NRP Loan','NRP Loan','AADHAAR','Aadhaar Card',true,'{"employmentType":["Salaried Person","Self Employed","Other"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','PAN','Pan Card',true,'{"employmentType":["Salaried Person","Self Employed","Other"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','ADDRESS_PROOF','Address Proof',true,'{"employmentType":["Salaried Person","Self Employed","Other"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','PHOTOGRAPH','Photograph',true,'{"employmentType":["Salaried Person","Self Employed","Other"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','PROPERTY_COST_SHEET','Property Cost Sheet / Index II',true,'{"employmentType":["Salaried Person","Self Employed","Other"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','CONTRIBUTION_PROOF','Own Contribution Proof',true,'{"employmentType":["Salaried Person","Self Employed","Other"],"is_self_login":[false]}');

-- ✅ 2️⃣ BANK STATEMENT (🔥 FIX — ONLY ONCE)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','NRP Loan','NRP Loan','BANK_STATEMENT','6 Months Bank Statement',true,'{"employmentType":["Salaried Person","Self Employed"],"is_self_login":[false]}');


-- ✅ 2️⃣ SALARIED PERSON DOCUMENTS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','NRP Loan','NRP Loan','SALARY_SLIP','3 Months Salary Slip',true,
 '{"employmentType":["Salaried Person"],"is_self_login":[false]}'),

('Loan','NRP Loan','NRP Loan','FORM16','2 Years Form 16',true,
 '{"employmentType":["Salaried Person"],"is_self_login":[false]}'),

('Loan','NRP Loan','NRP Loan','COMPANY_ID','Company ID Card',true,
 '{"employmentType":["Salaried Person"],"is_self_login":[false]}');


-- ✅ 3️⃣ SELF-EMPLOYED DOCUMENTS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','NRP Loan','NRP Loan','UDYAM','Udyam Registration',true,'{"employmentType":["Self Employed"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','SHOP_ACT','Shop Act Licence',true,'{"employmentType":["Self Employed"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','GST_CERTIFICATE','GST Certificate',true,'{"employmentType":["Self Employed"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','GST_RETURNS','Last 12 Months GST Returns',true,'{"employmentType":["Self Employed"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','ITR','3 Years ITR',true,'{"employmentType":["Self Employed"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','SAVING_BANK_STMT','Saving Bank Account',true,'{"employmentType":["Self Employed"],"is_self_login":[false]}'),
('Loan','NRP Loan','NRP Loan','BUSINESS_ADDRESS_PROOF','Business Office Address Proof',true,'{"employmentType":["Self Employed"],"is_self_login":[false]}');

-- ✅ 4️⃣ OTHER → PENSIONER
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','NRP Loan','NRP Loan','PPO','PPO (Pension Payment Order)',true,'{"employmentType":["Other"],"otherIncome":["Pensioner"],"is_self_login":[false]}'
),
('Loan','NRP Loan','NRP Loan','PENSION_STMT','1 Year Pension Credit Statement',true,'{"employmentType":["Other"],"otherIncome":["Pensioner"],"is_self_login":[false]}'
);

-- ✅ 5️⃣ OTHER → RENTAL
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','NRP Loan','NRP Loan','RENT_AGREEMENT','Rent Agreement',true,'{"employmentType":["Other"],"otherIncome":["Rental"],"is_self_login":[false]}'
),
('Loan','NRP Loan','NRP Loan','RENT_STMT','1 Year Rent Credit Statement',true,'{"employmentType":["Other"],"otherIncome":["Rental"],"is_self_login":[false]}'
);

-- ✅ 6️⃣ EXISTING LOAN (ALL NON-SELF LOGIN)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Loan','NRP Loan','NRP Loan',
  'EXISTING_LOAN','Existing Loan Statement',true,
  '{"employmentType":["Salaried Person","Self Employed","Other"],"is_self_login":[false]}'
);

-------------------------------------------------------------------------------------------------
-- VEHICLE LOAN – DOCUMENT RULES (FINAL & COMPLETE)

-- ✅ 1️⃣COMMON DOCUMENTS (ALL EMPLOYMENT TYPES)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Vehicle Loan','Vehicle Loan','VEHICLE_QUOTATION','Vehicle Quotation',true,'{"employmentType":["Salaried Person","Self Employed"]}'),
('Loan','Vehicle Loan','Vehicle Loan','AADHAAR','Aadhaar Card',true,'{"employmentType":["Salaried Person","Self Employed"]}'),
('Loan','Vehicle Loan','Vehicle Loan','PAN','Pan Card',true,'{"employmentType":["Salaried Person","Self Employed"]}'),
('Loan','Vehicle Loan','Vehicle Loan','ADDRESS_PROOF','Address Proof',true,'{"employmentType":["Salaried Person","Self Employed"]}'),
('Loan','Vehicle Loan','Vehicle Loan','PHOTOGRAPH','Photograph',true,'{"employmentType":["Salaried Person","Self Employed"]}');

--✅ 2️⃣ BANK STATEMENT (MERGED — IMPORTANT)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Vehicle Loan','Vehicle Loan','BANK_STATEMENT','Bank Statement (1 Year / 6 Months)',true,'{"employmentType":["Salaried Person","Self Employed"]}'
);

--✅ 3️⃣ SALARIED PERSON DOCUMENTS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Vehicle Loan','Vehicle Loan','SALARY_SLIP','3 Months Salary Slip',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Vehicle Loan','Vehicle Loan','FORM16','2 Years Form 16',true,'{"employmentType":["Salaried Person"]}'),
('Loan','Vehicle Loan','Vehicle Loan','COMPANY_ID','Company ID Card',true,'{"employmentType":["Salaried Person"]}');

--✅ 4️⃣ SELF-EMPLOYED DOCUMENTS
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Vehicle Loan','Vehicle Loan','UDYAM','Udyam Registration',true,'{"employmentType":["Self Employed"]}'),
('Loan','Vehicle Loan','Vehicle Loan','SHOP_ACT','Shop Act Licence',true,'{"employmentType":["Self Employed"]}'),
('Loan','Vehicle Loan','Vehicle Loan','SAVING_BANK_STMT','Saving Bank Account Statement',true,'{"employmentType":["Self Employed"]}'),
('Loan','Vehicle Loan','Vehicle Loan','ITR','3 Years ITR',true,'{"employmentType":["Self Employed"]}'),
('Loan','Vehicle Loan','Vehicle Loan','GST_CERTIFICATE','GST Certificate',true,'{"employmentType":["Self Employed"]}'),
('Loan','Vehicle Loan','Vehicle Loan','GST_RETURNS','Last 12 Months GST Returns',true,'{"employmentType":["Self Employed"]}');

--✅ 5️⃣ EXISTING LOAN (ONLY WHEN YES)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Vehicle Loan','Vehicle Loan','EXISTING_LOAN','Existing Loan Statement',true,'{"hasOtherLoan":["Yes"]}');

-------------------------------------------------------------------------------------------------
-- LOAN AGAINST SECURITIES – DOCUMENT RULES (FINAL & COMPLETE)

--✅ 1️⃣ BASE DOCUMENTS (ALWAYS REQUIRED)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Loan','Loan Against Securities','Loan Against Securities','AADHAAR','Aadhaar Card',true,'{}'),
('Loan','Loan Against Securities','Loan Against Securities','PAN','Pan Card',true,'{}'),
('Loan','Loan Against Securities','Loan Against Securities','ADDRESS_PROOF','Address Proof',true,'{}'),
('Loan','Loan Against Securities','Loan Against Securities','BANK_STATEMENT','1 Year Banking Statement',true,'{}'),
('Loan','Loan Against Securities','Loan Against Securities','DEMAT_STATEMENT','Demat Account Statement',true,'{}'),
('Loan','Loan Against Securities','Loan Against Securities','PORTFOLIO_REPORT','Portfolio Reports',true,'{}'),
('Loan','Loan Against Securities','Loan Against Securities','ITR','ITR 3 Years',true,'{}'),
('Loan','Loan Against Securities','Loan Against Securities','CANCEL_CHEQUE','Cancelled Cheque',true,'{}'),
('Loan','Loan Against Securities','Loan Against Securities','PHOTOGRAPH','Photograph',true,'{}');

--✅ 2️⃣ ADDITIVE DOCUMENT (ONLY WHEN OTHER LOAN = YES)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Loan','Loan Against Securities','Loan Against Securities',
  'EXISTING_LOAN','Existing Loan Statement',true,
  '{"hasOtherLoan":["Yes"]}'
);

-------------------------------------------------------------------------------------------------
--LIFE INSURANCE → TERM INSURANCE
--✅ 1️⃣ BASE DOCUMENT (ONLY WHAT UI ASKS)
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Insurance','Life Insurance','Life Insurance',
  'INCOME_PROOF','Income Proof Document (3 Years ITR / Form 16)',true,
  '{"planType":["TULIP","Term Insurance"]}'
);


-------------------------------------------------------------------------------------------------
--HEALTH INSURANCE
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
(
  'Insurance','Health Insurance','Health Insurance',
  'PREVIOUS_POLICY','Previous Policy Document',true,
  '{"policyType":["Port","Renewal"]}'
);

-------------------------------------------------------------------------------------------------
--MOTOR INSURANCE
--✅ 1️⃣ RC DOCUMENTS (ONLY IF VEHICLE IS USED)
INSERT INTO tbl_detail_lead_document_rules
(department,product_type,sub_category,document_key,document_label,is_mandatory,conditions)
VALUES
('Insurance','Motor Insurance','Motor Insurance','RC_DOC','RC Documents',true,'{"isNew":["No"]}');

--✅ 2️⃣ SHOWROOM QUOTATION (ONLY IF VEHICLE IS NEW)
INSERT INTO tbl_detail_lead_document_rules
(department,product_type,sub_category,document_key,document_label,is_mandatory,conditions)
VALUES
('Insurance','Motor Insurance','Motor Insurance','SHOWROOM_QUOTATION','Showroom Quotation',true,'{"isNew":["Yes"]}');

--✅ 3️⃣ PREVIOUS YEAR POLICY (ONLY IF AVAILABLE)
INSERT INTO tbl_detail_lead_document_rules
(department,product_type,sub_category,document_key,document_label,is_mandatory,conditions)
VALUES
('Insurance','Motor Insurance','Motor Insurance','PREVIOUS_POLICY','Previous Year Policy Document',true,'{"hasPrev":["Yes"]}');


-------------------------------------------------------------------------------------------------
--FIRE INSURANCE
INSERT INTO tbl_detail_lead_document_rules
(department,product_type,sub_category,document_key,document_label,is_mandatory,conditions)
VALUES
('Insurance','Fire Insurance','Fire Insurance','STOCK_INVENTORY','Stock Inventory Sheet',true,'{"insuranceType":["stock"]}');


-------------------------------------------------------------------------------------------------
--CATTLE INSURANCE
INSERT INTO tbl_detail_lead_document_rules
(department,product_type,sub_category,document_key,document_label,is_mandatory,conditions)
VALUES
('Insurance','Cattle Insurance','Cattle Insurance','PREVIOUS_POLICY','Previous Year Policy Document',true,'{}');
-------------------------------------------------------------------------------------------------

-- Corporate Insurance
INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Insurance','Corporate Insurance','Corporate Insurance','GST_CERTIFICATE','GST Certificate of Company',true,'{"insuranceProductType":["GMC","GPA","WC"]}')
ON CONFLICT DO NOTHING;

INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Insurance','Corporate Insurance','Corporate Insurance','GMC_EMPLOYEE_DETAILS','GMC Employee Details',true,'{"insuranceProductType":["GMC"]}'),
('Insurance','Corporate Insurance','Corporate Insurance','GPA_EMPLOYEE_DETAILS','GPA Employee Details',true,'{"insuranceProductType":["GPA"]}'),
('Insurance','Corporate Insurance','Corporate Insurance','WC_EMPLOYEE_DETAILS','WC Employee Details',true,'{"insuranceProductType":["WC"]}')
ON CONFLICT DO NOTHING;

INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Insurance','Corporate Insurance','Corporate Insurance','PREVIOUS_POLICY','Previous Policy Copy',true,'{"insuranceProductType":["GMC","GPA"],"policyType":["RENEWAL"]}')
ON CONFLICT DO NOTHING;

INSERT INTO tbl_detail_lead_document_rules
(department, product_type, sub_category, document_key, document_label, is_mandatory, conditions)
VALUES
('Insurance','Corporate Insurance','Corporate Insurance','CLAIM_HISTORY','Claim History / MIS Report',true,'{"insuranceProductType":["GMC","GPA"],"policyType":["Renewal"],"anyClaimLastYear":["Yes"]}'
)
ON CONFLICT DO NOTHING;
------------------------------------------------------------------------------------------------------
UPDATE tbl_detail_lead_document_rules
SET conditions = '{
  "policyType": ["Renewal"],
  "anyClaimLastYear": ["Yes"],
  "insuranceProductType": ["GMC", "GPA"]
}'::jsonb
WHERE id = 160;

UPDATE tbl_detail_lead_document_rules
SET conditions = '{
  "policyType": ["Renewal"],
  "insuranceProductType": ["GMC", "GPA"]
}'::jsonb
WHERE id = 159;

-------------------------------------------------------------------------------------------------
-- MUTUAL FUNDS
INSERT INTO tbl_detail_lead_document_rules
(department,product_type,sub_category,document_key,document_label,is_mandatory,conditions)
VALUES
('Mutual Funds','Mutual Funds','Mutual Funds','PAN','Pan Card',true,'{}'),
('Mutual Funds','Mutual Funds','Mutual Funds','AADHAAR','Aadhaar Card',true,'{}'),
('Mutual Funds','Mutual Funds','Mutual Funds','CANCEL_CHEQUE','Cancelled Cheque',true,'{}'),
('Mutual Funds','Mutual Funds','Mutual Funds','NOMINEE_PAN','Nominee Pan Card',true,'{}');  

INSERT INTO tbl_detail_lead_document_rules
(department,product_type,sub_category,document_key,document_label,is_mandatory,conditions)
VALUES
('Mutual Funds','Mutual Funds','Mutual Funds','BIRTH_CERTIFICATE','Birth Certificate',true,'{"isMinor":["true"]}'),
('Mutual Funds','Mutual Funds','Mutual Funds','GUARDIAN_PAN_CARD','Guardian Pan Card',true,'{"isMinor":["true"]}');
