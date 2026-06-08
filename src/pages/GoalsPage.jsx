import GoalsFeature from '../features/goals/components/GoalsFeature';

function GoalsPage() {
  return (
    <section className="page-section">
      <h2>اهداف</h2>
      <p>هدف‌های هفتگی و ماهانه.</p>
      <br/>
      <GoalsFeature />
    </section>
  );
}

export default GoalsPage;
