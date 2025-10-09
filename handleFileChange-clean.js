  // Handle file upload - only supports text files for simplicity
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('[DEBUG] File upload started:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Only allow text files
    const allowedTypes = ['text/plain'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['txt'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('Only text files (.txt) are supported. Please upload a .txt file.');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for text files
      alert('File size too large. Maximum size is 10MB.');
      e.target.value = '';
      return;
    }

    setIsProcessingFile(true);

    try {
      // Read text file directly
      console.log('[DEBUG] Reading text file directly');
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target.result;
        console.log('[DEBUG] Text file content length:', content.length);
        setModuleText(content);
        alert(`Text file loaded successfully! Loaded ${content.length} characters.`);
        setIsProcessingFile(false);
      };
      
      reader.onerror = () => {
        console.error('[ERROR] Failed to read file');
        alert('Failed to read the text file. Please try again.');
        setIsProcessingFile(false);
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error('[ERROR] File processing error:', error);
      alert('Failed to process file. Please try again.');
      setIsProcessingFile(false);
    } finally {
      e.target.value = '';
    }
  };