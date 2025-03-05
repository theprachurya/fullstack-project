async function searchYouTube() {
  const query = document.getElementById('searchInput').value;
  const apiKey = 'YOUR_API_KEY'; // Replace with your real API key
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;

  try {
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) {
      throw new Error('No results found');
    }

    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
    const videosResponse = await fetch(videosUrl);
    const videosData = await videosResponse.json();

    const videosWithDuration = searchData.items.map((item, index) => ({
      ...item,
      duration: videosData.items[index].contentDetails.duration
    }));
    displayResults(videosWithDuration);
  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('results').innerHTML = 'Something went wrong. Check the console.';
  }
}

function displayResults(videos) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (!videos || videos.length === 0) {
    resultsDiv.innerHTML = 'No videos found.';
    return;
  }

  let allVideoItems = [];

  videos.forEach(video => {
    const title = video.snippet.title;
    const videoId = video.id.videoId;
    const thumbnail = video.snippet.thumbnails.high.url;
    const duration = formatDuration(video.duration);

    const videoDiv = document.createElement('div');
    videoDiv.className = 'video-item';

    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'thumbnail-container';
    const img = document.createElement('img');
    img.src = thumbnail;
    thumbDiv.appendChild(img);
    videoDiv.appendChild(thumbDiv);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'video-content';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'video-title';
    titleSpan.textContent = title;
    contentDiv.appendChild(titleSpan);

    const durationSpan = document.createElement('span');
    durationSpan.className = 'duration';
    durationSpan.textContent = ` (${duration})`;
    contentDiv.appendChild(durationSpan);

    const addButton = document.createElement('button');
    addButton.textContent = 'Add to Playlist';
    addButton.className = 'add-button';
    addButton.addEventListener('click', (e) => {
      e.stopPropagation();
      addToPlaylist({ videoId, title, thumbnail, duration });
    });
    contentDiv.appendChild(addButton);

    videoDiv.appendChild(contentDiv);

    videoDiv.addEventListener('click', () => {
      allVideoItems.forEach(item => {
        if (item !== videoDiv) {
          item.style.display = 'none';
        }
      });

      thumbDiv.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
      iframe.width = '100%';
      iframe.height = '360';
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      thumbDiv.appendChild(iframe);

      const backButton = document.createElement('button');
      backButton.textContent = 'Back to Results';
      backButton.className = 'back-button';
      backButton.addEventListener('click', () => {
        allVideoItems.forEach(item => {
          item.style.display = 'block';
          const iframe = item.querySelector('iframe');
          if (iframe) {
            const thumbContainer = item.querySelector('.thumbnail-container');
            thumbContainer.innerHTML = '';
            const img = document.createElement('img');
            img.src = item.dataset.thumbnail;
            thumbContainer.appendChild(img);
          }
        });
        backButton.remove();
      });
      videoDiv.appendChild(backButton);
    });

    resultsDiv.appendChild(videoDiv);
    allVideoItems.push(videoDiv);
    videoDiv.dataset.thumbnail = thumbnail;
  });

  displayPlaylist(); // Safe to call after DOM is ready
}

function addToPlaylist(video) {
  let playlist = JSON.parse(localStorage.getItem('playlist') || '[]');
  if (!playlist.some(item => item.videoId === video.videoId)) {
    playlist.push(video);
    localStorage.setItem('playlist', JSON.stringify(playlist));
  }
  displayPlaylist();
}

function removeFromPlaylist(videoId) {
  let playlist = JSON.parse(localStorage.getItem('playlist') || '[]');
  playlist = playlist.filter(item => item.videoId !== videoId);
  localStorage.setItem('playlist', JSON.stringify(playlist));
  displayPlaylist();
}

function displayPlaylist() {
  const playlistDiv = document.getElementById('playlist-items');
  if (!playlistDiv) {
    console.error('Playlist container not found');
    return; // Exit if element is missing
  }

  playlistDiv.innerHTML = '';

  const playlist = JSON.parse(localStorage.getItem('playlist') || '[]');
  if (playlist.length === 0) {
    playlistDiv.innerHTML = '<p>No videos in playlist.</p>';
    return;
  }

  playlist.forEach(video => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'playlist-item';

    const thumbDiv = document.createElement('div');
    thumbDiv.className = 'thumbnail-container';
    const img = document.createElement('img');
    img.src = video.thumbnail;
    thumbDiv.appendChild(img);
    itemDiv.appendChild(thumbDiv);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'video-content';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'video-title';
    titleSpan.textContent = video.title;
    contentDiv.appendChild(titleSpan);

    const durationSpan = document.createElement('span');
    durationSpan.className = 'duration';
    durationSpan.textContent = ` (${video.duration})`;
    contentDiv.appendChild(durationSpan);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.className = 'remove-button';
    removeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromPlaylist(video.videoId);
    });
    contentDiv.appendChild(removeButton);

    itemDiv.appendChild(contentDiv);

    itemDiv.addEventListener('click', () => {
      document.getElementById('results').innerHTML = '';
      const videoDiv = document.createElement('div');
      videoDiv.className = 'video-item';

      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'thumbnail-container';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${video.videoId}?rel=0`;
      iframe.width = '100%';
      iframe.height = '360';
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      thumbDiv.appendChild(iframe);
      videoDiv.appendChild(thumbDiv);

      const backButton = document.createElement('button');
      backButton.textContent = 'Back to Playlist';
      backButton.className = 'back-button';
      backButton.addEventListener('click', () => {
        document.getElementById('results').innerHTML = '';
        displayPlaylist();
      });
      videoDiv.appendChild(backButton);

      document.getElementById('results').appendChild(videoDiv);
    });

    playlistDiv.appendChild(itemDiv);
  });
}

function formatDuration(isoDuration) {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Wrap all event listeners in DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchYouTube();
    }
  });

  displayPlaylist(); // Initial playlist load
});