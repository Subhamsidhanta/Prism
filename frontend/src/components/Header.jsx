import { motion } from 'framer-motion'
import { Brain, Menu } from 'lucide-react'

const Header = ({ onMenuToggle }) => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 relative z-50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-4 h-4 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold gradient-text">Prism</h1>
            <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Multimodal RAG System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="text-xs md:text-sm text-gray-600">
            <span className="font-medium hidden sm:inline">Status:</span>
            <span className="ml-0 sm:ml-1 text-green-600">Online</span>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default Header