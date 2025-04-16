// DOM Elements
const searchInput = document.getElementById('searchInput');
const foldersList = document.getElementById('foldersList');
const notesGrid = document.getElementById('notesGrid');
const currentFolderTitle = document.getElementById('currentFolder');
const newFolderBtn = document.getElementById('newFolderBtn');
const newNoteBtn = document.getElementById('newNoteBtn');
const noteImageContainer = document.getElementById('noteImageContainer');
const noteImageContent = document.getElementById('noteImageContent');

// Modal Elements
const noteModal = document.getElementById('noteModal');
const folderModal = document.getElementById('folderModal');
const deleteModal = document.getElementById('deleteModal');
const deleteFolderModal = document.getElementById('deleteFolderModal');

// Note Modal Elements
const modalTitle = document.getElementById('modalTitle');
const noteTitleInput = document.getElementById('noteTitleInput');
const noteContentInput = document.getElementById('noteContentInput');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const exportNoteBtn = document.getElementById('exportNoteBtn');
const shareNoteBtn = document.getElementById('shareNoteBtn');
const closeNoteBtn = document.getElementById('closeNoteBtn');
const saveNoteBtn = document.getElementById('saveNoteBtn');

// Folder Modal Elements
const folderNameInput = document.getElementById('folderNameInput');
const closeFolderBtn = document.getElementById('closeFolderBtn');
const createFolderBtn = document.getElementById('createFolderBtn');

// Delete Modal Elements
const closeDeleteBtn = document.getElementById('closeDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Delete Folder Modal Elements
const closeDeleteFolderBtn = document.getElementById('closeDeleteFolderBtn');
const cancelDeleteFolderBtn = document.getElementById('cancelDeleteFolderBtn');
const confirmDeleteFolderBtn = document.getElementById('confirmDeleteFolderBtn');

// State
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let folders = JSON.parse(localStorage.getItem('folders')) || ['All Notes', 'Work', 'Personal', 'Ideas'];
let currentFolder = 'All Notes';
let currentNote = null;
let folderToDelete = null;

// Folder color mapping
const folderColors = {
    'All Notes': '#64748b', // Slate
    'Work': '#0ea5e9', // Sky blue
    'Personal': '#8b5cf6', // Violet
    'Ideas': '#10b981', // Emerald
    'Default': '#6366f1' // Indigo
};

// Get folder color
function getFolderColor(folderName) {
    return folderColors[folderName] || folderColors['Default'];
}

// Initialize
function init() {
    renderFolders();
    renderNotes();
    setupEventListeners();
}

// Folder Management
function renderFolders() {
    foldersList.innerHTML = folders.map(folder => `
        <li class="${folder === currentFolder ? 'active' : ''}" data-folder="${folder}">
            <div class="folder-content">
                <i class="fas fa-folder"></i>
                <span>${folder}</span>
            </div>
            ${folder !== 'All Notes' ? `<i class="fas fa-times folder-delete" data-folder="${folder}"></i>` : ''}
        </li>
    `).join('');

    // Add click listeners to folders
    foldersList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', (e) => {
            // Don't change folder if clicking on delete icon
            if (e.target.classList.contains('folder-delete')) {
                return;
            }
            
            currentFolder = li.dataset.folder;
            currentFolderTitle.textContent = currentFolder;
            renderFolders();
            renderNotes();
        });
    });

    // Add click listeners to delete icons
    foldersList.querySelectorAll('.folder-delete').forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent folder selection
            folderToDelete = icon.dataset.folder;
            showDeleteFolderModal();
        });
    });
}

