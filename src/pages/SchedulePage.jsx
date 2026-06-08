import ScheduleFeature from '../features/schedule/components/ScheduleFeature';

function SchedulePage() {
  return (
    <section className="page-section">
      <h2>برنامه هفتگی</h2>
      <p>  برنامه مطالعاتی برای هر روز هفته.</p>
      <br/>
      <ScheduleFeature />
    </section>
  );
}

export default SchedulePage;
