// Import database functions
import { uploadFileToDatabase } from './lib/database.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Function to switch tabs
    function switchTab(tabId) {
        // Hide all tab panes
        tabPanes.forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show the selected tab pane
        const selectedPane = document.getElementById(tabId);
        if (selectedPane) {
            selectedPane.classList.add('active');
        }
        
        // Add active class to the clicked tab button
        const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
    }

    // Add click event listeners to tab buttons
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Initialize first tab as active
    if (tabBtns.length > 0) {
        const firstTabId = tabBtns[0].getAttribute('data-tab');
        switchTab(firstTabId);
    }

    // File upload functionality
    initializeFileUploads();
    
    // Load saved files from localStorage
    loadSavedFiles();
});

// File upload management
function initializeFileUploads() {
    const uploadAreas = document.querySelectorAll('.file-upload-area');
    const fileInputs = document.querySelectorAll('input[type="file"]');

    // Initialize drag and drop for each upload area
    uploadAreas.forEach(area => {
        const section = area.getAttribute('data-section');
        const fileInput = document.getElementById(`${section}-file`);

        // Drag and drop events
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });

        area.addEventListener('dragleave', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            const validFiles = files.filter(file => 
                file.type === 'text/plain' || file.type === 'application/pdf'
            );
            
            if (validFiles.length > 0) {
                handleFileUpload(validFiles, section);
            } else {
                alert('Please upload only .txt or .pdf files.');
            }
        });

        // Click to upload
        area.addEventListener('click', () => {
            fileInput.click();
        });
    });

    // File input change events
    fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            const section = e.target.id.replace('-file', '');
            
            if (files.length > 0) {
                handleFileUpload(files, section);
            }
        });
    });
}

// Handle file upload and display
function handleFileUpload(files, section) {
    const filesContainer = document.getElementById(`${section}-files`);
    
    files.forEach(file => {
        // Check file type
        if (file.type !== 'text/plain' && file.type !== 'application/pdf') {
            alert(`File "${file.name}" is not a valid .txt or .pdf file.`);
            return;
        }

        // Check file size (5MB limit for database)
        if (file.size > 5 * 1024 * 1024) {
            alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
            return;
        }

        // Convert file to base64 and save to database
        const reader = new FileReader();
        reader.onload = async function(e) {
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                content: e.target.result,
                section: section
            };
            
            try {
                // Save to database
                const response = await uploadFileToDatabase(fileData);
                
                // Create and display file item at the top
                const fileItem = createFileItemFromData(response.file);
                filesContainer.insertBefore(fileItem, filesContainer.firstChild);
            } catch (error) {
                alert(`Error uploading file: ${error.message}`);
            }
        };
        reader.readAsDataURL(file);
    });
}

// Create file item HTML element from stored data
function createFileItemFromData(fileData) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileIcon = fileData.type === 'application/pdf' ? '📄' : '📝';
    const fileSize = formatFileSize(fileData.size);
    
    fileItem.setAttribute('data-file-id', fileData.id);
    
    fileItem.innerHTML = `
        <div class="file-info">
            <div class="file-icon">${fileIcon}</div>
            <div class="file-details">
                <div class="file-name">${fileData.name}</div>
                <div class="file-size">${fileSize}</div>
            </div>
        </div>
        <div class="file-actions">
            <button class="download-file" data-file-id="${fileData.id}">Download</button>
            <button class="remove-file">Remove</button>
        </div>
    `;
    
    // Add event listeners after creating the element
    const downloadBtn = fileItem.querySelector('.download-file');
    const removeBtn = fileItem.querySelector('.remove-file');
    
    downloadBtn.addEventListener('click', () => downloadFile(fileData.id));
    removeBtn.addEventListener('click', () => removeFile(removeBtn));
    
    return fileItem;
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Database management functions
async function loadSavedFiles() {
    try {
        const response = await fetch('/api/files');
        if (!response.ok) {
            throw new Error('Failed to fetch files');
        }
        
        const { files } = await response.json();
        
        // Group files by section and display them
        files.forEach(fileData => {
            const filesContainer = document.getElementById(`${fileData.section}-files`);
            if (filesContainer) {
                const fileItem = createFileItemFromData(fileData);
                filesContainer.appendChild(fileItem);
            }
        });
    } catch (error) {
        console.error('Error loading saved files:', error);
    }
}

async function removeFileFromDatabase(fileId) {
    try {
        const response = await fetch(`/api/files?id=${fileId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete file');
        }

        return await response.json();
    } catch (error) {
        console.error('Error removing file from database:', error);
        throw error;
    }
}

async function getFileFromDatabase(fileId) {
    try {
        const response = await fetch('/api/files');
        if (!response.ok) {
            throw new Error('Failed to fetch files');
        }
        
        const { files } = await response.json();
        return files.find(file => file.id === parseInt(fileId));
    } catch (error) {
        console.error('Error retrieving file from database:', error);
        return null;
    }
}

// Download file function
async function downloadFile(fileId) {
    try {
        const fileData = await getFileFromDatabase(fileId);
        if (!fileData) {
            alert('File not found.');
            return;
        }
        
        // Convert base64 back to blob
        const byteCharacters = atob(fileData.content.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: fileData.type });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        alert(`Error downloading file: ${error.message}`);
    }
}

// Remove file from list and database
async function removeFile(button) {
    const fileItem = button.closest('.file-item');
    const fileId = fileItem.getAttribute('data-file-id');
    
    try {
        // Remove from database
        await removeFileFromDatabase(fileId);
        
        // Remove from DOM
        fileItem.remove();
    } catch (error) {
        alert(`Error removing file: ${error.message}`);
    }
}
