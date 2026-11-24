// --- SUBMIT GUESTBOOK NOTE SILENTLY TO AMAYA'S GOOGLE FORM ---
const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfrpyb3XwB1P2JrMnTp03Kzx4U4ibi5g8e5E-GjG3D9dwiWdA/formResponse";
const ENTRY_GUEST_NOTE = "entry.1474813942";

function submitDirectToGoogleForm() {
    const nameInput = document.getElementById("guestNameInput");
    const adviceInput = document.getElementById("adviceInput");
    const confirm = document.getElementById("adviceConfirm");
    const btn = document.getElementById("sendAdviceBtn");

    const guestName = nameInput ? nameInput.value.trim() : "";
    const noteText = adviceInput ? adviceInput.value.trim() : "";

    if (!noteText) {
        if (adviceInput) adviceInput.focus();
        return;
    }

    if (btn) btn.textContent = "Sending...";

    const formattedMessage = guestName ? `[From ${guestName}]: ${noteText}` : noteText;
    const formData = new FormData();
    formData.append(ENTRY_GUEST_NOTE, formattedMessage);

    fetch(GOOGLE_FORM_ACTION_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData
    }).finally(() => {
        if (nameInput) nameInput.value = "";
        if (adviceInput) adviceInput.value = "";
        if (btn) btn.textContent = "💌 Send Directly to Amaya";
        if (confirm) confirm.style.display = "block";
        showIosBanner("💌", "GUESTBOOK SENT", "Your note was delivered straight to Amaya!", 3500);

        setTimeout(() => {
            if (confirm) confirm.style.display = "none";
        }, 4500);
    });
}

// --- BACKGROUND MUSIC WITH 5-SECOND FADE-IN & HARDWARE SIDE BUTTONS ---
const bgMusic = document.getElementById("bgMusicPlayer");
const musicStatusPill = document.getElementById("musicStatusPill");
const btnMute = document.getElementById("btnMute");
const iosVolumeHud = document.getElementById("iosVolumeHud");
const volHudFill = document.getElementById("volHudFill");
const volHudIcon = document.getElementById("volHudIcon");
const leftThumbGroup = document.getElementById("leftThumbGroup");
const indexFingerGroup = document.getElementById("indexFingerGroup");
const screenSleepOverlay = document.getElementById("screenSleepOverlay");

let currentVolume = 0.7;
let isMuted = false;
let isPhoneAsleep = false;
let volHudTimer = null;
let fadeInterval = null;
let hasStartedFadeIn = false;

function syncMusicSlider() {
    const slider = document.getElementById("mobileVolumeSlider");
    if (slider) {
        slider.value = isMuted ? 0 : currentVolume;
    }
}

function animateLeftThumb(actionClass) {
    if (!leftThumbGroup) return;
    leftThumbGroup.classList.remove("pressing-mute", "pressing-vol-up", "pressing-vol-down");
    void leftThumbGroup.offsetWidth;
    leftThumbGroup.classList.add(actionClass);
    setTimeout(() => {
        leftThumbGroup.classList.remove(actionClass);
    }, 260);
}

function fadeInMusic(durationMs = 5000) {
    if (!bgMusic || hasStartedFadeIn) return;
    bgMusic.volume = 0;
    bgMusic.muted = isMuted;

    bgMusic.play().then(() => {
        hasStartedFadeIn = true;
        if (musicStatusPill && !isMuted) musicStatusPill.classList.remove("paused");

        clearInterval(fadeInterval);
        const steps = 50;
        const stepTime = durationMs / steps;
        let currentStep = 0;

        fadeInterval = setInterval(() => {
            currentStep++;
            if (isMuted) {
                bgMusic.volume = 0;
            } else {
                const progress = Math.min(1, currentStep / steps);
                bgMusic.volume = +(currentVolume * progress).toFixed(3);
            }
            syncMusicSlider();

            if (currentStep >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepTime);
    }).catch(() => {
        // Browser requires a tap/swipe first; will trigger automatically on first interaction
    });
}

// Attempt immediate 5-second fade-in as soon as the website opens
window.addEventListener("DOMContentLoaded", () => {
    fadeInMusic(5000);
});

// Fallback: if browser blocked autoplay before first touch, fade in on first tap/swipe
["pointerdown", "touchstart", "keydown"].forEach(evt => {
    window.addEventListener(evt, () => {
        if (!hasStartedFadeIn) fadeInMusic(5000);
    }, { once: true, passive: true });
});

function startBackgroundMusic() {
    if (!bgMusic) return;
    if (!hasStartedFadeIn) {
        fadeInMusic(5000);
        return;
    }
    bgMusic.volume = isMuted ? 0 : currentVolume;
    bgMusic.play().then(() => {
        if (musicStatusPill) musicStatusPill.classList.remove("paused");
    }).catch(() => {});
}

function togglePlayPauseMusic() {
    if (!bgMusic) return;
    clearInterval(fadeInterval);
    if (bgMusic.paused) {
        hasStartedFadeIn = true;
        bgMusic.volume = isMuted ? 0 : currentVolume;
        bgMusic.play().then(() => {
            if (musicStatusPill) musicStatusPill.classList.remove("paused");
            showIosBanner("🎵", "MUSIC", "Background music playing", 2500);
        }).catch(() => {});
    } else {
        bgMusic.pause();
        if (musicStatusPill) musicStatusPill.classList.add("paused");
        showIosBanner("⏸️", "MUSIC", "Background music paused", 2500);
    }
}

function setMusicVolumeDirect(val) {
    if (!bgMusic) return;
    clearInterval(fadeInterval);
    hasStartedFadeIn = true;
    if (bgMusic.paused) bgMusic.play().catch(() => {});
    currentVolume = parseFloat(val);
    if (currentVolume > 0 && isMuted) {
        isMuted = false;
        bgMusic.muted = false;
        if (btnMute) btnMute.classList.remove("muted");
        if (musicStatusPill) musicStatusPill.classList.remove("paused");
    }
    bgMusic.volume = currentVolume;
    if (volHudFill) volHudFill.style.height = `${Math.round(currentVolume * 100)}%`;
    if (volHudIcon) volHudIcon.textContent = currentVolume === 0 ? "🔇" : currentVolume < 0.5 ? "🔉" : "🔊";
}

function changeMusicVolume(delta) {
    animateLeftThumb(delta > 0 ? "pressing-vol-up" : "pressing-vol-down");
    if (!bgMusic) return;
    clearInterval(fadeInterval);
    hasStartedFadeIn = true;
    if (bgMusic.paused) bgMusic.play().catch(() => {});
    if (isMuted) {
        isMuted = false;
        bgMusic.muted = false;
        if (btnMute) btnMute.classList.remove("muted");
        if (musicStatusPill) musicStatusPill.classList.remove("paused");
    }

    currentVolume = Math.max(0, Math.min(1, +(currentVolume + delta).toFixed(2)));
    bgMusic.volume = currentVolume;
    syncMusicSlider();

    if (volHudFill) volHudFill.style.height = `${Math.round(currentVolume * 100)}%`;
    if (volHudIcon) volHudIcon.textContent = currentVolume === 0 ? "🔇" : currentVolume < 0.5 ? "🔉" : "🔊";

    if (iosVolumeHud) {
        iosVolumeHud.classList.add("show");
        clearTimeout(volHudTimer);
        volHudTimer = setTimeout(() => {
            iosVolumeHud.classList.remove("show");
        }, 1600);
    }
}

function toggleMuteMusic() {
    animateLeftThumb("pressing-mute");
    isMuted = !isMuted;
    if (bgMusic) {
        if (bgMusic.paused && !isMuted) startBackgroundMusic();
        bgMusic.muted = isMuted;
        if (!isMuted) bgMusic.volume = currentVolume;
    }
    if (btnMute) btnMute.classList.toggle("muted", isMuted);
    if (musicStatusPill) musicStatusPill.classList.toggle("paused", isMuted);
    syncMusicSlider();

    showIosBanner(
        isMuted ? "🔕" : "🔔",
        "RINGER & MUSIC",
        isMuted ? "Silent Mode: On (Music Muted)" : "Silent Mode: Off (Music Unmuted)",
        2400
    );
}

function pressPowerButton() {
    if (indexFingerGroup) {
        indexFingerGroup.classList.add("pressing-power");
        setTimeout(() => {
            indexFingerGroup.classList.remove("pressing-power");
        }, 260);
    }

    isPhoneAsleep = !isPhoneAsleep;
    if (screenSleepOverlay) {
        screenSleepOverlay.classList.toggle("asleep", isPhoneAsleep);
    }
}

function wakePhoneFromSleep() {
    if (!isPhoneAsleep) return;
    pressPowerButton();
}

// --- APPLE-STYLE NOTIFICATION CHIME (WEB AUDIO API) ---
function playAppleChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const notes = [880, 1174.66, 1567.98];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.085);
            gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.085);
            gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.085 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.085 + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.085);
            osc.stop(ctx.currentTime + i * 0.085 + 0.36);
        });
    } catch (e) {}
}

