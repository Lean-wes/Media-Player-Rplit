// Audio context and elements
let audioContext;
let audioElement;
let audioSource;
let analyser;

// Playlist and current track
let playlist = [];
let currentTrackIndex = -1;
let isPlaying = false;
let isMuted = false;
let currentVolume = 0.7;
let selectedFilesArray = [];

// UI Elements
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const muteBtn = document.getElementById('muteBtn');
const progressBar = document.getElementById('progressBar');
const progressBarFill = document.getElementById('progressBarFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeSlider = document.querySelector('.wmp-volume-slider');
const volumeLevel = document.getElementById('volumeLevel');
const playlistItems = document.getElementById('playlistItems');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const nowPlayingArtist = document.getElementById('nowPlayingArtist');
const albumArt = document.getElementById('albumArt');
const statusMessage = document.getElementById('statusMessage');
const fileCount = document.getElementById('fileCount');
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const selectedFiles = document.getElementById('selectedFiles');
const enqueueButton = document.getElementById('enqueueButton');
const visualizer = document.getElementById('visualizer');

// Generate visualizer bars
for (let i = 0; i < 60; i++) {
    const bar = document.createElement('div');
    bar.className = 'wmp-visualizer-bar';
    visualizer.appendChild(bar);
}

// Initialize audio context when user interacts
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioSource = audioContext.createMediaElementSource(audioElement);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Start visualizer animation
        animateVisualizer();
    }
}

// Format time in seconds to MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Update progress bar during playback
function updateProgress() {
    if (audioElement.duration && !isNaN(audioElement.duration)) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressBarFill.style.width = `${progress}%`;
        currentTimeEl.textContent = formatTime(audioElement.currentTime);
        totalTimeEl.textContent = formatTime(audioElement.duration);
    }
    
    if (isPlaying) {
        requestAnimationFrame(updateProgress);
    }
}

// Animate visualizer
function animateVisualizer() {
    if (audioContext && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        const bars = document.querySelectorAll('.wmp-visualizer-bar');
        bars.forEach((bar, index) => {
            const value = dataArray[index] || 0;
            const height = (value / 255) * 100;
            bar.style.height = `${Math.max(5, height)}px`;
        });
    } else {
        // Random animation when not playing
        const bars = document.querySelectorAll('.wmp-visualizer-bar');
        bars.forEach(bar => {
            const height = Math.random() * 20 + 5;
            bar.style.height = `${height}px`;
        });
    }
    
    requestAnimationFrame(animateVisualizer);
}

// Play current track
function playCurrentTrack() {
    if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length) {
        const track = playlist[currentTrackIndex];
        audioElement.src = track.url;
        audioElement.volume = currentVolume;
        
        audioElement.play().then(() => {
            isPlaying = true;
            showPlayButton(false);
            updateNowPlaying(track);
            updatePlaylistHighlight();
            statusMessage.textContent = `Playing: ${track.title}`;
            updateProgress();
            initAudio();
        }).catch(error => {
            console.error('Error playing audio:', error);
            statusMessage.textContent = 'Error playing file';
        });
    }
}

// Update now playing display
function updateNowPlaying(track) {
    nowPlayingTitle.textContent = track.title;
    nowPlayingArtist.textContent = track.artist || 'Unknown Artist';
    
    // Try to extract and display album art
    if (track.file && track.file.type.startsWith('audio/')) {
        // For now, show a music icon
        albumArt.innerHTML = `
            <svg class="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18V5L21 3V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
                <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
        `;
    }
}

// Show/hide play/pause buttons
function showPlayButton(show) {
    if (show) {
        playBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
    } else {
        playBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
    }
}

// Update playlist highlight
function updatePlaylistHighlight() {
    const items = document.querySelectorAll('.wmp-playlist-item');
    items.forEach((item, index) => {
        if (index === currentTrackIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Add track to playlist
function addToPlaylist(file) {
    const track = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Unknown Artist',
        duration: '0:00',
        url: URL.createObjectURL(file),
        file: file
    };
    
    playlist.push(track);
    
    // Get duration
    const tempAudio = new Audio(track.url);
    tempAudio.addEventListener('loadedmetadata', () => {
        track.duration = formatTime(tempAudio.duration);
        renderPlaylist();
    });
    
    renderPlaylist();
}

// Render playlist
function renderPlaylist() {
    playlistItems.innerHTML = '';
    
    playlist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'wmp-playlist-item';
        item.innerHTML = `
            <div>${index + 1}</div>
            <div>${track.title}</div>
            <div>${track.artist}</div>
            <div>${track.duration}</div>
        `;
        
        item.addEventListener('click', () => {
            currentTrackIndex = index;
            playCurrentTrack();
        });
        
        playlistItems.appendChild(item);
    });
    
    fileCount.textContent = `${playlist.length} files`;
}

// Handle file uploads
function handleFiles(files) {
    selectedFilesArray = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || file.type.startsWith('video/')
    );
    
    if (selectedFilesArray.length > 0) {
        selectedFiles.innerHTML = selectedFilesArray.map(file => 
            `<div class="py-1">${file.name}</div>`
        ).join('');
        enqueueButton.classList.remove('hidden');
        statusMessage.textContent = `${selectedFilesArray.length} files selected`;
    } else {
        selectedFiles.textContent = 'No valid audio/video files selected';
        enqueueButton.classList.add('hidden');
    }
}

