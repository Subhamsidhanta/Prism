import  { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Mic, Sparkles } from 'lucide-react'

const SearchInterface = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('')
  const [isVoiceActive, setIsVoiceActive] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim() && onSearch) {
      onSearch(query.trim())
    }
  }

  const suggestedQueries = [
    "Find budget information in my documents",
    "What are the project timelines?",
    "Summarize the key conclusions",
    "Show me any risk assessments"
  ]

  return (
    <div className="search-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 md:mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-3 md:mb-4 px-2">
          Search Across Your Documents
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base px-2">
          Ask questions in natural language and find insights across all your uploaded documents, images, and audio files.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="mb-6 md:mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your documents..."
            className="w-full pl-10 md:pl-12 pr-20 md:pr-32 py-3 md:py-4 text-base md:text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            disabled={isLoading}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-1 md:pr-2 space-x-1">
            <button
              type="button"
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isVoiceActive 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <Mic className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base px-3 md:px-4 py-2"
            >
              {isLoading ? (
                <div className="flex items-center space-x-1 md:space-x-2">
                  <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Searching...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Search</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Queries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        {suggestedQueries.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setQuery(suggestion)}
            className="text-left p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
          >
            <div className="flex items-center space-x-2">
              <Search className="h-3 w-3 md:h-4 md:w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 text-xs md:text-sm leading-tight">{suggestion}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default SearchInterface