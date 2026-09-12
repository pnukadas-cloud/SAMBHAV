type Props = {
  explanation: string;
};

export function TutorPanel({ explanation }: Props) {
  return (
    <section className="panel">
      <h2>AI Tutor</h2>
      <p className="tutor-text">{explanation}</p>
    </section>
  );
}