// --- IOS TOP NOTIFICATION BANNER LOGIC (SWIPE UP TO DISMISS) ---
const toastBanner = document.getElementById("iosToastBanner");
const toastIcon = document.getElementById("toastIcon");
const toastApp = document.getElementById("toastApp");
const toastMessage = document.getElementById("toastMessage");
let toastTimeout = null;
let toastStartY = 0;
let toastCurrentY = 0;
let isDraggingToast = false;

function showIosBanner(icon, appName, msg, durationMs = 6000) {
    if (!toastBanner) return;
    toastIcon.textContent = icon;
    toastApp.textContent = appName;
    toastMessage.textContent = msg;

    toastBanner.style.transform = "";
    toastBanner.style.opacity = "";
    toastBanner.classList.remove("dragging");
    toastBanner.classList.add("show");
    playAppleChime();

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        dismissIosBanner(false);
    }, durationMs);
}

function dismissIosBanner(withThumb = true) {
    if (!toastBanner) return;
    clearTimeout(toastTimeout);
    if (withThumb && typeof playThumbSwipe === "function") {
        playThumbSwipe("up");
    }
    toastBanner.classList.remove("dragging", "show");
    toastBanner.style.transform = "";
    toastBanner.style.opacity = "";
}

toastBanner.addEventListener("touchstart", e => {
    e.stopPropagation();
    isDraggingToast = true;
    toastStartY = e.touches[0].clientY;
    toastCurrentY = toastStartY;
    toastBanner.classList.add("dragging");
}, { passive: true });

toastBanner.addEventListener("touchmove", e => {
    if (!isDraggingToast) return;
    e.stopPropagation();
    toastCurrentY = e.touches[0].clientY;
    const deltaY = Math.min(0, toastCurrentY - toastStartY);
    toastBanner.style.transform = `translateY(${deltaY}px)`;
    toastBanner.style.opacity = `${Math.max(0.2, 1 + deltaY / 90)}`;
}, { passive: true });

toastBanner.addEventListener("touchend", e => {
    if (!isDraggingToast) return;
    e.stopPropagation();
    isDraggingToast = false;
    toastBanner.classList.remove("dragging");
    if (toastStartY - toastCurrentY > 22) {
        dismissIosBanner(true);
    } else {
        toastBanner.style.transform = "";
        toastBanner.style.opacity = "";
    }
});

toastBanner.addEventListener("mousedown", e => {
    e.stopPropagation();
    isDraggingToast = true;
    toastStartY = e.clientY;
    toastCurrentY = toastStartY;
    toastBanner.classList.add("dragging");
});

window.addEventListener("mousemove", e => {
    if (!isDraggingToast) return;
    toastCurrentY = e.clientY;
    const deltaY = Math.min(0, toastCurrentY - toastStartY);
    toastBanner.style.transform = `translateY(${deltaY}px)`;
    toastBanner.style.opacity = `${Math.max(0.2, 1 + deltaY / 90)}`;
});

window.addEventListener("mouseup", e => {
    if (!isDraggingToast) return;
    isDraggingToast = false;
    toastBanner.classList.remove("dragging");
    if (toastStartY - toastCurrentY > 22) {
        dismissIosBanner(true);
    } else {
        toastBanner.style.transform = "";
        toastBanner.style.opacity = "";
    }
});

// --- UNSWIPED IDLE HINT & PLACEHOLDER TAP COUNTER ---
let hasSwipedSinceUnlock = false;
let swipeHintTimer = null;
const swipePillHint = document.getElementById("swipePillHint");

function startSwipeHintTimer() {
    clearTimeout(swipeHintTimer);
    if (hasSwipedSinceUnlock) return;
    swipeHintTimer = setTimeout(() => {
        if (!hasSwipedSinceUnlock) {
            if (swipePillHint) swipePillHint.classList.add("visible");
            showIosBanner("👉", "GESTURE TIP", "Swipe left on the screen to explore more pages!", 6500);
        }
    }, 3800);
}

