// FICTIONAL DigiLocker / Aadhaar e-KYC records. Aadhaar numbers start with "0000",
// a prefix UIDAI never issues, so none of these can collide with a real number.

import { ERP_STUDENTS } from "./erp-students";

export type DigiLockerAccount = {
  aadhaar: string; // 12 digits — the mock "external system" holds this; our app stores only the last 4
  name: string;
  dob: string;
  gender: "MALE" | "FEMALE";
  mobile: string;
  address: string;
  class10: { board: string; rollNo: string; year: number; school: string };
  label: string; // shown in the demo helper panel
};

// Deliberate differences from the ERP record for test cases.
const OVERRIDES: Record<string, Partial<DigiLockerAccount>> = {
  "000010000002": { dob: "2001-05-14" }, // DOB mismatch (seeded, flagged)
  "000010000003": { name: "Sneha Ramesh Jadhav" }, // name mismatch (seeded, flagged)
  "000010000005": { dob: "2002-01-22" }, // DOB mismatch for the walkthrough
};

const CITIES = ["Pune", "Nashik", "Kolhapur", "Nagpur", "Mumbai", "Aurangabad", "Satara", "Solapur"];

const fromErp: DigiLockerAccount[] = ERP_STUDENTS.map((s, i) => {
  const base: DigiLockerAccount = {
    aadhaar: s.demoAadhaar,
    name: s.name,
    dob: s.dob,
    gender: s.gender,
    mobile: s.phone,
    address: `${12 + i}, Sample Housing Society, ${CITIES[i % CITIES.length]}, Maharashtra 4110${String(i).padStart(2, "0")}`,
    class10: { board: "State Board (fictional)", rollNo: `S${210000 + i * 37}`, year: Number(s.dob.slice(0, 4)) + 16, school: "Demo Vidyalaya" },
    label: `${s.name} — ERP ${s.prn}`,
  };
  return { ...base, ...OVERRIDES[s.demoAadhaar] };
});

// Outside (other-university) students
const outside: DigiLockerAccount[] = [
  { aadhaar: "000020000001", name: "Nikhil Sawant", dob: "2004-02-19", gender: "MALE", mobile: "+917000020001", address: "4, Demo Lane, Thane, Maharashtra 400601", class10: { board: "CBSE (fictional)", rollNo: "C7712301", year: 2020, school: "Sample Public School" }, label: "Nikhil Sawant — outside student (seeded, awaiting college confirmation)" },
  { aadhaar: "000020000002", name: "Pooja Hegde Rao", dob: "2005-10-08", gender: "FEMALE", mobile: "+917000020002", address: "9, Example Road, Belagavi, Karnataka 590001", class10: { board: "State Board (fictional)", rollNo: "K4419022", year: 2021, school: "Model High School" }, label: "Pooja Hegde Rao — outside student (walkthrough)" },
  { aadhaar: "000020000003", name: "Tenzin Norbu Bhutia", dob: "2003-12-24", gender: "MALE", mobile: "+917000020003", address: "2, Hill View, Gangtok, Sikkim 737101", class10: { board: "CBSE (fictional)", rollNo: "C9921003", year: 2019, school: "Sample Central School" }, label: "Tenzin Norbu Bhutia — outside student (walkthrough)" },
  { aadhaar: "000020000004", name: "Ritika Saini", dob: "2004-07-01", gender: "FEMALE", mobile: "+917000020004", address: "17, Practice Nagar, Jaipur, Rajasthan 302001", class10: { board: "RBSE (fictional)", rollNo: "R1100204", year: 2020, school: "Demo Girls School" }, label: "Ritika Saini — outside student (seeded, approved)" },
];

export const DIGILOCKER_ACCOUNTS: DigiLockerAccount[] = [...fromErp, ...outside];

/** Duplicate test: signing in with Aarav's Aadhaar from a different path collides with his existing profile. */
export const DUPLICATE_TEST_AADHAAR = "000010000001";
