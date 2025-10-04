import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, FileText, Upload, Bot, User, Copy, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import HardwareToggle from './HardwareToggle'

const DocumentQA = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState('')
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load uploaded documents on component mount
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/documents')
      const data = await response.json()
      if (data.success) {
        setUploadedDocuments(data.documents)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Document "${file.name}" uploaded and processed successfully!`)
        setUploadedDocuments(prev => [...prev, {
          file_id: data.file_id,
          file_name: data.metadata.file_name,
          num_pages: data.metadata.num_pages,
          num_chunks: data.metadata.num_chunks
        }])
        
        // Add system message
        const systemMessage = {
          id: Date.now(),
          type: 'system',
          content: `Document "${file.name}" has been processed and is ready for questions. It contains ${data.metadata.num_pages} pages and ${data.metadata.num_chunks} text chunks.`,
          timestamp: new Date().toLocaleTimeString()
        }
        setMessages(prev => [...prev, systemMessage])
      } else {
        toast.error(data.detail || 'Failed to upload document')
      }
    } catch (error) {
      toast.error('Error uploading document')
      console.error('Upload error:', error)
    } finally {
      setIsLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue,
          file_id: selectedDocument || null
        }),
      })

      const data = await response.json()
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.success ? data.answer : data.error || 'Sorry, I could not process your question.',
        sources: data.sources || [],
        chunks_used: data.chunks_used || 0,
        timestamp: new Date().toLocaleTimeString(),
        success: data.success
      }

      setMessages(prev => [...prev, assistantMessage])

      if (!data.success) {
        toast.error(data.error || 'Failed to get answer')
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, there was an error processing your question. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
        success: false
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('Error sending message')
      console.error('Send message error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const Message = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 px-1 sm:px-0`}
    >
      <div className={`max-w-xs sm:max-w-lg lg:max-w-3xl flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 sm:space-x-3 ${message.type === 'user' ? 'space-x-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
          message.type === 'user' 
            ? 'bg-primary-500 text-white' 
            : message.type === 'system'
            ? 'bg-gray-500 text-white'
            : 'bg-purple-500 text-white'
        }`}>
          {message.type === 'user' ? (
            <User className="w-4 h-4" />
          ) : message.type === 'system' ? (
            <FileText className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>
        
        <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 max-w-full ${
          message.type === 'user'
            ? 'bg-primary-500 text-white'
            : message.type === 'system'
            ? 'bg-gray-100 text-gray-700 border-l-2 sm:border-l-4 border-gray-400'
            : message.success 
            ? 'bg-white border border-gray-200 text-gray-900'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="whitespace-pre-wrap text-sm sm:text-base break-words">{message.content}</div>
          
          {/* Sources for assistant messages */}
          {message.type === 'assistant' && message.sources && message.sources.length > 0 && (
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Sources:</p>
              <div className="space-y-1 max-h-24 sm:max-h-32 overflow-y-auto">
                {message.sources.slice(0, 3).map((source, index) => (
                  <div key={index} className="text-xs bg-gray-50 rounded px-2 py-1 truncate">
                    📄 {source.file_name} - Page {source.page}
                  </div>
                ))}
                {message.sources.length > 3 && (
                  <div className="text-xs text-gray-500">+{message.sources.length - 3} more sources</div>
                )}
              </div>
              {message.chunks_used && (
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                  Based on {message.chunks_used} chunks
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-70 truncate flex-1">{message.timestamp}</span>
            {message.type === 'assistant' && (
              <div className="flex space-x-2 ml-2">
                <button
                  onClick={() => copyToClipboard(message.content)}
                  className="text-xs opacity-70 hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                  title="Copy message"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] max-w-full">
      {/* Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-b lg:border-r lg:border-b-0 border-gray-200 flex flex-col max-h-40 sm:max-h-48 lg:max-h-none">
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary-500 flex-shrink-0" />
            <span className="truncate">Document Q&A</span>
          </h2>
          
          {/* File Upload */}
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm lg:text-base py-2 lg:py-3 px-2 sm:px-3 lg:px-4"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden xs:inline">Upload Document</span>
              <span className="xs:hidden">Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
        
        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 hidden sm:block">
          <h3 className="font-medium text-gray-700 mb-2 lg:mb-3 text-xs sm:text-sm lg:text-base">Uploaded Documents</h3>
          {uploadedDocuments.length === 0 ? (
            <p className="text-gray-500 text-xs sm:text-sm">No documents uploaded yet</p>
          ) : (
            <div className="space-y-1 sm:space-y-2">
              <button
                onClick={() => setSelectedDocument('')}
                className={`w-full text-left p-2 sm:p-3 rounded-lg border transition-colors hover:scale-[1.02] active:scale-[0.98] ${
                  selectedDocument === '' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-xs sm:text-sm">All Documents</div>
                <div className="text-xs text-gray-500 hidden sm:block">Search across all uploaded files</div>
              </button>
              
              {uploadedDocuments.map((doc) => (
                <button
                  key={doc.file_id}
                  onClick={() => setSelectedDocument(doc.file_id)}
                  className={`w-full text-left p-2 sm:p-3 rounded-lg border transition-colors hover:scale-[1.02] active:scale-[0.98] ${
                    selectedDocument === doc.file_id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-xs sm:text-sm truncate" title={doc.file_name}>{doc.file_name}</div>
                  <div className="text-xs text-gray-500">
                    {doc.num_pages}p • {doc.num_chunks}c
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Hardware Toggle */}
        <div className="p-2 sm:p-3 lg:p-4 border-t border-gray-200 hidden lg:block">
          <HardwareToggle />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-3 sm:px-4 max-w-sm sm:max-w-md lg:max-w-lg">
                <Bot className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-3 lg:mb-4" />
                <h3 className="text-base sm:text-lg lg:text-xl font-medium text-gray-700 mb-2">Welcome to Document Q&A</h3>
                <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                  Upload PDF or DOCX documents and ask questions about their content. 
                  I'll use the Mistral 7B model to provide accurate answers based on your documents.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start mb-3 sm:mb-4 px-1 sm:px-0"
                >
                  <div className="max-w-xs sm:max-w-lg lg:max-w-3xl flex items-start space-x-2 sm:space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                      <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-purple-500" />
                        <span className="text-gray-600 text-sm sm:text-base">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-2 sm:p-3 lg:p-4 bg-white flex-shrink-0">
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-4">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={uploadedDocuments.length === 0 
                  ? "Upload a document first..." 
                  : "Ask a question about your documents..."
                }
                disabled={isLoading || uploadedDocuments.length === 0}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none text-sm sm:text-base transition-all"
                rows={window.innerWidth < 640 ? "1" : "2"}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim() || uploadedDocuments.length === 0}
              className="btn-primary flex items-center justify-center min-w-[40px] sm:min-w-[44px] lg:min-w-[50px] h-10 sm:h-12 lg:h-auto px-2 sm:px-3 lg:px-4 rounded-lg sm:rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
          
          {selectedDocument && (
            <div className="mt-2 text-xs sm:text-sm text-gray-600 truncate">
              <span className="hidden sm:inline">Asking about: </span>
              <span className="font-medium">
                {uploadedDocuments.find(d => d.file_id === selectedDocument)?.file_name || 'Selected document'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentQA