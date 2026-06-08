import StatisticsFeature from '../features/statistics/components/StatisticsFeature';

function StatisticsPage() {
  return (
    <section className="page-section">
      <h2>آمار</h2>
      <p>  بررسی روند مطالعه و نرخ پیشرفت  .</p>
      <br/>
      <StatisticsFeature />
    </section>
  );
}

export default StatisticsPage;
