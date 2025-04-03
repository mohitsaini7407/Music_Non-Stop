document.addEventListener('DOMContentLoaded', function() {
    // Audio context and elements
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let analyser = audioContext.createAnalyser();
    let audioSource;
    let isPlaying = false;
    
    // DOM elements
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const songTitleEl = document.getElementById('song-title');
    const artistNameEl = document.getElementById('artist-name');
    const albumCoverEl = document.getElementById('album-cover');
    const playlistEl = document.getElementById('playlist');
    const visualizerCanvas = document.getElementById('visualizer');
    const visualizerCtx = visualizerCanvas.getContext('2d');
    
    // Set canvas size
    visualizerCanvas.width = visualizerCanvas.offsetWidth;
    visualizerCanvas.height = visualizerCanvas.offsetHeight;
    
    // Sample playlist data
    const playlist = [
        {
            title: "Sunset Dreams",
            artist: "Chill Wave",
            cover: "https://source.unsplash.com/random/300x300/?sunset",
            file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        },
        {
            title: "Ocean Breeze",
            artist: "Nature Sounds",
            cover: "https://source.unsplash.com/random/300x300/?ocean",
            file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        },
        {
            title: "Mountain High",
            artist: "Adventure Mix",
            cover: "https://source.unsplash.com/random/300x300/?mountain",
            file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
        },
        {
            title: "City Lights",
            artist: "Urban Vibes",
            cover: "https://source.unsplash.com/random/300x300/?city",
            file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
        },
        {
            title: "Forest Walk",
            artist: "Nature Sounds",
            cover: "https://source.unsplash.com/random/300x300/?forest",
            file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
        }
    ];
    
    let currentSongIndex = 0;
    let audioElement = new Audio();
    
    // Initialize the player
    function init() {
        renderPlaylist();
        loadSong(currentSongIndex);
        
        // Event listeners
        playBtn.addEventListener('click', togglePlay);
        prevBtn.addEventListener('click', prevSong);
        nextBtn.addEventListener('click', nextSong);
        volumeBtn.addEventListener('click', toggleMute);
        volumeSlider.addEventListener('input', setVolume);
        progressBar.addEventListener('click', seek);
        
        audioElement.addEventListener('timeupdate', updateProgress);
        audioElement.addEventListener('ended', nextSong);
        audioElement.addEventListener('loadedmetadata', updateSongInfo);
        
        // Setup visualizer
        setupVisualizer();
        
        // Handle window resize
        window.addEventListener('resize', function() {
            visualizerCanvas.width = visualizerCanvas.offsetWidth;
            visualizerCanvas.height = visualizerCanvas.offsetHeight;
        });
    }
    
    // Render playlist
    function renderPlaylist() {
        playlistEl.innerHTML = '';
        playlist.forEach((song, index) => {
            const li = document.createElement('li');
            li.textContent = `${song.title} - ${song.artist}`;
            li.addEventListener('click', () => playSong(index));
            if (index === currentSongIndex) {
                li.classList.add('active');
            }
            playlistEl.appendChild(li);
        });
    }
    
    // Load a song
    function loadSong(index) {
        const song = playlist[index];
        audioElement.src = song.file;
        songTitleEl.textContent = song.title;
        artistNameEl.textContent = song.artist;
        albumCoverEl.src = song.cover;
        
        // Highlight current song in playlist
        const playlistItems = playlistEl.querySelectorAll('li');
        playlistItems.forEach(item => item.classList.remove('active'));
        playlistItems[index].classList.add('active');
    }
    
    // Play a song
    function playSong(index) {
        if (index !== currentSongIndex) {
            currentSongIndex = index;
            loadSong(index);
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        audioElement.play()
            .then(() => {
                isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                setupAudioNodes();
            })
            .catch(error => {
                console.error('Playback failed:', error);
            });
    }
    
    // Setup audio nodes for visualization
    function setupAudioNodes() {
        if (audioSource) {
            audioSource.disconnect();
        }
        
        audioSource = audioContext.createMediaElementSource(audioElement);
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);
        
        analyser.fftSize = 256;
    }
    
    // Toggle play/pause
    function togglePlay() {
        if (isPlaying) {
            audioElement.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            playSong(currentSongIndex);
        }
        isPlaying = !isPlaying;
    }
    
    // Previous song
    function prevSong() {
        currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
        loadSong(currentSongIndex);
        if (isPlaying) {
            audioElement.play();
        }
    }
    
    // Next song
    function nextSong() {
        currentSongIndex = (currentSongIndex + 1) % playlist.length;
        loadSong(currentSongIndex);
        if (isPlaying) {
            audioElement.play();
        }
    }
    
    // Toggle mute
    function toggleMute() {
        audioElement.muted = !audioElement.muted;
        if (audioElement.muted) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
    
    // Set volume
    function setVolume() {
        audioElement.volume = volumeSlider.value;
        if (audioElement.volume === 0) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
    
    // Update progress bar
    function updateProgress() {
        const { currentTime, duration } = audioElement;
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.setProperty('--progress', `${progressPercent}%`);
        
        // Update time display
        currentTimeEl.textContent = formatTime(currentTime);
        
        if (duration) {
            durationEl.textContent = formatTime(duration);
        }
    }
    
    // Update song info when metadata is loaded
    function updateSongInfo() {
        durationEl.textContent = formatTime(audioElement.duration);
    }
    
    // Seek in the song
    function seek(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioElement.duration;
        audioElement.currentTime = (clickX / width) * duration;
    }
    
    // Format time (seconds to MM:SS)
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    // Setup visualizer
    function setupVisualizer() {
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        function draw() {
            requestAnimationFrame(draw);
            
            analyser.getByteFrequencyData(dataArray);
            
            visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
            
            const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;
                
                const hue = i * 360 / bufferLength;
                visualizerCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                visualizerCtx.fillRect(
                    x,
                    visualizerCanvas.height - barHeight,
                    barWidth,
                    barHeight
                );
                
                x += barWidth + 1;
            }
        }
        
        draw();
    }
    
    // Initialize the player
    init();
});
