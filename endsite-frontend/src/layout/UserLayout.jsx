// src/layouts/UserLayout.jsx

import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-[#e9edf2] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}