// デバッグモード
const DEBUG = true;

// 音声データ
const voiceData = [
    { id: "voice01", name: "03 AI アナウンサー" },
    { id: "voice02", name: "しらゆき" },
    { id: "voice03", name: "たけちょり" },
    { id: "voice04", name: "ひかるボイス" },
    { id: "voice05", name: "ひまひま" },
    { id: "voice06", name: "まな" },
    { id: "voice07", name: "ゆりVer1" },
    { id: "voice08", name: "アスナ" },
    { id: "voice09", name: "テスト" },
    { id: "voice10", name: "ムアラニ" },
    { id: "voice11", name: "モデル" },
    { id: "voice12", name: "元気な女性" },
    { id: "voice13", name: "与沢さん" },
    { id: "voice14", name: "大文字メロウ２" },
    { id: "voice15", name: "安和昂" },
    { id: "voice16", name: "田中みなみ風" }
];

// バージョンマッピング
const versionPaths = {
    ayaharmony: "アヤハモニー",
    ayantry: "アヤントリー",
    natsumism: "ナツミズム"
};

// 初期化関数
function init() {
    generateTable();
    loadStarStates();
    setupEventListeners();
    setupKeyboardNavigation();
}

// テーブル生成
function generateTable() {
    const tbody = document.getElementById('voices-tbody');
    
    voiceData.forEach((voice, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-voice-id', voice.id);
        
        const th = document.createElement('th');
        th.setAttribute('scope', 'row');
        th.textContent = `Voice-${String(index + 1).padStart(2, '0')}`;
        th.setAttribute('title', voice.name);
        tr.appendChild(th);
        
        for (const version of ['ayaharmony', 'ayantry', 'natsumism']) {
            const td = document.createElement('td');
            td.setAttribute('data-version', version);
            td.setAttribute('data-voice-id', voice.id);
            td.setAttribute('tabindex', '0');
            td.setAttribute('data-rating', '0'); // 初期評価は0
            
            const cellContent = document.createElement('div');
            cellContent.className = 'cell-content';

            // 3つの星ボタンを生成
            const starsContainer = document.createElement('div');
            starsContainer.className = 'stars-container';
            for (let i = 1; i <= 3; i++) {
                const starBtn = document.createElement('button');
                starBtn.className = 'star-btn'; 
                starBtn.textContent = '☆'; 
                starBtn.setAttribute('data-star-index', String(i));
                starBtn.setAttribute('aria-label', `${voice.name}の${version}を星${i}で評価`);
                starsContainer.appendChild(starBtn);
            }
            
            const cellAudioPlayer = document.createElement('audio');
            cellAudioPlayer.className = 'cell-audio-player';
            cellAudioPlayer.controls = true;
            const audioPath = `音声_提案2/${versionPaths[version]}/${voice.name}`;
            const exactPath = findExactAudioPath(audioPath);
            if (exactPath) {
                cellAudioPlayer.src = exactPath;
            } else {
                console.error('初期パス設定エラー:', audioPath);
            }
            
            cellContent.appendChild(starsContainer); 
            cellContent.appendChild(cellAudioPlayer);
            
            td.appendChild(cellContent);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
}

// イベントリスナーのセットアップ
function setupEventListeners() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('star-btn')) {
            setRating(e.target);
        }
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            applyFilter(filter);
        });
    });

    // 各オーディオプレーヤーの再生イベントを監視し、他のプレーヤーを停止
    document.querySelectorAll('.cell-audio-player').forEach(player => {
        player.addEventListener('play', function() {
            document.querySelectorAll('.cell-audio-player').forEach(otherPlayer => {
                if (otherPlayer !== player && !otherPlayer.paused) {
                    otherPlayer.pause();
                }
            });
        });
    });
}

