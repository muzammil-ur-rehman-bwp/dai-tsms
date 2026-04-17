import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, MobileNav } from './Sidebar'
import { Footer } from './Footer'
import Topbar from './Topbar'

export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Nav */}
        <MobileNav />
        
        <Topbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