function markUserSwiped() {
    hasSwipedSinceUnlock = true;
    clearTimeout(swipeHintTimer);
    if (swipePillHint) swipePillHint.classList.remove("visible");
}

let placeholderTapCount = 0;
function handlePlaceholderClick() {
    placeholderTapCount++;
    if (placeholderTapCount >= 3) {
        placeholderTapCount = 0;
        showIosBanner(
            "🔔",
            "HOW TO EXPLORE",
            "Tip: You can only open apps with a red notification badge on them!",
            10000
        );
    }
}

// --- APPLE APP LIBRARY (ALPHABETICAL LIST + SEARCH) ---
const ALL_APPS = [
    { name: "Calendar", icon: "📅", bg: "#ffffff", badge: null, action: () => handlePlaceholderClick() },
    { name: "Cash App", icon: "$", bg: "#00d632", badge: "1", action: () => openModal("modal-cashapp") },
    { name: "Details", icon: "🎓", bg: "#1c1c1e", badge: "2", action: () => openModal("modal-details") },
    { name: "Directions", icon: "📍", bg: "#34c759", badge: "2", action: () => openModal("modal-details") },
    { name: "Discord", icon: "💬", bg: "#5865f2", badge: null, action: () => handlePlaceholderClick() },
    { name: "Divinely", icon: "✦", bg: "#0a0a0c", badge: null, action: () => handlePlaceholderClick() },
    { name: "Flo", icon: "🪶", bg: "#f46b8a", badge: null, action: () => handlePlaceholderClick() },
    { name: "Google", icon: "G", bg: "#ffffff", badge: null, action: () => handlePlaceholderClick() },
    { name: "Guestbook", icon: "📖", bg: "#8ec5fc", badge: "1", action: () => openModal("modal-next") },
    { name: "I am", icon: "✨", bg: "#d9b4a3", badge: null, action: () => handlePlaceholderClick() },
    { name: "Lock", icon: "🔒", bg: "#2c2c2e", badge: "•", action: () => lockPhone() },
    { name: "Music", icon: "♫", bg: "#f5f5f7", badge: "♪", action: () => openModal("modal-music") },
    { name: "Notes (Itinerary)", icon: "📝", bg: "#ffffff", badge: "1", action: () => openModal("modal-notes") },
    { name: "Photos (Memory Lane)", icon: "🌸", bg: "#ffffff", badge: "13", action: () => openModal("modal-photos") },
    { name: "Pinterest", icon: "P", bg: "#e60023", badge: null, action: () => handlePlaceholderClick() },
    { name: "RSVP", icon: "💌", bg: "#f9d5e5", badge: "1", action: () => openModal("modal-rsvp") },
    { name: "ScreenZen", icon: "🪨", bg: "#1f2247", badge: null, action: () => handlePlaceholderClick() }
].sort((a, b) => a.name.localeCompare(b.name));

const appLibraryList = document.getElementById("appLibraryList");
const alphabetRail = document.getElementById("alphabetRail");
const appLibrarySearch = document.getElementById("appLibrarySearch");
const clearSearchBtn = document.getElementById("clearSearchBtn");

function renderAppLibrary(filterText = "") {
    if (!appLibraryList) return;
    const query = filterText.trim().toLowerCase();
    const filtered = ALL_APPS.filter(app => app.name.toLowerCase().includes(query));

    appLibraryList.innerHTML = "";
    const lettersPresent = new Set();
    let currentLetter = "";

    filtered.forEach(app => {
        const firstLetter = app.name[0].toUpperCase();
        lettersPresent.add(firstLetter);

        if (firstLetter !== currentLetter) {
            currentLetter = firstLetter;
            const header = document.createElement("div");
            header.className = "alpha-section-header";
            header.id = `alpha-${currentLetter}`;
            header.textContent = currentLetter;
            appLibraryList.appendChild(header);
        }

        const row = document.createElement("div");
        row.className = "library-row";
        row.onclick = app.action;

        const darkTextIcons = ["$", "G", "♫", "📝", "🌸", "📅"];
        const textColor = darkTextIcons.includes(app.icon) && app.bg === "#ffffff" ? "#1c1c1e" : "#ffffff";

        row.innerHTML = `
            <div class="library-row-icon" style="background:${app.bg}; color:${textColor}; font-weight:700;">${app.icon}</div>
            <div class="library-row-name">${app.name}</div>
            ${app.badge ? `<span class="library-row-badge">${app.badge}</span>` : ""}
        `;
        appLibraryList.appendChild(row);
    });

    if (alphabetRail) {
        alphabetRail.innerHTML = "";
        [...lettersPresent].forEach(letter => {
            const span = document.createElement("span");
            span.textContent = letter;
            span.onclick = () => {
                const target = document.getElementById(`alpha-${letter}`);
                if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
            };
            alphabetRail.appendChild(span);
        });
    }
}

function filterAppLibrary() {
    const val = appLibrarySearch.value;
    clearSearchBtn.style.display = val.length > 0 ? "flex" : "none";
    renderAppLibrary(val);
}

function clearAppSearch() {
    appLibrarySearch.value = "";
    clearSearchBtn.style.display = "none";
    renderAppLibrary("");
}

renderAppLibrary();

// --- PHOTO LIGHTBOX ---
function openLightbox(src) {
    const lb = document.getElementById("photo-lightbox");
    const img = document.getElementById("lightboxImg");
    img.src = src;
    lb.style.display = "flex";
}

function closeLightbox() {
    document.getElementById("photo-lightbox").style.display = "none";
}

// --- ANIMATED THUMB HELPER ---
const wrapper = document.getElementById("handPhoneWrapper");
const swipingThumb = document.getElementById("swipingThumb");

function playThumbSwipe(direction) {
    if (!swipingThumb) return;
    swipingThumb.classList.remove("dragging", "anim-left", "anim-right", "anim-up");
    void swipingThumb.offsetWidth;
    swipingThumb.classList.add(`anim-${direction}`);
}

function moveThumbToClientCoords(clientX, clientY) {
    if (!wrapper || !swipingThumb) return;
    const rect = wrapper.getBoundingClientRect();
    const isMobile = window.innerWidth <= 600;
    const scale = isMobile ? 1 : 0.88;
    const x = (clientX - rect.left) / scale - 55;
    const y = (clientY - rect.top) / scale - 35;

    swipingThumb.classList.remove("anim-left", "anim-right", "anim-up");
    swipingThumb.classList.add("dragging");
    swipingThumb.style.left = `${x}px`;
    swipingThumb.style.top = `${y}px`;
}

function resetThumbDrag() {
    if (!swipingThumb) return;
    swipingThumb.classList.remove("dragging");
    swipingThumb.style.left = "";
    swipingThumb.style.top = "";
}

// --- LOCK SCREEN & PASSCODE LOGIC (CODE: 6292 / MAYA) ---
const CORRECT_PASSCODE = "6292";
let enteredCode = "";

const lockScreen = document.getElementById("lockScreen");
const lockView = document.getElementById("lockView");
const passcodeView = document.getElementById("passcodeView");
const dotsContainer = document.getElementById("passcodeDots");
const passcodeDots = dotsContainer.querySelectorAll("span");

let lockStartY = 0;
let lockDragging = false;

lockView.addEventListener("touchstart", e => {
    lockDragging = true;
    lockStartY = e.touches[0].clientY;
}, { passive: true });