// Note Management
function renderNotes(notesToRender = notes) {
    const filteredNotes = currentFolder === 'All Notes' 
        ? notesToRender 
        : notesToRender.filter(note => note.folder === currentFolder);

    notesGrid.innerHTML = filteredNotes.map(note => `
        <div class="note-card" data-id="${note.id}">
            <h3>${note.title}</h3>
            <p>${note.content}</p>
            <div class="note-meta">
                <span class="folder-tag">${note.folder}</span>
                <span class="timestamp">${new Date(note.lastModified).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');

    // Add click listeners to note cards
    notesGrid.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('click', () => {
            const noteId = card.dataset.id;
            const note = notes.find(n => n.id === noteId);
            if (note) {
                showNoteModal(note);
            }
        });
    });
}

// Modal Management
function showNoteModal(note = null) {
    currentNote = note;
    
    // Update modal content
    modalTitle.textContent = note ? 'Edit Note' : 'New Note';
    noteTitleInput.value = note ? note.title : '';
    noteContentInput.value = note ? note.content : '';
    
    // Show/hide action buttons
    deleteNoteBtn.style.display = note ? 'block' : 'none';
    exportNoteBtn.style.display = note ? 'block' : 'none';
    shareNoteBtn.style.display = note ? 'block' : 'none';
    
    noteModal.classList.add('active');
}

function showFolderModal() {
    folderNameInput.value = '';
    folderModal.classList.add('active');
}

function showDeleteModal() {
    deleteModal.classList.add('active');
}

function showDeleteFolderModal() {
    deleteFolderModal.classList.add('active');
}

function closeModals() {
    noteModal.classList.remove('active');
    folderModal.classList.remove('active');
    deleteModal.classList.remove('active');
    deleteFolderModal.classList.remove('active');
}

// Export Note as PDF
function exportNoteToPDF(note) {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set font styles
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    
    // Add title
    doc.text(note.title, 20, 20);
    
    // Add metadata
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Folder: ${note.folder}`, 20, 30);
    doc.text(`Last Modified: ${new Date(note.lastModified).toLocaleString()}`, 20, 35);
    
    // Add content
    doc.setFontSize(12);
    doc.setTextColor(0);
    
    // Split content into lines that fit the page width
    const contentLines = doc.splitTextToSize(note.content, 170);
    doc.text(contentLines, 20, 45);
    
    // Save the PDF
    doc.save(`${note.title}.pdf`);
}

