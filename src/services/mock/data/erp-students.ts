// FICTIONAL university ERP records. No real persons.
// `demoAadhaar` is NOT part of an ERP record — it only powers the demo hint that tells a tester
// which mock DigiLocker account belongs to this fictional student.

export type ErpRecord = {
  prn: string;
  name: string;
  dob: string; // YYYY-MM-DD
  gender: "MALE" | "FEMALE";
  phone: string;
  email: string;
  course: string;
  year: number;
  demoAadhaar: string;
  note?: string;
};

export const ERP_STUDENTS: ErpRecord[] = [
  { prn: "SS23CS001", name: "Aarav Kulkarni", dob: "2004-06-12", gender: "MALE", phone: "+917000010001", email: "aarav.kulkarni@students.sportssphere.example", course: "B.Tech Computer Science", year: 3, demoAadhaar: "000010000001", note: "Seeded: APPROVED with QR Sports ID" },
  { prn: "SS23ME002", name: "Rohan Deshmukh", dob: "2003-05-14", gender: "MALE", phone: "+917000010002", email: "rohan.deshmukh@students.sportssphere.example", course: "B.Tech Mechanical", year: 3, demoAadhaar: "000010000002", note: "Seeded: FLAGGED — DOB mismatch" },
  { prn: "SS24BC003", name: "Sneha Patil", dob: "2005-09-03", gender: "FEMALE", phone: "+917000010003", email: "sneha.patil@students.sportssphere.example", course: "B.Com", year: 2, demoAadhaar: "000010000003", note: "Seeded: FLAGGED — name mismatch" },
  { prn: "SS26BA004", name: "Kavya Iyer", dob: "2009-03-15", gender: "FEMALE", phone: "+917000010004", email: "kavya.iyer@students.sportssphere.example", course: "BA Psychology", year: 1, demoAadhaar: "000010000004", note: "Seeded: PENDING — under 18" },
  { prn: "SS24EE005", name: "Vikram Singh Rathore", dob: "2005-01-22", gender: "MALE", phone: "+917000010005", email: "vikram.rathore@students.sportssphere.example", course: "B.Tech Electrical", year: 2, demoAadhaar: "000010000005", note: "Walkthrough: DigiLocker DOB differs → will be FLAGGED" },
  { prn: "SS24CS006", name: "Ishaan Mehta", dob: "2005-11-30", gender: "MALE", phone: "+917000010006", email: "ishaan.mehta@students.sportssphere.example", course: "B.Tech Computer Science", year: 2, demoAadhaar: "000010000006", note: "Walkthrough: clean record" },
  { prn: "SS25BS007", name: "Ananya Reddy", dob: "2006-07-19", gender: "FEMALE", phone: "+917000010007", email: "ananya.reddy@students.sportssphere.example", course: "B.Sc Physics", year: 1, demoAadhaar: "000010000007", note: "Walkthrough: clean record" },
  { prn: "SS22CE008", name: "Arjun Nair", dob: "2002-02-08", gender: "MALE", phone: "+917000010008", email: "arjun.nair@students.sportssphere.example", course: "B.Tech Civil", year: 4, demoAadhaar: "000010000008", note: "Seeded: APPROVED (football)" },
  { prn: "SS23BB009", name: "Meera Joshi", dob: "2004-12-01", gender: "FEMALE", phone: "+917000010009", email: "meera.joshi@students.sportssphere.example", course: "BBA", year: 3, demoAadhaar: "000010000009", note: "Seeded: VERIFIED, awaiting approval" },
  { prn: "SS24CS010", name: "Kabir Malhotra", dob: "2005-04-27", gender: "MALE", phone: "+917000010010", email: "kabir.malhotra@students.sportssphere.example", course: "B.Tech Computer Science", year: 2, demoAadhaar: "000010000010", note: "Seeded: PENDING (wrestling)" },
  { prn: "SS22LW011", name: "Priya Chatterjee", dob: "2002-10-10", gender: "FEMALE", phone: "+917000010011", email: "priya.chatterjee@students.sportssphere.example", course: "BA LLB", year: 4, demoAadhaar: "000010000011", note: "Seeded: APPROVED (badminton)" },
  { prn: "SS25AR012", name: "Siddharth Rao", dob: "2006-03-05", gender: "MALE", phone: "+917000010012", email: "siddharth.rao@students.sportssphere.example", course: "B.Arch", year: 1, demoAadhaar: "000010000012", note: "Seeded: REJECTED" },
  { prn: "SS23PH013", name: "Fatima Shaikh", dob: "2004-08-16", gender: "FEMALE", phone: "+917000010013", email: "fatima.shaikh@students.sportssphere.example", course: "B.Pharm", year: 3, demoAadhaar: "000010000013" },
  { prn: "SS24MA014", name: "Aditya Banerjee", dob: "2005-06-21", gender: "MALE", phone: "+917000010014", email: "aditya.banerjee@students.sportssphere.example", course: "B.Sc Mathematics", year: 2, demoAadhaar: "000010000014" },
  { prn: "SS22CS015", name: "Neha Gupta", dob: "2003-01-09", gender: "FEMALE", phone: "+917000010015", email: "neha.gupta@students.sportssphere.example", course: "B.Tech Computer Science", year: 4, demoAadhaar: "000010000015" },
  { prn: "SS25EC016", name: "Rahul Verma", dob: "2006-09-28", gender: "MALE", phone: "+917000010016", email: "rahul.verma@students.sportssphere.example", course: "B.Tech Electronics", year: 1, demoAadhaar: "000010000016" },
  { prn: "SS23HM017", name: "Diya Menon", dob: "2004-04-04", gender: "FEMALE", phone: "+917000010017", email: "diya.menon@students.sportssphere.example", course: "BHM Hotel Management", year: 3, demoAadhaar: "000010000017" },
  { prn: "SS24BT018", name: "Harsh Vardhan Yadav", dob: "2005-02-14", gender: "MALE", phone: "+917000010018", email: "harsh.yadav@students.sportssphere.example", course: "B.Tech Biotechnology", year: 2, demoAadhaar: "000010000018" },
  { prn: "SS22EN019", name: "Tanvi Kapoor", dob: "2003-07-07", gender: "FEMALE", phone: "+917000010019", email: "tanvi.kapoor@students.sportssphere.example", course: "BA English", year: 4, demoAadhaar: "000010000019" },
  { prn: "SS25CS020", name: "Yash Pandey", dob: "2007-01-17", gender: "MALE", phone: "+917000010020", email: "yash.pandey@students.sportssphere.example", course: "B.Tech Computer Science", year: 1, demoAadhaar: "000010000020" },
  { prn: "SS23MB021", name: "Lakshmi Subramanian", dob: "2004-05-25", gender: "FEMALE", phone: "+917000010021", email: "lakshmi.s@students.sportssphere.example", course: "MBA", year: 1, demoAadhaar: "000010000021" },
  { prn: "SS24AG022", name: "Manpreet Kaur Gill", dob: "2005-08-11", gender: "FEMALE", phone: "+917000010022", email: "manpreet.gill@students.sportssphere.example", course: "B.Sc Agriculture", year: 2, demoAadhaar: "000010000022" },
  { prn: "SS22ME023", name: "Omkar Pawar", dob: "2002-11-02", gender: "MALE", phone: "+917000010023", email: "omkar.pawar@students.sportssphere.example", course: "B.Tech Mechanical", year: 4, demoAadhaar: "000010000023" },
  { prn: "SS25DS024", name: "Zoya Khan", dob: "2006-12-12", gender: "FEMALE", phone: "+917000010024", email: "zoya.khan@students.sportssphere.example", course: "B.Sc Data Science", year: 1, demoAadhaar: "000010000024" },
  { prn: "SS23PE025", name: "Gaurav Thakur", dob: "2004-03-30", gender: "MALE", phone: "+917000010025", email: "gaurav.thakur@students.sportssphere.example", course: "B.P.Ed Physical Education", year: 3, demoAadhaar: "000010000025" },
];
