"use client";

import { useRouter } from "next/navigation";
import { Form } from "@/components/Form";
import {
  StudentForm,
  type StudentFormValues,
} from "@/components/admin/StudentForm";

export default function NewStudentPage() {
  const router = useRouter();

  async function handleSubmit(values: StudentFormValues) {
    const response = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        yearOfStudy: Number(values.yearOfStudy),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not create student.");
    }

    router.push(`/admin/students/${payload.student.id}`);
  }

  return (
    <div className="grid">
      <Form
        title="Register Student"
        description="Enter the student's profile. You'll add the requirements checklist and enroll their fingerprint next."
      >
        <StudentForm onSubmit={handleSubmit} submitLabel="Create Student" />
      </Form>
    </div>
  );
}