lockView.addEventListener("touchmove", e => {
    if (!lockDragging) return;
    moveThumbToClientCoords(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

lockView.addEventListener("touchend", e => {
    if (!lockDragging) return;
    lockDragging = false;
    resetThumbDrag();
    const lockEndY = e.changedTouches[0].clientY;
    const deltaY = lockStartY - lockEndY;
    if (deltaY > 30 || Math.abs(deltaY) < 10) {
        showPasscode();
    }
});

lockView.addEventListener("mousedown", e => {
    lockDragging = true;
    lockStartY = e.clientY;
});

function showPasscode() {
    playThumbSwipe("up");
    lockView.style.display = "none";
    passcodeView.classList.add("active");
}

function hidePasscode() {
    enteredCode = "";
    updatePasscodeDots();
    passcodeView.classList.remove("active");
    lockView.style.display = "flex";
}

function pressKey(num) {
    if (enteredCode.length >= 4) return;
    enteredCode += num;
    updatePasscodeDots();

    if (enteredCode.length === 4) {
        if (enteredCode === CORRECT_PASSCODE) {
            setTimeout(() => {
                lockScreen.classList.add("unlocked");
                enteredCode = "";
                updatePasscodeDots();
                hasSwipedSinceUnlock = false;
                startBackgroundMusic();
                startSwipeHintTimer();
            }, 180);
        } else {
            dotsContainer.classList.add("shake");
            setTimeout(() => {
                dotsContainer.classList.remove("shake");
                enteredCode = "";
                updatePasscodeDots();
            }, 450);
        }
    }
}

function deleteKey() {
    enteredCode = enteredCode.slice(0, -1);
    updatePasscodeDots();
}

function updatePasscodeDots() {
    passcodeDots.forEach((dot, idx) => {
        dot.classList.toggle("filled", idx < enteredCode.length);
    });
}

function lockPhone() {
    clearTimeout(swipeHintTimer);
    if (swipePillHint) swipePillHint.classList.remove("visible");
    if (toastBanner) toastBanner.classList.remove("show");
    hidePasscode();
    lockScreen.classList.remove("unlocked");
}

// --- COPY CASHAPP TAG ---
function copyCashtag() {
    navigator.clipboard.writeText("$myashw");
    const confirm = document.getElementById("copyConfirm");
    confirm.style.display = "block";
    setTimeout(() => {
        confirm.style.display = "none";
    }, 2000);
}

// --- MODAL POP-UPS ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "flex";
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

window.addEventListener("click", event => {
    if (event.target.classList.contains("modal")) {
        event.target.style.display = "none";
    }
});

// --- HOME SCREEN SWIPE (4 PAGES INCLUDING APP LIBRARY) ---
const screenContainer = document.getElementById("phoneScreen");
const screens = document.querySelectorAll(".home-screen");
const dots = document.querySelectorAll(".dot");
const dotSearch = document.querySelector(".dot-search");
const phoneDock = document.getElementById("phoneDock");
const paginationDotsWrap = document.getElementById("paginationDots");

let startX = 0;
let endX = 0;
let isDragging = false;
let currentScreen = 0;

screenContainer.addEventListener("touchstart", e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    isDragging = true;
    startX = e.touches[0].clientX;
}, { passive: true });

screenContainer.addEventListener("touchmove", e => {
    if (!isDragging) return;
    moveThumbToClientCoords(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

screenContainer.addEventListener("touchend", e => {
    if (!isDragging) return;
    isDragging = false;
    resetThumbDrag();
    endX = e.changedTouches[0].clientX;
    handleSwipe();
});

screenContainer.addEventListener("mousedown", e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    isDragging = true;
    startX = e.clientX;
});

window.addEventListener("mousemove", e => {
    if (!isDragging && !lockDragging) return;
    moveThumbToClientCoords(e.clientX, e.clientY);
});

window.addEventListener("mouseup", e => {
    resetThumbDrag();
    if (lockDragging) {
        lockDragging = false;
        const deltaY = lockStartY - e.clientY;
        if (deltaY > 30 || Math.abs(deltaY) < 10) {
            showPasscode();
        }
    }
    if (isDragging) {
        isDragging = false;
        endX = e.clientX;
        handleSwipe();
    }
});

function handleSwipe() {
    const threshold = 45;
    const diff = endX - startX;

    if (diff < -threshold && currentScreen < screens.length - 1) {
        goToScreen(currentScreen + 1);
    } else if (diff > threshold && currentScreen > 0) {
        goToScreen(currentScreen - 1);
    }
}

function goToScreen(screenIndex) {
    if (screenIndex !== currentScreen) {
        markUserSwiped();
    }
    if (screenIndex > currentScreen) playThumbSwipe("left");
    else if (screenIndex < currentScreen) playThumbSwipe("right");

    currentScreen = screenIndex;
    screens.forEach((screen, index) => {
        screen.style.transform = `translateX(${(index - currentScreen) * 100}%)`;
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === currentScreen);
    });
    if (dotSearch) {
        dotSearch.classList.toggle("active", currentScreen === 3);
    }

    const inLibrary = currentScreen === 3;
    if (phoneDock) phoneDock.classList.toggle("hidden-in-library", inLibrary);
    if (paginationDotsWrap) paginationDotsWrap.classList.toggle("in-library", inLibrary);
}