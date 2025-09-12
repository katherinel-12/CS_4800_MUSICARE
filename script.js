// Import database functions
import { uploadFileToDatabase } from './lib/database.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize popup functionality
    initializePopupSystem();
    
    // File upload functionality
    initializeFileUploads();
    
    // Load saved files from localStorage
    loadSavedFiles();
});

// Popup system for sidebar navigation
function initializePopupSystem() {
    const navItems = document.querySelectorAll('.nav-item');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupTitle = document.getElementById('popup-title');
    const popupBody = document.getElementById('popup-body');
    const closeBtn = document.getElementById('close-popup');
    
    // Section titles mapping
    const sectionTitles = {
        'about': 'About Us',
        'staff': 'Our Team', 
        'docs': 'Documentation',
        'sprints': 'Sprint Logs',
        'dailies': 'Daily Standups',
        'report': 'Project Report'
    };
    
    // Add click event listeners to navigation items
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            openPopup(tabId, sectionTitles[tabId]);
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Close popup functionality
    closeBtn.addEventListener('click', closePopup);
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            closePopup();
        }
    });
    
    // Close popup with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popupOverlay.classList.contains('active')) {
            closePopup();
        }
    });
    
    function openPopup(contentId, title) {
        const contentTemplate = document.getElementById(`${contentId}-content`);
        if (contentTemplate) {
            popupTitle.textContent = title;
            popupBody.innerHTML = contentTemplate.innerHTML;
            popupOverlay.classList.add('active');
            
            // Re-initialize file upload functionality for the popup content
            initializePopupFileUploads();
        }
    }
    
    function closePopup() {
        popupOverlay.classList.remove('active');
        // Remove active state from nav items
        navItems.forEach(nav => nav.classList.remove('active'));
    }
}

// File upload management
function initializeFileUploads() {
    setupFileUploadHandlers(document);
}

// Initialize file uploads specifically for popup content
function initializePopupFileUploads() {
    const popupBody = document.getElementById('popup-body');
    setupFileUploadHandlers(popupBody);
}

// Setup file upload handlers for a given container
function setupFileUploadHandlers(container) {
    const uploadAreas = container.querySelectorAll('.file-upload-area');
    const fileInputs = container.querySelectorAll('input[type="file"]');

    // Initialize drag and drop for each upload area
    uploadAreas.forEach(area => {
        const section = area.getAttribute('data-section');
        const fileInput = container.querySelector(`#${section}-file`);
        
        if (!fileInput) return;

        // Remove existing event listeners to prevent duplicates
        area.replaceWith(area.cloneNode(true));
        const newArea = container.querySelector(`[data-section="${section}"]`);
        const newFileInput = container.querySelector(`#${section}-file`);

        // Drag and drop events
        newArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            newArea.classList.add('dragover');
        });

        newArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            newArea.classList.remove('dragover');
        });

        newArea.addEventListener('drop', (e) => {
            e.preventDefault();
            newArea.classList.remove('dragover');
            
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
        newArea.addEventListener('click', () => {
            newFileInput.click();
        });
        
        // File input change event
        newFileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            
            if (files.length > 0) {
                handleFileUpload(files, section);
            }
        });
    });
}

// Handle file upload and display
function handleFileUpload(files, section) {
    // Try to find the files container in both the main document and popup
    let filesContainer = document.getElementById(`${section}-files`);
    if (!filesContainer) {
        // Look in the popup body
        const popupBody = document.getElementById('popup-body');
        if (popupBody) {
            filesContainer = popupBody.querySelector(`#${section}-files`);
        }
    }
    
    if (!filesContainer) {
        console.error(`Files container not found for section: ${section}`);
        return;
    }
    
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
                
                // Also update the corresponding container in the main document if we're in a popup
                const mainContainer = document.getElementById(`${section}-files`);
                if (mainContainer && mainContainer !== filesContainer) {
                    const mainFileItem = createFileItemFromData(response.file);
                    mainContainer.insertBefore(mainFileItem, mainContainer.firstChild);
                }
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
        
        // Group files by section and display them in hidden templates
        files.forEach(fileData => {
            const templateContainer = document.querySelector(`#${fileData.section}-content .uploaded-files`);
            if (templateContainer) {
                const fileItem = createFileItemFromData(fileData);
                templateContainer.appendChild(fileItem);
            }
        });
    } catch (error) {
        console.error('Error loading saved files:', error);
    }
}

async function removeFileFromDatabase(fileId) {
    try {
        console.log('Attempting to delete file with ID:', fileId);
        const response = await fetch(`/api/files?id=${fileId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const responseData = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            console.error('Delete failed:', response.status, responseData);
            throw new Error(responseData.error || `Failed to delete file: ${response.statusText}`);
        }

        console.log('Delete successful:', responseData);
        return responseData;
    } catch (error) {
        console.error('Error in removeFileFromDatabase:', error);
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
        // Convert both IDs to strings for comparison to ensure type consistency
        return files.find(file => String(file.id) === String(fileId));
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
    if (!fileItem) {
        console.error('Could not find parent file item');
        return;
    }
    
    const fileId = fileItem.getAttribute('data-file-id');
    if (!fileId) {
        console.error('No file ID found for removal');
        console.log('File item attributes:', fileItem.attributes);
        return;
    }
    
    console.log('Removing file with ID:', fileId);
    
    try {
        // Remove from database
        console.log('Calling removeFileFromDatabase with ID:', fileId);
        await removeFileFromDatabase(fileId);
        
        // Remove from DOM
        console.log('Removing file item from DOM');
        fileItem.remove();
        console.log('File removed successfully');
    } catch (error) {
        console.error('Error in removeFile:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        alert(`Error removing file: ${error.message}`);
    }
}
