import { redirect } from "next/navigation";

export default function StudentsIndex() {
  redirect("/admin#students");
}
