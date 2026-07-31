ALTER TABLE restaurants ADD COLUMN business_type VARCHAR(120);

ALTER TABLE restaurants ADD COLUMN approval_note TEXT;

ALTER TABLE restaurants ADD COLUMN onboarding_completed_at TIMESTAMP NULL;
