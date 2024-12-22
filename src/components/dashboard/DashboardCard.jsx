function DashboardCard({ title, children }) {
  return (
    <div className="card">
      <h2 className="dashboard-title">{title}</h2>
      {children}
    </div>
  )
}

export default DashboardCard 