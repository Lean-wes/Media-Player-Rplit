// Global variables
let audioElement;
let audioContext;
let analyser;
let audioSource;
let playlist = [];
let currentTrackIndex = -1;
let isPlaying = false;
let isMuted = false;
let currentVolume = 0.7;
let selectedFilesArray = [];

// DOM elements
let playBtn, pauseBtn, stopBtn, prevBtn, nextBtn, muteBtn;
let progressBar, progressBarFill, currentTimeEl, totalTimeEl;
let volumeSlider, volumeLevel, playlistItems;
let nowPlayingTitle, nowPlayingArtist, albumArt;
let statusMessage, fileCount, fileInput, uploadZone;
let selectedFiles, enqueueButton, visualizer;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing player...');
    
    // Get DOM elements
    audioElement = document.getElementById('audioPlayer');
    playBtn = document.getElementById('playBtn');
    pauseBtn = document.getElementById('pauseBtn');
    stopBtn = document.getElementById('stopBtn');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    muteBtn = document.getElementById('muteBtn');
    progressBar = document.getElementById('progressBar');
    progressBarFill = document.getElementById('progressBarFill');
    currentTimeEl = document.getElementById('currentTime');
    totalTimeEl = document.getElementById('totalTime');
    volumeSlider = document.querySelector('.wmp-volume-slider');
    volumeLevel = document.getElementById('volumeLevel');
    playlistItems = document.getElementById('playlistItems');
    nowPlayingTitle = document.getElementById('nowPlayingTitle');
    nowPlayingArtist = document.getElementById('nowPlayingArtist');
    albumArt = document.getElementById('albumArt');
    statusMessage = document.getElementById('statusMessage');
    fileCount = document.getElementById('fileCount');
    fileInput = document.getElementById('fileInput');
    uploadZone = document.getElementById('uploadZone');
    selectedFiles = document.getElementById('selectedFiles');
    enqueueButton = document.getElementById('enqueueButton');
    visualizer = document.getElementById('visualizer');

    // Check if all elements exist
    if (!audioElement || !playBtn || !pauseBtn) {
        console.error('Required elements not found');
        return;
    }

    // Initialize
    initializePlayer();
    setupEventListeners();
    createVisualizer();
    updateVolumeDisplay();
    
    console.log('Player initialized successfully');
});

function initializePlayer() {
    // Set initial audio properties
    audioElement.volume = currentVolume;
    audioElement.preload = 'metadata';
    
    // Initialize visualizer
    generateVisualizerBars();
    startVisualizerAnimation();
}

function setupEventListeners() {
    // Transport controls
    playBtn.addEventListener('click', playCurrentTrack);
    pauseBtn.addEventListener('click', pauseCurrentTrack);
    stopBtn.addEventListener('click', stopCurrentTrack);
    prevBtn.addEventListener('click', previousTrack);
    nextBtn.addEventListener('click', nextTrack);
    
    // Progress bar
    progressBar.addEventListener('click', seekToPosition);
    
    // Volume controls
    volumeSlider.addEventListener('click', setVolumeFromClick);
    muteBtn.addEventListener('click', toggleMute);
    
    // File handling
    fileInput.addEventListener('change', handleFileSelect);
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleFileDrop);
    enqueueButton.addEventListener('click', addSelectedFilesToPlaylist);
    
    // Tab switching
    setupTabSwitching();
    
    // Sidebar navigation
    setupSidebarNavigation();
    
    // Audio events
    audioElement.addEventListener('loadedmetadata', updateTrackInfo);
    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', handleTrackEnd);
    audioElement.addEventListener('play', () => {
        isPlaying = true;
        updatePlayButton();
        initializeAudioContext();
    });
    audioElement.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayButton();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function generateVisualizerBars() {
    visualizer.innerHTML = '';
    for (let i = 0; i < 60; i++) {
        const bar = document.createElement('div');
        bar.className = 'wmp-visualizer-bar';
        visualizer.appendChild(bar);
    }
}

function initializeAudioContext() {
    if (!audioContext && audioElement.src) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioSource = audioContext.createMediaElementSource(audioElement);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            
            audioSource.connect(analyser);
            analyser.connect(audioContext.destination);
            
            console.log('Audio context initialized');
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    }
}

function startVisualizerAnimation() {
    function animate() {
        const bars = document.querySelectorAll('.wmp-visualizer-bar');
        
        if (audioContext && analyser && isPlaying) {
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);
            
            bars.forEach((bar, index) => {
                const value = dataArray[index] || 0;
                const height = Math.max(5, (value / 255) * 100);
                bar.style.height = `${height}px`;
            });
        } else {
            // Static animation when not playing
            bars.forEach(bar => {
                const height = Math.random() * 20 + 5;
                bar.style.height = `${height}px`;
            });
        }
        
        requestAnimationFrame(animate);
    }
    animate();
}

function playCurrentTrack() {
    if (currentTrackIndex >= 0 && currentTrackIndex < playlist.length) {
        const track = playlist[currentTrackIndex];
        audioElement.src = track.url;
        
        audioElement.play().then(() => {
            console.log('Playing:', track.title);
            updateNowPlaying(track);
            updatePlaylistHighlight();
            statusMessage.textContent = `Playing: ${track.title}`;
        }).catch(error => {
            console.error('Error playing track:', error);
            statusMessage.textContent = 'Error playing file';
        });
    } else if (playlist.length > 0) {
        currentTrackIndex = 0;
        playCurrentTrack();
    } else {
        statusMessage.textContent = 'No tracks in playlist';
    }
}

function pauseCurrentTrack() {
    audioElement.pause();
    statusMessage.textContent = 'Paused';
}

