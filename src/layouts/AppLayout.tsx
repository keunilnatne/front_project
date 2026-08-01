import { NavLink, Outlet } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Messages', path: '/messages' },
  { label: 'Recipients', path: '/recipients' },
  { label: 'Company DNA', path: '/company-dna' },
  { label: 'Team Memory', path: '/team-memory' },
  { label: 'History', path: '/history' },
  { label: 'Settings', path: '/settings' },
]

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 p-6 text-white">
        <div className="mb-8 text-xl font-bold">Conexting</div>

        <nav className="flex flex-col gap-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  'rounded-lg px-4 py-2 transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout