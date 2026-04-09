import type { PropsWithChildren } from "react";

type FormProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function Form({ title, description, children }: FormProps) {
  return (
    <section className="card">
      <div className="card__header">
        <p className="eyebrow">ALLANTECH Workflow</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="stack">{children}</div>
    </section>
  );
}