function stopCurrentTrack() {
    audioElement.pause();
    audioElement.currentTime = 0;
    statusMessage.textContent = 'Stopped';
    updateProgress();
}

function previousTrack() {
    if (playlist.length === 0) return;
    
    currentTrackIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : playlist.length - 1;
    playCurrentTrack();
}

function nextTrack() {
    if (playlist.length === 0) return;
    
    currentTrackIndex = currentTrackIndex < playlist.length - 1 ? currentTrackIndex + 1 : 0;
    playCurrentTrack();
}

function updatePlayButton() {
    if (isPlaying) {
        playBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
    } else {
        playBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
    }
}

function updateNowPlaying(track) {
    nowPlayingTitle.textContent = track.title;
    nowPlayingArtist.textContent = track.artist || 'Unknown Artist';
    
    // Show music icon for now
    albumArt.innerHTML = `
        <svg class="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18V5L21 3V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
            <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2"/>
        </svg>
    `;
}

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

function updateProgress() {
    if (audioElement.duration && !isNaN(audioElement.duration)) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressBarFill.style.width = `${progress}%`;
        currentTimeEl.textContent = formatTime(audioElement.currentTime);
        totalTimeEl.textContent = formatTime(audioElement.duration);
    }
}

function updateTrackInfo() {
    if (audioElement.duration) {
        totalTimeEl.textContent = formatTime(audioElement.duration);
        
        // Update playlist with actual duration
        if (currentTrackIndex >= 0 && playlist[currentTrackIndex]) {
            playlist[currentTrackIndex].duration = formatTime(audioElement.duration);
            renderPlaylist();
        }
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function seekToPosition(event) {
    if (audioElement.duration) {
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        audioElement.currentTime = percentage * audioElement.duration;
    }
}

function setVolumeFromClick(event) {
    const rect = volumeSlider.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    
    currentVolume = percentage;
    audioElement.volume = currentVolume;
    updateVolumeDisplay();
}

function updateVolumeDisplay() {
    volumeLevel.style.width = `${currentVolume * 100}%`;
    
    // Update mute button icon
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

function toggleMute() {
    isMuted = !isMuted;
    audioElement.muted = isMuted;
    updateVolumeDisplay();
}

function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    handleFiles(files);
}

function handleDragOver(event) {
    event.preventDefault();
    uploadZone.classList.add('drag-over');
}

function handleDragLeave() {
    uploadZone.classList.remove('drag-over');
}

function handleFileDrop(event) {
    event.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = Array.from(event.dataTransfer.files);
    handleFiles(files);
}

function handleFiles(files) {
    selectedFilesArray = files.filter(file => 
        file.type.startsWith('audio/') || file.type.startsWith('video/')
    );
    
    if (selectedFilesArray.length > 0) {
        selectedFiles.innerHTML = selectedFilesArray
            .map(file => `<div class="py-1">${file.name}</div>`)
            .join('');
        enqueueButton.classList.remove('hidden');
        statusMessage.textContent = `${selectedFilesArray.length} files selected`;
    } else {
        selectedFiles.textContent = 'No valid audio/video files selected';
        enqueueButton.classList.add('hidden');
    }
}

function addSelectedFilesToPlaylist() {
    selectedFilesArray.forEach(file => {
        const track = {
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Unknown Artist',
            duration: '0:00',
            url: URL.createObjectURL(file),
            file: file
        };
        playlist.push(track);
    });
    
    renderPlaylist();
    selectedFilesArray = [];
    selectedFiles.textContent = 'Files added to playlist';
    enqueueButton.classList.add('hidden');
    statusMessage.textContent = `${playlist.length} files in playlist`;
    
    // Switch to playlist tab
    switchToTab('playlist');
}

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
    updatePlaylistHighlight();
}

function switchToTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.wmp-tab').forEach(tab => {
        if (tab.getAttribute('data-content') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.wmp-tab-content').forEach(content => {
        if (content.id === tabName) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

function setupTabSwitching() {
    document.querySelectorAll('.wmp-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const contentId = tab.getAttribute('data-content');
            switchToTab(contentId);
        });
    });
}

function setupSidebarNavigation() {
    document.querySelectorAll('.wmp-nav-item[data-tab]').forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.getAttribute('data-tab');
            
            // Update nav states
            document.querySelectorAll('.wmp-nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            item.classList.add('active');
            
            // Switch to appropriate tab
            if (tabName === 'upload') {
                switchToTab('upload');
            } else {
                switchToTab('now-playing');
            }
        });
    });
}

function handleTrackEnd() {
    if (currentTrackIndex < playlist.length - 1) {
        nextTrack();
    } else {
        isPlaying = false;
        updatePlayButton();
        statusMessage.textContent = 'Playlist ended';
    }
}

function handleKeyboardShortcuts(event) {
    switch(event.code) {
        case 'Space':
            event.preventDefault();
            if (isPlaying) {
                pauseCurrentTrack();
            } else {
                playCurrentTrack();
            }
            break;
        case 'ArrowRight':
            if (event.ctrlKey) {
                event.preventDefault();
                nextTrack();
            }
            break;
        case 'ArrowLeft':
            if (event.ctrlKey) {
                event.preventDefault();
                previousTrack();
            }
            break;
        case 'ArrowUp':
            event.preventDefault();
            currentVolume = Math.min(1, currentVolume + 0.1);
            audioElement.volume = currentVolume;
            updateVolumeDisplay();
            break;
        case 'ArrowDown':
            event.preventDefault();
            currentVolume = Math.max(0, currentVolume - 0.1);
            audioElement.volume = currentVolume;
            updateVolumeDisplay();
            break;
    }
}