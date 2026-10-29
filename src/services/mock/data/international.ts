// FICTIONAL passports and international admissions records.

export type AdmissionsRecord = {
  passportNumber: string;
  nationality: string; // ISO 3166-1 alpha-3
  name: string;
  dob: string;
  gender: "MALE" | "FEMALE";
  program: string;
  email: string;
};

export type DemoPassport = {
  passportNumber: string;
  nationality: string;
  surname: string;
  givenNames: string;
  dob: string;
  expiry: string;
  gender: "MALE" | "FEMALE";
  label: string;
};

/** Our university's international admissions office (6 records). */
export const ADMISSIONS_RECORDS: AdmissionsRecord[] = [
  { passportNumber: "N4821733", nationality: "NPL", name: "Sujan Thapa Magar", dob: "2004-04-18", gender: "MALE", program: "B.Tech Computer Science", email: "sujan.thapa@intl.sportssphere.example" },
  { passportNumber: "KE7710245", nationality: "KEN", name: "Wanjiru Achieng Otieno", dob: "2003-09-02", gender: "FEMALE", program: "BBA", email: "wanjiru.otieno@intl.sportssphere.example" },
  { passportNumber: "A09126654", nationality: "AFG", name: "Farid Ahmadzai", dob: "2002-08-01", gender: "MALE", program: "MBA", email: "farid.ahmadzai@intl.sportssphere.example" },
  { passportNumber: "BG3317720", nationality: "BGD", name: "Nusrat Jahan Mim", dob: "2005-01-27", gender: "FEMALE", program: "B.Pharm", email: "nusrat.mim@intl.sportssphere.example" },
  { passportNumber: "VN1029384", nationality: "VNM", name: "Minh Anh Nguyen", dob: "2004-11-11", gender: "FEMALE", program: "B.Sc Data Science", email: "minh.anh@intl.sportssphere.example" },
  { passportNumber: "ZW5566120", nationality: "ZWE", name: "Tatenda Moyo", dob: "2003-06-30", gender: "MALE", program: "B.Tech Mechanical", email: "tatenda.moyo@intl.sportssphere.example" },
];

/** Passports for the demo helper. The DOB of Farid's passport differs from the admissions record (mismatch test). */
export const DEMO_PASSPORTS: DemoPassport[] = [
  { passportNumber: "N4821733", nationality: "NPL", surname: "THAPA MAGAR", givenNames: "SUJAN", dob: "2004-04-18", expiry: "2031-04-17", gender: "MALE", label: "Sujan Thapa Magar (Nepal) — seeded, awaiting passport check" },
  { passportNumber: "KE7710245", nationality: "KEN", surname: "OTIENO", givenNames: "WANJIRU ACHIENG", dob: "2003-09-02", expiry: "2030-09-01", gender: "FEMALE", label: "Wanjiru Otieno (Kenya) — ours, clean (walkthrough)" },
  { passportNumber: "A09126654", nationality: "AFG", surname: "AHMADZAI", givenNames: "FARID", dob: "2000-08-01", expiry: "2029-02-10", gender: "MALE", label: "Farid Ahmadzai (Afghanistan) — ours, DOB mismatch with admissions" },
  { passportNumber: "BG3317720", nationality: "BGD", surname: "MIM", givenNames: "NUSRAT JAHAN", dob: "2005-01-27", expiry: "2032-01-26", gender: "FEMALE", label: "Nusrat Jahan Mim (Bangladesh) — ours, clean" },
  { passportNumber: "VN1029384", nationality: "VNM", surname: "NGUYEN", givenNames: "MINH ANH", dob: "2004-11-11", expiry: "2033-05-05", gender: "FEMALE", label: "Nguyen Minh Anh (Vietnam) — ours, clean" },
  { passportNumber: "ZW5566120", nationality: "ZWE", surname: "MOYO", givenNames: "TATENDA", dob: "2003-06-30", expiry: "2030-06-29", gender: "MALE", label: "Tatenda Moyo (Zimbabwe) — ours, clean" },
  { passportNumber: "LK8834501", nationality: "LKA", surname: "PERERA", givenNames: "DILSHAN KAVINDA", dob: "2004-02-02", expiry: "2031-12-31", gender: "MALE", label: "Dilshan Perera (Sri Lanka) — outside university" },
  { passportNumber: "Z7123456", nationality: "IND", surname: "D SOUZA", givenNames: "ELENA", dob: "2005-05-05", expiry: "2034-05-04", gender: "FEMALE", label: "Elena D'Souza (OCI cardholder, no Aadhaar) — outside" },
];