// Event Listeners

// Transport controls
playBtn.addEventListener('click', () => {
    if (currentTrackIndex >= 0) {
        playCurrentTrack();
    } else if (playlist.length > 0) {
        currentTrackIndex = 0;
        playCurrentTrack();
    } else {
        statusMessage.textContent = 'No tracks in playlist';
    }
});

pauseBtn.addEventListener('click', () => {
    audioElement.pause();
    isPlaying = false;
    showPlayButton(true);
    statusMessage.textContent = 'Paused';
});

stopBtn.addEventListener('click', () => {
    audioElement.pause();
    audioElement.currentTime = 0;
    isPlaying = false;
    showPlayButton(true);
    statusMessage.textContent = 'Stopped';
});

prevBtn.addEventListener('click', () => {
    if (currentTrackIndex > 0) {
        currentTrackIndex--;
        playCurrentTrack();
    } else if (playlist.length > 0) {
        currentTrackIndex = playlist.length - 1;
        playCurrentTrack();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentTrackIndex < playlist.length - 1) {
        currentTrackIndex++;
        playCurrentTrack();
    } else if (playlist.length > 0) {
        currentTrackIndex = 0;
        playCurrentTrack();
    }
});

// Progress bar
progressBar.addEventListener('click', (e) => {
    if (audioElement.duration) {
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        audioElement.currentTime = percentage * audioElement.duration;
    }
});

// Volume control
volumeSlider.addEventListener('click', (e) => {
    const rect = volumeSlider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    currentVolume = Math.max(0, Math.min(1, percentage));
    audioElement.volume = currentVolume;
    volumeLevel.style.width = `${currentVolume * 100}%`;
    
    updateVolumeIcon();
});

function updateVolumeIcon() {
    if (isMuted || currentVolume === 0) {
        muteBtn.innerHTML = `
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor"/>
                <path d="M23 9L17 15M17 9L23 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    } else {
        muteBtn.innerHTML = `
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor"/>
                <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" stroke-width="2"/>
                <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="currentColor" stroke-width="2"/>
            </svg>
        `;
    }
}

muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    audioElement.muted = isMuted;
    updateVolumeIcon();
});

// Tab switching
document.querySelectorAll('.wmp-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const contentId = tab.getAttribute('data-content');
        
        // Update tab states
        document.querySelectorAll('.wmp-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.wmp-tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(contentId).classList.add('active');
    });
});

// Sidebar navigation
document.querySelectorAll('.wmp-nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', () => {
        const tabName = item.getAttribute('data-tab');
        
        // Update nav states
        document.querySelectorAll('.wmp-nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Show corresponding tab content
        if (tabName === 'upload') {
            document.querySelectorAll('.wmp-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.wmp-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById('upload').classList.add('active');
        }
    });
});

// File input
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag and drop functionality
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

// Enqueue button
enqueueButton.addEventListener('click', () => {
    selectedFilesArray.forEach(file => addToPlaylist(file));
    selectedFilesArray = [];
    selectedFiles.textContent = 'Files added to playlist';
    enqueueButton.classList.add('hidden');
    statusMessage.textContent = `${playlist.length} files in playlist`;
    
    // Switch to playlist tab
    document.querySelectorAll('.wmp-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.wmp-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-content="playlist"]').classList.add('active');
    document.getElementById('playlist').classList.add('active');
});

// Audio events
audioElement.addEventListener('ended', () => {
    if (currentTrackIndex < playlist.length - 1) {
        currentTrackIndex++;
        playCurrentTrack();
    } else {
        isPlaying = false;
        showPlayButton(true);
        statusMessage.textContent = 'Playlist ended';
    }
});

audioElement.addEventListener('loadedmetadata', () => {
    if (audioElement.duration) {
        totalTimeEl.textContent = formatTime(audioElement.duration);
    }
});

audioElement.addEventListener('timeupdate', () => {
    if (isPlaying) {
        updateProgress();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            if (isPlaying) {
                pauseBtn.click();
            } else {
                playBtn.click();
            }
            break;
        case 'ArrowRight':
            if (e.ctrlKey) {
                e.preventDefault();
                nextBtn.click();
            }
            break;
        case 'ArrowLeft':
            if (e.ctrlKey) {
                e.preventDefault();
                prevBtn.click();
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            currentVolume = Math.min(1, currentVolume + 0.1);
            audioElement.volume = currentVolume;
            volumeLevel.style.width = `${currentVolume * 100}%`;
            updateVolumeIcon();
            break;
        case 'ArrowDown':
            e.preventDefault();
            currentVolume = Math.max(0, currentVolume - 0.1);
            audioElement.volume = currentVolume;
            volumeLevel.style.width = `${currentVolume * 100}%`;
            updateVolumeIcon();
            break;
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get audio element from HTML
    audioElement = document.getElementById('audioPlayer');
    
    // Set initial values
    audioElement.volume = currentVolume;
    volumeLevel.style.width = `${currentVolume * 100}%`;
    updateVolumeIcon();
    animateVisualizer();
    statusMessage.textContent = 'Ready - Upload files to get started';
});