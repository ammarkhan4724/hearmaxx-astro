# Action Items & Content Confirmatory Checklist for Clinic Owner

The following items represent legacy inconsistencies or gaps extracted from the legacy website. To ensure medical, legal, and operational accuracy, please review and update the items below:

---

### 1. Mississauga Clinic Postal Code
- **Current Status**: The old website had no valid Canadian postal code for the Mississauga location (only listed `1151 Dundas Street West #17, Mississauga, ON` with an invalid `4C4` snippet elsewhere).
- **Action Required**: Provide the correct 6-character Canadian Postal Code (e.g. `L5C ...`) for `1151 Dundas Street West #17`. Once provided, update the `postalCode` field in `src/data/site.ts`.

---

### 2. Specialist Credentials & Title (Sheeraz Rahim)
- **Current Status**: The legacy site inconsistently referred to founder Sheeraz Rahim as "Dr. Sheeraz Rahim" in some headings and "Hearing Care Specialist" or "Certified Audiologist" in body text.
- **Action Required**: Confirm the exact professional regulatory designation under Ontario provincial licensing (e.g., Registered Hearing Instrument Practitioner / Hearing Instrument Specialist / Doctor of Audiology). In `src/data/site.ts`, his title is currently standardized to `Hearing Care Specialist`.

---

### 3. Tinnitus Treatment & Management Section
- **Current Status**: The page `/what-is-tinnitus/` ended abruptly after the "Causes of Tinnitus" section. No copy existed for treatment or management, despite the navigation title promising *"What is Tinnitus & Its Treatment?"*.
- **Action Required**: Supply approved clinical copy regarding tinnitus management therapies (e.g., sound masking, acoustic therapy, hearing aid tinnitus-support algorithms, counseling). An empty placeholder block is currently marked in `src/content/hearing-health/what-is-tinnitus.md`.

---

### 4. Myths vs. Facts Counter-Statements
- **Current Status**: On `/the-impact-of-untreated-hearing-loss/`, the legacy table duplicated the myths in the "Facts" column instead of presenting actual scientific counter-statements.
- **Action Required**: Review the two-column Myths vs. Facts comparison table in `src/content/hearing-health/the-impact-of-untreated-hearing-loss.md`. Any counter-statement not explicitly verified from clinical literature has been flagged for owner confirmation.

---

### 5. Form Submission Endpoint & Email Destination
- **Current Status**: Contact and Appointment booking forms submit progressively to `public/form-handler.php` using standard PHP `mail()` configured to notify `Info@hearmaxx.ca`.
- **Action Required**: 
  1. Confirm whether `Info@hearmaxx.ca` is monitored and receives messages from Hostinger's PHP mail server.
  2. If using an external CRM or webhook service (e.g., Formspree, Webhook, HubSpot), set the environment variable `PUBLIC_FORM_ENDPOINT="https://your-crm-endpoint.com/api"` in `.env`.
