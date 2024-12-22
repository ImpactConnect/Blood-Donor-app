import PropTypes from 'prop-types'

function DashboardCard({ title, children }) {
  return (
    <div className="card">
      <h2 className="dashboard-title">{title}</h2>
      {children}
    </div>
  )
}

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
}

export default DashboardCard 