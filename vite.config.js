import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // Feature chunks
          'admin-pages': [
            './src/pages/admin/AdminDashboard.jsx',
            './src/pages/admin/DataManagementPage.jsx',
            './src/pages/admin/TimetableManagementPage.jsx',
            './src/pages/admin/TimetableSchedulingPage.jsx',
            './src/pages/admin/SwapRequestsPage.jsx',
          ],
          'teacher-pages': [
            './src/pages/teacher/TeacherDashboard.jsx',
            './src/pages/teacher/TeacherTimetablePage.jsx',
          ],
          'student-pages': [
            './src/pages/student/StudentDashboard.jsx',
            './src/pages/student/StudentTimetablePage.jsx',
          ],
          'entity-pages': [
            './src/pages/admin/entity/AcademicYearsPage.jsx',
            './src/pages/admin/entity/AcademicSemestersPage.jsx',
            './src/pages/admin/entity/AcademicPeriodsPage.jsx',
            './src/pages/admin/entity/DisciplinesPage.jsx',
            './src/pages/admin/entity/ProgramsPage.jsx',
            './src/pages/admin/entity/SemesterNumbersPage.jsx',
            './src/pages/admin/entity/SectionNumbersPage.jsx',
            './src/pages/admin/entity/DegreeLevelsPage.jsx',
            './src/pages/admin/entity/CampusesPage.jsx',
            './src/pages/admin/entity/SectionsPage.jsx',
            './src/pages/admin/entity/TeachersPage.jsx',
            './src/pages/admin/entity/StudentsPage.jsx',
            './src/pages/admin/entity/CoursesPage.jsx',
            './src/pages/admin/entity/RoomsPage.jsx',
            './src/pages/admin/entity/SlotsPage.jsx',
            './src/pages/admin/entity/SlotDurationsPage.jsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit since we're code-splitting
  },
})