// 評価設定機能 (旧 toggleStar)
function setRating(clickedStarBtn) {
    const starsContainer = clickedStarBtn.closest('.stars-container');
    const allStarBtns = Array.from(starsContainer.querySelectorAll('.star-btn'));
    const clickedIndex = parseInt(clickedStarBtn.getAttribute('data-star-index'), 10);
    const td = clickedStarBtn.closest('td');
    let currentRating = parseInt(td.getAttribute('data-rating'), 10);

    // クリックされた星が現在の評価と同じで、それが最初の星でない場合、評価をリセット（星0）
    // または、クリックされた星が現在の評価と同じで最初の星なら、評価を1つ減らす（ただし0未満にはしない）
    // シンプルにするため、同じ星を再度クリックしたら評価を0にする仕様をまず試す
    if (clickedIndex === currentRating) {
        currentRating = 0;
    } else {
        currentRating = clickedIndex;
    }

    td.setAttribute('data-rating', String(currentRating));

    allStarBtns.forEach((star, index) => {
        if ((index + 1) <= currentRating) {
            star.textContent = '★'; // 塗りつぶされた星
            star.classList.add('rated');
        } else {
            star.textContent = '☆'; // 空の星
            star.classList.remove('rated');
        }
    });

    saveStarStates();
}

// 正確な音声ファイルパスを見つける関数
function findExactAudioPath(basePath) {
    try {
        const fileName = basePath.split('/').pop();
        const folderPath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
        
        const patterns = {
            'アヤハモニー': {
                '03 AI アナウンサー': '[03 AI アナウンサー](brea......んか？  .mp3',
                'しらゆき': '[しらゆき](brea......か？   .mp3',
                'たけちょり': '[たけちょり](brea......んか？  .mp3',
                'ひかるボイス': '[ひかるボイス](brea......んか？  .mp3',
                'ひまひま': '[ひまひま](brea......んか？  .mp3',
                'まな': '[まな]この包丁、......か？   .mp3',
                'ゆりVer1': '[ゆりVer1](brea......んか？  .mp3',
                'アスナ': '[アスナ]この包丁、......？    .mp3',
                'テスト': '[テスト](brea......んか？  .mp3',
                'ムアラニ': '[ムアラニ](brea......んか？  .mp3',
                'モデル': '[モデル](brea......んか？  .mp3',
                '元気な女性': '[元気な女性](brea......？    .mp3',
                '与沢さん': '[与沢さん](brea......んか？  .mp3',
                '大文字メロウ２': '[大文字メロウ２](brea......か？   .mp3',
                '安和昂': '[安和昂](brea......んか？  .mp3',
                '田中みなみ風': '[田中みなみ風]この包丁、......     .mp3'
            },
            'アヤントリー': {
                '03 AI アナウンサー': '[03 AI アナウンサー](brea......ライス！！.mp3',
                'しらゆき': '[しらゆき](brea......ライス！！.mp3',
                'たけちょり': '[たけちょり](brea......ライス！！.mp3',
                'ひかるボイス': '[ひかるボイス](brea......ライス！！.mp3',
                'ひまひま': '[ひまひま](brea......ライス！！.mp3',
                'まな': '[まな](brea......ライス！！.mp3',
                'ゆりVer1': '[ゆりVer1](brea......ライス！！.mp3',
                'アスナ': '[アスナ](brea......ライス！！.mp3',
                'テスト': '[テスト](brea......ライス！！.mp3',
                'ムアラニ': '[ムアラニ](brea......ライス！！.mp3',
                'モデル': '[モデル](brea......ライス！！.mp3',
                '元気な女性': '[元気な女性](brea......ライス！！.mp3',
                '与沢さん': '[与沢さん](brea......ライス！！-2.mp3',
                '大文字メロウ２': '[大文字メロウ２](brea......ライス！！.mp3',
                '安和昂': '[安和昂](brea......ライス！！.mp3',
                '田中みなみ風': '[田中みなみ風](brea......スライス！.mp3'
            },
            'ナツミズム': {
                '03 AI アナウンサー': '[03 AI アナウンサー] (bre......やさしい！.mp3',
                'しらゆき': '[しらゆき] (bre......やさしい！.mp3',
                'たけちょり': '[たけちょり] (bre......やさしい！.mp3',
                'ひかるボイス': '[ひかるボイス] (bre......やさしい！.mp3',
                'ひまひま': '[ひまひま] (bre......やさしい！.mp3',
                'まな': '[まな](brea......やさしい！.mp3',
                'ゆりVer1': '[ゆりVer1] (bre......やさしい！.mp3',
                'アスナ': '[アスナ] (bre......やさしい！.mp3',
                'テスト': '[テスト] (bre......やさしい！.mp3',
                'ムアラニ': '[ムアラニ] (bre......やさしい！.mp3',
                'モデル': '[モデル] (bre......やさしい！.mp3',
                '元気な女性': '[元気な女性] (bre......やさしい！.mp3',
                '与沢さん': '[与沢さん] (bre......やさしい！.mp3',
                '大文字メロウ２': '[大文字メロウ２] (bre......やさしい！.mp3',
                '安和昂': '[安和昂] (bre......やさしい！.mp3',
                '田中みなみ風': '[田中みなみ風] (bre......やさしい！.mp3'
            }
        };
        
        let currentVersion = '';
        if (folderPath.includes('アヤハモニー')) {
            currentVersion = 'アヤハモニー';
        } else if (folderPath.includes('アヤントリー')) {
            currentVersion = 'アヤントリー';
        } else if (folderPath.includes('ナツミズム')) {
            currentVersion = 'ナツミズム';
        } else {
            console.error('不明なバージョン:', folderPath);
            return null;
        }
        
        const exactFileName = patterns[currentVersion][fileName];
        if (!exactFileName) {
            console.error('音声ファイル名が見つかりません:', fileName, 'バージョン:', currentVersion);
            return null;
        }
        
        const actualPath = `${folderPath}${exactFileName}`;
        if (DEBUG) console.log('音声ファイルパス:', actualPath);
        return actualPath;
    } catch (error) {
        console.error('パス解決エラー:', error);
        return null;
    }
}

