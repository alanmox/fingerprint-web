"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "@/components/Form";
import {
  StudentForm,
  type StudentFormValues,
} from "@/components/admin/StudentForm";

export default function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<StudentFormValues | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/students/${id}`)
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.student) {
          throw new Error(payload.error ?? "Student not found.");
        }

        setInitialValues({
          fullName: payload.student.fullName,
          registrationNumber: payload.student.registrationNumber,
          university: payload.student.university,
          program: payload.student.program,
          yearOfStudy: String(payload.student.yearOfStudy),
          phone: payload.student.phone,
          email: payload.student.email ?? "",
        });
      })
      .catch((caughtError) =>
        setError(caughtError.message ?? "Could not load student."),
      );
  }, [id]);

  async function handleSubmit(values: StudentFormValues) {
    const response = await fetch(`/api/admin/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: values.fullName,
        university: values.university,
        program: values.program,
        yearOfStudy: Number(values.yearOfStudy),
        phone: values.phone,
        email: values.email,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not update student.");
    }

    router.push(`/admin/students/${id}`);
  }

  return (
    <div className="grid">
      <Form
        title="Edit Student"
        description="Update this student's profile details."
      >
        {error ? <p className="status status--error">{error}</p> : null}
        {initialValues ? (
          <StudentForm
            initialValues={initialValues}
            lockRegistrationNumber
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        ) : (
          <p className="status">Loading...</p>
        )}
      </Form>
    </div>
  );
}
