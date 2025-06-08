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

window.isServerActive = false;

// connection_status var
let connectionStatus = document.querySelector(".connection_status");

// get localStorage for server API
API_BASE = localStorage.getItem("API_BASE") || "http://192.168.1.6:5000";

// set apiBaseInput value
apiBaseInput.value = API_BASE;

// check storage accessible
const isStorageAccessible = navigator.storage && navigator.storage.estimate;

// display Warning if not available 
if(!isStorageAccessible)
  console.warn("Failed to access browser storage, cannot calculate available storage space.");

if(isDarkMode) {
  themeToggle.innerHTML = "<img src=images/sun.png width=28 style='border-radius:50%'>";
  document.body.classList.add('dark');
  themeMetatag.content = "#1b0832";
}
else {
  themeToggle.innerHTML = "<img src=images/moon.jpg width=28 style='border-radius:50%'>";
  themeMetatag.content = "#041d44";
}

// pause all themeToggle animations
themeToggle.style.animationPlayState = 'paused';
document.querySelector("#theme-toggle img").style.animationPlayState = 'paused';

themeToggle.onclick = () => {
  if (document.body.classList.contains('dark')) {
    document.body.classList.remove('dark');
    themeToggle.innerHTML = "<img src=images/moon.jpg width=28 style='border-radius:50%'>";
    themeMetatag.content = "#041d44";
  } else {
    document.body.classList.add('dark');
    themeToggle.innerHTML = "<img src=images/sun.png width=28 style='border-radius:50%'>";
    themeMetatag.content = "#1b0832";
  }
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
  intro.style.backgroundColor = '#000000b9';
  setTimeout( () => {
    intro.classList.add("active");
  },1000);
},{once: true});

//Full screen Logic
intro.addEventListener('click', function () {
  // Handling isServerActive logic
  const isDisplayedConnectionStatus = localStorage.getItem("isDisplayedConnectionStatus") || false
  
  if(!window.isServerActive) {
    console.error("Failed to connect to server");
    if(!isDisplayedConnectionStatus) {
      connectionStatus.style.display = 'block';
      localStorage.setItem("isDisplayedConnectionStatus", true);
    } else {
      connectionStatus.remove();
    }
  }
  else {
    connectionStatus.remove();
    console.log("Server is Active");
  }
  
  // continue animating themeToggle
  themeToggle.style.animationPlayState = 'running';
  document.querySelector("#theme-toggle img").style.animationPlayState = 'running';
  
  if(!isStandalone()) {
    goFullScreen();
    console.log('Running as a web app');
  } else {
    console.log('Running as a standalone app');
  }
  
  
  intro.classList.remove("active");
  requestAnimationFrame( () => {
    intro.classList.add("deactivate");
  });
  
  setTimeout( () => {
    intro.style.animation = 'hide 1s ease';
  },500);
  setTimeout( () => {
    intro.style.display = 'none';
    intro.remove();
    intro = null;
  },1500);
}, {once: true});

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

function goFullScreen() {
  if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
  } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
  } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
  } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
  }
}

// Preload images function
function preloadImages(urls) {
 urls.forEach(url => {
  const img = new Image(); // Create a new Image object
  img.src = url; // Set the src attribute to preload the image
  });
}
 
// preloadImages 
const imageUrls = ['images/white.jpeg', 'images/dark.jpg', 'images/moon.jpg', 'images/sun.png', 'images/icon-192x192.png'];
preloadImages(imageUrls)


// menu inner content functions
// apiBaseInput function
apiBaseInput.addEventListener('keydown', function(event) {
  if(event.key === 'Enter') {
    if(this.value.length < 21)
      return;
    localStorage.setItem("API_BASE", this.value);
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
  storageAvailable.innerText = quotaDisplay;
  if (quotaGB > 20)
    storageAvailable.classList.add('highlight_green');
  else if (quotaGB > 5)
    storageAvailable.classList.add('highlight_yellow');
  else
    storageAvailable.classList.add('highlight_red');
  
  // storageUsed
  storageUsed.innerText = usageMB.toFixed(2) + ' MB';
  
  // storagePercentUsed
  storagePercentUsed.innerText = percentUsed + '%';
  if (percentUsed > 80)
    storagePercentUsed.classList.add('highlight_red');
  else if (percentUsed > 50)
    storagePercentUsed.classList.add('highlight_yellow');
  else
    storagePercentUsed.classList.add('highlight_green');
  
  if (percentUsed >= 90 && !isPercentUsedWarningDisplayed) {
    const element = document.createElement('span')
    element.classList.add('storage_warning_element');
    element.innerText = "Warning: Your storage is nearly full! Please remove some songs.";
    document.querySelector('.storage_container').appendChild(element);
    isPercentUsedWarningDisplayed = true;
  }
}

// fetch server request function
function fetchServerRequest() {
  let userLogins = null;
  let userSongRequests = null;
  
  // fetch data from server
  fetch(API_BASE+'/counts')
  .then((response) =>
    response.json())
  .then((data) => {
    userLogins = data.logins;
    userSongRequests = data.song_requests;
    // update dom with new data
    loginsElement.innerText = userLogins;
    songRequestsElement.innerText = userSongRequests;
  })
  .catch((error) => {
    // update dom set data unavailable
    loginsElement.innerText = "Unavailable";
    songRequestsElement.innerText = "Unavailable";
  });
  
  //if (!userLogins && userLogins != 0)
   // return
}