// フィルター適用
function applyFilter(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (filter === 'all') {
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
        document.querySelectorAll('tr[data-voice-id]').forEach(tr => {
            tr.style.display = '';
        });
        return;
    }
    
    document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active');
    
    document.querySelectorAll('tr[data-voice-id]').forEach(tr => {
        const versionCell = tr.querySelector(`td[data-version="${filter}"]`);
        if (versionCell && parseInt(versionCell.getAttribute('data-rating'), 10) > 0) { 
            tr.style.display = '';
        } else {
            tr.style.display = 'none';
        }
    });
}

// 評価状態の保存
function saveStarStates() {
    const ratings = {};
    document.querySelectorAll('td[data-version][data-voice-id]').forEach(td => {
        const version = td.getAttribute('data-version');
        const voiceId = td.getAttribute('data-voice-id');
        const rating = td.getAttribute('data-rating');
        
        if (!ratings[version]) {
            ratings[version] = {};
        }
        ratings[version][voiceId] = rating;
    });
    localStorage.setItem('starRatings', JSON.stringify(ratings)); // キー名を変更
}

// 評価状態の復元
function loadStarStates() {
    const savedRatings = localStorage.getItem('starRatings'); // キー名を変更
    if (!savedRatings) return;
    
    try {
        const ratings = JSON.parse(savedRatings);
        for (const version in ratings) {
            for (const voiceId in ratings[version]) {
                const rating = parseInt(ratings[version][voiceId], 10);
                const td = document.querySelector(`td[data-version="${version}"][data-voice-id="${voiceId}"]`);
                if (td) {
                    td.setAttribute('data-rating', String(rating));
                    const starBtns = td.querySelectorAll('.star-btn');
                    starBtns.forEach((starBtn, index) => {
                        if ((index + 1) <= rating) {
                            starBtn.textContent = '★';
                            starBtn.classList.add('rated');
                        } else {
                            starBtn.textContent = '☆';
                            starBtn.classList.remove('rated');
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('保存された評価の復元に失敗:', error);
    }
}

// キーボードナビゲーション (Sキーの動作変更)
function setupKeyboardNavigation() {
    let currentFocus = null;
    document.querySelectorAll('td[data-version]').forEach(cell => {
        cell.addEventListener('focus', function() {
            currentFocus = this;
        });
    });
    document.addEventListener('keydown', function(e) {
        if (!currentFocus) return;
        const row = currentFocus.parentElement;
        const allCells = Array.from(row.querySelectorAll('td[data-version]'));
        const currentIndex = allCells.indexOf(currentFocus);
        const rowIndex = Array.from(row.parentElement.children).indexOf(row);
        const allRows = Array.from(row.parentElement.children);

        switch (e.key) {
            case 'ArrowLeft':
                if (currentIndex > 0) allCells[currentIndex - 1].focus();
                break;
            case 'ArrowRight':
                if (currentIndex < allCells.length - 1) allCells[currentIndex + 1].focus();
                break;
            case 'ArrowUp':
                if (rowIndex > 0) {
                    const prevRow = allRows[rowIndex - 1];
                    const targetCell = prevRow.querySelectorAll('td[data-version]')[currentIndex];
                    if (targetCell) targetCell.focus();
                }
                break;
            case 'ArrowDown':
                if (rowIndex < allRows.length - 1) {
                    const nextRow = allRows[rowIndex + 1];
                    const targetCell = nextRow.querySelectorAll('td[data-version]')[currentIndex];
                    if (targetCell) targetCell.focus();
                }
                break;
            case ' ': 
                e.preventDefault();
                const cellAudioPlayer = currentFocus.querySelector('.cell-audio-player');
                if (cellAudioPlayer) {
                    if (cellAudioPlayer.paused) {
                        document.querySelectorAll('.cell-audio-player').forEach(player => {
                            if (player !== cellAudioPlayer && !player.paused) {
                                player.pause();
                            }
                        });
                        cellAudioPlayer.play();
                    } else {
                        cellAudioPlayer.pause();
                    }
                }
                break;
            case 's': 
            case 'S': 
                e.preventDefault();
                const currentRatingTd = currentFocus; // tdがフォーカス対象
                let currentRating = parseInt(currentRatingTd.getAttribute('data-rating'), 10);
                currentRating = (currentRating + 1) % 4; // 0, 1, 2, 3 のサイクル
                currentRatingTd.setAttribute('data-rating', String(currentRating));
                
                // UI更新のためにsetRatingを呼び出すか、同様のロジックをここに記述
                // ここでは簡易的に最初の星ボタンに対してsetRatingを擬似的に呼び出す
                const firstStar = currentRatingTd.querySelector('.star-btn[data-star-index="1"]');
                if (firstStar) {
                    // setRatingはクリックされた星のインデックスで評価を決定するため、
                    // ratingに合わせた星をクリックしたことにする
                    const targetStarIndex = currentRating === 0 ? 1 : currentRating; // 0の場合は1番目の星をクリックしたのと同じ挙動でリセット
                    const targetStar = currentRatingTd.querySelector(`.star-btn[data-star-index="${targetStarIndex}"]`);
                    if (targetStar) {
                         // Sキーで0になった場合、再度同じ星をクリックで0にするsetRatingのロジックだと都合が悪いので、直接UI更新
                        const allStarBtns = Array.from(currentRatingTd.querySelectorAll('.stars-container .star-btn'));
                        allStarBtns.forEach((star, index) => {
                            if ((index + 1) <= currentRating) {
                                star.textContent = '★';
                                star.classList.add('rated');
                            } else {
                                star.textContent = '☆';
                                star.classList.remove('rated');
                            }
                        });
                        saveStarStates();
                    }
                }
                break;
            case 'F1': 
                e.preventDefault();
                document.querySelector('.filter-btn[data-filter="ayaharmony"]').click();
                break;
            case 'F2': 
                e.preventDefault();
                document.querySelector('.filter-btn[data-filter="ayantry"]').click();
                break;
            case 'F3': 
                e.preventDefault();
                document.querySelector('.filter-btn[data-filter="natsumism"]').click();
                break;
        }
    });
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', init); 