// Share Note as PNG Image
async function shareNoteAsImage(note) {
    // Calculate optimal font size based on content length
    const contentLength = note.content.length;
    let titleSize = 32;
    let contentSize = 18;
    
    if (contentLength > 1000) {
        titleSize = 28;
        contentSize = 16;
    }
    if (contentLength > 2000) {
        titleSize = 24;
        contentSize = 14;
    }
    if (contentLength > 3000) {
        titleSize = 20;
        contentSize = 12;
    }

    const folderColor = getFolderColor(note.folder);

    // Create a styled version of the note for the image
    noteImageContent.innerHTML = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; height: 100%; display: flex; flex-direction: column; text-align: left;">
            <div style="flex: 0 0 auto; margin-bottom: 20px; text-align: left;">
                <h1 style="color: ${folderColor}; font-size: ${titleSize}px; margin-bottom: 15px; font-weight: 700; text-align: left; padding: 0;">${note.title}</h1>
                <div style="color: #64748b; font-size: ${contentSize}px; text-align: left; display: flex; align-items: center; gap: 12px;">
                    <span style="background-color: ${folderColor}20; color: ${folderColor}; padding: 4px 12px; border-radius: 6px; font-weight: 500;">${note.folder}</span>
                    <span>${new Date(note.lastModified).toLocaleString()}</span>
                </div>
            </div>
            <div style="flex: 1; position: relative; overflow: hidden; text-align: left;">
                <div style="color: #1e293b; font-size: ${contentSize}px; line-height: 1.6; white-space: pre-wrap; position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow-y: auto; padding-right: 10px; text-align: left;">
                    ${note.content}
                </div>
            </div>
            <div style="flex: 0 0 auto; margin-top: 20px; text-align: left; color: #94a3b8; font-size: ${contentSize}px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                Created with Vibrant Notes
            </div>
        </div>
    `;
    
    // Show the container temporarily for rendering
    noteImageContainer.style.display = 'block';
    
    try {
        // Use html2canvas to capture the note as an image
        const canvas = await html2canvas(noteImageContainer, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality
            logging: false,
            width: 800,
            height: 800,
            onclone: (clonedDoc) => {
                // Ensure the content is fully rendered before capture
                const container = clonedDoc.getElementById('noteImageContent');
                const contentDiv = container.querySelector('div:nth-child(2) > div');
                if (contentDiv.scrollHeight > contentDiv.clientHeight) {
                    // If content overflows, adjust the container to fit
                    contentDiv.style.height = 'auto';
                    contentDiv.style.position = 'relative';
                }
            }
        });
        
        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        
        // Create a file from the blob
        const file = new File([blob], `${note.title}.png`, { type: 'image/png' });
        
        // Share the file if the Web Share API is available
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: note.title,
                text: 'Check out my note from Vibrant Notes!',
                files: [file]
            });
        } else {
            // Fallback: Download the image
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${note.title}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Error sharing note as image:', error);
        alert('Failed to share note as image. Please try again.');
    } finally {
        // Hide the container again
        noteImageContainer.style.display = 'none';
    }
}

// Event Listeners
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) || 
            note.content.toLowerCase().includes(searchTerm)
        );
        renderNotes(filteredNotes);
    });

    // New Note Button
    newNoteBtn.addEventListener('click', () => showNoteModal());

    // New Folder Button
    newFolderBtn.addEventListener('click', () => showFolderModal());

    // Note Modal Buttons
    closeNoteBtn.addEventListener('click', closeModals);
    saveNoteBtn.addEventListener('click', () => {
        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();
        
        if (title && content) {
            if (currentNote) {
                // Update existing note
                currentNote.title = title;
                currentNote.content = content;
                currentNote.lastModified = new Date().toISOString();
            } else {
                // Create new note
                const newNote = {
                    id: Date.now().toString(),
                    title,
                    content,
                    folder: currentFolder,
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                notes.push(newNote);
            }
            
            localStorage.setItem('notes', JSON.stringify(notes));
            renderNotes();
            closeModals();
        }
    });

    deleteNoteBtn.addEventListener('click', () => {
        noteModal.classList.remove('active');
        showDeleteModal();
    });

    // Folder Modal Buttons
    closeFolderBtn.addEventListener('click', closeModals);
    createFolderBtn.addEventListener('click', () => {
        const folderName = folderNameInput.value.trim();
        if (folderName && !folders.includes(folderName)) {
            folders.push(folderName);
            localStorage.setItem('folders', JSON.stringify(folders));
            renderFolders();
            closeModals();
        }
    });

    // Delete Note Modal Buttons
    closeDeleteBtn.addEventListener('click', closeModals);
    cancelDeleteBtn.addEventListener('click', closeModals);
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentNote) {
            notes = notes.filter(note => note.id !== currentNote.id);
            localStorage.setItem('notes', JSON.stringify(notes));
            renderNotes();
            closeModals();
        }
    });

    // Delete Folder Modal Buttons
    closeDeleteFolderBtn.addEventListener('click', closeModals);
    cancelDeleteFolderBtn.addEventListener('click', closeModals);
    confirmDeleteFolderBtn.addEventListener('click', () => {
        if (folderToDelete && folderToDelete !== 'All Notes') {
            // Move notes from deleted folder to "All Notes"
            notes = notes.map(note => {
                if (note.folder === folderToDelete) {
                    return { ...note, folder: 'All Notes' };
                }
                return note;
            });
            
            // Remove the folder
            folders = folders.filter(folder => folder !== folderToDelete);
            
            // Update localStorage
            localStorage.setItem('notes', JSON.stringify(notes));
            localStorage.setItem('folders', JSON.stringify(folders));
            
            // If current folder was deleted, switch to "All Notes"
            if (currentFolder === folderToDelete) {
                currentFolder = 'All Notes';
                currentFolderTitle.textContent = currentFolder;
            }
            
            // Re-render UI
            renderFolders();
            renderNotes();
            closeModals();
        }
    });

    // Export Note
    exportNoteBtn.addEventListener('click', () => {
        if (currentNote) {
            exportNoteToPDF(currentNote);
        }
    });

    // Share Note
    shareNoteBtn.addEventListener('click', () => {
        if (currentNote) {
            shareNoteAsImage(currentNote);
        }
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init); 