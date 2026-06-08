import DashboardFeature from '../features/dashboard/components/DashboardFeature';

function DashboardPage() {
  return (
    <section className="page-section">
      <h2>داشبورد</h2>
      <p>خلاصه وضعیت مطالعه.</p>
      <br/>
      <DashboardFeature />
    </section>
  );
}

export default DashboardPage;
