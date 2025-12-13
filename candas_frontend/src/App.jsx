import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Layout, LoadingSpinner } from './components'
import ErrorBoundary from './components/ErrorBoundary'
import KeyboardShortcutsHelp from './components/feedback/KeyboardShortcutsHelp'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PullsList from './pages/logistics/PullsList'
import PullsCreate from './pages/logistics/PullsCreate'
import PullsDetail from './pages/logistics/PullsDetail'
import PullsEdit from './pages/logistics/PullsEdit'
import PullsAddPackages from './pages/logistics/PullsAddPackages'
import BatchesList from './pages/logistics/BatchesList'
import BatchCreate from './pages/logistics/BatchCreate'
import BatchWithPullsCreate from './pages/logistics/BatchWithPullsCreate'
import BatchDetail from './pages/logistics/BatchDetail'
import BatchFormWizard from './pages/logistics/BatchFormWizard'
import BatchEdit from './pages/logistics/BatchEdit'
import DispatchesList from './pages/logistics/DispatchesList'
import DispatchCreate from './pages/logistics/DispatchCreate'
import DispatchDetail from './pages/logistics/DispatchDetail'
import IndividualPackagesList from './pages/logistics/IndividualPackagesList'
import CreateIndividualPackage from './pages/logistics/CreateIndividualPackage'
import EditIndividualPackage from './pages/logistics/EditIndividualPackage'
import PackagesList from './pages/packages/PackagesList'
import PackagesForm from './pages/packages/PackagesForm'
import PackagesDetail from './pages/packages/PackagesDetail'
import BarcodeScanner from './pages/packages/BarcodeScanner'
import PackageExport from './pages/packages/PackageExport'
import ImportPackages from './pages/packages/ImportPackages'
import BatchUpdatePackages from './pages/packages/BatchUpdatePackages'
import ReportsList from './pages/reports/ReportsList'
import ReportsCreate from './pages/reports/ReportsCreate'
import ReportsView from './pages/reports/ReportsView'
import ReportsDashboard from './pages/reports/ReportsDashboard'
import ReportGenerator from './pages/reports/ReportGenerator'
import ReportsScheduled from './pages/reports/ReportsScheduled'
import TransportAgenciesList from './pages/catalog/TransportAgenciesList'
import TransportAgencyForm from './pages/catalog/TransportAgencyForm'
import TransportAgencyDetail from './pages/catalog/TransportAgencyDetail'
import ExcelMapper from './pages/tools/ExcelMapper'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { KeyboardProvider, useKeyboard, useShortcut } from './contexts/KeyboardContext'

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner message="Cargando..." fullScreen />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Componente para manejar atajos de navegación global
const GlobalKeyboardShortcuts = () => {
  const navigate = useNavigate()
  const { showHelp, setShowHelp } = useKeyboard()

  // Atajo: / para ir a la búsqueda (paquetes)
  useShortcut('/', () => {
    navigate('/paquetes')
    // Focus en el campo de búsqueda después de navegar
    setTimeout(() => {
      const searchInput = document.querySelector('input[type="text"]')
      if (searchInput) searchInput.focus()
    }, 100)
  }, { description: 'Ir a búsqueda de paquetes', category: 'Navegación' })

  // Atajo: g+h para ir al Dashboard
  useShortcut('g+h', () => {
    navigate('/')
  }, { description: 'Ir al Dashboard', category: 'Navegación' })

  // Atajo: g+p para ir a Paquetes
  useShortcut('g+p', () => {
    navigate('/paquetes')
  }, { description: 'Ir a Paquetes', category: 'Navegación' })

  // Atajo: g+l para ir a Logística (Sacas)
  useShortcut('g+l', () => {
    navigate('/logistica/pulls')
  }, { description: 'Ir a Logística', category: 'Navegación' })

  // Atajo: g+r para ir a Reportes
  useShortcut('g+r', () => {
    navigate('/reports/dashboard')
  }, { description: 'Ir a Reportes', category: 'Navegación' })

  // Atajo: n para crear nuevo elemento según la página actual
  useShortcut('n', () => {
    const currentPath = window.location.pathname
    
    // Mapeo de rutas de lista a rutas de creación
    const createRoutes = {
      '/paquetes': '/paquetes/crear',
      '/logistica/pulls': '/logistica/pulls/crear',
      '/logistica/batches': '/logistica/batches/crear',
      '/logistica/dispatches': '/logistica/dispatches/crear',
      '/logistica/individuales': '/logistica/individuales/crear',
      '/reports': '/reports/create',
      '/reports/dashboard': '/reports/create',
      '/catalogo/agencias-transporte': '/catalogo/agencias-transporte/crear',
    }
    
    // Buscar ruta de creación correspondiente
    const createRoute = createRoutes[currentPath]
    
    if (createRoute) {
      navigate(createRoute)
    } else {
      // Si estamos en una subruta, intentar con la ruta base
      const basePath = Object.keys(createRoutes).find(route => currentPath.startsWith(route))
      if (basePath) {
        navigate(createRoutes[basePath])
      }
    }
  }, { description: 'Nuevo elemento', category: 'Acciones' })

  return (
    <KeyboardShortcutsHelp 
      show={showHelp} 
      onClose={() => setShowHelp(false)} 
    />
  )
}

