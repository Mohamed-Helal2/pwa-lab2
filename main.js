// API Configuration
const API_BASE_URL = "https://jsonplaceholder.typicode.com";
const POSTS_ENDPOINT = "/posts";

// Application State
const appState = {
  currentRoute: 'home',
  posts: [],
  loading: false,
  error: null
};

// Router Class
class Router {
  constructor() {
    this.routes = {
      'home': this.renderHomePage,
      'about': this.renderAboutPage,
      'posts': this.renderPostsPage
    };
    
    this.init();
  }

  init() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      this.handleRoute(e.state?.route || 'home');
    });

    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-route]')) {
        e.preventDefault();
        const route = e.target.getAttribute('data-route');
        this.navigate(route);
      }
    });

    // Initial route
    const hash = window.location.hash.slice(1) || 'home';
    this.navigate(hash, false);
  }

  navigate(route, pushState = true) {
    if (this.routes[route]) {
      appState.currentRoute = route;
      
      if (pushState) {
        history.pushState({ route }, '', `#${route}`);
      }
      
      this.handleRoute(route);
      this.updateActiveNav(route);
    }
  }

  handleRoute(route) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    mainContent.className = 'main-content fade-in';
    
    if (this.routes[route]) {
      this.routes[route].call(this);
    }
  }

  updateActiveNav(route) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current route
    const activeLink = document.querySelector(`[data-route="${route}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  renderHomePage() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="page">
        <div class="hero">
          <h1 class="hero-title">Welcome to PWA Posts</h1>
          <p class="hero-subtitle">
            A modern Progressive Web App built with vanilla JavaScript.<br>
            Explore posts, work offline, and enjoy a native app experience.
          </p>
          <a href="#posts" class="cta-button" data-route="posts">
            <span>Browse Posts</span>
            <span>→</span>
          </a>
        </div>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3 class="feature-title">Progressive Web App</h3>
            <p class="feature-description">
              Install on your device and use like a native app
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3 class="feature-title">Mobile First</h3>
            <p class="feature-description">
              Responsive design that works perfectly on all devices
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3 class="feature-title">Fast & Offline</h3>
            <p class="feature-description">
              Works offline with cached content and lightning-fast loading
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🎨</div>
            <h3 class="feature-title">Modern Design</h3>
            <p class="feature-description">
              Clean, beautiful interface with smooth animations
            </p>
          </div>
        </div>
      </div>
    `;
  }

  renderAboutPage() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="page">
        <h1 class="page-title">About PWA Posts</h1>
        <p class="page-subtitle">Learn more about this Progressive Web Application</p>
        
        <div class="about-content">
          <p>
            PWA Posts is a demonstration of modern web development techniques, showcasing 
            how to build a Progressive Web App using vanilla JavaScript, HTML, and CSS. 
            This application proves that you don't always need heavy frameworks to create 
            engaging, performant web experiences.
          </p>
          
          <p>
            The app fetches posts from the JSONPlaceholder API, a popular testing service 
            for developers. All posts are cached locally using a service worker, enabling 
            offline functionality and faster subsequent loads.
          </p>
          
          <h2 style="margin: 2rem 0 1rem; color: var(--primary-color);">Key Features</h2>
          
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🌐</div>
              <h3 class="feature-title">Single Page Application</h3>
              <p class="feature-description">
                Client-side routing with smooth transitions between pages
              </p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3 class="feature-title">API Integration</h3>
              <p class="feature-description">
                Fetches real data from JSONPlaceholder API with loading states
              </p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">💾</div>
              <h3 class="feature-title">Service Worker</h3>
              <p class="feature-description">
                Caches resources and API responses for offline usage
              </p>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">📋</div>
              <h3 class="feature-title">Web App Manifest</h3>
              <p class="feature-description">
                Enables installation on devices as a native-like app
              </p>
            </div>
          </div>
          
          <p>
            Built with modern web standards and best practices, this PWA demonstrates 
            the power of vanilla JavaScript and progressive enhancement. The app is 
            fully responsive, accessible, and optimized for performance across all devices.
          </p>
        </div>
      </div>
    `;
  }

  async renderPostsPage() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="page">
        <div class="posts-header">
          <div>
            <h1 class="page-title">Posts</h1>
            <p class="page-subtitle">Explore interesting posts from around the web</p>
          </div>
          <button id="refresh-btn" class="refresh-button">
            Refresh Posts
          </button>
        </div>
        <div id="posts-container">
          <div class="loading">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    `;

    // Add refresh button functionality
    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.loadPosts(true);
    });

    // Load posts
    await this.loadPosts();
  }

  async loadPosts(forceRefresh = false) {
    const postsContainer = document.getElementById('posts-container');
    const refreshBtn = document.getElementById('refresh-btn');
    
    if (!postsContainer) return;

    try {
      appState.loading = true;
      appState.error = null;
      
      if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Loading...';
      }

      // Show loading spinner
      postsContainer.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
        </div>
      `;

      // Check if we have cached posts and not forcing refresh
      if (appState.posts.length > 0 && !forceRefresh) {
        this.renderPosts();
        return;
      }

      // Fetch posts from API
      const response = await fetch(`${API_BASE_URL}${POSTS_ENDPOINT}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const posts = await response.json();
      appState.posts = posts;
      
      // Simulate network delay for better UX demonstration
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.renderPosts();
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      appState.error = error.message;
      this.renderPostsError();
    } finally {
      appState.loading = false;
      
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh Posts';
      }
    }
  }

  renderPosts() {
    const postsContainer = document.getElementById('posts-container');
    
    if (appState.posts.length === 0) {
      postsContainer.innerHTML = `
        <div class="error">
          <h3 class="error-title">No Posts Found</h3>
          <p class="error-message">There are no posts to display at the moment.</p>
        </div>
      `;
      return;
    }

    const postsHTML = appState.posts.map(post => `
      <div class="post-card">
        <div class="post-id">#${post.id}</div>
        <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
        <p class="post-body">${this.escapeHtml(post.body)}</p>
      </div>
    `).join('');

    postsContainer.innerHTML = `<div class="posts-grid">${postsHTML}</div>`;
  }

  renderPostsError() {
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = `
      <div class="error">
        <h3 class="error-title">Failed to Load Posts</h3>
        <p class="error-message">
          ${appState.error || 'An error occurred while fetching posts. Please try again.'}
        </p>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Service Worker Registration
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully:', registration);
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
}

// App Initialization
let deferredPrompt;

// Handle PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt available');
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show install button
  showInstallButton();
});

// Show install button in header
function showInstallButton() {
  const header = document.querySelector('.header .container');
  const installBtn = document.createElement('button');
  installBtn.id = 'install-btn';
  installBtn.className = 'install-button';
  installBtn.innerHTML = '📱 Install App';
  installBtn.addEventListener('click', installApp);
  
  // Add to header navigation
  header.appendChild(installBtn);
}

// Install the PWA
async function installApp() {
  if (!deferredPrompt) {
    console.log('No install prompt available');
    return;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User response to the install prompt: ${outcome}`);
  
  // Clear the deferredPrompt variable
  deferredPrompt = null;
  
  // Hide the install button
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
}

// Handle successful installation
window.addEventListener('appinstalled', (evt) => {
  console.log('PWA was installed successfully');
  // Hide install button if still visible
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
});

function initializeApp() {
  // Register service worker
  registerServiceWorker();
  
  // Initialize router
  new Router();
  
  // Log app initialization
  console.log('PWA Posts App initialized successfully!');
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}