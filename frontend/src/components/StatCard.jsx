function StatCard({ icon, label, value, tone = 'default' }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default StatCard
