document.addEventListener('DOMContentLoaded', () => {
    // 同じvideoで映像と鳴き声を同期させ、音付きの1回再生後は無音ループへ戻す。
    const heroVideo = document.getElementById('hero-video');
    const videoPlayButton = document.getElementById('hero-video-play');
    const soundButton = document.getElementById('hero-sound-play');
    const soundStatus = document.getElementById('hero-sound-status');

    if (heroVideo && videoPlayButton && soundButton && soundStatus) {
        heroVideo.muted = true;
        let soundActive = false;
        let soundRequest = 0;

        const stopSound = (message, showError = false) => {
            soundRequest += 1;
            soundActive = false;
            heroVideo.muted = true;
            heroVideo.loop = true;
            soundButton.textContent = '鳴き声を聞く';
            soundStatus.textContent = message;
            soundStatus.classList.toggle('visually-hidden', !showError);
        };

        soundButton.hidden = false;
        soundButton.addEventListener('click', async () => {
            if (soundActive) {
                stopSound('鳴き声を停止しました。もう一度聞けます。');
                return;
            }
            const request = ++soundRequest;
            soundActive = true;
            soundStatus.classList.add('visually-hidden');
            soundButton.textContent = '鳴き声を止める';
            soundStatus.textContent = '鳴き声を読み込んでいます。';
            try {
                heroVideo.currentTime = 0;
                heroVideo.loop = false;
                heroVideo.muted = false;
                await heroVideo.play();
                if (request === soundRequest) {
                    soundStatus.textContent = '鳴き声を再生中です。終わると自動で無音に戻ります。';
                }
            } catch (error) {
                if (request === soundRequest) {
                    stopSound('鳴き声を再生できませんでした。もう一度ボタンを押してください。', true);
                }
            }
        });
        heroVideo.addEventListener('ended', () => {
            stopSound('鳴き声の再生が終わりました。もう一度聞けます。');
            heroVideo.currentTime = 0;
            playVideo();
        });
        heroVideo.addEventListener('error', () => {
            stopSound('動画を読み込めませんでした。ページを再読み込みしてください。', true);
        });
        // 別タブへ移った後や「戻る」で復帰したときに、突然鳴き続けないようにする。
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && soundActive) stopSound('鳴き声を停止しました。もう一度聞けます。');
        });
        window.addEventListener('pagehide', () => {
            if (soundActive) stopSound('鳴き声を停止しました。もう一度聞けます。');
        });

        const playVideo = async () => {
            try {
                await heroVideo.play();
            } catch (error) {
                videoPlayButton.hidden = false;
            }
        };
        heroVideo.addEventListener('playing', () => { videoPlayButton.hidden = true; });
        heroVideo.addEventListener('pause', () => {
            if (soundActive) stopSound('鳴き声を停止しました。もう一度聞けます。');
            videoPlayButton.hidden = false;
        });
        videoPlayButton.addEventListener('click', playVideo);
        playVideo();
    }

    // ==========================================
    // 1. Hamburger Menu & Mobile Navigation
    // ==========================================
    const hamburger = document.querySelector('.hamburger');
    const headerNav = document.querySelector('.header-nav');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger && headerNav) {
        const setMenuState = (isOpen) => {
            hamburger.classList.toggle('is-active', isOpen);
            headerNav.classList.toggle('is-open', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
        };

        hamburger.addEventListener('click', () => {
            setMenuState(!headerNav.classList.contains('is-open'));
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && headerNav.classList.contains('is-open')) {
                setMenuState(false);
                hamburger.focus();
            }
        });
        document.addEventListener('click', (event) => {
            if (!headerNav.contains(event.target) && !hamburger.contains(event.target)) {
                setMenuState(false);
            }
        });
        document.querySelector('.header').addEventListener('focusout', (event) => {
            if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
                setMenuState(false);
            }
        });
        window.matchMedia('(max-width: 991px)').addEventListener('change', () => setMenuState(false));

        // スマホ時にリンクをクリックしたらメニューを閉じる
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 991) {
                    setMenuState(false);
                }
            });
        });
    }

    // ==========================================
    // 2. Smooth Scroll
    // ==========================================
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    const headerEl = document.querySelector('.header');
    if (headerEl) {
        const updateHeaderHeight = () => {
            document.documentElement.style.setProperty('--site-header-height', `${headerEl.offsetHeight}px`);
        };
        updateHeaderHeight();
        new ResizeObserver(updateHeaderHeight).observe(headerEl);
    }

    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId === '#') return; // ダミーリンクは無視

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();

                // クリック時にヘッダー高さを再取得（レスポンシブ対応）
                const headerHeight = headerEl ? headerEl.offsetHeight : 56;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition - 16,
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
                });
                targetElement.setAttribute('tabindex', '-1');
                targetElement.focus({ preventScroll: true });
                if (window.location.hash !== targetId) history.pushState(null, '', targetId);
            }
        });
    });

    // ==========================================
    // 3. Overlay Close (Writer Details)
    // ==========================================
    const infoContents = document.querySelectorAll('.writer-info-content');
    infoContents.forEach(content => {
        content.addEventListener('click', (e) => {
            const details = e.target.closest('details');
            if (details) {
                details.removeAttribute('open');
            }
        });
    });
    // ==========================================
    // 4. Gallery Modal
    // ==========================================
    const galleryItems = document.querySelectorAll('button.gallery-item');
    const galleryModal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('gallery-modal-img');
    const closeModalBtn = document.querySelector('.gallery-modal-close');

    if (galleryItems.length > 0 && galleryModal && modalImg && closeModalBtn) {
        let galleryTrigger = null;
        let previousOverflow = '';
        galleryItems.forEach(button => {
            button.addEventListener('click', () => {
                const img = button.querySelector('img');
                galleryTrigger = button;
                modalImg.src = img.currentSrc || img.src;
                modalImg.alt = img.alt;
                previousOverflow = document.body.style.overflow;
                document.body.style.overflow = 'hidden';
                galleryModal.showModal();
            });
        });
        // dialogにフォーカス制御とEscを任せ、閉じたら元の写真へ戻す。
        galleryModal.addEventListener('close', () => {
            modalImg.removeAttribute('src');
            document.body.style.overflow = previousOverflow;
            if (galleryTrigger) galleryTrigger.focus({ preventScroll: true });
        });
        closeModalBtn.addEventListener('click', () => galleryModal.close());
        galleryModal.addEventListener('click', event => {
            if (event.target === galleryModal) galleryModal.close();
        });
    }
});
