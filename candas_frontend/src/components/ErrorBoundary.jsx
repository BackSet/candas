import React from 'react'
import Card from './ui/Card'
import Button from './ui/Button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Algo salió mal
                </h1>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
              </p>

              {this.state.error && (
                <div className="mb-4">
                  <details className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <summary className="cursor-pointer font-medium text-gray-900 dark:text-white mb-2">
                      Detalles del error
                    </summary>
                    <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReset} variant="primary">
                  <i className="fas fa-redo mr-2"></i>
                  Recargar página
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="ghost"
                >
                  <i className="fas fa-home mr-2"></i>
                  Ir al inicio
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

