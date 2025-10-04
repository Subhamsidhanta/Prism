import  { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Zap, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

const HardwareToggle = () => {
  const [hardwareInfo, setHardwareInfo] = useState({
    hardware_mode: 'CPU',
    gpu_available: false,
    gpu_layers: 0,
    model_loaded: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Fetch current hardware status
  const fetchHardwareStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/model/status')
      setHardwareInfo(response.data)
      setIsInitialLoad(false)
    } catch (error) {
      console.error('Failed to fetch hardware status:', error)
      if (isInitialLoad) {
        setIsInitialLoad(false)
      }
    }
  }

  // Toggle hardware mode
  const toggleHardware = async () => {
    if (!hardwareInfo.model_loaded) {
      toast.error('Model not loaded. Please wait for initialization.')
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post('http://localhost:8000/api/model/toggle-hardware')
      
      if (response.data.success) {
        setHardwareInfo(prev => ({
          ...prev,
          hardware_mode: response.data.current_mode,
          gpu_layers: response.data.gpu_layers || 0
        }))
        
        toast.success(response.data.message || `Switched to ${response.data.current_mode} mode`)
      } else {
        toast.error(response.data.error || 'Failed to toggle hardware mode')
      }
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error(error.response?.data?.detail || 'Failed to toggle hardware mode')
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh status
  const refreshStatus = () => {
    fetchHardwareStatus()
    toast.success('Status refreshed')
  }

  useEffect(() => {
    fetchHardwareStatus()
    // Refresh status every 10 seconds
    const interval = setInterval(fetchHardwareStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const isGpuMode = hardwareInfo.hardware_mode === 'GPU'
  const canToggle = hardwareInfo.gpu_available && hardwareInfo.model_loaded

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${isGpuMode ? 'bg-green-100' : 'bg-blue-100'}`}>
            {isGpuMode ? (
              <Zap className="w-5 h-5 text-green-600" />
            ) : (
              <Cpu className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <span>Hardware Control</span>
        </h3>
        
        <button
          onClick={refreshStatus}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status Display */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Mode:</span>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isGpuMode 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {hardwareInfo.hardware_mode}
            </span>
            {isGpuMode && hardwareInfo.gpu_layers > 0 && (
              <span className="text-xs text-gray-500">
                ({hardwareInfo.gpu_layers} layers)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">GPU Available:</span>
          <div className="flex items-center space-x-1">
            {hardwareInfo.gpu_available ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${
              hardwareInfo.gpu_available ? 'text-green-600' : 'text-red-600'
            }`}>
              {hardwareInfo.gpu_available ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Model Status:</span>
          <div className="flex items-center space-x-1">
            {hardwareInfo.model_loaded ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className={`text-sm ${
              hardwareInfo.model_loaded ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {hardwareInfo.model_loaded ? 'Loaded' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="space-y-3">
        <button
          onClick={toggleHardware}
          disabled={!canToggle || isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
            canToggle && !isLoading
              ? isGpuMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Switching...</span>
            </>
          ) : (
            <>
              {isGpuMode ? <Cpu className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              <span>
                Switch to {isGpuMode ? 'CPU' : 'GPU'} Mode
              </span>
            </>
          )}
        </button>

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center">
          {!hardwareInfo.gpu_available && (
            <p>⚠️ GPU not available - CPU mode only</p>
          )}
          {hardwareInfo.gpu_available && !hardwareInfo.model_loaded && (
            <p>⏳ Please wait for model to load</p>
          )}
          {canToggle && (
            <p>
              💡 {isGpuMode ? 'GPU mode provides faster responses' : 'CPU mode uses less power'}
            </p>
          )}
        </div>
      </div>

      {/* Performance Info */}
      {hardwareInfo.gpu_available && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">GPU Mode</div>
              <div className="text-green-600">⚡ 3-10x faster</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">CPU Mode</div>
              <div className="text-blue-600">🔋 Lower power</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default HardwareToggle