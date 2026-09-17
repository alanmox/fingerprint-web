import Link from "next/link";
import { db } from "@/lib/db";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const students = await db.student.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q } },
            { registrationNumber: { contains: q } },
          ],
        }
      : undefined,
    include: {
      fingerprintTemplate: { select: { id: true } },
      requirements: { select: { isComplete: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid">
      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Registration</p>
          <h2>Students</h2>
          <p>
            Register and manage field placement students at Mloganzila Hospital.
          </p>
        </div>

        <form className="stack-inline">
          <div className="field field--grow">
            <label htmlFor="q">Search</label>
            <input
              defaultValue={q ?? ""}
              id="q"
              name="q"
              placeholder="Name or registration number"
            />
          </div>
          <button className="button button--secondary" type="submit">
            Search
          </button>
        </form>

        <div className="stack-inline">
          <Link className="button button--primary" href="/admin/students/new">
            Add Student
          </Link>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Registration No.</th>
              <th>Program</th>
              <th>Fingerprint</th>
              <th>Checklist</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const totalRequirements = student.requirements.length;
              const completeRequirements = student.requirements.filter(
                (r) => r.isComplete,
              ).length;
              const eligible =
                Boolean(student.fingerprintTemplate) &&
                completeRequirements === totalRequirements;

              return (
                <tr key={student.id}>
                  <td>
                    <Link href={`/admin/students/${student.id}`}>
                      {student.fullName}
                    </Link>
                  </td>
                  <td>{student.registrationNumber}</td>
                  <td>{student.program}</td>
                  <td>
                    <span
                      className={`badge ${student.fingerprintTemplate ? "badge--success" : "badge--muted"}`}
                    >
                      {student.fingerprintTemplate
                        ? "Enrolled"
                        : "Not Enrolled"}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge--muted">
                      {completeRequirements}/{totalRequirements}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${eligible ? "badge--success" : "badge--warning"}`}
                    >
                      {eligible ? "Eligible" : "Pending"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 ? (
              <tr>
                <td colSpan={6}>No students found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
