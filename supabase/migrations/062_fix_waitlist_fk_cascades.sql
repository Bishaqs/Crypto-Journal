ALTER TABLE quiz_results
  DROP CONSTRAINT IF EXISTS quiz_results_waitlist_signup_id_fkey;

ALTER TABLE quiz_results
  ADD CONSTRAINT quiz_results_waitlist_signup_id_fkey
    FOREIGN KEY (waitlist_signup_id) REFERENCES waitlist_signups(id) ON DELETE SET NULL;

ALTER TABLE email_sequences
  DROP CONSTRAINT IF EXISTS email_sequences_waitlist_signup_id_fkey;

ALTER TABLE email_sequences
  ADD CONSTRAINT email_sequences_waitlist_signup_id_fkey
    FOREIGN KEY (waitlist_signup_id) REFERENCES waitlist_signups(id) ON DELETE CASCADE;

ALTER TABLE feature_votes
  DROP CONSTRAINT IF EXISTS feature_votes_waitlist_signup_id_fkey;

ALTER TABLE feature_votes
  ADD CONSTRAINT feature_votes_waitlist_signup_id_fkey
    FOREIGN KEY (waitlist_signup_id) REFERENCES waitlist_signups(id) ON DELETE CASCADE;
