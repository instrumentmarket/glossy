// --- EXTENSION SAFE LOGIC (Fixed Version) ---

// We use a self-executing function to prevent variable conflicts
(function() {
    console.log("Glossy: Script started...");

    // Helper to safely get elements without crashing if they are missing
    const get = (id) => document.getElementById(id);
    const getAll = (sel) => document.querySelectorAll(sel);

    document.addEventListener('DOMContentLoaded', () => {
        console.log("Glossy: DOM fully loaded. Attaching listeners...");

        // --- 1. DROPDOWN & SEARCH ---
        try {
            const dropdownBtn = get('dropdown-trigger');
            const dropdownList = get('dropdown-list');
            const currentEngineText = get('current-engine');
            const searchForm = get('search-form');
            const searchField = get('search-field');

            if (dropdownBtn && dropdownList) {
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Stop click from bubbling to window
                    dropdownList.classList.toggle('show');
                });

                // Handle Engine Selection
                getAll('.engine-select').forEach(item => {
                    item.addEventListener('click', () => {
                        const id = item.dataset.id;
                        const name = item.dataset.name;
                        
                        if(currentEngineText) currentEngineText.innerText = name;
                        dropdownList.classList.remove('show');

                        const configs = { 
                            'google': { a: 'https://www.google.com/search', p: 'q' }, 
                            'bing': { a: 'https://www.bing.com/search', p: 'q' }, 
                            'ddg': { a: 'https://duckduckgo.com/', p: 'q' }, 
                            'yahoo': { a: 'https://search.yahoo.com/search', p: 'p' } 
                        };
                        
                        if(searchForm && searchField) {
                            searchForm.action = configs[id].a;
                            searchField.name = configs[id].p;
                            searchField.placeholder = `Search ${name}...`;
                        }
                    });
                });
            }

            // Global Click to Close Dropdown
            window.addEventListener('click', (e) => {
                if (dropdownList && !e.target.closest('.custom-dropdown') && !e.target.closest('.modal-overlay')) {
                    dropdownList.classList.remove('show');
                }
                if(e.target.classList.contains('modal-overlay')) {
                    closeAllModals();
                }
            });
        } catch (err) { console.error("Glossy Error (Dropdown):", err); }


        // --- 2. MODAL MANAGEMENT ---
        const aiModal = get('ai-modal');
        const gameModal = get('game-modal');

        function closeAllModals() {
            if(aiModal) aiModal.style.display = 'none';
            if(gameModal) gameModal.style.display = 'none';
        }

        getAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', closeAllModals);
        });


        // --- 3. AI LOGIC ---
        try {
            const aiTrigger = get('btn-ai-trigger');
            const chatHistory = get('chat-history');
            const userInput = get('user-input');
            const aiSendBtn = get('btn-ai-send');
            const indicator = get('typing-indicator');

            if (aiTrigger) {
                aiTrigger.addEventListener('click', () => {
                    closeAllModals();
                    if(aiModal) {
                        aiModal.style.display = 'flex';
                        if(userInput) userInput.focus();
                    }
                });
            }

            if (aiSendBtn) aiSendBtn.addEventListener('click', sendMessage);
            if (userInput) {
                userInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') sendMessage();
                });
            }

            function appendMessage(html, sender) {
                if(!chatHistory) return;
                const div = document.createElement('div');
                div.classList.add('msg', sender === 'user' ? 'msg-user' : 'msg-bot');
                div.innerHTML = html;
                chatHistory.appendChild(div);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }

            async function sendMessage() {
                if(!userInput) return;
                const text = userInput.value.trim();
                if (!text) return;

                appendMessage(text, 'user');
                userInput.value = '';
                if(indicator) indicator.classList.add('typing-visible');

                const lower = text.toLowerCase();

                // Bot Logic
                let response = "";
                
                if (lower.match(/^(hi|hello)/)) {
                    reply("Hello! I'm Glossy."); return;
                }
                else if (lower.startsWith("watch ")) {
                    reply(`YouTube: <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(text.substring(6))}" target="_blank" class="msg-link">Watch Video</a>`); return;
                }
                else if (/^[\d\s\+\-\*\/\(\)\.\^a-z]+$/.test(lower) && (/\d/.test(lower))) {
                    try {
                        // Safety check for eval
                        reply(`Result: <strong>${eval(lower.replace(/\^/g,'**').replace(/sqrt/g,'Math.sqrt'))}</strong>`); return;
                    } catch(e) {}
                }

                // Wikipedia Fallback
                const wikiQuery = text.replace(/what is|who is|define/gi, '').trim();
                try {
                    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiQuery)}`);
                    if (r.ok) {
                        const d = await r.json();
                        if (d.type === 'standard') {
                            const extract = d.extract.length > 300 ? d.extract.substring(0, 300) + '...' : d.extract;
                            reply(`${extract}<br><a href="${d.content_urls.desktop.page}" class="msg-link">Read more</a>`);
                            return;
                        }
                    }
                } catch (e) { console.warn("Wiki fetch failed", e); }

                // Google Fallback
                setTimeout(() => {
                    if(indicator) indicator.classList.remove('typing-visible');
                    appendMessage(`I couldn't find that internally. <a href="https://www.google.com/search?q=${encodeURIComponent(text)}" target="_blank" class="msg-link">Search Google</a>`, 'bot');
                }, 600);
            }

            function reply(html) {
                setTimeout(() => {
                    if(indicator) indicator.classList.remove('typing-visible');
                    appendMessage(html, 'bot');
                }, 500);
            }
        } catch (err) { console.error("Glossy Error (AI):", err); }


        // --- 4. GAME LOGIC ---
        try {
            const gamesTrigger = get('btn-games-trigger');
            const gameViewIds = ['view-menu', 'view-ttt', 'view-rps', 'view-reaction', 'view-guess'];

            if (gamesTrigger) {
                gamesTrigger.addEventListener('click', () => {
                    closeAllModals();
                    if(gameModal) {
                        gameModal.style.display = 'flex';
                        showGameMenu();
                    }
                });
            }

            function showGameMenu() {
                gameViewIds.forEach(id => {
                    const el = get(id);
                    if(el) el.classList.add('hidden');
                });
                const menu = get('view-menu');
                if(menu) menu.classList.remove('hidden');
            }

            getAll('.btn-back-menu').forEach(btn => {
                btn.addEventListener('click', showGameMenu);
            });

            getAll('.game-select').forEach(btn => {
                btn.addEventListener('click', () => {
                    const game = btn.dataset.game;
                    const menu = get('view-menu');
                    if(menu) menu.classList.add('hidden');

                    if (game === 'ttt') {
                        initTTT();
                        const view = get('view-ttt');
                        if(view) view.classList.remove('hidden');
                    } else if (game === 'rps') {
                        const view = get('view-rps');
                        if(view) view.classList.remove('hidden');
                        const msg = get('rps-msg');
                        if(msg) msg.innerText = "Choose your weapon";
                    } else if (game === 'reaction') {
                        resetReaction();
                        const view = get('view-reaction');
                        if(view) view.classList.remove('hidden');
                    } else if (game === 'guess') {
                        initGuess();
                        const view = get('view-guess');
                        if(view) view.classList.remove('hidden');
                    }
                });
            });

            // TIC TAC TOE
            let tttState, tttPlayer, tttActive;
            const tttResetBtn = get('btn-ttt-reset');
            if (tttResetBtn) tttResetBtn.addEventListener('click', initTTT);

            function initTTT() {
                tttState = Array(9).fill('');
                tttPlayer = 'X';
                tttActive = true;
                const status = get('ttt-status');
                if(status) status.innerText = "Player X's Turn";
                const board = get('ttt-board');
                if(!board) return;
                
                board.innerHTML = '';

                for (let i = 0; i < 9; i++) {
                    let c = document.createElement('div');
                    c.className = 'ttt-cell';
                    c.addEventListener('click', () => {
                        if (tttState[i] || !tttActive) return;
                        tttState[i] = tttPlayer;
                        c.innerText = tttPlayer;
                        c.style.color = tttPlayer === 'X' ? 'var(--accent)' : '#ec4899';
                        checkTTT();
                    });
                    board.appendChild(c);
                }
            }

            function checkTTT() {
                const w = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
                const status = get('ttt-status');
                if(!status) return;

                if (w.some(a => tttState[a[0]] && tttState[a[0]] == tttState[a[1]] && tttState[a[1]] == tttState[a[2]])) {
                    status.innerText = `${tttPlayer} Wins!`;
                    tttActive = false;
                } else if (!tttState.includes('')) {
                    status.innerText = "Draw!";
                    tttActive = false;
                } else {
                    tttPlayer = tttPlayer === 'X' ? 'O' : 'X';
                    status.innerText = `${tttPlayer}'s Turn`;
                }
            }

            // RPS
            getAll('.rps-select').forEach(btn => {
                btn.addEventListener('click', () => playRPS(btn.dataset.choice));
            });

            function playRPS(p) {
                const c = ['🪨', '📄', '✂️'][Math.floor(Math.random() * 3)];
                let r = p === c ? "Tie!" :
                    ((p == '🪨' && c == '✂️') || (p == '📄' && c == '🪨') || (p == '✂️' && c == '📄')) ? "Win!" : "Lose!";
                
                const msg = get('rps-msg');
                if(msg) {
                    msg.innerHTML = `You: ${p} | Bot: ${c}<br><strong style="color:${r == 'Win!' ? '#4ade80' : r == 'Tie!' ? 'white' : '#f87171'}">${r}</strong>`;
                }
            }

            // REACTION
            let reactTimer, reactStart, reactActive = false, reactReady = false;
            const rBox = get('reaction-box');
            const rRes = get('reaction-res');

            if (rBox) {
                rBox.addEventListener('mousedown', () => {
                    if (!reactActive && !reactReady) {
                        reactActive = true;
                        rBox.style.background = '#ef4444';
                        rBox.innerText = "Wait for Green...";
                        if(rRes) rRes.innerText = "...";
                        const delay = 1000 + Math.random() * 3000;
                        reactTimer = setTimeout(() => {
                            rBox.style.background = '#22c55e';
                            rBox.innerText = "CLICK!";
                            reactStart = Date.now();
                            reactReady = true;
                        }, delay);
                    } else if (reactActive && !reactReady) {
                        clearTimeout(reactTimer);
                        rBox.innerText = "Too Early!";
                        if(rRes) rRes.innerText = "Fail";
                        reactActive = false;
                    } else if (reactReady) {
                        const ms = Date.now() - reactStart;
                        rBox.innerText = `${ms} ms`;
                        if(rRes) rRes.innerText = "Nice!";
                        reactReady = false;
                        reactActive = false;
                    } else {
                        resetReaction();
                    }
                });
            }

            function resetReaction() {
                clearTimeout(reactTimer);
                if(rBox) {
                    rBox.style.background = '#ef4444';
                    rBox.innerText = "Click to Start";
                }
                if(rRes) rRes.innerText = "Test your speed";
                reactActive = false;
                reactReady = false;
            }

            // GUESS
            let targetNum;
            const guessBtn = get('btn-guess-check');
            if (guessBtn) guessBtn.addEventListener('click', checkGuess);

            function initGuess() {
                targetNum = Math.floor(Math.random() * 100) + 1;
                const msg = get('guess-msg');
                const input = get('guess-input');
                if(msg) msg.innerText = "Thinking of 1-100...";
                if(input) input.value = '';
            }

            function checkGuess() {
                const input = get('guess-input');
                const msg = get('guess-msg');
                if(!input || !msg) return;
                
                const v = parseInt(input.value);
                if (v === targetNum) {
                    msg.innerText = "Correct!";
                    msg.style.color = "#4ade80";
                } else {
                    msg.innerText = v < targetNum ? "Too Low" : "Too High";
                    msg.style.color = "#fbbf24";
                }
            }
        } catch (err) { console.error("Glossy Error (Games):", err); }

    });
})();