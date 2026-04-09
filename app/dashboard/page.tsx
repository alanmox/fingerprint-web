import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <section className="card dashboard">
      <p className="eyebrow">Protected Area</p>
      <h1>Welcome back, {session.username}.</h1>
      <p>
        Your passkey authentication succeeded and a signed session cookie is active.
        This page is server-protected through the App Router.
      </p>
      <div className="dashboard__meta">
        <span>User ID: {session.userId}</span>
        <span>Username: {session.username}</span>
      </div>
      <form action="/api/auth/logout" method="post">
        <button className="button button--secondary" type="submit">
          Logout
        </button>
      </form>
    </section>
  );
}