function App() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:133',message:'App component RENDER',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion
  
  try {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <KeyboardProvider>
              <Router>
                <GlobalKeyboardShortcuts />
                <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
              <Route index element={<Dashboard />} />
              
              {/* Rutas de Logística */}
              <Route path="logistica/pulls" element={<PullsList />} />
              <Route path="logistica/pulls/crear" element={<PullsCreate />} />
              <Route path="logistica/pulls/:id" element={<PullsDetail />} />
              <Route path="logistica/pulls/:id/editar" element={<PullsEdit />} />
              <Route path="logistica/pulls/:id/agregar-paquetes" element={<PullsAddPackages />} />
              <Route path="logistica/batches" element={<BatchesList />} />
              <Route path="logistica/batches/crear" element={<BatchCreate />} />
              <Route path="logistica/batches/wizard" element={<BatchFormWizard />} />
              <Route path="logistica/batches/crear-con-sacas" element={<BatchWithPullsCreate />} />
              <Route path="logistica/batches/:id" element={<BatchDetail />} />
              <Route path="logistica/batches/:id/editar" element={<BatchEdit />} />
              <Route path="logistica/dispatches" element={<DispatchesList />} />
              <Route path="logistica/dispatches/crear" element={<DispatchCreate />} />
              <Route path="logistica/dispatches/:id" element={<DispatchDetail />} />
              <Route path="logistica/individuales" element={<IndividualPackagesList />} />
              <Route path="logistica/individuales/crear" element={<CreateIndividualPackage />} />
              <Route path="logistica/individuales/editar/:id" element={<EditIndividualPackage />} />
              
              {/* Rutas de Paquetes */}
              <Route path="paquetes" element={<PackagesList />} />
              <Route path="paquetes/crear" element={<PackagesForm />} />
              <Route path="paquetes/editar/:id" element={<PackagesForm />} />
              <Route path="paquetes/:id" element={<PackagesDetail />} />
              <Route path="paquetes/scanner" element={<BarcodeScanner />} />
              <Route path="paquetes/exportar" element={<PackageExport />} />
              <Route path="paquetes/importar" element={<ImportPackages />} />
              <Route path="paquetes/herramientas/cambio-lotes" element={<BatchUpdatePackages />} />
              
              {/* Rutas de Informes */}
              <Route path="reports" element={<ReportsList />} />
              <Route path="reports/dashboard" element={<ReportsDashboard />} />
              <Route path="reports/generate" element={<ReportGenerator />} />
              <Route path="reports/create" element={<ReportsCreate />} />
              <Route path="reports/scheduled" element={<ReportsScheduled />} />
              <Route path="reports/:id" element={<ReportsView />} />
              
              {/* Rutas de Catálogo */}
              <Route path="catalogo/agencias-transporte" element={<TransportAgenciesList />} />
              <Route path="catalogo/agencias-transporte/crear" element={<TransportAgencyForm />} />
              <Route path="catalogo/agencias-transporte/editar/:id" element={<TransportAgencyForm />} />
              <Route path="catalogo/agencias-transporte/:id" element={<TransportAgencyDetail />} />
              
              {/* Rutas de Herramientas */}
              <Route path="herramientas/mapeador-excel" element={<ExcelMapper />} />
            </Route>
          </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
            </Router>
          </KeyboardProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
    )
  } catch (error) {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/e032b260-3761-424c-8962-a2f280305add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.jsx:210',message:'App component ERROR',data:{errorMessage:error?.message,errorStack:error?.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
    // #endregion
    console.error('Error in App component:', error)
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <h1>Error en la aplicación</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    )
  }
}

export default App
