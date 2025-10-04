import { motion } from 'framer-motion'
import { FileText, Image, Mic, ExternalLink, Star, Clock } from 'lucide-react'

const ResultsDisplay = ({ results }) => {
  if (!results || results.length === 0) {
    return null
  }

  const getIcon = (type) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4 md:w-5 md:h-5 text-red-500 flex-shrink-0" />
      case 'image':
        return <Image className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
      case 'audio':
        return <Mic className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
      default:
        return <FileText className="w-4 h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
    }
  }

  const getRelevanceColor = (score) => {
    if (score >= 0.9) return 'text-green-600 bg-green-100'
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getRelevanceLabel = (score) => {
    if (score >= 0.9) return 'Highly Relevant'
    if (score >= 0.7) return 'Relevant'
    return 'Somewhat Relevant'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="search-container"
    >
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between mb-3 sm:mb-4 md:mb-6 gap-2">
        <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">
          Search Results ({results.length})
        </h2>
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Search completed in 2.3s</span>
          <span className="xs:hidden">2.3s</span>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        {results.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 card-hover overflow-hidden"
          >
            <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
              <div className="flex-shrink-0">
                {getIcon(result.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col xs:flex-row xs:items-start sm:items-center xs:justify-between mb-2 sm:mb-3 gap-2">
                  <h3 className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 line-clamp-2 flex-1 min-w-0">
                    {result.title}
                  </h3>
                  
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getRelevanceColor(result.relevanceScore)}`}>
                      <span className="hidden md:inline">{getRelevanceLabel(result.relevanceScore)}</span>
                      <span className="md:hidden">{result.relevanceScore.toFixed(2)}</span>
                    </span>
                    <div className="hidden md:flex items-center space-x-1">
                      <Star className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-400 fill-current" />
                      <span className="text-xs lg:text-sm font-medium">{result.relevanceScore.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-2 sm:mb-3 lg:mb-4 leading-relaxed line-clamp-2 sm:line-clamp-3 lg:line-clamp-none">
                  {result.content}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate max-w-32 sm:max-w-none">{result.source}</span>
                    </span>
                    
                    {result.page && (
                      <span className="whitespace-nowrap">Page {result.page}</span>
                    )}
                    
                    {result.timestamp && (
                      <span className="whitespace-nowrap hidden sm:inline">Time {result.timestamp}</span>
                    )}
                    
                    {result.boundingBox && (
                      <span className="whitespace-nowrap hidden md:inline">Region ({result.boundingBox.x}, {result.boundingBox.y})</span>
                    )}
                  </div>
                  
                  {result.citations && result.citations.length > 0 && (
                    <div className="flex flex-col xs:flex-row xs:items-center space-y-1 xs:space-y-0 xs:space-x-2">
                      <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">Citations:</span>
                      <div className="flex flex-wrap gap-1">
                        {result.citations.slice(0, 3).map((citation, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium"
                          >
                            [{citation}]
                          </span>
                        ))}
                        {result.citations.length > 3 && (
                          <span className="text-xs text-gray-400">+{result.citations.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 sm:mt-6 lg:mt-8 grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4"
      >
        <div className="bg-blue-50 rounded-lg p-2 sm:p-4 text-center">
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-blue-600">
            {results.filter(r => r.type === 'document').length}
          </div>
          <div className="text-xs sm:text-sm lg:text-base text-blue-600">Documents</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-2 sm:p-4 text-center">
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-green-600">
            {results.filter(r => r.type === 'image').length}
          </div>
          <div className="text-xs sm:text-sm lg:text-base text-green-600">Images</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-2 sm:p-4 text-center">
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-purple-600">
            {results.filter(r => r.type === 'audio').length}
          </div>
          <div className="text-xs sm:text-sm lg:text-base text-purple-600">Audio Files</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ResultsDisplay