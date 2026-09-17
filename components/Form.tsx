import type { PropsWithChildren } from "react";

type FormProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description: string;
}>;

export function Form({ eyebrow = "Mloganzila Field Desk", title, description, children }: FormProps) {
  return (
    <section className="card">
      <div className="card__header">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="stack">{children}</div>
    </section>
  );
}
