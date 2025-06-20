class WindowsMediaPlayer {
    constructor() {
        this.audioPlayer = document.getElementById('audioPlayer');
        this.currentTrackIndex = 0;
        this.tracks = [];
        this.isPlaying = false;
        this.isShuffle = false;
        this.isRepeat = false;
        this.isMuted = false;
        this.previousVolume = 50;
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeVisualizer();
        this.loadSampleTracks();
    }

    initializeElements() {
        // Transport controls
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.stopBtn = document.getElementById('stopBtn');
        
        // Progress and time
        this.progressBar = document.getElementById('progressBar');
        this.currentTime = document.getElementById('currentTime');
        this.totalTime = document.getElementById('totalTime');
        
        // Volume controls
        this.volumeBar = document.getElementById('volumeBar');
        this.muteBtn = document.getElementById('muteBtn');
        
        // Additional controls
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.equalizerBtn = document.getElementById('equalizerBtn');
        
        // Track info
        this.trackTitle = document.getElementById('trackTitle');
        this.trackArtist = document.getElementById('trackArtist');
        this.trackAlbum = document.getElementById('trackAlbum');
        this.albumArt = document.getElementById('albumArt');
        
        // Track list
        this.trackList = document.getElementById('trackList');
        
        // File input
        this.fileInput = document.getElementById('fileInput');
        this.addMusicBtn = document.getElementById('addMusicBtn');
    }

    attachEventListeners() {
        // Transport controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.stopBtn.addEventListener('click', () => this.stopPlayback());
        
        // Progress bar
        this.progressBar.addEventListener('input', () => this.seekTo());
        this.progressBar.addEventListener('mousedown', () => this.isDragging = true);
        this.progressBar.addEventListener('mouseup', () => this.isDragging = false);
        
        // Volume controls
        this.volumeBar.addEventListener('input', () => this.setVolume());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        
        // Additional controls
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        this.equalizerBtn.addEventListener('click', () => this.showEqualizer());
        
        // File input
        this.addMusicBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Audio events
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => this.handleTrackEnd());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateTrackInfo());
        this.audioPlayer.addEventListener('play', () => this.updatePlayButton());
        this.audioPlayer.addEventListener('pause', () => this.updatePlayButton());
        
        // Window controls
        document.querySelector('.minimize').addEventListener('click', () => this.minimizeWindow());
        document.querySelector('.maximize').addEventListener('click', () => this.maximizeWindow());
        document.querySelector('.close').addEventListener('click', () => this.closeWindow());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    initializeVisualizer() {
        this.canvas = document.getElementById('visualizerCanvas');
        this.canvasCtx = this.canvas.getContext('2d');
        this.animationId = null;
        
        // Create audio context for visualization
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.source = null;
            
            this.analyser.fftSize = 256;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            
            this.drawVisualizer();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    connectAudioToVisualizer() {
        if (this.audioContext && !this.source) {
            this.source = this.audioContext.createMediaElementSource(this.audioPlayer);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        }
    }

    drawVisualizer() {
        this.animationId = requestAnimationFrame(() => this.drawVisualizer());
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.canvasCtx.fillStyle = 'rgba(15, 20, 25, 0.9)';
        this.canvasCtx.fillRect(0, 0, width, height);
        
        if (this.analyser && this.isPlaying) {
            this.analyser.getByteFrequencyData(this.dataArray);
            
            const barWidth = (width / this.bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < this.bufferLength; i++) {
                barHeight = (this.dataArray[i] / 255) * height * 0.8;
                
                const gradient = this.canvasCtx.createLinearGradient(0, height - barHeight, 0, height);
                gradient.addColorStop(0, '#8cc8ff');
                gradient.addColorStop(0.5, '#5c7cfa');
                gradient.addColorStop(1, '#364fc7');
                
                this.canvasCtx.fillStyle = gradient;
                this.canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        } else {
            // Draw static bars when not playing
            this.drawStaticBars();
        }
    }

    drawStaticBars() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const barCount = 64;
        const barWidth = width / barCount;
        
        for (let i = 0; i < barCount; i++) {
            const barHeight = Math.random() * height * 0.2 + 5;
            
            this.canvasCtx.fillStyle = 'rgba(140, 200, 255, 0.3)';
            this.canvasCtx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }
    }

    loadSampleTracks() {
        // Sample tracks with metadata
        this.tracks = [
            {
                title: "Canción de ejemplo 1",
                artist: "Artista 1",
                album: "Álbum de prueba",
                duration: "3:45",
                url: null
            },
            {
                title: "Canción de ejemplo 2",
                artist: "Artista 2",
                album: "Álbum de prueba",
                duration: "4:12",
                url: null
            },
            {
                title: "Canción de ejemplo 3",
                artist: "Artista 3",
                album: "Álbum de prueba",
                duration: "2:58",
                url: null
            }
        ];
        
        this.renderTrackList();
    }

    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        
        files.forEach(file => {
            if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                const track = {
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: "Artista desconocido",
                    album: "Álbum desconocido",
                    duration: "0:00",
                    url: url,
                    file: file
                };
                
                this.tracks.push(track);
                
                // Get duration
                const tempAudio = new Audio(url);
                tempAudio.addEventListener('loadedmetadata', () => {
                    track.duration = this.formatTime(tempAudio.duration);
                    this.renderTrackList();
                });
            }
        });
        
        this.renderTrackList();
    }

    renderTrackList() {
        this.trackList.innerHTML = '';
        
        this.tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            if (index === this.currentTrackIndex) {
                trackItem.classList.add('playing');
            }
            
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-title-cell">${track.title}</div>
                <div class="track-artist-cell">${track.artist}</div>
                <div class="track-duration">${track.duration}</div>
            `;
            
            trackItem.addEventListener('click', () => this.selectTrack(index));
            trackItem.addEventListener('dblclick', () => this.playTrack(index));
            
            this.trackList.appendChild(trackItem);
        });
    }

    selectTrack(index) {
        // Remove previous selection
        document.querySelectorAll('.track-item').forEach(item => {
            item.classList.remove('playing');
        });
        
        this.currentTrackIndex = index;
        this.loadCurrentTrack();
        
        // Add selection to new track
        document.querySelectorAll('.track-item')[index]?.classList.add('playing');
    }

    playTrack(index) {
        this.selectTrack(index);
        if (this.tracks[index].url) {
            this.play();
        }
    }

    loadCurrentTrack() {
        const track = this.tracks[this.currentTrackIndex];
        if (!track) return;
        
        this.trackTitle.textContent = track.title;
        this.trackArtist.textContent = track.artist;
        this.trackAlbum.textContent = track.album;
        
        if (track.url) {
            this.audioPlayer.src = track.url;
            this.connectAudioToVisualizer();
        }
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        const track = this.tracks[this.currentTrackIndex];
        if (!track || !track.url) {
            alert('Selecciona un archivo de audio válido');
            return;
        }
        
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.audioPlayer.play();
        this.isPlaying = true;
        this.updatePlayButton();
    }

    pause() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }

    stopPlayback() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.isPlaying = false;
        this.updatePlayButton();
        this.updateProgress();
    }

    previousTrack() {
        if (this.isShuffle) {
            this.currentTrackIndex = Math.floor(Math.random() * this.tracks.length);
        } else {
            this.currentTrackIndex = this.currentTrackIndex > 0 
                ? this.currentTrackIndex - 1 
                : this.tracks.length - 1;
        }
        
        this.selectTrack(this.currentTrackIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    nextTrack() {
        if (this.isShuffle) {
            this.currentTrackIndex = Math.floor(Math.random() * this.tracks.length);
        } else {
            this.currentTrackIndex = this.currentTrackIndex < this.tracks.length - 1 
                ? this.currentTrackIndex + 1 
                : 0;
        }
        
        this.selectTrack(this.currentTrackIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    handleTrackEnd() {
        if (this.isRepeat) {
            this.audioPlayer.currentTime = 0;
            this.play();
        } else {
            this.nextTrack();
        }
    }

    updatePlayButton() {
        this.playPauseBtn.textContent = this.isPlaying ? '⏸' : '▶';
    }

    updateProgress() {
        if (!this.isDragging && this.audioPlayer.duration) {
            const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            this.progressBar.value = progress;
            this.progressBar.style.setProperty('--progress', progress + '%');
        }
        
        this.currentTime.textContent = this.formatTime(this.audioPlayer.currentTime);
        if (this.audioPlayer.duration) {
            this.totalTime.textContent = this.formatTime(this.audioPlayer.duration);
        }
    }

    updateTrackInfo() {
        if (this.audioPlayer.duration) {
            this.totalTime.textContent = this.formatTime(this.audioPlayer.duration);
            
            // Update track duration in the list
            const track = this.tracks[this.currentTrackIndex];
            if (track) {
                track.duration = this.formatTime(this.audioPlayer.duration);
                this.renderTrackList();
            }
        }
    }

    seekTo() {
        if (this.audioPlayer.duration) {
            const seekTime = (this.progressBar.value / 100) * this.audioPlayer.duration;
            this.audioPlayer.currentTime = seekTime;
        }
    }

    setVolume() {
        const volume = this.volumeBar.value / 100;
        this.audioPlayer.volume = volume;
        this.volumeBar.style.setProperty('--volume', this.volumeBar.value + '%');
        
        // Update mute button
        if (volume === 0) {
            this.muteBtn.textContent = '🔇';
        } else if (volume < 0.5) {
            this.muteBtn.textContent = '🔉';
        } else {
            this.muteBtn.textContent = '🔊';
        }
    }

    toggleMute() {
        if (this.isMuted) {
            this.volumeBar.value = this.previousVolume;
            this.isMuted = false;
        } else {
            this.previousVolume = this.volumeBar.value;
            this.volumeBar.value = 0;
            this.isMuted = true;
        }
        this.setVolume();
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('active', this.isShuffle);
    }

    toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        this.repeatBtn.classList.toggle('active', this.isRepeat);
    }

    showEqualizer() {
        alert('Ecualizador - Función no implementada en esta demo');
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    handleKeyboardShortcuts(event) {
        switch(event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowRight':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.nextTrack();
                }
                break;
            case 'ArrowLeft':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.previousTrack();
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.volumeBar.value = Math.min(100, parseInt(this.volumeBar.value) + 5);
                this.setVolume();
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.volumeBar.value = Math.max(0, parseInt(this.volumeBar.value) - 5);
                this.setVolume();
                break;
        }
    }

    minimizeWindow() {
        // Simulate minimize
        document.body.style.transform = 'scale(0.1)';
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transform = 'scale(1)';
            document.body.style.opacity = '1';
        }, 300);
    }

    maximizeWindow() {
        // Toggle fullscreen simulation
        if (document.body.style.transform === 'scale(1.1)') {
            document.body.style.transform = 'scale(1)';
        } else {
            document.body.style.transform = 'scale(1.1)';
        }
    }

    closeWindow() {
        if (confirm('¿Estás seguro de que quieres cerrar Windows Media Player?')) {
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.close();
            }, 500);
        }
    }
}

// Initialize the media player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mediaPlayer = new WindowsMediaPlayer();
});

// Handle window resize for responsive canvas
window.addEventListener('resize', () => {
    const canvas = document.getElementById('visualizerCanvas');
    if (canvas && window.mediaPlayer) {
        // Adjust canvas size for mobile
        if (window.innerWidth <= 768) {
            canvas.width = Math.min(300, window.innerWidth - 40);
            canvas.height = 100;
        } else {
            canvas.width = 400;
            canvas.height = 150;
        }
    }
});