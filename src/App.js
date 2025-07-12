import React, { useCallback, useState, useEffect, useRef } from "react";
import { List, AutoSizer } from "react-virtualized"; // Import Virtualized Components
import Marquee from "react-fast-marquee";
import "react-virtualized/styles.css"; // Default styles
import "./index.css";

// indexedDB functions
import {
  saveFavourite,
  removeFavourite,
  getAllFavourites,
  getFavourite
} from "./indexedDB";

// Global vars
const bodyElement = document.body;

// audio player event listener var
let audioPlayerIsSeeking = false;

const App = () => {
  // states variables
  const [API_BASE, setAPI_BASE] = useState("");
  
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentSong, setCurrentSong] = useState(null);
  
  // favourite songs states
  const [favouriteSongs, setFavouriteSongs] = useState([]);

  // songsContainer var
  const [songsContainerHeight, setSongsContainerHeight] = useState(0);

  // playing bar states
  const [text, setText] = useState("Click on any songs to play");
  const [useMarquee, setUseMarquee] = useState(false);
  const [play, setPlay] = useState(true);
  
  const [isServerActive, setIsServerActive] = useState(null);
  
  // references
  // allSongs object ref
  const allSongsRef = useRef({});
  
  const hasRefreshedFav = useRef(false);
  
  const audioPlayerRef = useRef(null);
  const listRef = useRef(null); // Create ref for Virtualized List
  
  const songsContainer = useRef(null);
  
  // playingBar reference 
  const playingBarContainer = useRef(null);
  const playingBar = useRef(null);
  const timeoutRef = useRef(null);

  // fetch API_BASE
  useEffect(() => {
    const savedURL = localStorage.getItem("API_BASE") || '';
    if(window.location.hostname === "localhost") {
      setAPI_BASE("http://127.0.0.1:5000");
    } else if(savedURL) {
      setAPI_BASE(savedURL);
    } else {
      fetch("https://SOMOSTRO.github.io/Hosted/MP_server_url.json", {cache: 'no-store'})
        .then(res => res.json())
        .then(data => {
          setAPI_BASE(data.url);
        })
        .catch(err => {
          setIsServerActive(false)
          window.scriptProperties?.closeIntro?.(false);
          console.warn("Failed to fetch API_BASE");
        });
    }
  }, []);
  
  // fetch songs List
  useEffect(() => {
    if(!API_BASE) {
      return
    }
    fetch(API_BASE+'/songs', {cache: 'no-store'})
      .then((response) => response.json())
      .then((data) => {
        allSongsRef.current = data;
        // setFilteredSongs(Object.values(data).flat());
        filterSongs("English", false);
        setIsServerActive(true)
        window.scriptProperties?.closeIntro?.(true, API_BASE);
        getSongsCount(data);
      })
      .catch((error) => {
        console.error("Error fetching songs")
        setIsServerActive(false)
        window.scriptProperties?.closeIntro?.(false);
      });
  }, [API_BASE]);

  // load favouriteSongs
  useEffect(() => {
    const start = performance.now();
    loadFavourites().then( () => {
      const end = performance.now();
      console.log(`loadFavourites() Execution time: ${end - start} ms`);
    });
  }, []);
  
  // re-render Virtualized List for Fav
  useEffect(() => {
    if(hasRefreshedFav.current)
      return
    
    if(isServerActive === null)
      return;
    if(isServerActive) {
      hasRefreshedFav.current = true;
      return
    }
      
    if (favouriteSongs.length > 0) {
      hasRefreshedFav.current = true;
      requestAnimationFrame(() => {
          filterSongs("Favourite", false);
          // listRef.current?.recomputeRowHeights();
          // listRef.current?.scrollToRow(0);
          console.log("virtualized list refreshed for Favourites");
        });
    }
  }, [favouriteSongs, isServerActive]);

  // All functions
  const filterSongs = (category, isAnimationEnabled = true) => {
    const allSongs = allSongsRef.current;
    
    if (category === "Favourite") {   setFilteredSongs(favouriteSongs);
    } else if (category === "all") {   setFilteredSongs(Object.values(allSongs).flat()); } else {   setFilteredSongs(allSongs[category] || []); }
    
    setSelectedCategory(category);
    
    // animate if true
    if(isAnimationEnabled) {
      // Reset scroll position using React Virtualized
      listRef.current?.scrollToPosition(0);
      
      bodyElement?.classList.remove("category");
      void bodyElement?.offsetHeight; // Force reflow to restart animation
      requestAnimationFrame(() => {
        bodyElement?.classList.add("category");
      });
    }
  };

  const updateMediaMetadata = (song) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: getSongName(song),
        artist: selectedCategory[0].toUpperCase() + selectedCategory.slice(1).toLowerCase(),
        artwork: [{ src: "./images/icon-512x512.png", sizes: "512x512", type: "image/png" }]
      });
    }
  };
  
  const playSong = (song) => {
    const allSongs = allSongsRef.current;
    
    if (song == currentSong || audioPlayerRef.current.src.includes(encodeURIComponent(song))) {
      audioPlayerRef.current.currentTime = 0;
      if(audioPlayerRef.current.paused)
        audioPlayerRef.current.play();
      return;
    }
    
    setCurrentSong(song);
    const category = Object.keys(allSongs).find((cat) => allSongs[cat].includes(song));
    
    // Function
    const getSongFromServer = () => {
      if (category && audioPlayerRef.current) {
        const songUrl = `${API_BASE}/music/${category}/${encodeURIComponent(song)}`;
        audioPlayerRef.current.src = songUrl;
        audioPlayerRef.current.play();
        displaySongName(song);
        updateMediaMetadata(song); // Update metadata
      } else {
        console.error("Song category not found or audio player missing");
      }
    };
    
    if (favouriteSongs.includes(song)) {
      getFavourite(song)
        .then(blob => {
          if (blob && blob.size > 0) {
            const localUrl = URL.createObjectURL(blob);
            audioPlayerRef.current.src = localUrl;
            audioPlayerRef.current.play();
            displaySongName(song);
            updateMediaMetadata(song);
          } else {
            console.warn(`"${song}" found in IndexedDB but blob is empty or missing\n Blob size: ${blob.size}`);
            getSongFromServer();
          }
        })
        .catch(() => {
          console.warn("Favourite song not found in IndexedDB, fallback to server");
          getSongFromServer();
        });
      return;
    }
    
    // call if song need to fetch from the server 
    getSongFromServer();
  };

  const playPreviousSong = () => {
    if (!currentSong) return;
    
    const currentIndex = filteredSongs.indexOf(currentSong);
    const prevIndex = (currentIndex - 1 + filteredSongs.length) % filteredSongs.length;
  
    playSong(filteredSongs[prevIndex]); // Play the previous song
  };

  const playNextSong = () => {
    if (!currentSong) return; // If no song is playing, do nothing
    // If audio is not playing, do nothing 
    if (audioPlayerIsSeeking) {
      return;
    }
  
    const currentIndex = filteredSongs.indexOf(currentSong);
    const nextIndex = (currentIndex + 1) % filteredSongs.length; // Loop back when reaching the end
  
    playSong(filteredSongs[nextIndex]); // Play the next song
    };

  const getSongName = (song) => {
    return song.replace(/\.[^/.]+$/, "");
  };

  // indexedDB helper functions
  const addToFavourites = async (song) => {
    const allSongs = allSongsRef.current;
    
    const category = Object.keys(allSongs).find((cat) => allSongs[cat].includes(song));
    const songUrl = `${API_BASE}/music/${category}/${encodeURIComponent(song)}`;
  
    try {
      const response = await fetch(songUrl);
      if (!response.ok) {
        console.error(`Failed to fetch ${song}: HTTP ${response.status}`);
        return;
      }
  
      const blob = await response.blob();
  
      if (!blob || blob.size === 0) {
        console.warn(`"${song}" not saved: blob is empty`);
        return;
      }
  
      await saveFavourite(song, blob);
      setFavouriteSongs((prev) => [...prev, song]);
    } catch (err) {
      console.error(`Error adding "${song}" to favourites`, err);
    }
  };
  
  const removeFromFavourites = async (song) => {
    await removeFavourite(song);
    setFavouriteSongs((prev) => prev.filter((s) => s !== song));
  };
  
  // retrieve fav songs list from indexedDB
  const loadFavourites = async () => {
    try {
      const favs = await getAllFavourites();
      setFavouriteSongs(favs.map(item => item.song));
    } catch (error) {
      console.error("Failed to load favourites:", error);
    }
};

  const displaySongName = (song) => {
    const songName = getSongName(song);
    const getTextWidth = (text, fontSize = "16px", fontWeight = "normal", fontFamily = "Arial") => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
    
      // Wrap font family in quotes if it contains spaces
      const formattedFontFamily = fontFamily.includes(" ") ? `"${fontFamily}"` : fontFamily;
      context.font = `${fontWeight} ${fontSize} ${formattedFontFamily}`;
    
      return context.measureText(text).width;
    };
    
    const playingBarWidth = playingBarContainer.current.offsetWidth;
    const textWidth = getTextWidth(songName, "16px", "bold", "Times New Roman");
    
    //console.log("playingBar width: ", playingBarWidth, "\nText width:", textWidth);
    
    setText(songName);
    setUseMarquee(textWidth > playingBarWidth - 5);
    
    playingBar.current.style.animation = '';
    void playingBar.current.offsetWidth;
    playingBar.current.style.animation = 'opacity 1.5s ease';
  };
  
  const handleCycleComplete = () => {
    if(timeoutRef.current)
      clearTimeout(timeoutRef.current);
    setPlay(false);
    timeoutRef.current = setTimeout( () => {
      setPlay(true);
    },3000);
  };
  
  const getSongsCount = (allSongs) => {
   let songsEnglish = [], songsHindi = [], songsMalayalam = [], songsPhonk = [];
  
   Object.entries(allSongs).forEach(([category, songs]) => {
    switch (category) {
      case 'English': songsEnglish = songs; break;
      case 'Hindi': songsHindi = songs; break;
      case 'Malayalam': songsMalayalam = songs; break;
      case 'Phonk': songsPhonk = songs; break;
    }
   });
   
   let totalSongs = songsEnglish.length + songsHindi.length + songsMalayalam.length + songsPhonk.length;
   
   // songs_information_container var
   const englishSongsElement = document.getElementById('englishSongsElement');
   const hindiSongsElement = document.getElementById('hindiSongsElement');
   const malayalamSongsElement = document.getElementById('malayalamSongsElement');
   const phonkSongsElement = document.getElementById('phonkSongsElement');
   const totalSongsElement = document.getElementById('totalSongsElement');
   
   englishSongsElement.innerText = songsEnglish.length;
   hindiSongsElement.innerText = songsHindi.length;
   malayalamSongsElement.innerText = songsMalayalam.length;
   phonkSongsElement.innerText = songsPhonk.length;
   totalSongsElement.innerText = totalSongs;
   
   console.log("Total English Songs: "+songsEnglish.length, "\nTotal Malayalam Songs: "+songsMalayalam.length, "\nTotal Hindi Songs: "+songsHindi.length, "\nTotal Phonk Songs: "+songsPhonk.length, "\nTotal Songs: " + totalSongs);
 };

  const removeAnimation = () => {
    bodyElement?.classList.remove("category");
  };
  
  useEffect( () => {
    const updateSongsContainerHeight = () => {
      setSongsContainerHeight(songsContainer.current.offsetHeight);
      console.log("songsContainerHeight", songsContainerHeight);
    };
    
    window.addEventListener('resize', updateSongsContainerHeight);
    // call once on mount
    updateSongsContainerHeight();
    
    // clean up on unmount
    return () => {
      window.removeEventListener('resize', updateSongsContainerHeight);
    };
  }, []);

  // audio player event listener logic
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio) return;
  
    const handleSeeking = () => {
      audioPlayerIsSeeking = true;
    };
  
    const handleSeeked = () => {
      // Check if the seeked position is at the very end
      if (Math.abs(audio.currentTime - audio.duration) < 0.5) {
        console.log("User seeked to end, preventing auto-skip.");
        return;
      }
  
      audioPlayerIsSeeking = false;
    };
    
    // after window load display audio element
    const handleWindowLoad = () => {
      audio.style.display = 'block';
      console.log("audio element added")
    }
  
    audio.addEventListener("seeking", handleSeeking);
    audio.addEventListener("seeked", handleSeeked);
    
    // event listener for displaying audio element after window load
    window.addEventListener("load", handleWindowLoad);
  
    return () => {
      audio.removeEventListener("seeking", handleSeeking);
      audio.removeEventListener("seeked", handleSeeked);
      window.removeEventListener("load", handleWindowLoad);
    };
  }, []);

  // audio media notification control
  const handlePreviousTrack = useCallback(() => {
    playPreviousSong();
  }, [currentSong]); 

  const handleNextTrack = useCallback(() => {
    playNextSong();
  }, [currentSong]); 

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("previoustrack", handlePreviousTrack);
      navigator.mediaSession.setActionHandler("nexttrack", handleNextTrack);
    }
  }, [handlePreviousTrack, handleNextTrack]); // Depend on the wrapped functions


  // **React Virtualized row rendering logic**
  const rowRenderer = ({ index, key, style }) => {
    // actual song name
    const song = filteredSongs[index]
    // song name without extension
    const songName = getSongName(song);
    
    const isPlaying = song == currentSong;
    
    // indexedDB setup
    const isFavourite = favouriteSongs.includes(song);
    
    return (
      <div key={key} style={style} className={`btn-wrapper ${isPlaying ? 'playing':''}`}
      >
        <button className="song-btn" onClick={() => playSong(song)
         } >
          {songName}
        </button>
      
        <button className={`fav-btn ${isFavourite ? "favourited" : ""}`} onClick={(e) => {
          if (isFavourite) {
            removeFromFavourites(song);
          } else {
            addToFavourites(song);
            
            const btn = e.currentTarget;
            btn.style.animation = 'none';
            void btn.offsetWidth;
            btn.style.animation = 'heartBeat .5s ease .2s';
          }
        }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            //fill={isPlaying ? '#9a40ff' : 'none'}
            fill="none"
            stroke="#FF0000"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6c-1.8-1.8-4.6-1.8-6.4 0L12 7l-2.4-2.4c-1.8-1.8-4.6-1.8-6.4 0s-1.8 4.6 0 6.4l8.8 8.8 8.8-8.8c1.8-1.8 1.8-4.6 0-6.4z" />
          </svg>
        </button>
        
      </div>
    );
  };
  return (
    <div className="container">
      {/* Category Buttons */}
      <div className="categories">
        {[...Object.keys(allSongsRef.current), 'Favourite'].map((category) => (
          <button key={category} className={selectedCategory === category ? "buttons_style" : ""} onClick={() => filterSongs(category)}>
            {category == "Favourite" ? "💜Fav" : category}
          </button>
        ))}
      </div>

      {/* Virtualized Songs List */}
      <div id="songs" className="songs" ref={songsContainer}>
        <AutoSizer>
          {({ height, width }) => (
            <List
              style={{'paddingBottom': '150px'}}
              ref={listRef}
              width={width}
              height={songsContainerHeight}
              rowCount={filteredSongs.length}
              rowHeight={70} // Adjust row height
              rowRenderer={rowRenderer}
              // overscanRowCount={10}
              onScroll={() => {removeAnimation();}}
            />
          )}
        </AutoSizer>
      </div>

      {/* playingBar */}
      <div className="playingBar_container" ref={playingBarContainer}>
          <span ref={playingBar}>
            
            {useMarquee ? (
              <Marquee 
                key={text}
                gradient={false}
                delay={1}
                play={play}
                speed={60}
                pauseOnHover={true}
                onCycleComplete={handleCycleComplete}>
                
               <div style={{paddingRight:'80px', paddingLeft:'15px'}}>
                {text}
                </div>
                
              </Marquee>
            ) : (
              text
            )}
            
          </span>
      </div>

      {/* Audio Player */}
      <div className="audio-container">
        <audio ref={audioPlayerRef} id="audio-player" onEnded={playNextSong} controls></audio>
      </div>
    </div>
  );

};

export default App;