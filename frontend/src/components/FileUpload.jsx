import  { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Image, Mic, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const FileUpload = ({ onFileUpload, uploadedFiles }) => {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const uploadPromises = acceptedFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8000/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Upload failed');
        }

        const result = await response.json();
        toast.success(`${file.name} uploaded successfully!`);
        return { ...file, ...result }; // Combine file info with backend response
      } catch (error) {
        toast.error(`Upload failed for ${file.name}: ${error.message}`);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result !== null);
      
      if (onFileUpload) {
        onFileUpload(successfulUploads);
      }
    } finally {
      setUploading(false);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'audio/*': ['.mp3', '.wav', '.m4a']
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024 // 100MB
  })

  const getFileIcon = (type) => {
    if (type.includes('image')) return <Image className="w-6 h-6 md:w-8 md:h-8 text-blue-500 flex-shrink-0" />
    if (type.includes('audio')) return <Mic className="w-6 h-6 md:w-8 md:h-8 text-green-500 flex-shrink-0" />
    return <FileText className="w-6 h-6 md:w-8 md:h-8 text-red-500 flex-shrink-0" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="search-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 md:mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-3 md:mb-4 px-2">
          Upload Your Documents
        </h2>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto px-2">
          Upload PDFs, Word documents, images, and audio files. All processing happens locally on your device.
        </p>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-6 md:p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-3 md:space-y-4">
          {uploading ? (
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          ) : (
            <Upload className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
          )}
          
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
              {uploading ? 'Uploading...' : isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </h3>
            <p className="text-sm md:text-base text-gray-500 mb-3 md:mb-4">
              or click to browse
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
              <div className="flex items-center space-x-1 md:space-x-2">
                <FileText className="w-3 h-3 md:w-4 md:h-4" />
                <span>PDF, DOCX</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <Image className="w-3 h-3 md:w-4 md:h-4" />
                <span>Images</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <Mic className="w-3 h-3 md:w-4 md:h-4" />
                <span>Audio</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-2">
              Maximum file size: 100MB
            </p>
          </div>
        </div>
      </motion.div>

      {/* Uploaded Files List */}
      {uploadedFiles && uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Uploaded Files ({uploadedFiles.length})</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 card-hover"
              >
                <div className="flex items-start space-x-3">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-full"></div>
                      </div>
                      <p className="text-xs text-green-600 mt-1">Processed</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default FileUpload