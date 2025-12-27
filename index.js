// State management
let state = {
    imageHistory: [],
    maxHistory: 12,
    autoMode: true,
    interval: 3000,
    intervalId: null,
    favorites: new Set(),
    currentImageUrl: '',
    isFullscreen: false
};

// DOM Elements
const elements = {
    imageElement: document.getElementById('picsumImage'),
    generateBtn: document.getElementById('generateBtn'),
    toggleModeBtn: document.getElementById('toggleMode'),
    intervalRange: document.getElementById('intervalRange'),
    intervalValue: document.getElementById('intervalValue'),
    downloadBtn: document.getElementById('downloadBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    favoriteBtn: document.getElementById('favoriteBtn'),
    shareBtn: document.getElementById('shareBtn'),
    historyGrid: document.getElementById('historyGrid'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    imageDetails: document.getElementById('imageDetails')
};

// ======================
// CORE FUNCTIONS
// ======================

/**
 * Generate a random image URL with timestamp to prevent caching
 */
function generateRandomImageUrl() {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    return `https://picsum.photos/1024/500?${timestamp}-${randomId}`;
}

/**
 * Preload an image to ensure it's loaded before display
 */
function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Update the image element with smooth transition
 */
async function updateImageElement(imageUrl) {
    // Store current URL
    state.currentImageUrl = imageUrl;
    
    // Hide current image with fade out
    elements.imageElement.classList.remove('fade-in');
    elements.imageElement.style.opacity = '0';
    
    // Wait for transition
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Set new image source
    elements.imageElement.src = imageUrl;
    
    // Show new image with fade in
    setTimeout(() => {
        elements.imageElement.classList.add('fade-in');
        elements.imageElement.style.opacity = '1';
    }, 50);
}

/**
 * Get and display a random image
 */
async function getRandomImages() {
    try {
        // Show loading state
        showLoading();
        
        // Generate and preload image
        const imageUrl = generateRandomImageUrl();
        await preloadImage(imageUrl);
        
        // Update image element
        await updateImageElement(imageUrl);
        
        // Add to history
        addToHistory(imageUrl);
        
        // Update image details
        updateImageDetails();
        
        // Show success notification
        showNotification('New image loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error loading image:', error);
        showNotification('Failed to load image. Please try again.', 'error');
    }
}

/**
 * Show loading state
 */
function showLoading() {
    elements.imageDetails.textContent = 'Loading new image...';
}

/**
 * Add image URL to history
 */
function addToHistory(imageUrl) {
    // Create thumbnail object
    const thumbnail = {
        url: imageUrl,
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now()
    };

    // Add to beginning of history array
    state.imageHistory.unshift(thumbnail);

    // Limit history size
    if (state.imageHistory.length > state.maxHistory) {
        state.imageHistory.pop();
    }

    // Update history display
    updateHistoryDisplay();
    
    // Save to localStorage
    saveHistory();
}

/**
 * Update the history display with thumbnails
 */
function updateHistoryDisplay() {
    elements.historyGrid.innerHTML = '';
    
    state.imageHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <img src="${item.url}" alt="Recent image ${index + 1}" 
                 data-url="${item.url}"
                 title="Loaded at ${item.timestamp}">
        `;
        
        // Click to load this image
        historyItem.addEventListener('click', (e) => {
            const url = e.currentTarget.querySelector('img').dataset.url;
            loadHistoryImage(url);
        });
        
        elements.historyGrid.appendChild(historyItem);
    });
}

/**
 * Load a specific image from history
 */
function loadHistoryImage(url) {
    elements.imageElement.src = url;
    state.currentImageUrl = url;
    elements.imageElement.classList.add('fade-in');
    showNotification('Image loaded from history', 'info');
}

/**
 * Start auto mode for image generation
 */
function startAutoMode() {
    // Clear any existing interval
    if (state.intervalId) {
        clearInterval(state.intervalId);
    }
    
    // Set new interval
    state.intervalId = setInterval(() => {
        getRandomImages();
    }, state.interval);
    
    // Update button UI
    elements.toggleModeBtn.innerHTML = '<i class="fas fa-pause"></i> Auto Mode: ON';
    elements.toggleModeBtn.classList.remove('off');
    state.autoMode = true;
}

/**
 * Stop auto mode
 */
function stopAutoMode() {
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
    
    // Update button UI
    elements.toggleModeBtn.innerHTML = '<i class="fas fa-play"></i> Auto Mode: OFF';
    elements.toggleModeBtn.classList.add('off');
    state.autoMode = false;
}

/**
 * Toggle auto mode on/off
 */
function toggleAutoMode() {
    if (state.autoMode) {
        stopAutoMode();
    } else {
        startAutoMode();
    }
}

/**
 * Update the auto mode interval
 */
function updateInterval(value) {
    state.interval = value * 1000;
    elements.intervalValue.textContent = value;
    
    // Restart auto mode with new interval
    if (state.autoMode) {
        startAutoMode();
    }
    
    showNotification(`Auto mode interval set to ${value} seconds`, 'info');
}

/**
 * Download the current image
 */
function downloadImage() {
    if (!state.currentImageUrl) return;
    
    const link = document.createElement('a');
    link.href = state.currentImageUrl;
    link.download = `random-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Image download started!', 'success');
}

/**
 * Toggle fullscreen mode for the image
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        elements.imageElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
        elements.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        state.isFullscreen = true;
    } else {
        document.exitFullscreen();
        elements.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        state.isFullscreen = false;
    }
}

/**
 * Toggle favorite status for current image
 */
function toggleFavorite() {
    if (!state.currentImageUrl) return;
    
    if (state.favorites.has(state.currentImageUrl)) {
        state.favorites.delete(state.currentImageUrl);
        elements.favoriteBtn.classList.remove('active');
        elements.favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
        showNotification('Removed from favorites', 'info');
    } else {
        state.favorites.add(state.currentImageUrl);
        elements.favoriteBtn.classList.add('active');
        elements.favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
        showNotification('Added to favorites!', 'success');
    }
}

/**
 * Share the current image
 */
function shareImage() {
    if (!navigator.share) {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(state.currentImageUrl).then(() => {
            showNotification('Image URL copied to clipboard!', 'success');
        });
        return;
    }

    navigator.share({
        title: 'Random Beautiful Image',
        text: 'Check out this amazing random image!',
        url: state.currentImageUrl,
    })
    .then(() => showNotification('Thanks for sharing!', 'success'))
    .catch(error => console.error('Error sharing:', error));
}

/**
 * Update image details display
 */
function updateImageDetails() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString();
    
    elements.imageDetails.textContent = `Loaded on ${dateString} at ${timeString}`;
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    elements.notificationText.textContent = message;
    
    // Set color based on type
    const colors = {
        'success': '#27ae60',
        'error': '#e74c3c',
        'info': '#3498db'
    };
    
    elements.notification.style.background = colors[type] || colors.info;
    
    // Show notification with animation
    elements.notification.classList.add('show');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

/**
 * Save history to localStorage
 */
function saveHistory() {
    try {
        localStorage.setItem('imageHistory', JSON.stringify(state.imageHistory));
    } catch (error) {
        console.error('Error saving history:', error);
    }
}

/**
 * Load history from localStorage
 */
function loadHistory() {
    try {
        const saved = localStorage.getItem('imageHistory');
        if (saved) {
            state.imageHistory = JSON.parse(saved);
            updateHistoryDisplay();
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Spacebar - Generate new image
        if (e.code === 'Space') {
            e.preventDefault();
            getRandomImages();
        }
        // A key - Toggle auto mode
        if (e.code === 'KeyA') {
            toggleAutoMode();
        }
        // Escape - Exit fullscreen
        if (e.code === 'Escape' && state.isFullscreen) {
            toggleFullscreen();
        }
    });
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Generate button
    elements.generateBtn.addEventListener('click', getRandomImages);
    
    // Auto mode toggle
    elements.toggleModeBtn.addEventListener('click', toggleAutoMode);
    
    // Interval slider
    elements.intervalRange.addEventListener('input', (e) => 
        updateInterval(e.target.value));
    
    // Action buttons
    elements.downloadBtn.addEventListener('click', downloadImage);
    elements.fullscreenBtn.addEventListener('click', toggleFullscreen);
    elements.favoriteBtn.addEventListener('click', toggleFavorite);
    elements.shareBtn.addEventListener('click', shareImage);
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Handle fullscreen change
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && state.isFullscreen) {
            elements.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            state.isFullscreen = false;
        }
    });
}

/**
 * Initialize the application
 */
function initializeApp() {
    // Setup all event listeners
    setupEventListeners();
    
    // Load history from localStorage
    loadHistory();
    
    // Load first image
    getRandomImages();
    
    // Start auto mode
    startAutoMode();
    
    // Log instructions
    console.log('%c✨ Random Image Generator ✨', 'color: #3498db; font-size: 24px; font-weight: bold;');
    console.log('%c🚀 Shortcuts:', 'color: #2ecc71; font-size: 16px;');
    console.log('%c• Spacebar - Generate new image', 'color: #666;');
    console.log('%c• A - Toggle auto mode', 'color: #666;');
    console.log('%c• Escape - Exit fullscreen', 'color: #666;');
}

// ======================
// APPLICATION START
// ======================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, stop auto mode
        stopAutoMode();
    } else if (state.autoMode) {
        // Page is visible again, restart auto mode
        startAutoMode();
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (state.intervalId) {
        clearInterval(state.intervalId);
    }
});