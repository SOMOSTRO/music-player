// bodyElement
const bodyElement = document.body;

// Dark Mode var
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
const themeToggle = document.getElementById('theme-toggle');

// metatag var
let themeMetatag = document.querySelector("meta[name='theme-color']");

// menu var
let isMenuFirstClick = false;
let menu_opened = false;
const menuInnerContainer = document.querySelector(".menu_inner_container");
const menuCloseLayer = document.querySelector(".menu_close_layer");

// api base container var
const apiBaseInput = document.getElementById('api_base_input');

// storage container var
let isPercentUsedWarningDisplayed = false;
const storageAvailable = document.getElementById('storageAvailable');
const storageUsed = document.getElementById('storageUsed');
const storagePercentUsed = document.getElementById('storagePercentUsed');

// server_request_container var
const loginsElement = document.getElementById('loginsElement');
const songRequestsElement = document.getElementById('songRequestsElement');

// Intro var
let intro = document.getElementById("intro");
let introLogo = document.querySelector("#intro img");

let isServerActive = false;

let isErudaActivated = localStorage.getItem("isErudaActivated") || false

// connection_status var
let connectionStatus = document.querySelector(".connection_status");

// set API_BASE = server URL
let API_BASE = null;

// check storage accessible
const isStorageAccessible = navigator.storage && navigator.storage.estimate;

// display Warning if not available 
if(!isStorageAccessible)
  console.warn("Failed to access browser storage, cannot calculate available storage space.");

// Set themeToggle img for first render
function renderThemeToggleImg() {
  const img = document.createElement("img");
  img.className = "theme-toggle-img";
  
  if(isDarkMode) {
    img.alt = "image sun";
    img.src = "./images/sun.png";
    document.body.classList.add('dark');
  }
  else {
    img.alt = "image moon";
    img.src = "./images/moon.jpg";
  }
  
  // render img
  themeToggle.replaceChildren(img);
}
renderThemeToggleImg();

// pause all themeToggle animations
themeToggle.style.animationPlayState = 'paused';
document.querySelector("#theme-toggle img").style.animationPlayState = 'paused';

themeToggle.onclick = () => {
  const img = document.createElement("img");
  img.className = "theme-toggle-img";
  
  if (document.body.classList.contains('dark')) {
    img.alt = "image moon";
    img.src = "./images/moon.jpg";
    
    document.body.classList.remove('dark');
    themeMetatag.content = "#041d44";
  } else {
    img.alt = "image sun";
    img.src = "./images/sun.png";
    
    document.body.classList.add('dark');
    themeMetatag.content = "#1b0832";
  }
  
  // render img
  themeToggle.replaceChildren(img);
};

// menu handler function
let checkTimeout = null;
let checkTimeoutForLayer = null;
function handleMenuClick() {
  if(!isMenuFirstClick) {
    menuInnerContainer.classList.add('set_animation');
    isMenuFirstClick = true;
  }
  
  bodyElement.classList.toggle("menu_opened");
  menu_opened = menu_opened? false: true;
  if(menu_opened) {
    clearTimeout(checkTimeout);
    clearTimeout(checkTimeoutForLayer);
    
    // setTimeout for menuCloseLayer
    checkTimeoutForLayer = setTimeout( () => {
      menuCloseLayer.style.display = 'block';
      menuCloseLayer.addEventListener('click', handleMenuClick);
    },700);
    
    // setTimeout for menu calculations
    checkTimeout = setTimeout( () => {
      checkStorage().catch(console.error);
      fetchServerRequest();
    },1500);
  } else {
    menuCloseLayer.style.display = 'none';
    menuCloseLayer.removeEventListener('click', handleMenuClick);
    clearTimeout(checkTimeout);
    clearTimeout(checkTimeoutForLayer);
  }
}

//Intro logic 
window.addEventListener('load',function () {
  // Show Intro
  // The intro animation will skip when server is connected too fast.
  if(introLogo) {
    introLogo.style.animation = 'logoAnm .6s ease .4s';
    setTimeout( () => {
      intro?.classList.add("active");
    },1000);
  }
}, {once: true});

//window global function for intro
window.scriptProperties = {
  closeIntro: function (serverConnected, api_base = "") {
    // set API_BASE value from App.js
    API_BASE = api_base;
    
    isServerActive = serverConnected;
    const isDisplayedConnectionStatus = localStorage.getItem("isDisplayedConnectionStatus") || false
    
    // update theme-color for pwa
    if(isDarkMode)
      themeMetatag.content = "#1b0832";
    else
      themeMetatag.content = "#041d44";
    
    // Handling serverConnected logic
    if(!serverConnected) {
      console.error("Failed to connect to server, Please ensure the server is active and API_BASE is valid.");
      if(!isDisplayedConnectionStatus) {
        connectionStatus.style.display = 'block';
        localStorage.setItem("isDisplayedConnectionStatus", true);
      } else {
        closeConnectionStatus()
      }
    }
    else {
      closeConnectionStatus()
      console.log("Server is Active");
    }
    
    // continue animating themeToggle
    themeToggle.style.animationPlayState = 'running';
    
    if(!isStandalone()) {
      console.log('Running as a web app');
    } else {
      console.log('Running as a standalone app');
    }
    
    // close and clean-up intro
    introLogo = null;
    
    intro.style.animation = 'opacity .3s reverse';
    setTimeout( () => {
      intro.remove();
      intro = null;
    },300);
  }
};

function closeConnectionStatus() {
  connectionStatus.remove();
  connectionStatus = null;
}

function isStandalone() {
  // Check for standalone mode
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator.standalone === true) // iOS-specific check
  );
}

// function used for deleting service-worker and it all cached files
function clearServiceWorkerAndCaches() {
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().then((success) => {
          console.log(`Service Worker unregistered: ${success}`);
        });
      });
    });
  }

  // Delete all CacheStorage entries
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName).then((success) => {
          console.log(`Cache deleted: ${cacheName} → ${success}`);
        });
      });
    });
  }
}

// menu inner content functions
// apiBaseInput function
apiBaseInput.addEventListener('keydown', function(event) {
  let inputValue = this.value.trim();
  if(event.key === 'Enter') {
    if(inputValue.toLowerCase().includes('eruda')) {
      if(isErudaActivated === true)
        return
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/eruda";
      document.body.appendChild(script);
      script.onload = function () {
        try {
          eruda.init();
          console.log("Eruda Activated");
        }
        catch (error) {
          console.log("Eruda is unavailable");
        }
      };
      
      this.value = this.value.replace(/eruda/gi, '')
      isErudaActivated = true;
      localStorage.setItem('isErudaActivated', true)
      return
    }
    else if(inputValue.toLowerCase().includes('delete service-worker')) {
      clearServiceWorkerAndCaches();
      this.value = this.value.replace(/delete service-worker/gi, '')
      return;
    }
    else if(inputValue.toLowerCase().includes('delete localstorage')) {
      localStorage.clear();
      this.value = this.value.replace(/delete localstorage/gi, '')
      return;
    }
    
    // if input empty reset API_BASE to fetch actual URL
    if(!inputValue) {
      localStorage.removeItem("API_BASE");
      location.reload();
    }
      
    if(inputValue === API_BASE)
      return 
    
    // set API_BASE if it's entered manually
    localStorage.setItem("API_BASE", inputValue);
    location.reload();
  }
});

// storage calculation function
async function checkStorage() {
  if(!isStorageAccessible)
    return;
  const { usage, quota } = await navigator.storage.estimate();
  const usageMB = usage / 1024 / 1024;
  const quotaMB = quota / 1024 / 1024;
  const quotaGB = quota / 1024 / 1024 / 1024;
  const percentUsed = ((usage / quota) * 100).toFixed(2);
  
  const quotaDisplay = quotaGB >= 1 ? `${quotaGB.toFixed(2)} GB`:
    `${quotaMB.toFixed(2)} MB`;
  
  // storageAvailable
  if(storageAvailable.textContent !== quotaDisplay)
    storageAvailable.textContent = quotaDisplay;
  
  if (quotaGB > 50)
    storageAvailable.classList.add('highlight_green');
  else if (quotaGB > 20)
    storageAvailable.classList.add('highlight_yellow');
  else
    storageAvailable.classList.add('highlight_red');
  
  // storageUsed
  if(storageUsed.textContent !== usageMB.toFixed(2) + ' MB')
    storageUsed.textContent = usageMB.toFixed(2) + ' MB';
  
  // storagePercentUsed
  if(storagePercentUsed.textContent !== percentUsed + '%')
    storagePercentUsed.textContent = percentUsed + '%';
  
  if (percentUsed > 50)
    storagePercentUsed.classList.add('highlight_red');
  else if (percentUsed > 10)
    storagePercentUsed.classList.add('highlight_yellow');
  else
    storagePercentUsed.classList.add('highlight_green');
  
  if (percentUsed >= 50 && !isPercentUsedWarningDisplayed) {
    const element = document.createElement('span')
    element.classList.add('storage_warning_element');
    element.textContent = "Warning: You are using too much storage. Please remove some songs to free up space.";
    document.querySelector('.storage_container').appendChild(element);
    isPercentUsedWarningDisplayed = true;
  }
}

// fetch server request function
function fetchServerRequest() {
  let userLogins = null;
  let userSongRequests = null;
  
  // fetch data from server
  if(isServerActive) {
    fetch(API_BASE+'/counts')
    .then((response) =>
      response.json())
    .then((data) => {
      userLogins = data.logins;
      userSongRequests = data.song_requests;
      // update dom with new data
      if(loginsElement.textContent !== userLogins)
        loginsElement.textContent = userLogins;
      if(songRequestsElement.textContent !== userSongRequests)
        songRequestsElement.textContent = userSongRequests;
    })
    .catch((error) => {
      // update dom set data unavailable
      if(loginsElement.textContent !== "Unavailable") {
        loginsElement.textContent = "Unavailable";
        songRequestsElement.textContent = "Unavailable";
      }
    });
  }
  
  //if (!userLogins && userLogins != 0)
   // return
}