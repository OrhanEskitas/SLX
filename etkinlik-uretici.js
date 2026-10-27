/**
 * ============================================================================
 * ETKİNLİK ÜRETİCİ (STUDIO NATIVE ACTIVITY BUILDER) - etkinlik-uretici.js
 * ============================================================================
 * Sistemin kendi mimarisiyle (1750x750 Safe-Zone, PlayerCore.initSlide,
 * slideData, [data-admin-path], AdminVisualEditor ve Seçili Nesne Özellikleri)
 * birebir uyumlu, düzenlenebilir içerik üretici modül.
 *
 * 1. Etkinlik Tipi: Sürükle ve Bırak (Drag & Drop)
 *    - Kaç elemanlı olacağını kullanıcıya sorar.
 *    - Sürüklenecek nesneleri (dragItems - Mavi) ve bırakma alanlarını
 *      (dropZones - Kehribar/Sarı) görünür, renklendirilmiş ve içi boş <div>
 *      olarak oluşturur.
 *    - Her sürüklenecek nesnenin içinde 3 adet <div> bulunur:
 *        1) Normal Div  (states.normal  - Mavi)
 *        2) Doğru Div   (states.correct - Yeşil)
 *        3) Yanlış Div  (states.wrong   - Kırmızı)
 *    - Yapay zeka araçlarından alınan tüm düzenleme özellikleri (fareyle taşıma,
 *      8 tutamaçla boyutlandırma, metin/görsel/Arapça ekleme, ekran alıntısı
 *      kırpma, renk, köşe yuvarlaklığı, katman, kopyalama/silme) bu nesneler
 *      için de birebir geçerlidir.
 *    - Tüm nesneler bırakma alanlarına yerleştirildiğinde "Kontrol Et"
 *      (#slayt-check-btn) anında aktif olur (hem Stüdyo Canlı Önizleme sahnesinde
 *      hem Öğrenci sahnesinde).
 * ============================================================================
 */

(function () {
    'use strict';





    function injectBuilderStyles() {
        if (document.getElementById('agy-activity-builder-styles')) return;
        const style = document.createElement('style');
        style.id = 'agy-activity-builder-styles';
        style.textContent = `
            /* Dönüt modalının Yönetim Paneli (z-60) açıkken de en üstte görünmesini sağla */
            #feedback-modal {
                z-index: 220 !important;
            }
            /* Yönetim Paneli Canlı Önizleme sahnesinde boş div'lerin kolayca fark edilmesi için yardımcı etiket */
            #admin-preview-canvas .agy-empty-div-hint::after {
                content: attr(data-empty-label);
                position: absolute;
                inset: 8px;
                border: 2px dashed rgba(30, 41, 59, 0.25);
                border-radius: inherit;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 6px;
                font-size: 13px;
                font-weight: 800;
                color: rgba(15, 23, 42, 0.65);
                background: rgba(255, 255, 255, 0.45);
                pointer-events: none;
                line-height: 1.25;
                z-index: 1;
            }
            /* Öğrenci sahnesinde (#slide-canvas) boş div olsa bile renkli kutu görünür, sadece stüdyo yazısı gizlenir */
            #slide-canvas .agy-empty-div-hint::after {
                display: none !important;
                content: none !important;
            }
            .agy-drag-item {
                touch-action: none;
                user-select: none;
                transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
            }
            .agy-drag-item.agy-dragging {
                transition: none !important;
                z-index: 95 !important;
                box-shadow: 0 22px 38px -10px rgba(15, 23, 42, 0.32) !important;
            }
            .agy-drop-zone.agy-zone-hover {
                outline: 4px dashed #2563eb !important;
                outline-offset: 4px;
                filter: brightness(0.96);
            }
            #slayt-check-btn.agy-check-ready {
                opacity: 1 !important;
                cursor: pointer !important;
                pointer-events: auto !important;
                filter: drop-shadow(0 8px 18px rgba(16, 185, 129, 0.38));
            }
            .agy-interactive-card {
                user-select: none;
                transition: transform 0.18s ease, box-shadow 0.18s ease;
            }
            .agy-interactive-card:focus-visible {
                outline: 4px solid #3b82f6 !important;
                outline-offset: 2px;
            }
            .agy-text-input-field {
                background: transparent;
                border: none;
                outline: none;
                width: 100%;
                height: 100%;
                text-align: center;
                font-weight: 800;
                color: inherit;
                font-family: inherit;
            }
            .agy-text-input-field::placeholder {
                color: rgba(100, 116, 139, 0.55);
                font-weight: 600;
            }
            #admin-preview-canvas.preview-edit-mode .agy-state-text-wrap,
            #admin-preview-canvas.preview-edit-mode [data-is-state-text="1"],
            #admin-preview-canvas.preview-edit-mode .agy-state-text-wrap * {
                pointer-events: auto !important;
                cursor: move !important;
                transition: outline 0.15s ease, background-color 0.15s ease;
            }
            #admin-preview-canvas.preview-edit-mode .agy-state-text-wrap:hover,
            #admin-preview-canvas.preview-edit-mode [data-is-state-text="1"]:hover {
                outline: 2px dashed #4f46e5 !important;
                outline-offset: 3px !important;
                background-color: rgba(99, 102, 241, 0.12) !important;
                border-radius: 6px !important;
            }
        `;
        document.head.appendChild(style);
    }

    const ActivityStudioBuilder = {
        selectedType: 'drag-drop',
        dragDropConfig: {
            count: 4,
            layout: 'top-bottom', // 'top-bottom' | 'left-right'
            title: 'Sürükle ve Bırak Etkinliği',
            instruction: 'Nesneleri uygun bırakma alanlarına sürükleyip bırakınız ve Kontrol Et butonuna basınız.'
        },
        textInputConfig: {
            count: 3,
            inputMode: 'text', // 'digit' | 'letter' | 'text'
            layout: 'rows',    // 'rows' | 'cards'
            title: 'Metin Girişi Etkinliği',
            instruction: 'Kutulara doğru ifadeleri yazınız ve Kontrol Et butonuna basınız.'
        },
        multipleChoiceConfig: {
            optionCount: 4,
            questionCount: 2,
            layout: 'grid', // 'grid' | 'list'
            title: 'Çoktan Seçmeli Etkinliği',
            instruction: 'Soruyu okuyunuz, doğru seçeneği işaretleyip Kontrol Et butonuna basınız.'
        },
        trueFalseConfig: {
            count: 6,
            title: 'Doğru / Yanlış Etkinliği',
            instruction: 'İfadeleri okuyunuz, her ifade için Doğru (D) veya Yanlış (Y) seçeneğini işaretleyip Kontrol Et butonuna basınız.'
        },
        multiSelectConfig: {
            count: 6,
            layout: 'grid', // 'grid' | 'cards'
            title: 'Çoklu Seçim Etkinliği',
            instruction: 'Aşağıdakilerden doğru olanların tamamını işaretleyip Kontrol Et butonuna basınız.'
        },
        studioPreviewMode: 'design', // 'design' | 'test'

        activityTypes: [
            {
                id: 'drag-drop',
                order: 1,
                title: 'Sürükle ve Bırak',
                subtitle: '3 Durumlu Nesne Divi (Normal / Doğru / Yanlış) + Bırakma Alanı Divi',
                icon: 'fa-hand-pointer',
                ready: true
            },
            {
                id: 'text-input',
                order: 2,
                title: 'Metin Girişi',
                subtitle: '1-Tek Rakam • 2-Sadece Harf • 3-Metin (Çoklu Giriş + Doğru Cevap Tanımlı)',
                icon: 'fa-keyboard',
                ready: true
            },
            {
                id: 'multiple-choice',
                order: 3,
                title: 'Çoktan Seçmeli (Zincirli)',
                subtitle: 'Soru Divi + 4/5 Seçenek Divi (4 Durumlu) • Bildikçe Yeni Soruya Geçer',
                icon: 'fa-circle-dot',
                ready: true
            },
            {
                id: 'true-false',
                order: 4,
                title: 'Doğru / Yanlış Grubu',
                subtitle: '6-7 İfade Divi + İkili Radio Buton Grubu (4 Durumlu: Normal/Seçili/Doğru/Yanlış)',
                icon: 'fa-scale-balanced',
                ready: true
            },
            {
                id: 'multi-select',
                order: 5,
                title: 'Çoklu Seçim (Check)',
                subtitle: '5-6 Check Buton Divi (Hangileri Doğrudur? • 4 Durumlu Div)',
                icon: 'fa-square-check',
                ready: true
            },
            { id: 'type-6', order: 6, title: '6. Etkinlik Tiplemesi', subtitle: 'Tanımlanmaya Hazır', icon: 'fa-bullseye', ready: false },
            { id: 'type-7', order: 7, title: '7. Etkinlik Tiplemesi', subtitle: 'Tanımlanmaya Hazır', icon: 'fa-star', ready: false }
        ],

        init: function () {
            injectBuilderStyles();
            if (typeof PlayerCore !== 'undefined' && typeof PlayerCore.playSound !== 'function') {
                PlayerCore.playSound = function () {};
            }
            this.renderBuilderTab();
            this.injectWebObjectExportUI();
            this.hookIntoSystem();
            this.upgradeExistingDragDropSlides();
        },

        // Daha önce kaydedilmiş (localStorage / PlayerCore.slides) sürükle-bırak etkinliklerini en güncel motora yükseltir
        upgradeExistingDragDropSlides: function () {
            try {
                if (typeof PlayerCore !== 'undefined' && Array.isArray(PlayerCore.slides)) {
                    const freshInitFn = new Function('return ' + this.buildDragDropInitFunctionString())();
                    let currentSlideUpgraded = false;
                    PlayerCore.slides.forEach((sl, idx) => {
                        if (sl && sl.slideData && Array.isArray(sl.slideData.dragItems) && Array.isArray(sl.slideData.dropZones)) {
                            sl.init = freshInitFn;
                            if (idx === PlayerCore.currentSlideIndex) currentSlideUpgraded = true;
                        }
                    });
                    if (currentSlideUpgraded && typeof PlayerCore.renderSlide === 'function') {
                        PlayerCore.renderSlide();
                    }
                }
                if (typeof AdminCore !== 'undefined' && typeof AdminCore.getDb === 'function' && typeof AdminCore.setDb === 'function') {
                    const db = AdminCore.getDb();
                    if (Array.isArray(db) && db.length > 0) {
                        let dbChanged = false;
                        const updatedDb = db.map(codeStr => {
                            if (typeof codeStr === 'string' && codeStr.includes('"dragItems"') && codeStr.includes('"dropZones"')) {
                                const upgraded = this.replaceDragDropInitInCode(codeStr);
                                if (upgraded !== codeStr) {
                                    dbChanged = true;
                                    return upgraded;
                                }
                            }
                            return codeStr;
                        });
                        if (dbChanged) AdminCore.setDb(updatedDb);
                    }
                }
            } catch (e) {}
        },

        replaceDragDropInitInCode: function (codeStr) {
            if (!codeStr || typeof codeStr !== 'string') return codeStr;
            if (!codeStr.includes('dragItems') || !codeStr.includes('dropZones')) return codeStr;
            const sdInfo = (typeof AdminCore !== 'undefined' && typeof AdminCore.extractSlideData === 'function')
                ? AdminCore.extractSlideData(codeStr)
                : null;
            if (!sdInfo || !sdInfo.data || !Array.isArray(sdInfo.data.dragItems) || !Array.isArray(sdInfo.data.dropZones)) {
                return codeStr;
            }
            const afterSlideData = codeStr.substring(sdInfo.fullMatchEnd);
            const fnStartRel = afterSlideData.search(/,\s*function\s*\(/);
            const scriptCloseIdx = codeStr.lastIndexOf('</script>');
            if (fnStartRel === -1) return codeStr;
            const fnCommaPos = sdInfo.fullMatchEnd + fnStartRel;
            const newInitStr = this.buildDragDropInitFunctionString();
            if (scriptCloseIdx !== -1 && scriptCloseIdx > fnCommaPos) {
                return codeStr.substring(0, fnCommaPos) + ', ' + newInitStr + ');\n</script>';
            }
            return codeStr.substring(0, fnCommaPos) + ', ' + newInitStr + ');';
        },

        onTabOpened: function () {
            this.renderBuilderTab();
        },

        renderBuilderTab: function () {
            const container = document.getElementById('tab-builder-content');
            if (!container) return;

            const selType = this.selectedType || 'drag-drop';
            const cfg = this.dragDropConfig;
            const tiCfg = this.textInputConfig;
            const mcCfg = this.multipleChoiceConfig;
            const tfCfg = this.trueFalseConfig;
            const msCfg = this.multiSelectConfig;

            let configPanelHtml = '';
            if (selType === 'drag-drop') {
                const quickCounts = [2, 3, 4, 5, 6, 8];
                configPanelHtml = `
                    <!-- 1. TİP: SÜRÜKLE VE BIRAK KURULUM PANELİ -->
                    <div class="bg-white border-2 border-emerald-200 rounded-2xl p-6 shadow-sm space-y-5">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                            <div>
                                <h4 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs inline-flex items-center justify-center">1</span>
                                    <span>Sürükle ve Bırak Etkinliği Yapılandırması</span>
                                </h4>
                                <p class="text-xs text-slate-500 mt-0.5">Sürüklenecek nesneler <b>Mavi (Normal) / Yeşil (Doğru) / Kırmızı (Yanlış)</b> 3 iç div ile; bırakma alanları <b>Kehribar/Sarı</b> renkli boş div olarak oluşturulur.</p>
                            </div>
                            <div class="flex items-center gap-2 shrink-0">
                                <span class="text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-lg">Nesneler: 3 Durumlu Div</span>
                                <span class="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-lg">Bırakma Alanı: Sarı Div</span>
                            </div>
                        </div>

                        <div class="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
                            <label class="block text-sm font-extrabold text-emerald-950 mb-2">
                                <i class="fa-solid fa-circle-question text-emerald-600 mr-1.5"></i>Kaç elemanlı bir sürükle bırak etkinliği yapmak istiyorsunuz?
                            </label>
                            <div class="flex flex-wrap items-center gap-2.5">
                                ${quickCounts.map(n => `
                                    <button type="button" onclick="ActivityStudioBuilder.setElementCount(${n})" class="px-4 py-2.5 rounded-xl font-extrabold text-sm transition cursor-pointer border-2 ${cfg.count === n ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'}">
                                        ${n} Elemanlı
                                    </button>
                                `).join('')}
                                <div class="flex items-center gap-2 ml-auto bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5">
                                    <span class="text-xs font-bold text-slate-500">Özel Sayı:</span>
                                    <input type="number" id="builder-dd-count-input" min="1" max="12" value="${cfg.count}" onchange="ActivityStudioBuilder.setElementCount(this.value)" class="w-16 text-center font-extrabold text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg py-1 outline-none focus:ring-2 focus:ring-emerald-400">
                                </div>
                            </div>
                            <p class="text-[11px] text-emerald-800 mt-2.5 font-medium">
                                <i class="fa-solid fa-wand-sparkles mr-1"></i>Sahnede <b>${cfg.count} adet</b> mavi sürüklenecek nesne (her birinde <i>Normal, Doğru, Yanlış</i> olmak üzere 3 div) ve <b>${cfg.count} adet</b> sarı bırakma alanı divi oluşturulacak.
                            </p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">Sahne Başlangıç Dizilimi</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <button type="button" onclick="ActivityStudioBuilder.setLayout('top-bottom')" class="p-3 rounded-xl border-2 text-left transition cursor-pointer ${cfg.layout === 'top-bottom' ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}">
                                        <div class="text-xs font-extrabold flex items-center gap-1.5"><i class="fa-solid fa-arrows-up-down text-emerald-600"></i> Üst - Alt Dizilim</div>
                                        <div class="text-[10px] text-slate-500 mt-0.5">Üstte mavi nesneler, altta sarı alanlar</div>
                                    </button>
                                    <button type="button" onclick="ActivityStudioBuilder.setLayout('left-right')" class="p-3 rounded-xl border-2 text-left transition cursor-pointer ${cfg.layout === 'left-right' ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}">
                                        <div class="text-xs font-extrabold flex items-center gap-1.5"><i class="fa-solid fa-arrows-left-right text-emerald-600"></i> Sol - Sağ Dizilim</div>
                                        <div class="text-[10px] text-slate-500 mt-0.5">Solda mavi nesneler, sağda sarı alanlar</div>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">Yönerge / Başlık Metni</label>
                                <input type="text" value="${cfg.instruction.replace(/"/g, '&quot;')}" oninput="ActivityStudioBuilder.dragDropConfig.instruction = this.value" class="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400">
                            </div>
                        </div>

                        <div class="flex items-center justify-end pt-2">
                            <button type="button" onclick="ActivityStudioBuilder.generateAndLoadDragDrop()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2.5 text-sm">
                                <i class="fa-solid fa-plus-circle text-base"></i>
                                <span>${cfg.count} Elemanlı Sürükle-Bırak Etkinliğini Oluştur ve Düzenle</span>
                                <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>`;
            } else if (selType === 'text-input') {
                const tiCounts = [1, 2, 3, 4, 5, 6];
                const modes = [
                    { id: 'digit', title: '1 - Sadece Sayı (Tek Rakamlı)', desc: 'Sadece 0-9 arası tek rakam girilebilir', icon: 'fa-hashtag' },
                    { id: 'letter', title: '2 - Sadece Harf', desc: 'Sadece harf girilebilir (sayı/sembol engellenir)', icon: 'fa-font' },
                    { id: 'text', title: '3 - Serbest Metin / İfade', desc: 'Kelime, cümle veya serbest ifade girilebilir', icon: 'fa-keyboard' }
                ];
                configPanelHtml = `
                    <!-- 2. TİP: METİN GİRİŞİ KURULUM PANELİ -->
                    <div class="bg-white border-2 border-blue-200 rounded-2xl p-6 shadow-sm space-y-5">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                            <div>
                                <h4 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-full bg-blue-600 text-white text-xs inline-flex items-center justify-center">2</span>
                                    <span>Metin Girişi Etkinliği Yapılandırması</span>
                                </h4>
                                <p class="text-xs text-slate-500 mt-0.5">Bir ekranda birden fazla metin girişi olabilir. Tüm metin girişleri tamamlanınca <b>Kontrol Et</b> aktif olur; doğrular kilitlenir, yanlışların değeri silinip tekrar giriş yapılması sağlanır.</p>
                            </div>
                            <span class="text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-lg shrink-0">Tam Erişilebilir (A11y)</span>
                        </div>

                        <div class="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-3">
                            <label class="block text-sm font-extrabold text-blue-950">
                                <i class="fa-solid fa-sliders text-blue-600 mr-1.5"></i>1) Metin Giriş Türünü Seçin (Stüdyoda her kutu için ayrı ayrı da değiştirilebilir):
                            </label>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                ${modes.map(m => `
                                    <button type="button" onclick="ActivityStudioBuilder.setTextInputMode('${m.id}')" class="p-3.5 rounded-xl border-2 text-left transition cursor-pointer ${tiCfg.inputMode === m.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'}">
                                        <div class="text-xs font-extrabold flex items-center gap-2"><i class="fa-solid ${m.icon}"></i><span>${m.title}</span></div>
                                        <div class="text-[10px] mt-1 ${tiCfg.inputMode === m.id ? 'text-blue-100' : 'text-slate-500'}">${m.desc}</div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <label class="block text-sm font-extrabold text-slate-800 mb-2">
                                <i class="fa-solid fa-list-ol text-blue-600 mr-1.5"></i>2) Ekranda kaç adet Metin Giriş alanı olsun?
                            </label>
                            <div class="flex flex-wrap items-center gap-2.5">
                                ${tiCounts.map(n => `
                                    <button type="button" onclick="ActivityStudioBuilder.setTextInputCount(${n})" class="px-4 py-2 rounded-xl font-extrabold text-sm transition cursor-pointer border-2 ${tiCfg.count === n ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'}">
                                        ${n} Giriş Alanı
                                    </button>
                                `).join('')}
                                <div class="flex items-center gap-2 ml-auto bg-white border-2 border-slate-200 rounded-xl px-3 py-1">
                                    <span class="text-xs font-bold text-slate-500">Özel Sayı:</span>
                                    <input type="number" min="1" max="10" value="${tiCfg.count}" onchange="ActivityStudioBuilder.setTextInputCount(this.value)" class="w-16 text-center font-extrabold text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg py-1 outline-none">
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">Sahne Başlangıç Dizilimi</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <button type="button" onclick="ActivityStudioBuilder.setTextInputLayout('rows')" class="p-3 rounded-xl border-2 text-left transition cursor-pointer ${tiCfg.layout === 'rows' ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}">
                                        <div class="text-xs font-extrabold"><i class="fa-solid fa-table-list text-blue-600 mr-1"></i> Satır Dizilimi</div>
                                        <div class="text-[10px] text-slate-500 mt-0.5">Solda soru/görsel divi, sağda giriş kutusu</div>
                                    </button>
                                    <button type="button" onclick="ActivityStudioBuilder.setTextInputLayout('cards')" class="p-3 rounded-xl border-2 text-left transition cursor-pointer ${tiCfg.layout === 'cards' ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}">
                                        <div class="text-xs font-extrabold"><i class="fa-solid fa-grip text-blue-600 mr-1"></i> Kart Izgarası</div>
                                        <div class="text-[10px] text-slate-500 mt-0.5">Üstte soru/görsel divi, altında giriş kutusu</div>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">Yönerge / Başlık Metni</label>
                                <input type="text" value="${tiCfg.instruction.replace(/"/g, '&quot;')}" oninput="ActivityStudioBuilder.textInputConfig.instruction = this.value" class="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-400">
                            </div>
                        </div>

                        <div class="flex items-center justify-end pt-2">
                            <button type="button" onclick="ActivityStudioBuilder.generateAndLoadTextInput()" class="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2.5 text-sm">
                                <i class="fa-solid fa-plus-circle text-base"></i>
                                <span>${tiCfg.count} Alanlı Metin Girişi Etkinliğini Oluştur ve Düzenle</span>
                                <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>`;
            } else if (selType === 'multiple-choice') {
                const optCounts = [3, 4, 5, 6];
                const qCounts = [1, 2, 3, 4, 5];
                configPanelHtml = `
                    <!-- 3. TİP: ÇOKTAN SEÇMELİ (PEŞ PEŞE SORULU) KURULUM PANELİ -->
                    <div class="bg-white border-2 border-violet-200 rounded-2xl p-6 shadow-sm space-y-5">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                            <div>
                                <h4 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-full bg-violet-600 text-white text-xs inline-flex items-center justify-center">3</span>
                                    <span>Çoktan Seçmeli (Bildikçe Yeni Soruya Geçen) Etkinlik Yapılandırması</span>
                                </h4>
                                <p class="text-xs text-slate-500 mt-0.5">Soru alanı ve seçenekler boş/düzenlenebilir <b>div</b> olarak oluşturulur (Seçeneklerde <b>1-Normal, 2-Seçili, 3-Doğru, 4-Yanlış</b> 4 durumlu div vardır). Peş peşe istediğiniz kadar soru ekleyebilirsiniz.</p>
                            </div>
                            <span class="text-[11px] font-bold bg-violet-100 text-violet-800 border border-violet-300 px-2.5 py-1 rounded-lg shrink-0">Zincirli Soru Sistemi</span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="bg-violet-50/60 border border-violet-200 rounded-2xl p-4">
                                <label class="block text-sm font-extrabold text-violet-950 mb-2">
                                    <i class="fa-solid fa-list-ul text-violet-600 mr-1.5"></i>Her soruda kaç seçenek (div) olsun?
                                </label>
                                <div class="flex flex-wrap gap-2">
                                    ${optCounts.map(n => `
                                        <button type="button" onclick="ActivityStudioBuilder.setMcOptionCount(${n})" class="px-4 py-2 rounded-xl font-extrabold text-sm transition cursor-pointer border-2 ${mcCfg.optionCount === n ? 'bg-violet-600 text-white border-violet-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-violet-400'}">
                                            ${n} Seçenekli
                                        </button>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
                                <label class="block text-sm font-extrabold text-amber-950 mb-2">
                                    <i class="fa-solid fa-layer-group text-amber-600 mr-1.5"></i>Başlangıçta peş peşe kaç soru olsun? (Stüdyoda sınırsız eklenebilir)
                                </label>
                                <div class="flex flex-wrap items-center gap-2">
                                    ${qCounts.map(n => `
                                        <button type="button" onclick="ActivityStudioBuilder.setMcQuestionCount(${n})" class="px-3.5 py-2 rounded-xl font-extrabold text-sm transition cursor-pointer border-2 ${mcCfg.questionCount === n ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'}">
                                            ${n} Soru
                                        </button>
                                    `).join('')}
                                    <input type="number" min="1" max="20" value="${mcCfg.questionCount}" onchange="ActivityStudioBuilder.setMcQuestionCount(this.value)" class="w-16 text-center font-extrabold text-sm text-amber-800 bg-white border-2 border-amber-200 rounded-xl py-1.5 ml-auto outline-none">
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">Seçeneklerin Sahne Dizilimi</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <button type="button" onclick="ActivityStudioBuilder.setMcLayout('grid')" class="p-3 rounded-xl border-2 text-left transition cursor-pointer ${mcCfg.layout === 'grid' ? 'border-violet-600 bg-violet-50/60 text-violet-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}">
                                        <div class="text-xs font-extrabold"><i class="fa-solid fa-grip text-violet-600 mr-1"></i> Yan Yana / Izgara</div>
                                        <div class="text-[10px] text-slate-500 mt-0.5">Üstte soru divi, altta kart seçenekler</div>
                                    </button>
                                    <button type="button" onclick="ActivityStudioBuilder.setMcLayout('list')" class="p-3 rounded-xl border-2 text-left transition cursor-pointer ${mcCfg.layout === 'list' ? 'border-violet-600 bg-violet-50/60 text-violet-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}">
                                        <div class="text-xs font-extrabold"><i class="fa-solid fa-bars text-violet-600 mr-1"></i> Alt Alta Liste</div>
                                        <div class="text-[10px] text-slate-500 mt-0.5">Solda soru divi, sağda alt alta seçenekler</div>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">Yönerge / Başlık Metni</label>
                                <input type="text" value="${mcCfg.instruction.replace(/"/g, '&quot;')}" oninput="ActivityStudioBuilder.multipleChoiceConfig.instruction = this.value" class="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-violet-400">
                            </div>
                        </div>

                        <div class="flex items-center justify-end pt-2">
                            <button type="button" onclick="ActivityStudioBuilder.generateAndLoadMultipleChoice()" class="bg-violet-600 hover:bg-violet-700 text-white font-extrabold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2.5 text-sm">
                                <i class="fa-solid fa-plus-circle text-base"></i>
                                <span>${mcCfg.questionCount} Sorulu (${mcCfg.optionCount} Seçenekli) Çoktan Seçmeli Oluştur</span>
                                <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>`;
            } else if (selType === 'true-false') {
                const tfCounts = [4, 5, 6, 7, 8];
                configPanelHtml = `
                    <!-- 4. TİP: DOĞRU / YANLIŞ İKİLİ RADİO GRUBU KURULUM PANELİ -->
                    <div class="bg-white border-2 border-amber-200 rounded-2xl p-6 shadow-sm space-y-5">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                            <div>
                                <h4 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-full bg-amber-600 text-white text-xs inline-flex items-center justify-center">4</span>
                                    <span>Doğru / Yanlış İkili Radio Buton Grubu Yapılandırması</span>
                                </h4>
                                <p class="text-xs text-slate-500 mt-0.5">Ekranda ifadeler ve yanlarında ikili <b>Doğru / Yanlış</b> buton divleri yer alır. Her butonda <b>4 State (1-Normal, 2-Seçili, 3-Doğru, 4-Yanlış)</b> div bulunur. Tümü işaretlenince Kontrol Et aktif olur.</p>
                            </div>
                            <span class="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-lg shrink-0">4 Durumlu İkili Radio</span>
                        </div>

                        <div class="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                            <label class="block text-sm font-extrabold text-amber-950 mb-2">
                                <i class="fa-solid fa-list-check text-amber-600 mr-1.5"></i>Ekranda kaç adet Doğru / Yanlış ifadesi bulunsun?
                            </label>
                            <div class="flex flex-wrap items-center gap-2.5">
                                ${tfCounts.map(n => `
                                    <button type="button" onclick="ActivityStudioBuilder.setTrueFalseCount(${n})" class="px-4 py-2.5 rounded-xl font-extrabold text-sm transition cursor-pointer border-2 ${tfCfg.count === n ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-105' : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'}">
                                        ${n} İfadeli
                                    </button>
                                `).join('')}
                                <div class="flex items-center gap-2 ml-auto bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5">
                                    <span class="text-xs font-bold text-slate-500">Özel Sayı:</span>
                                    <input type="number" min="1" max="10" value="${tfCfg.count}" onchange="ActivityStudioBuilder.setTrueFalseCount(this.value)" class="w-16 text-center font-extrabold text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-1 outline-none">
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">Yönerge / Başlık Metni</label>
                            <input type="text" value="${tfCfg.instruction.replace(/"/g, '&quot;')}" oninput="ActivityStudioBuilder.trueFalseConfig.instruction = this.value" class="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-400">
                        </div>

                        <div class="flex items-center justify-end pt-2">
                            <button type="button" onclick="ActivityStudioBuilder.generateAndLoadTrueFalse()" class="bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2.5 text-sm">
                                <i class="fa-solid fa-plus-circle text-base"></i>
                                <span>${tfCfg.count} İfadeli Doğru / Yanlış Etkinliğini Oluştur ve Düzenle</span>
                                <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>`;
            } else if (selType === 'multi-select') {
                const msCounts = [4, 5, 6, 8, 9];
                configPanelHtml = `
                    <!-- 5. TİP: ÇOKLU SEÇİM (HANGİLERİ DOĞRUDUR?) KURULUM PANELİ -->
                    <div class="bg-white border-2 border-teal-200 rounded-2xl p-6 shadow-sm space-y-5">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                            <div>
                                <h4 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-full bg-teal-600 text-white text-xs inline-flex items-center justify-center">5</span>
                                    <span>Çoklu Seçim (Check Buton Grubu) Yapılandırması</span>
                                </h4>
                                <p class="text-xs text-slate-500 mt-0.5">"Hangileri doğrudur?" sorusu altında birden fazla doğru seçeneğin işaretlendiği check buton divleri oluşturur. Her nesnede <b>4 State (1-Normal, 2-Seçili, 3-Doğru, 4-Yanlış)</b> div bulunur.</p>
                            </div>
                            <span class="text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300 px-2.5 py-1 rounded-lg shrink-0">4 Durumlu Check Div</span>
                        </div>

                        <div class="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4">
                            <label class="block text-sm font-extrabold text-teal-950 mb-2">
                                <i class="fa-solid fa-square-check text-teal-600 mr-1.5"></i>Ekranda kaç adet Çoklu Seçim (Check) kutusu bulunsun?
                            </label>
                            <div class="flex flex-wrap items-center gap-2.5">
                                ${msCounts.map(n => `
                                    <button type="button" onclick="ActivityStudioBuilder.setMultiSelectCount(${n})" class="px-4 py-2.5 rounded-xl font-extrabold text-sm transition cursor-pointer border-2 ${msCfg.count === n ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-105' : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'}">
                                        ${n} Seçenekli
                                    </button>
                                `).join('')}
                                <div class="flex items-center gap-2 ml-auto bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5">
                                    <span class="text-xs font-bold text-slate-500">Özel Sayı:</span>
                                    <input type="number" min="2" max="12" value="${msCfg.count}" onchange="ActivityStudioBuilder.setMultiSelectCount(this.value)" class="w-16 text-center font-extrabold text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-lg py-1 outline-none">
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">Sahne Dizilimi</label>
                                <div class="grid grid-cols-2 gap-2">
                                    <button type="button" onclick="ActivityStudioBuilder.setMultiSelectLayout('grid')" class="p-3 rounded-xl border-2 text-left transition cursor-pointer ${msCfg.layout === 'grid' ? 'border-teal-600 bg-teal-50/60 text-teal-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}">
                                        <div class="text-xs font-extrabold"><i class="fa-solid fa-table-cells-large text-teal-600 mr-1"></i> 2 Sütunlu Liste</div>
                                        <div class="text-[10px] text-slate-500 mt-0.5">Geniş yatay check kartları</div>
                                    </button>
                                    <button type="button" onclick="ActivityStudioBuilder.setMultiSelectLayout('cards')" class="p-3 rounded-xl border-2 text-left transition cursor-pointer ${msCfg.layout === 'cards' ? 'border-teal-600 bg-teal-50/60 text-teal-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}">
                                        <div class="text-xs font-extrabold"><i class="fa-solid fa-grip text-teal-600 mr-1"></i> 3 Sütunlu Kartlar</div>
                                        <div class="text-[10px] text-slate-500 mt-0.5">Görsel/metin için kareye yakın kartlar</div>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-600 uppercase mb-1.5">Yönerge / Soru Başlığı</label>
                                <input type="text" value="${msCfg.instruction.replace(/"/g, '&quot;')}" oninput="ActivityStudioBuilder.multiSelectConfig.instruction = this.value" class="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-400">
                            </div>
                        </div>

                        <div class="flex items-center justify-end pt-2">
                            <button type="button" onclick="ActivityStudioBuilder.generateAndLoadMultiSelect()" class="bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2.5 text-sm">
                                <i class="fa-solid fa-plus-circle text-base"></i>
                                <span>${msCfg.count} Seçenekli Çoklu Seçim Etkinliğini Oluştur ve Düzenle</span>
                                <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>`;
            }

            container.innerHTML = `
                <div class="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
                    <!-- Üst Başlık Kartı -->
                    <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl shrink-0 shadow-inner">
                                <i class="fa-solid fa-cubes-stacked"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h3 class="text-lg font-extrabold tracking-tight">Yerleşik Etkinlik Oluşturucu</h3>
                                    <span class="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">5 Etkinlik Tipi Aktif</span>
                                </div>
                                <p class="text-xs text-emerald-50 mt-0.5">Oluşturulan tüm nesneler, sorular ve çok durumlu (3 veya 4 state) div'ler fareyle taşınabilir, boyutlandırılabilir, renklendirilebilir ve içine görsel/metin eklenebilir.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Etkinlik Tiplemesi Seçim Izgarası -->
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-extrabold text-slate-500 uppercase tracking-wider"><i class="fa-solid fa-grip mr-1.5 text-emerald-600"></i>Etkinlik Tiplemesi Seçin (5 / 7 Aktif)</span>
                            <span class="text-[11px] text-slate-400 font-medium">Sistem Elemanları & Görsel Editör Uyumlu</span>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            ${this.activityTypes.map(t => {
                                const isSel = selType === t.id;
                                if (t.ready) {
                                    return `
                                    <div onclick="ActivityStudioBuilder.selectActivityType('${t.id}')" class="cursor-pointer rounded-2xl p-4 border-2 transition-all ${isSel ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-emerald-400'}">
                                        <div class="flex items-center justify-between mb-2">
                                            <div class="w-9 h-9 rounded-xl ${isSel ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'} flex items-center justify-center text-sm font-bold shadow-sm">
                                                <i class="fa-solid ${t.icon}"></i>
                                            </div>
                                            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isSel ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">${t.order}. TİP • AKTİF</span>
                                        </div>
                                        <div class="font-extrabold text-sm text-slate-800">${t.title}</div>
                                        <div class="text-[11px] text-slate-500 mt-1 leading-snug">${t.subtitle}</div>
                                    </div>`;
                                } else {
                                    return `
                                    <div class="rounded-2xl p-4 border border-dashed border-slate-200 bg-slate-50/60 opacity-65 select-none">
                                        <div class="flex items-center justify-between mb-2">
                                            <div class="w-8 h-8 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
                                                <i class="fa-solid ${t.icon}"></i>
                                            </div>
                                            <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-500">${t.order}. TİP</span>
                                        </div>
                                        <div class="font-bold text-xs text-slate-600">${t.title}</div>
                                        <div class="text-[10px] text-slate-400 mt-0.5">${t.subtitle}</div>
                                    </div>`;
                                }
                            }).join('')}
                        </div>
                    </div>

                    ${configPanelHtml}
                </div>
            `;
        },

        selectActivityType: function (typeId) {
            const found = this.activityTypes.find(t => t.id === typeId);
            if (!found || !found.ready) return;
            this.selectedType = typeId;
            this.renderBuilderTab();
        },

        setElementCount: function (val) {
            const num = Math.max(1, Math.min(12, parseInt(val, 10) || 4));
            this.dragDropConfig.count = num;
            this.renderBuilderTab();
        },

        setLayout: function (layoutMode) {
            this.dragDropConfig.layout = layoutMode === 'left-right' ? 'left-right' : 'top-bottom';
            this.renderBuilderTab();
        },

        setTextInputMode: function (mode) {
            this.textInputConfig.inputMode = (mode === 'digit' || mode === 'letter') ? mode : 'text';
            this.renderBuilderTab();
        },

        setTextInputCount: function (val) {
            this.textInputConfig.count = Math.max(1, Math.min(10, parseInt(val, 10) || 3));
            this.renderBuilderTab();
        },

        setTextInputLayout: function (layout) {
            this.textInputConfig.layout = layout === 'cards' ? 'cards' : 'rows';
            this.renderBuilderTab();
        },

        setMcOptionCount: function (val) {
            this.multipleChoiceConfig.optionCount = Math.max(2, Math.min(6, parseInt(val, 10) || 4));
            this.renderBuilderTab();
        },

        setMcQuestionCount: function (val) {
            this.multipleChoiceConfig.questionCount = Math.max(1, Math.min(20, parseInt(val, 10) || 2));
            this.renderBuilderTab();
        },

        setMcLayout: function (layout) {
            this.multipleChoiceConfig.layout = layout === 'list' ? 'list' : 'grid';
            this.renderBuilderTab();
        },

        setTrueFalseCount: function (val) {
            this.trueFalseConfig.count = Math.max(1, Math.min(10, parseInt(val, 10) || 6));
            this.renderBuilderTab();
        },

        setMultiSelectCount: function (val) {
            this.multiSelectConfig.count = Math.max(2, Math.min(12, parseInt(val, 10) || 6));
            this.renderBuilderTab();
        },

        setMultiSelectLayout: function (layout) {
            this.multiSelectConfig.layout = layout === 'cards' ? 'cards' : 'grid';
            this.renderBuilderTab();
        },

        promptAndCreateDragDrop: function () {
            const ans = prompt('Kaç elemanlı bir Sürükle ve Bırak etkinliği oluşturmak istiyorsunuz? (1 - 12 arası bir sayı giriniz):', String(this.dragDropConfig.count || 4));
            if (ans === null) return;
            const count = Math.max(1, Math.min(12, parseInt(ans, 10) || 4));
            this.dragDropConfig.count = count;
            this.generateAndLoadDragDrop();
        },

        // Sürükle-Bırak koordinatlarını ve RENKLİ boş div yapılarını oluşturur
        buildDragDropSlideData: function (count, layout, instructionText) {
            const dragItems = [];
            const dropZones = [];

            const makeDragItemObj = (idx, x, y, w, h) => ({
                id: `drag-${idx}`,
                type: 'dragItem',
                targetZoneId: `zone-${idx}`,
                activeEditState: 'normal',
                offsetX: x,
                offsetY: y,
                homeX: x,
                homeY: y,
                width: w,
                height: h,
                zIndex: 25,
                borderRadius: 18,
                textSize: 20,
                arabicSize: 32,
                a11yText: `Sürüklenecek Nesne ${idx}`,
                tabIndex: idx + 1,
                isHidden: false,
                states: {
                    normal: {
                        text: '',
                        arabicText: '',
                        imageUrl: '',
                        bgColor: '#dbeafe',
                        borderColor: '#2563eb',
                        textColor: '#1e3a8a'
                    },
                    correct: {
                        text: '',
                        arabicText: '',
                        imageUrl: '',
                        bgColor: '#bbf7d0',
                        borderColor: '#059669',
                        textColor: '#064e3b'
                    },
                    wrong: {
                        text: '',
                        arabicText: '',
                        imageUrl: '',
                        bgColor: '#fecaca',
                        borderColor: '#dc2626',
                        textColor: '#7f1d1d'
                    }
                }
            });

            const makeDropZoneObj = (idx, x, y, w, h) => ({
                id: `zone-${idx}`,
                type: 'dropZone',
                text: '',
                arabicText: '',
                imageUrl: '',
                offsetX: x,
                offsetY: y,
                width: w,
                height: h,
                zIndex: 10,
                borderRadius: 18,
                bgColor: '#fef3c7',
                borderColor: '#d97706',
                textColor: '#92400e',
                textSize: 20,
                arabicSize: 30,
                a11yText: `Bırakma Alanı ${idx}`,
                tabIndex: count + idx + 1,
                isHidden: false
            });

            if (layout === 'left-right') {
                const startY = -205;
                const endY = 235;
                const availH = endY - startY;
                const stepY = count > 1 ? Math.min(105, Math.floor(availH / (count - 1))) : 0;
                const itemH = Math.max(58, Math.min(88, stepY > 0 ? stepY - 12 : 86));
                const itemW = 310;
                const totalSpan = stepY * (count - 1);
                const firstY = Math.round((startY + endY) / 2 - totalSpan / 2);

                for (let i = 0; i < count; i++) {
                    const y = firstY + i * stepY;
                    const idx = i + 1;
                    dragItems.push(makeDragItemObj(idx, -390, y, itemW, itemH));
                    dropZones.push(makeDropZoneObj(idx, 390, y, itemW + 20, itemH + 8));
                }
            } else {
                const maxPerRow = Math.min(count, 6);
                const totalWidth = 1520;
                const colGap = 24;
                const itemW = Math.max(170, Math.min(280, Math.floor((totalWidth - (maxPerRow - 1) * colGap) / maxPerRow)));
                const itemH = count > 6 ? 95 : 118;

                for (let i = 0; i < count; i++) {
                    const row = Math.floor(i / maxPerRow);
                    const col = i % maxPerRow;
                    const itemsInThisRow = Math.min(maxPerRow, count - row * maxPerRow);
                    const rowSpanW = itemsInThisRow * itemW + (itemsInThisRow - 1) * colGap;
                    const startX = -Math.round(rowSpanW / 2) + Math.round(itemW / 2);
                    const x = startX + col * (itemW + colGap);

                    const dragY = count > 6 ? (-155 + row * 110) : -105;
                    const zoneY = count > 6 ? (85 + row * 115) : 115;
                    const idx = i + 1;

                    dragItems.push(makeDragItemObj(idx, x, dragY, itemW, itemH));
                    dropZones.push(makeDropZoneObj(idx, x, zoneY, itemW + 12, itemH + 10));
                }
            }

            return {
                activityType: 'drag-drop',
                heading: {
                    id: 'heading',
                    text: instructionText || 'Nesneleri uygun bırakma alanlarına sürükleyip bırakınız ve Kontrol Et butonuna basınız.',
                    textSize: 22,
                    width: 1480,
                    height: 60,
                    offsetX: 0,
                    offsetY: -315,
                    zIndex: 20,
                    borderRadius: 14,
                    bgColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    textColor: '#1e293b',
                    a11yText: instructionText || 'Nesneleri uygun bırakma alanlarına sürükleyip bırakınız.',
                    tabIndex: 1,
                    isHidden: false
                },
                blocks: [
                    {
                        id: 'bg-block-1',
                        text: '',
                        textSize: 16,
                        width: 1660,
                        height: 550,
                        offsetX: 0,
                        offsetY: 5,
                        zIndex: 1,
                        borderRadius: 24,
                        bgColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        textColor: '#475569',
                        a11yText: 'Etkinlik Çalışma Alanı Arka Planı',
                        tabIndex: 0,
                        isHidden: true
                    }
                ],
                dragItems: dragItems,
                dropZones: dropZones,
                checkButtonConf: {
                    id: 'checkButtonConf',
                    imageUrl: 'cekirdek/kontrolet.png',
                    width: 240,
                    height: 68,
                    offsetX: 0,
                    offsetY: 325,
                    zIndex: 35,
                    borderRadius: 16,
                    a11yText: 'Kontrol Et',
                    tabIndex: count * 2 + 2,
                    isHidden: false
                }
            };
        },

        // DİKKAT: Parametre adı mutlaka (canvas, state) olmalıdır ki normalizeRawActivityCode içindeki regex ile %100 eşleşsin!
        buildDragDropInitFunctionString: function () {
            return `function(canvas, state) {
    state = state || { completed: false, passed: false, attempts: 3 };
    if (typeof state.attempts !== 'number' || state.attempts <= 0) state.attempts = 3;

    const { data, safeArea, area, checkBtn, renderBox } = PlayerCore.initSlide(canvas);
    if (!area) return;
    area.innerHTML = '';

    const dragItems = Array.isArray(data.dragItems) ? data.dragItems : [];
    const dropZones = Array.isArray(data.dropZones) ? data.dropZones : [];

    const placedZoneByItem = {};
    const lockedCorrectByItem = {};
    const homeCoordsByItem = {};
    let selectedDragId = null;

    function isStudioEditActive() {
        const inPreview = Boolean(canvas.closest('#admin-preview-canvas'));
        if (!inPreview) return false;
        if (typeof AdminVisualEditor !== 'undefined' && !AdminVisualEditor.isEditMode) return false;
        if (window.ActivityStudioBuilder && window.ActivityStudioBuilder.studioPreviewMode === 'test') return false;
        return true;
    }

    function populateDivContent(targetDiv, contentObj, emptyLabel) {
        targetDiv.innerHTML = '';
        const imgUrl = (contentObj && contentObj.imageUrl) ? String(contentObj.imageUrl).trim() : '';
        const arTxt = (contentObj && contentObj.arabicText) ? String(contentObj.arabicText).trim() : '';
        const trTxt = (contentObj && contentObj.text) ? String(contentObj.text).trim() : '';

        if (contentObj && contentObj.bgColor) targetDiv.style.backgroundColor = contentObj.bgColor;
        if (contentObj && contentObj.borderColor) targetDiv.style.borderColor = contentObj.borderColor;
        if (contentObj && contentObj.textColor) targetDiv.style.color = contentObj.textColor;

        const hasAnyContent = Boolean(imgUrl || arTxt || trTxt);
        if (!hasAnyContent) {
            targetDiv.classList.add('agy-empty-div-hint');
            if (emptyLabel) targetDiv.setAttribute('data-empty-label', emptyLabel);
            return;
        }
        targetDiv.classList.remove('agy-empty-div-hint');
        targetDiv.removeAttribute('data-empty-label');

        if (imgUrl) {
            const imgEl = document.createElement('img');
            imgEl.src = imgUrl;
            imgEl.alt = trTxt || arTxt || 'Görsel';
            imgEl.className = (arTxt || trTxt)
                ? 'max-h-[65%] max-w-[90%] object-contain rounded-lg pointer-events-none select-none mb-1'
                : 'w-full h-full object-contain rounded-lg pointer-events-none select-none';
            targetDiv.appendChild(imgEl);
        }
        if (arTxt) {
            const arDiv = document.createElement('div');
            arDiv.dir = 'rtl';
            arDiv.className = 'font-arabic leading-tight text-center pointer-events-none select-none px-2';
            arDiv.style.fontSize = ((contentObj && contentObj.arabicSize) || 30) + 'px';
            arDiv.textContent = arTxt;
            targetDiv.appendChild(arDiv);
        }
        if (trTxt) {
            const trDiv = document.createElement('div');
            trDiv.className = 'font-bold leading-snug text-center pointer-events-none select-none px-2 break-words';
            trDiv.style.fontSize = ((contentObj && contentObj.textSize) || 20) + 'px';
            trDiv.textContent = trTxt;
            targetDiv.appendChild(trDiv);
        }
    }

    function setItemVisibleState(itemEl, itemData, stateKey) {
        if (!itemEl) return;
        const validKey = (stateKey === 'correct' || stateKey === 'wrong') ? stateKey : 'normal';
        itemEl.setAttribute('data-current-state', validKey);
        const stateDivs = itemEl.querySelectorAll('.agy-drag-state-div');
        stateDivs.forEach(div => {
            if (div.getAttribute('data-state-key') === validKey) {
                div.classList.remove('hidden');
                div.style.display = 'flex';
            } else {
                div.classList.add('hidden');
                div.style.display = 'none';
            }
        });
    }

    function setElementCoords(el, x, y) {
        if (!el) return;
        el.setAttribute('data-cur-x', x);
        el.setAttribute('data-cur-y', y);
        el.style.transform = 'translate(calc(-50% + ' + x + 'px), calc(-50% + ' + y + 'px)) scale(var(--agy-btn-scale, 1))';
    }

    // 1) Bırakma Alanlarını (dropZones - Sarı/Kehribar Renkli Boş Divler) Oluştur
    const zoneElementsById = {};
    dropZones.forEach((zone, zIdx) => {
        if (!zone.id) zone.id = 'zone-' + (zIdx + 1);
        const zDiv = document.createElement('div');
        zDiv.setAttribute('data-zone-id', zone.id);
        zDiv.className = 'agy-drop-zone border-4 border-dashed shadow-sm flex flex-col items-center justify-center overflow-hidden transition-colors cursor-pointer';
        renderBox(zDiv, {
            width: 240,
            height: 110,
            borderRadius: 18,
            zIndex: 10,
            bgColor: '#fef3c7',
            borderColor: '#d97706',
            textColor: '#92400e',
            ...zone
        }, 'dropZones.' + zIdx);
        setElementCoords(zDiv, zone.offsetX || 0, zone.offsetY || 0);

        populateDivContent(zDiv, zone, (zIdx + 1) + '. Bırakma Alanı (Boş Div)');

        const placeSelectedIntoThisZone = (e) => {
            if (state.completed) return;
            if (selectedDragId) {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                const dragId = selectedDragId;
                const placedItem = dragItems.find(d => d.id === dragId);
                placeItemIntoZone(dragId, zone.id);
                selectedDragId = null;
                clearSelectionRings();
                const live = document.getElementById('feedback-live-region') || document.getElementById('a11y-live-region');
                if (live) live.textContent = (placedItem?.text || 'Kart') + ', ' + (zone.text || (zIdx + 1) + '. Alan') + ' kutusuna yerleştirildi.';
            }
        };

        zDiv.addEventListener('click', (e) => {
            placeSelectedIntoThisZone(e);
        });

        zDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                placeSelectedIntoThisZone(e);
            }
        });

        area.appendChild(zDiv);
        zoneElementsById[zone.id] = zDiv;
    });

    // Yardımcı: Bir koordinatın herhangi bir dropZone'un tam üstünde olup olmadığını bul
    function findZoneMatchingSavedCoords(x, y) {
        for (let i = 0; i < dropZones.length; i++) {
            const z = dropZones[i];
            const zx = parseFloat(z.offsetX) || 0;
            const zy = parseFloat(z.offsetY) || 0;
            if (Math.abs(x - zx) <= 25 && Math.abs(y - zy) <= 25) {
                return z;
            }
        }
        return null;
    }

    // 2) Sürüklenecek Nesneleri (dragItems) ve İçindeki 3 Renkli Boş Div'i (1. Normal, 2. Doğru, 3. Yanlış) Oluştur
    const dragElementsById = {};
    dragItems.forEach((item, dIdx) => {
        if (!item.id) item.id = 'drag-' + (dIdx + 1);
        if (!item.targetZoneId && dropZones[dIdx]) item.targetZoneId = dropZones[dIdx].id;
        if (!item.states || typeof item.states !== 'object') {
            item.states = {
                normal: { text: item.text || '', arabicText: item.arabicText || '', imageUrl: item.imageUrl || '', bgColor: '#dbeafe', borderColor: '#2563eb', textColor: '#1e3a8a' },
                correct: { text: item.text || '', arabicText: item.arabicText || '', imageUrl: item.imageUrl || '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                wrong: { text: item.text || '', arabicText: item.arabicText || '', imageUrl: item.imageUrl || '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
            };
        }

        const rawX = parseFloat(item.offsetX) || 0;
        const rawY = parseFloat(item.offsetY) || 0;
        const overlappingSavedZone = findZoneMatchingSavedCoords(rawX, rawY);

        let homeX = (typeof item.homeX === 'number' && !findZoneMatchingSavedCoords(item.homeX, item.homeY || 0))
            ? item.homeX
            : rawX;
        let homeY = (typeof item.homeY === 'number' && !findZoneMatchingSavedCoords(item.homeX || 0, item.homeY))
            ? item.homeY
            : rawY;

        // Eğer nesne daha önce tasarım modunda bırakma alanının üstüne sürüklenip kaydedildiyse ve ayrı bir homeY yoksa:
        if (overlappingSavedZone) {
            if (Math.abs(homeY - (overlappingSavedZone.offsetY || 0)) <= 35) {
                homeY = (overlappingSavedZone.offsetY || 0) >= 0 ? -105 : 115;
            }
            if (findZoneMatchingSavedCoords(homeX, homeY)) {
                homeX = -390;
            }
        }
        item.homeX = homeX;
        item.homeY = homeY;
        item.offsetX = homeX;
        item.offsetY = homeY;
        homeCoordsByItem[item.id] = { x: homeX, y: homeY };

        const itemDiv = document.createElement('div');
        itemDiv.setAttribute('data-drag-id', item.id);
        itemDiv.setAttribute('data-target-zone', item.targetZoneId || '');
        itemDiv.className = 'agy-drag-item shadow-md cursor-grab active:cursor-grabbing overflow-hidden';
        renderBox(itemDiv, {
            width: 220,
            height: 100,
            borderRadius: 18,
            zIndex: 25,
            ...item
        }, 'dragItems.' + dIdx);
        setElementCoords(itemDiv, homeX, homeY);

        const stateDefs = [
            { key: 'normal', label: (dIdx + 1) + '. Nesne • 1. Normal Div', defBg: '#dbeafe', defBd: '#2563eb', defTc: '#1e3a8a' },
            { key: 'correct', label: (dIdx + 1) + '. Nesne • 2. Doğru Div', defBg: '#bbf7d0', defBd: '#059669', defTc: '#064e3b' },
            { key: 'wrong', label: (dIdx + 1) + '. Nesne • 3. Yanlış Div', defBg: '#fecaca', defBd: '#dc2626', defTc: '#7f1d1d' }
        ];

        stateDefs.forEach(def => {
            const stObj = item.states[def.key] || {};
            if (!stObj.bgColor) stObj.bgColor = def.defBg;
            if (!stObj.borderColor) stObj.borderColor = def.defBd;
            if (!stObj.textColor) stObj.textColor = def.defTc;
            if (stObj.textSize === undefined) stObj.textSize = item.textSize || 20;
            if (stObj.arabicSize === undefined) stObj.arabicSize = item.arabicSize || 30;

            const innerDiv = document.createElement('div');
            innerDiv.className = 'agy-drag-state-div agy-state-' + def.key + ' w-full h-full border-3 flex flex-col items-center justify-center overflow-hidden relative';
            innerDiv.setAttribute('data-state-key', def.key);
            innerDiv.style.borderRadius = 'inherit';
            innerDiv.style.borderWidth = '3px';
            innerDiv.style.borderStyle = 'solid';
            innerDiv.style.backgroundColor = stObj.bgColor;
            innerDiv.style.borderColor = stObj.borderColor;
            innerDiv.style.color = stObj.textColor;

            populateDivContent(innerDiv, stObj, def.label);
            itemDiv.appendChild(innerDiv);
        });

        const initialVisibleState = isStudioEditActive() ? (item.activeEditState || 'normal') : 'normal';
        setItemVisibleState(itemDiv, item, initialVisibleState);

        bindDragEvents(itemDiv, item);
        area.appendChild(itemDiv);
        dragElementsById[item.id] = itemDiv;
    });

    function getStageScale() {
        const rect = safeArea.getBoundingClientRect();
        return (rect && rect.width > 0) ? (rect.width / 1750) : 1;
    }

    function clearSelectionRings() {
        Object.values(dragElementsById).forEach(el => el.classList.remove('ring-4', 'ring-blue-400'));
    }

    function setCheckBtnActive(isActive) {
        const host = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
        const btns = [];
        if (checkBtn) btns.push(checkBtn);
        if (host && typeof host.querySelectorAll === 'function') {
            host.querySelectorAll('#slayt-check-btn').forEach(b => {
                if (!btns.includes(b)) btns.push(b);
            });
        }
        btns.forEach(btn => {
            if (isActive && !state.completed) {
                btn.disabled = false;
                btn.removeAttribute('disabled');
                btn.classList.remove('opacity-40', 'cursor-not-allowed', 'disabled:opacity-40', 'disabled:cursor-not-allowed', 'hidden');
                btn.classList.add('cursor-pointer', 'agy-check-ready');
                btn.style.setProperty('opacity', '1', 'important');
                btn.style.setProperty('pointer-events', 'auto', 'important');
                btn.style.setProperty('cursor', 'pointer', 'important');
            } else {
                btn.disabled = true;
                btn.setAttribute('disabled', 'disabled');
                btn.classList.add('opacity-40', 'cursor-not-allowed');
                btn.classList.remove('agy-check-ready');
                btn.style.setProperty('opacity', '0.4', 'important');
            }
        });
    }

    function updateCheckButtonState() {
        // Görsel olarak bırakma alanının üzerinde duran ama henüz placedZoneByItem'a yazılmamış nesneleri de otomatik algıla
        dragItems.forEach(it => {
            if (!placedZoneByItem[it.id]) {
                const el = dragElementsById[it.id];
                if (el) {
                    const attrZone = el.getAttribute('data-placed-zone');
                    if (attrZone) {
                        placedZoneByItem[it.id] = attrZone;
                    } else if (el.getAttribute('data-current-state') !== 'wrong' && typeof findZoneForElement === 'function') {
                        const hit = findZoneForElement(el);
                        if (hit) {
                            placedZoneByItem[it.id] = hit.id;
                            el.setAttribute('data-placed-zone', hit.id);
                        }
                    }
                }
            }
        });
        const allPlaced = dragItems.length > 0 && dragItems.every(it => Boolean(placedZoneByItem[it.id]));
        setCheckBtnActive(allPlaced);
    }

    // İlk yüklemede Kontrol Et durumunu güncelle
    setTimeout(updateCheckButtonState, 0);

    // Hem DOM dikdörtgen kesişimi (getBoundingClientRect) hem de sahne koordinatlarıyla en uygun bırakma alanını bulur
    function findZoneForElement(itemEl, fallbackX, fallbackY) {
        let bestZone = null;
        let bestScore = -1;

        if (itemEl && typeof itemEl.getBoundingClientRect === 'function') {
            const iRect = itemEl.getBoundingClientRect();
            if (iRect.width > 0 && iRect.height > 0) {
                const iCenterX = iRect.left + iRect.width / 2;
                const iCenterY = iRect.top + iRect.height / 2;

                dropZones.forEach(z => {
                    const zEl = zoneElementsById[z.id];
                    if (!zEl) return;
                    const zRect = zEl.getBoundingClientRect();
                    if (zRect.width <= 0 || zRect.height <= 0) return;

                    const overlapX = Math.max(0, Math.min(iRect.right, zRect.right) - Math.max(iRect.left, zRect.left));
                    const overlapY = Math.max(0, Math.min(iRect.bottom, zRect.bottom) - Math.max(iRect.top, zRect.top));
                    const overlapArea = overlapX * overlapY;
                    const minArea = Math.min(iRect.width * iRect.height, zRect.width * zRect.height);

                    const margin = 24;
                    const centerInside = (
                        iCenterX >= zRect.left - margin &&
                        iCenterX <= zRect.right + margin &&
                        iCenterY >= zRect.top - margin &&
                        iCenterY <= zRect.bottom + margin
                    );

                    if (overlapArea >= minArea * 0.12 || centerInside) {
                        const zCenterX = zRect.left + zRect.width / 2;
                        const zCenterY = zRect.top + zRect.height / 2;
                        const dist = Math.hypot(iCenterX - zCenterX, iCenterY - zCenterY);
                        const score = overlapArea * 1000 - dist;
                        if (score > bestScore) {
                            bestScore = score;
                            bestZone = z;
                        }
                    }
                });
            }
        }

        if (bestZone) return bestZone;

        const x = (fallbackX !== undefined) ? fallbackX : (parseFloat(itemEl?.getAttribute('data-cur-x')) || 0);
        const y = (fallbackY !== undefined) ? fallbackY : (parseFloat(itemEl?.getAttribute('data-cur-y')) || 0);
        let bestDist = Infinity;
        dropZones.forEach(z => {
            const zx = parseFloat(z.offsetX) || 0;
            const zy = parseFloat(z.offsetY) || 0;
            const zw = (parseFloat(z.width) || 240) / 2 + 45;
            const zh = (parseFloat(z.height) || 110) / 2 + 45;
            if (Math.abs(x - zx) <= zw && Math.abs(y - zy) <= zh) {
                const dist = Math.hypot(x - zx, y - zy);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestZone = z;
                }
            }
        });
        return bestZone;
    }

    function getItemHomeCoords(item) {
        if (!item) return { x: 0, y: 0 };
        if (homeCoordsByItem[item.id]) return homeCoordsByItem[item.id];
        if (typeof item.homeX === 'number' && typeof item.homeY === 'number') {
            return { x: item.homeX, y: item.homeY };
        }
        return { x: item.offsetX || 0, y: item.offsetY || 0 };
    }

    function placeItemIntoZone(dragId, zoneId) {
        if (lockedCorrectByItem[dragId]) return;
        const item = dragItems.find(d => d.id === dragId);
        const zone = dropZones.find(z => z.id === zoneId);
        const itemEl = dragElementsById[dragId];
        if (!item || !zone || !itemEl) return;

        const existingItemId = Object.keys(placedZoneByItem).find(k => placedZoneByItem[k] === zoneId && k !== dragId);
        if (existingItemId && lockedCorrectByItem[existingItemId]) {
            returnItemToHome(dragId, 'normal');
            return;
        }

        const prevZoneOfDragged = placedZoneByItem[dragId] || null;

        if (existingItemId) {
            const existingItem = dragItems.find(d => d.id === existingItemId);
            const existingEl = dragElementsById[existingItemId];
            if (prevZoneOfDragged) {
                const prevZone = dropZones.find(z => z.id === prevZoneOfDragged);
                if (prevZone && existingEl) {
                    placedZoneByItem[existingItemId] = prevZone.id;
                    existingEl.setAttribute('data-placed-zone', prevZone.id);
                    setElementCoords(existingEl, prevZone.offsetX || 0, prevZone.offsetY || 0);
                }
            } else {
                delete placedZoneByItem[existingItemId];
                if (existingEl && existingItem) {
                    const exHome = getItemHomeCoords(existingItem);
                    existingEl.removeAttribute('data-placed-zone');
                    setElementCoords(existingEl, exHome.x, exHome.y);
                    setItemVisibleState(existingEl, existingItem, 'normal');
                }
            }
        }

        placedZoneByItem[dragId] = zone.id;
        itemEl.setAttribute('data-placed-zone', zone.id);
        setElementCoords(itemEl, zone.offsetX || 0, zone.offsetY || 0);
        setItemVisibleState(itemEl, item, 'normal');
        if (item.audioUrl) PlayerCore.playAudio(item.audioUrl);
        updateCheckButtonState();
    }

    function unplaceItemOnly(dragId, newHomeX, newHomeY) {
        const item = dragItems.find(d => d.id === dragId);
        const itemEl = dragElementsById[dragId];
        if (!item || !itemEl) return;
        delete placedZoneByItem[dragId];
        itemEl.removeAttribute('data-placed-zone');
        if (typeof newHomeX === 'number' && typeof newHomeY === 'number') {
            homeCoordsByItem[dragId] = { x: newHomeX, y: newHomeY };
            item.homeX = newHomeX;
            item.homeY = newHomeY;
            setElementCoords(itemEl, newHomeX, newHomeY);
        }
        setItemVisibleState(itemEl, item, 'normal');
        updateCheckButtonState();
    }

    function returnItemToHome(dragId, stateToShow) {
        const item = dragItems.find(d => d.id === dragId);
        const itemEl = dragElementsById[dragId];
        if (!item || !itemEl) return;
        const home = getItemHomeCoords(item);
        delete placedZoneByItem[dragId];
        itemEl.removeAttribute('data-placed-zone');
        setElementCoords(itemEl, home.x, home.y);
        setItemVisibleState(itemEl, item, stateToShow || 'normal');
        updateCheckButtonState();
    }

    function bindDragEvents(itemEl, item) {
        let isDragging = false;
        let pointerId = null;
        let startClientX = 0;
        let startClientY = 0;
        let origX = 0;
        let origY = 0;
        let movedSignificantly = false;

        itemEl.addEventListener('pointerdown', (e) => {
            if (isStudioEditActive()) return; // Stüdyo tasarım modunda AdminVisualEditor köprüsü devreye girer
            if (state.completed || lockedCorrectByItem[item.id]) return;
            if (e.button !== undefined && e.button !== 0) return;

            e.stopPropagation();
            isDragging = true;
            movedSignificantly = false;
            pointerId = e.pointerId;
            startClientX = e.clientX;
            startClientY = e.clientY;
            origX = parseFloat(itemEl.getAttribute('data-cur-x')) || item.offsetX || 0;
            origY = parseFloat(itemEl.getAttribute('data-cur-y')) || item.offsetY || 0;

            itemEl.classList.add('agy-dragging');
            setItemVisibleState(itemEl, item, 'normal');
            try { itemEl.setPointerCapture(pointerId); } catch (err) {}
        });

        itemEl.addEventListener('pointermove', (e) => {
            if (!isDragging || e.pointerId !== pointerId) return;
            const scale = getStageScale();
            const dx = (e.clientX - startClientX) / scale;
            const dy = (e.clientY - startClientY) / scale;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedSignificantly = true;

            const curX = Math.round(origX + dx);
            const curY = Math.round(origY + dy);
            setElementCoords(itemEl, curX, curY);

            const hitZone = findZoneForElement(itemEl, curX, curY);
            Object.values(zoneElementsById).forEach(zEl => {
                if (hitZone && zEl.getAttribute('data-zone-id') === hitZone.id) {
                    zEl.classList.add('agy-zone-hover');
                } else {
                    zEl.classList.remove('agy-zone-hover');
                }
            });
        });

        const finishPointer = (e) => {
            if (!isDragging || (e && e.pointerId !== undefined && e.pointerId !== pointerId)) return;
            isDragging = false;
            itemEl.classList.remove('agy-dragging');
            Object.values(zoneElementsById).forEach(zEl => zEl.classList.remove('agy-zone-hover'));
            try { itemEl.releasePointerCapture(pointerId); } catch (err) {}

            if (!movedSignificantly) {
                setElementCoords(itemEl, origX, origY);
                if (selectedDragId === item.id) {
                    selectedDragId = null;
                    clearSelectionRings();
                } else {
                    selectedDragId = item.id;
                    clearSelectionRings();
                    itemEl.classList.add('ring-4', 'ring-blue-400');
                }
                return;
            }

            const finalX = parseFloat(itemEl.getAttribute('data-cur-x')) || 0;
            const finalY = parseFloat(itemEl.getAttribute('data-cur-y')) || 0;
            const hitZone = findZoneForElement(itemEl, finalX, finalY);

            if (hitZone) {
                placeItemIntoZone(item.id, hitZone.id);
            } else {
                returnItemToHome(item.id, 'normal');
            }
        };

        itemEl.addEventListener('pointerup', finishPointer);
        itemEl.addEventListener('pointercancel', finishPointer);

        const toggleItemSelect = (e) => {
            if (isStudioEditActive()) return;
            if (state.completed || lockedCorrectByItem[item.id]) return;
            if (e) { e.preventDefault(); e.stopPropagation(); }
            if (selectedDragId === item.id) {
                selectedDragId = null;
                clearSelectionRings();
            } else {
                selectedDragId = item.id;
                clearSelectionRings();
                itemEl.classList.add('ring-4', 'ring-blue-500', 'scale-105');
                const live = document.getElementById('feedback-live-region') || document.getElementById('a11y-live-region');
                if (live) live.textContent = (item.text || 'Kart') + ' seçildi. Hedef kutuyu seçip Enter veya Space tuşuna basın.';
            }
        };

        itemEl.addEventListener('click', (e) => {
            if (isDragging || movedSignificantly) return;
            toggleItemSelect(e);
        });

        itemEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                toggleItemSelect(e);
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (placedZoneByItem[item.id] && !lockedCorrectByItem[item.id]) {
                    e.preventDefault();
                    e.stopPropagation();
                    returnItemToHome(item.id, 'normal');
                    const live = document.getElementById('feedback-live-region') || document.getElementById('a11y-live-region');
                    if (live) live.textContent = (item.text || 'Kart') + ' alandan kaldırıldı.';
                }
            }
        });
    }

    function revealAllCorrectAnswers() {
        dragItems.forEach((item, idx) => {
            const itemEl = dragElementsById[item.id];
            const targetZone = dropZones.find(z => z.id === item.targetZoneId) || dropZones[idx] || dropZones[0];
            if (!itemEl || !targetZone) return;

            placedZoneByItem[item.id] = targetZone.id;
            lockedCorrectByItem[item.id] = true;
            itemEl.setAttribute('data-placed-zone', targetZone.id);
            itemEl.classList.remove('cursor-grab', 'active:cursor-grabbing', 'border-red-500', 'bg-red-50');
            itemEl.classList.add('cursor-default', 'border-emerald-500', 'bg-emerald-50');
            setElementCoords(itemEl, targetZone.offsetX || 0, targetZone.offsetY || 0);
            setItemVisibleState(itemEl, item, 'correct');
        });
        if (checkBtn) {
            setCheckBtnActive(false);
            checkBtn.classList.add('hidden');
        }
    }

    function submitResultWithFeedback(isCorrect, onFinalExhausted) {
        const inPreview = Boolean(canvas.closest('#admin-preview-canvas'));
        const resetWrongInputsToNormal = () => {
            inputs.forEach(it => {
                if (!lockedCorrect[it.id]) {
                    const inputEl = inputDomById[it.id];
                    const cardDom = cardDomById[it.id];
                    if (inputEl && cardDom) {
                        setCardState(cardDom, it, 'normal');
                        inputEl.value = '';
                        inputEl.readOnly = false;
                        inputEl.setAttribute('aria-invalid', 'false');
                    }
                }
            });
            updateCheckButtonState();
            const firstWrong = inputs.find(it => !lockedCorrect[it.id]);
            if (firstWrong && inputDomById[firstWrong.id]) {
                setTimeout(() => {
                    try { inputDomById[firstWrong.id].focus(); } catch (err) {}
                }, 100);
            }
        };

        if (inPreview) {
            if (!isCorrect) state.attempts = Math.max(0, (state.attempts || 3) - 1);
            if (isCorrect || state.attempts <= 0) {
                state.completed = true;
                state.passed = Boolean(isCorrect);
                PlayerCore.showFeedback(isCorrect ? 'correct' : 'incorrect', null, () => {
                    if (typeof onFinalExhausted === 'function') onFinalExhausted();
                });
            } else {
                PlayerCore.showFeedback('retry', 'Kalan deneme hakkınız: ' + state.attempts, () => {
                    resetWrongInputsToNormal();
                });
            }
        } else {
            PlayerCore.submitAnswer(isCorrect, (feedbackType) => {
                if (feedbackType === 'retry' || !isCorrect) {
                    resetWrongInputsToNormal();
                } else if (typeof onFinalExhausted === 'function') {
                    onFinalExhausted();
                }
            });
        }
    }

    function evaluateAnswers() {
        if (!checkBtn || checkBtn.disabled || state.completed) return;

        const allCorrect = dragItems.length > 0 && dragItems.every(it => placedZoneByItem[it.id] === it.targetZoneId);

        if (allCorrect) {
            revealAllCorrectAnswers();
            submitResultWithFeedback(true);
            return;
        }

        // Doğru olanlar 2. Doğru Div ile yerinde kalır, yanlış olanlar 3. Yanlış Div ile eski yerine (home) döner
        dragItems.forEach(item => {
            const itemEl = dragElementsById[item.id];
            if (!itemEl) return;
            const placedZ = placedZoneByItem[item.id];
            if (placedZ === item.targetZoneId) {
                lockedCorrectByItem[item.id] = true;
                itemEl.classList.remove('cursor-grab', 'active:cursor-grabbing', 'border-red-500', 'bg-red-50');
                itemEl.classList.add('cursor-default', 'border-emerald-500', 'bg-emerald-50');
                setItemVisibleState(itemEl, item, 'correct');
            } else {
                const home = getItemHomeCoords(item);
                delete placedZoneByItem[item.id];
                itemEl.removeAttribute('data-placed-zone');
                itemEl.classList.add('border-red-500', 'bg-red-50');
                setItemVisibleState(itemEl, item, 'wrong');
                setElementCoords(itemEl, home.x, home.y);
            }
        });

        updateCheckButtonState();

        // Tüm haklar bittiğinde doğru cevaplar 2. Doğru Div ile doğru yerlerine yerleşir
        submitResultWithFeedback(false, () => {
            revealAllCorrectAnswers();
        });
    }

    function resetActivity() {
        state.completed = false;
        state.passed = false;
        const currentSlide = (typeof PlayerCore !== 'undefined' && Array.isArray(PlayerCore.slides))
            ? PlayerCore.slides[PlayerCore.currentSlideIndex]
            : null;
        state.attempts = (currentSlide && currentSlide.maxAttempts) || (typeof PlayerCore !== 'undefined' && PlayerCore.settings?.maxAttempts) || 3;
        selectedDragId = null;
        clearSelectionRings();

        Object.keys(placedZoneByItem).forEach(k => delete placedZoneByItem[k]);
        Object.keys(lockedCorrectByItem).forEach(k => delete lockedCorrectByItem[k]);

        dragItems.forEach(item => {
            const itemEl = dragElementsById[item.id];
            const home = getItemHomeCoords(item);
            item.offsetX = home.x;
            item.offsetY = home.y;
            if (!itemEl) return;
            itemEl.removeAttribute('data-placed-zone');
            itemEl.classList.remove('cursor-default', 'border-emerald-500', 'bg-emerald-50', 'border-red-500', 'bg-red-50', 'ring-4', 'ring-blue-400');
            itemEl.classList.add('cursor-grab', 'active:cursor-grabbing');
            setElementCoords(itemEl, home.x, home.y);
            const initVis = isStudioEditActive() ? (item.activeEditState || 'normal') : 'normal';
            setItemVisibleState(itemEl, item, initVis);
        });

        const host = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
        if (host && typeof host.querySelectorAll === 'function') {
            host.querySelectorAll('#slayt-check-btn').forEach(b => {
                b.classList.remove('hidden');
                b.style.display = '';
            });
        }
        if (checkBtn) {
            checkBtn.classList.remove('hidden');
            checkBtn.style.display = '';
        }
        setCheckBtnActive(false);
    }

    if (checkBtn) {
        checkBtn.onclick = (e) => {
            if (e) e.stopPropagation();
            evaluateAnswers();
        };
    }

    // Stüdyo Görsel Editörü (AdminVisualEditor) ile tam entegrasyon API'si
    const ddApi = {
        dragItems,
        dropZones,
        placedZoneByItem,
        lockedCorrectByItem,
        homeCoordsByItem,
        dragElementsById,
        zoneElementsById,
        findZoneForElement,
        placeItemIntoZone,
        unplaceItemOnly,
        returnItemToHome,
        updateCheckButtonState,
        evaluateAnswers,
        resetActivity,
        setElementCoords,
        clearZoneHovers: function() {
            Object.values(zoneElementsById).forEach(zEl => zEl.classList.remove('agy-zone-hover'));
        },
        highlightZoneForElement: function(itemEl) {
            const hit = findZoneForElement(itemEl);
            Object.values(zoneElementsById).forEach(zEl => {
                if (hit && zEl.getAttribute('data-zone-id') === hit.id) {
                    zEl.classList.add('agy-zone-hover');
                } else {
                    zEl.classList.remove('agy-zone-hover');
                }
            });
            return hit;
        }
    };

    safeArea._ddApi = ddApi;
    const hostCanvas = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
    if (hostCanvas) hostCanvas._ddApi = ddApi;
}`;
        },

        generateAndLoadDragDrop: function () {
            if (typeof AdminCore === 'undefined') return;
            const cfg = this.dragDropConfig;
            const count = Math.max(1, Math.min(12, parseInt(cfg.count, 10) || 4));
            const slideId = AdminCore.ensureUniqueSlideId('etkinlik-surukle-birak');
            const titleText = cfg.title || 'Sürükle ve Bırak Etkinliği';
            const slideData = this.buildDragDropSlideData(count, cfg.layout, cfg.instruction);
            const initFnStr = this.buildDragDropInitFunctionString();

            const fullCode = `<template id="tpl-${slideId}">
    <div id="slayt-safe-area" class="relative w-[1750px] h-[750px] shrink-0 origin-center pointer-events-none select-none bg-transparent overflow-hidden font-gothic">
        <div id="blok-katmani" class="absolute inset-0 pointer-events-none"></div>
        <h2 id="slayt-baslik" class="pointer-events-auto font-bold text-slate-800 text-center flex items-center justify-center outline-none focus:ring-4 focus:ring-blue-300 rounded-xl px-4"></h2>
        <div id="etkilesim-alani" class="absolute inset-0 pointer-events-none"></div>
        <button id="slayt-check-btn" class="pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none focus:ring-4 focus:ring-blue-300 rounded-xl flex items-center justify-center bg-transparent" disabled></button>
    </div>
</template>
<script>
PlayerCore.registerSlide({
    id: ${JSON.stringify(slideId)},
    title: ${JSON.stringify(titleText)},
    maxAttempts: 3,
    startAudio: "",
    hideBanner: false,
    hideNav: false,
    requireAudioComplete: false,
    slideData: ${JSON.stringify(slideData, null, 8)}
}, ${initFnStr});
<\/script>`;

            this.studioPreviewMode = 'design';
            if (typeof AdminVisualEditor !== 'undefined') {
                AdminVisualEditor.isEditMode = true;
            }
            const codeInput = document.getElementById('admin-code-input');
            if (codeInput) {
                codeInput.value = fullCode;
                AdminCore.analyzeCode();
                setTimeout(() => {
                    const previewCanvas = document.getElementById('admin-preview-canvas');
                    const firstDrag = previewCanvas ? previewCanvas.querySelector('[data-admin-path="dragItems.0"]') : null;
                    if (firstDrag && typeof AdminVisualEditor !== 'undefined') {
                        AdminVisualEditor.attach(firstDrag, 'dragItems.0');
                        AdminCore.openSelectedObjectInspector('dragItems.0');
                    }
                    this.renderStudioPreviewModeBar();
                }, 150);
            }
        },

        // =========================================================================
        // 2. ETKİNLİK TİPİ: METİN GİRİŞİ (1-TEK RAKAM, 2-SADECE HARF, 3-SERBEST METİN)
        // =========================================================================
        buildTextInputSlideData: function (count, inputMode, layout, instructionText) {
            const textPromptBoxes = [];
            const textInputs = [];
            const validMode = (inputMode === 'digit' || inputMode === 'letter') ? inputMode : 'text';

            const makePromptObj = (idx, x, y, w, h) => ({
                id: `prompt-${idx}`,
                type: 'textPrompt',
                text: '',
                arabicText: '',
                imageUrl: '',
                offsetX: x,
                offsetY: y,
                width: w,
                height: h,
                zIndex: 18,
                borderRadius: 16,
                bgColor: '#fef3c7',
                borderColor: '#d97706',
                textColor: '#92400e',
                textSize: 20,
                arabicSize: 30,
                a11yText: `${idx}. Soru / İpucu Alanı`,
                tabIndex: idx * 2,
                isHidden: false
            });

            const makeInputObj = (idx, x, y, w, h) => ({
                id: `input-${idx}`,
                type: 'textInput',
                inputMode: validMode,
                correctAnswer: validMode === 'digit' ? String(idx % 10) : (validMode === 'letter' ? 'A' : `Cevap ${idx}`),
                placeholder: validMode === 'digit' ? '#' : (validMode === 'letter' ? 'Harf...' : 'Yazınız...'),
                activeEditState: 'normal',
                offsetX: x,
                offsetY: y,
                width: w,
                height: h,
                zIndex: 25,
                borderRadius: 16,
                textSize: 24,
                arabicSize: 32,
                a11yText: `${idx}. Metin Giriş Kutusu (${validMode === 'digit' ? 'Tek Rakam' : (validMode === 'letter' ? 'Sadece Harf' : 'Metin')})`,
                tabIndex: idx * 2 + 1,
                isHidden: false,
                states: {
                    normal: { text: '', arabicText: '', imageUrl: '', bgColor: '#ffffff', borderColor: '#2563eb', textColor: '#1e3a8a' },
                    correct: { text: '', arabicText: '', imageUrl: '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                    wrong: { text: '', arabicText: '', imageUrl: '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
                }
            });

            if (layout === 'cards') {
                const maxPerRow = Math.min(count, 4);
                const totalW = 1480;
                const gapX = 28;
                const cardW = Math.max(220, Math.min(340, Math.floor((totalW - (maxPerRow - 1) * gapX) / maxPerRow)));
                for (let i = 0; i < count; i++) {
                    const row = Math.floor(i / maxPerRow);
                    const col = i % maxPerRow;
                    const inRow = Math.min(maxPerRow, count - row * maxPerRow);
                    const rowSpan = inRow * cardW + (inRow - 1) * gapX;
                    const x = Math.round(-rowSpan / 2 + cardW / 2 + col * (cardW + gapX));
                    const baseY = count > 4 ? (row === 0 ? -130 : 95) : -35;
                    const idx = i + 1;
                    textPromptBoxes.push(makePromptObj(idx, x, baseY - 58, cardW, 110));
                    textInputs.push(makeInputObj(idx, x, baseY + 55, validMode === 'digit' ? 120 : cardW, 76));
                }
            } else {
                const startY = -195;
                const endY = 215;
                const stepY = count > 1 ? Math.min(100, Math.floor((endY - startY) / (count - 1))) : 0;
                const itemH = Math.max(58, Math.min(82, stepY > 0 ? stepY - 12 : 80));
                const firstY = Math.round((startY + endY) / 2 - (stepY * (count - 1)) / 2);
                for (let i = 0; i < count; i++) {
                    const y = firstY + i * stepY;
                    const idx = i + 1;
                    textPromptBoxes.push(makePromptObj(idx, -230, y, 620, itemH));
                    textInputs.push(makeInputObj(idx, 330, y, validMode === 'digit' ? 140 : 380, itemH));
                }
            }

            return {
                activityType: 'text-input',
                heading: {
                    text: instructionText || 'Kutulara doğru ifadeleri yazınız ve Kontrol Et butonuna basınız.',
                    textSize: 26,
                    width: 1520,
                    height: 66,
                    offsetX: 0,
                    offsetY: -315,
                    zIndex: 20,
                    borderRadius: 16,
                    bgColor: '#eff6ff',
                    borderColor: '#bfdbfe',
                    textColor: '#1e3a8a',
                    a11yText: instructionText || 'Metin Girişi Etkinliği Yönergesi',
                    tabIndex: 1,
                    isHidden: false
                },
                blocks: [
                    {
                        id: 'block-bg-1',
                        title: '',
                        text: '',
                        textSize: 16,
                        width: 1660,
                        height: 550,
                        offsetX: 0,
                        offsetY: 5,
                        zIndex: 1,
                        borderRadius: 24,
                        bgColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        textColor: '#475569',
                        a11yText: 'Etkinlik Çalışma Alanı',
                        tabIndex: 0,
                        isHidden: true
                    }
                ],
                textPromptBoxes,
                textInputs,
                checkButtonConf: {
                    id: 'checkButtonConf',
                    imageUrl: 'cekirdek/kontrolet.png',
                    width: 240,
                    height: 68,
                    offsetX: 0,
                    offsetY: 325,
                    zIndex: 35,
                    borderRadius: 16,
                    a11yText: 'Kontrol Et',
                    tabIndex: count * 2 + 5,
                    isHidden: false
                }
            };
        },

        buildTextInputInitFunctionString: function () {
            return `function(canvas, state) {
    state = state || { completed: false, passed: false, attempts: 3 };
    if (typeof state.attempts !== 'number' || state.attempts <= 0) state.attempts = 3;

    const { data, safeArea, area, checkBtn, renderBox } = PlayerCore.initSlide(canvas);
    if (!area) return;
    area.innerHTML = '';

    const prompts = Array.isArray(data.textPromptBoxes) ? data.textPromptBoxes : [];
    const inputs = Array.isArray(data.textInputs) ? data.textInputs : [];
    const lockedCorrect = {};
    const inputDomById = {};
    const cardDomById = {};

    function isStudioEditActive() {
        const inPreview = Boolean(canvas.closest('#admin-preview-canvas'));
        if (!inPreview) return false;
        if (typeof AdminVisualEditor !== 'undefined' && !AdminVisualEditor.isEditMode) return false;
        if (window.ActivityStudioBuilder && window.ActivityStudioBuilder.studioPreviewMode === 'test') return false;
        return true;
    }

    function populateDivContent(targetDiv, contentObj, emptyLabel) {
        targetDiv.innerHTML = '';
        const imgUrl = (contentObj && contentObj.imageUrl) ? String(contentObj.imageUrl).trim() : '';
        const arTxt = (contentObj && contentObj.arabicText) ? String(contentObj.arabicText).trim() : '';
        const trTxt = (contentObj && contentObj.text) ? String(contentObj.text).trim() : '';
        if (contentObj && contentObj.bgColor) targetDiv.style.backgroundColor = contentObj.bgColor;
        if (contentObj && contentObj.borderColor) targetDiv.style.borderColor = contentObj.borderColor;
        if (contentObj && contentObj.textColor) targetDiv.style.color = contentObj.textColor;

        const hasAny = Boolean(imgUrl || arTxt || trTxt);
        if (!hasAny) {
            if (emptyLabel) {
                targetDiv.classList.add('agy-empty-div-hint');
                targetDiv.setAttribute('data-empty-label', emptyLabel);
            }
            return;
        }
        targetDiv.classList.remove('agy-empty-div-hint');
        targetDiv.removeAttribute('data-empty-label');

        if (imgUrl) {
            const imgEl = document.createElement('img');
            imgEl.src = imgUrl;
            imgEl.alt = trTxt || arTxt || 'Görsel';
            imgEl.className = (arTxt || trTxt)
                ? 'max-h-[65%] max-w-[90%] object-contain rounded-lg pointer-events-none select-none mb-1'
                : 'w-full h-full object-contain rounded-lg pointer-events-none select-none';
            targetDiv.appendChild(imgEl);
        }
        if (arTxt) {
            const arDiv = document.createElement('div');
            arDiv.dir = 'rtl';
            arDiv.className = 'font-arabic leading-tight text-center pointer-events-none select-none px-2';
            arDiv.style.fontSize = ((contentObj && contentObj.arabicSize) || 30) + 'px';
            arDiv.textContent = arTxt;
            targetDiv.appendChild(arDiv);
        }
        if (trTxt) {
            const trDiv = document.createElement('div');
            trDiv.className = 'font-bold leading-snug text-center pointer-events-none select-none px-2 break-words';
            trDiv.style.fontSize = ((contentObj && contentObj.textSize) || 20) + 'px';
            trDiv.textContent = trTxt;
            targetDiv.appendChild(trDiv);
        }
    }

    function setCardState(cardEl, itemData, stateKey) {
        if (!cardEl) return;
        const validKey = (stateKey === 'correct' || stateKey === 'wrong') ? stateKey : 'normal';
        cardEl.setAttribute('data-current-state', validKey);
        const stObj = (itemData && itemData.states && itemData.states[validKey]) ? itemData.states[validKey] : {};
        if (stObj.bgColor) cardEl.style.backgroundColor = stObj.bgColor;
        if (stObj.borderColor) cardEl.style.borderColor = stObj.borderColor;
        if (stObj.textColor) cardEl.style.color = stObj.textColor;

        cardEl.querySelectorAll('.agy-drag-state-div').forEach(div => {
            if (div.getAttribute('data-state-key') === validKey) {
                div.classList.remove('hidden');
                div.style.display = 'flex';
            } else {
                div.classList.add('hidden');
                div.style.display = 'none';
            }
        });
    }

    prompts.forEach((pr, idx) => {
        if (!pr.id) pr.id = 'prompt-' + (idx + 1);
        const pEl = document.createElement('div');
        pEl.id = pr.id;
        pEl.className = 'border-2 shadow-sm flex flex-col items-center justify-center p-2 overflow-hidden relative';
        pEl.style.backgroundColor = pr.bgColor || '#fef3c7';
        pEl.style.borderColor = pr.borderColor || '#d97706';
        pEl.style.color = pr.textColor || '#92400e';
        populateDivContent(pEl, pr, (idx + 1) + '. Soru / İfade Divi');
        renderBox(pEl, { zIndex: 18, borderRadius: 16, ...pr }, 'textPromptBoxes.' + idx);
        area.appendChild(pEl);
    });

    function sanitizeByMode(val, mode) {
        const s = String(val || '');
        if (mode === 'digit') {
            return s.replace(/[^0-9]/g, '').slice(0, 1);
        }
        if (mode === 'letter') {
            return s.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ\\u0600-\\u06FF\\s]/g, '');
        }
        return s;
    }

    function normalizeAnswer(str) {
        return String(str || '').trim().toLocaleLowerCase('tr-TR').replace(/\\s+/g, ' ');
    }

    function isInputCorrect(item, userVal) {
        const expectedRaw = String(item.correctAnswer ?? '').trim();
        if (!expectedRaw) return userVal.trim().length > 0;
        const alternatives = expectedRaw.split('|').map(x => normalizeAnswer(x)).filter(Boolean);
        const normUser = normalizeAnswer(userVal);
        return alternatives.includes(normUser);
    }

    function setCheckBtnActive(isActive) {
        const host = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
        const btns = [];
        if (checkBtn) btns.push(checkBtn);
        if (host && typeof host.querySelectorAll === 'function') {
            host.querySelectorAll('#slayt-check-btn').forEach(b => {
                if (!btns.includes(b)) btns.push(b);
            });
        }
        btns.forEach(btn => {
            if (isActive && !state.completed) {
                btn.disabled = false;
                btn.removeAttribute('disabled');
                btn.setAttribute('aria-disabled', 'false');
                btn.classList.remove('disabled:opacity-40', 'disabled:cursor-not-allowed', 'opacity-40');
                btn.classList.add('agy-check-ready');
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.style.cursor = 'pointer';
            } else {
                btn.disabled = true;
                btn.setAttribute('disabled', 'disabled');
                btn.setAttribute('aria-disabled', 'true');
                btn.classList.remove('agy-check-ready');
                btn.style.opacity = '0.4';
            }
        });
    }

    function updateCheckButtonState() {
        if (state.completed) {
            setCheckBtnActive(false);
            return;
        }
        const allFilled = inputs.length > 0 && inputs.every(it => {
            if (lockedCorrect[it.id]) return true;
            const inpEl = inputDomById[it.id];
            return inpEl && String(inpEl.value || '').trim().length > 0;
        });
        setCheckBtnActive(allFilled);
    }

    inputs.forEach((item, idx) => {
        if (!item.id) item.id = 'input-' + (idx + 1);
        if (!item.states) {
            item.states = {
                normal: { text: '', arabicText: '', imageUrl: '', bgColor: '#ffffff', borderColor: '#2563eb', textColor: '#1e3a8a' },
                correct: { text: '', arabicText: '', imageUrl: '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                wrong: { text: '', arabicText: '', imageUrl: '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
            };
        }

        const cardEl = document.createElement('div');
        cardEl.id = item.id;
        cardEl.className = 'agy-interactive-card border-3 shadow-md flex items-center justify-center overflow-hidden relative';
        cardEl.style.borderWidth = '3px';

        ['normal', 'correct', 'wrong'].forEach(k => {
            const stDiv = document.createElement('div');
            stDiv.className = 'agy-drag-state-div absolute inset-0 w-full h-full flex flex-col items-center justify-center p-1 pointer-events-none select-none';
            stDiv.setAttribute('data-state-key', k);
            populateDivContent(stDiv, item.states[k] || {}, '');
            cardEl.appendChild(stDiv);
        });

        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'agy-text-input-field relative z-10 px-3';
        inp.style.fontSize = ((item.textSize || 24)) + 'px';
        inp.placeholder = item.placeholder || (item.inputMode === 'digit' ? '#' : (item.inputMode === 'letter' ? 'Harf...' : 'Yazınız...'));
        inp.setAttribute('aria-label', item.a11yText || ((idx + 1) + '. Metin Giriş Alanı'));
        inp.setAttribute('aria-required', 'true');
        inp.setAttribute('autocomplete', 'off');
        inp.setAttribute('spellcheck', 'false');
        if (item.inputMode === 'digit') {
            inp.maxLength = 1;
            inp.inputMode = 'numeric';
        }

        inp.addEventListener('input', () => {
            if (lockedCorrect[item.id] || state.completed) return;
            const cleaned = sanitizeByMode(inp.value, item.inputMode);
            if (inp.value !== cleaned) inp.value = cleaned;
            if (cardEl.getAttribute('data-current-state') === 'wrong') {
                setCardState(cardEl, item, 'normal');
            }
            inp.setAttribute('aria-invalid', 'false');
            updateCheckButtonState();
        });

        inp.addEventListener('focus', () => {
            if (lockedCorrect[item.id] || state.completed) return;
            if (cardEl.getAttribute('data-current-state') === 'wrong') {
                setCardState(cardEl, item, 'normal');
                inp.setAttribute('aria-invalid', 'false');
            }
        });

        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                updateCheckButtonState();
                if (checkBtn && !checkBtn.disabled) evaluateAnswers();
            }
        });

        cardEl.appendChild(inp);
        const initState = isStudioEditActive() ? (item.activeEditState || 'normal') : 'normal';
        setCardState(cardEl, item, initState);
        renderBox(cardEl, { zIndex: 25, borderRadius: 16, ...item }, 'textInputs.' + idx);

        if (item.tabIndex !== undefined) {
            cardEl.removeAttribute('tabindex');
            inp.tabIndex = item.tabIndex;
        }

        area.appendChild(cardEl);
        inputDomById[item.id] = inp;
        cardDomById[item.id] = cardEl;
    });

    function revealAllCorrectAnswers() {
        inputs.forEach(it => {
            const inp = inputDomById[it.id];
            const cardEl = cardDomById[it.id];
            const firstAns = String(it.correctAnswer ?? '').split('|')[0].trim();
            if (inp) {
                inp.value = firstAns;
                inp.readOnly = true;
                inp.setAttribute('aria-invalid', 'false');
            }
            lockedCorrect[it.id] = true;
            setCardState(cardEl, it, 'correct');
        });
        setCheckBtnActive(false);
    }

    function submitResultWithFeedback(isCorrect, onFinalExhausted) {
        const inPreview = Boolean(canvas.closest('#admin-preview-canvas'));
        if (inPreview) {
            if (!isCorrect) state.attempts = Math.max(0, (state.attempts || 3) - 1);
            if (isCorrect || state.attempts <= 0) {
                state.completed = true;
                state.passed = Boolean(isCorrect);
                PlayerCore.showFeedback(isCorrect ? 'correct' : 'incorrect', null, () => {
                    if (typeof onFinalExhausted === 'function') onFinalExhausted();
                });
            } else {
                PlayerCore.showFeedback('retry', 'Kalan deneme hakkınız: ' + state.attempts, null);
            }
        } else {
            PlayerCore.submitAnswer(isCorrect, onFinalExhausted);
        }
    }

    function evaluateAnswers() {
        if (!checkBtn || checkBtn.disabled || state.completed) return;

        let allCorrect = true;
        inputs.forEach(it => {
            const inp = inputDomById[it.id];
            const cardEl = cardDomById[it.id];
            if (!inp || !cardEl) return;
            if (lockedCorrect[it.id] || isInputCorrect(it, inp.value)) {
                lockedCorrect[it.id] = true;
                inp.readOnly = true;
                inp.setAttribute('aria-invalid', 'false');
                setCardState(cardEl, it, 'correct');
            } else {
                allCorrect = false;
                setCardState(cardEl, it, 'wrong');
                inp.setAttribute('aria-invalid', 'true');
                // Yanlış olanların değerini silip tekrar giriş yapmalarını sağla
                inp.value = '';
            }
        });

        if (allCorrect) {
            revealAllCorrectAnswers();
            submitResultWithFeedback(true);
            return;
        }

        updateCheckButtonState();
        submitResultWithFeedback(false, () => {
            revealAllCorrectAnswers();
        });
    }

    function resetActivity() {
        state.completed = false;
        state.passed = false;
        state.attempts = (PlayerCore.slides && PlayerCore.slides[PlayerCore.currentSlideIndex] && PlayerCore.slides[PlayerCore.currentSlideIndex].maxAttempts) || (PlayerCore.settings && PlayerCore.settings.maxAttempts) || 3;
        Object.keys(lockedCorrect).forEach(k => delete lockedCorrect[k]);
        inputs.forEach(it => {
            const inp = inputDomById[it.id];
            const cardEl = cardDomById[it.id];
            if (inp) {
                inp.value = '';
                inp.readOnly = false;
                inp.setAttribute('aria-invalid', 'false');
            }
            setCardState(cardEl, it, isStudioEditActive() ? (it.activeEditState || 'normal') : 'normal');
        });
        if (checkBtn) {
            checkBtn.classList.remove('hidden');
            checkBtn.style.display = '';
        }
        setCheckBtnActive(false);
    }

    if (checkBtn) {
        checkBtn.onclick = (e) => {
            if (e) e.stopPropagation();
            evaluateAnswers();
        };
    }

    updateCheckButtonState();

    const ddApi = {
        activityType: 'text-input',
        updateCheckButtonState,
        evaluateAnswers,
        resetActivity,
        clearZoneHovers: function() {}
    };
    safeArea._ddApi = ddApi;
    const hostCanvas = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
    if (hostCanvas) hostCanvas._ddApi = ddApi;
}`;
        },

        generateAndLoadTextInput: function () {
            if (typeof AdminCore === 'undefined') return;
            const cfg = this.textInputConfig;
            const count = Math.max(1, Math.min(10, parseInt(cfg.count, 10) || 3));
            const slideId = AdminCore.ensureUniqueSlideId('etkinlik-metin-girisi');
            const slideData = this.buildTextInputSlideData(count, cfg.inputMode, cfg.layout, cfg.instruction);
            const initFnStr = this.buildTextInputInitFunctionString();
            this.loadGeneratedSlideIntoStudio(slideId, cfg.title || 'Metin Girişi Etkinliği', slideData, initFnStr, 'textInputs.0');
        },

        // =========================================================================
        // 3. ETKİNLİK TİPİ: ÇOKTAN SEÇMELİ (PEŞ PEŞE YENİ SORUYA GEÇEN ZİNCİRLİ YAPI)
        // =========================================================================
        createSingleMcQuestionObj: function (qNumber, optionCount, layout) {
            const options = [];
            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

            const makeOpt = (oIdx, x, y, w, h) => ({
                id: `q${qNumber}-opt-${oIdx + 1}`,
                type: 'mcOption',
                isCorrect: oIdx === 0,
                activeEditState: 'normal',
                offsetX: x,
                offsetY: y,
                width: w,
                height: h,
                zIndex: 25,
                borderRadius: 18,
                textSize: 20,
                arabicSize: 30,
                a11yText: `${qNumber}. Soru ${letters[oIdx] || (oIdx + 1)}. Seçenek`,
                tabIndex: oIdx + 3,
                isHidden: false,
                states: {
                    normal: { text: '', arabicText: '', imageUrl: '', bgColor: '#ffffff', borderColor: '#94a3b8', textColor: '#1e293b' },
                    selected: { text: '', arabicText: '', imageUrl: '', bgColor: '#dbeafe', borderColor: '#2563eb', textColor: '#1e3a8a' },
                    correct: { text: '', arabicText: '', imageUrl: '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                    wrong: { text: '', arabicText: '', imageUrl: '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
                }
            });

            let questionDiv = {
                id: `q${qNumber}-stem`,
                type: 'mcQuestionDiv',
                text: '',
                arabicText: '',
                imageUrl: '',
                offsetX: 0,
                offsetY: -155,
                width: 1480,
                height: 145,
                zIndex: 18,
                borderRadius: 20,
                bgColor: '#fef3c7',
                borderColor: '#d97706',
                textColor: '#92400e',
                textSize: 24,
                arabicSize: 34,
                a11yText: `${qNumber}. Soru Alanı`,
                tabIndex: 2,
                isHidden: false
            };

            if (layout === 'list') {
                questionDiv.offsetX = -380;
                questionDiv.offsetY = 0;
                questionDiv.width = 680;
                questionDiv.height = 440;
               
                const startY = -185;
                const endY = 205;
                const stepY = optionCount > 1 ? Math.min(95, Math.floor((endY - startY) / (optionCount - 1))) : 0;
                const optH = Math.max(58, Math.min(82, stepY > 0 ? stepY - 12 : 78));
                const firstY = Math.round((startY + endY) / 2 - (stepY * (optionCount - 1)) / 2);
                for (let i = 0; i < optionCount; i++) {
                    options.push(makeOpt(i, 370, firstY + i * stepY, 680, optH));
                }
            } else {
                const maxPerRow = optionCount === 4 ? 2 : Math.min(optionCount, 3);
                const totalW = 1480;
                const gapX = 28;
                const optW = Math.floor((totalW - (maxPerRow - 1) * gapX) / maxPerRow);
                const rows = Math.ceil(optionCount / maxPerRow);
                const optH = rows > 1 ? 115 : 175;
                for (let i = 0; i < optionCount; i++) {
                    const r = Math.floor(i / maxPerRow);
                    const c = i % maxPerRow;
                    const inRow = Math.min(maxPerRow, optionCount - r * maxPerRow);
                    const rowSpan = inRow * optW + (inRow - 1) * gapX;
                    const x = Math.round(-rowSpan / 2 + optW / 2 + c * (optW + gapX));
                    const y = rows > 1 ? (r === 0 ? 15 : 150) : 75;
                    options.push(makeOpt(i, x, y, optW, optH));
                }
            }

            return {
                id: `question-${qNumber}`,
                title: `${qNumber}. Soru`,
                questionDiv,
                options
            };
        },

        buildMultipleChoiceSlideData: function (optionCount, questionCount, layout, instructionText) {
            const questions = [];
            for (let q = 1; q <= questionCount; q++) {
                questions.push(this.createSingleMcQuestionObj(q, optionCount, layout));
            }
            return {
                activityType: 'multiple-choice',
                activeQuestionIndex: 0,
                mcLayout: layout,
                mcOptionCount: optionCount,
                heading: {
                    text: instructionText || 'Soruyu okuyunuz, doğru seçeneği işaretleyip Kontrol Et butonuna basınız.',
                    textSize: 25,
                    width: 1520,
                    height: 64,
                    offsetX: 0,
                    offsetY: -315,
                    zIndex: 20,
                    borderRadius: 16,
                    bgColor: '#f5f3ff',
                    borderColor: '#ddd6fe',
                    textColor: '#4c1d95',
                    a11yText: instructionText || 'Çoktan Seçmeli Etkinliği Yönergesi',
                    tabIndex: 1,
                    isHidden: false
                },
                blocks: [
                    {
                        id: 'block-bg-1',
                        title: '',
                        text: '',
                        textSize: 16,
                        width: 1660,
                        height: 550,
                        offsetX: 0,
                        offsetY: 5,
                        zIndex: 1,
                        borderRadius: 24,
                        bgColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        textColor: '#475569',
                        a11yText: 'Etkinlik Çalışma Alanı',
                        tabIndex: 0,
                        isHidden: true
                    }
                ],
                questions,
                checkButtonConf: {
                    id: 'checkButtonConf',
                    imageUrl: 'cekirdek/kontrolet.png',
                    width: 240,
                    height: 68,
                    offsetX: 0,
                    offsetY: 325,
                    zIndex: 35,
                    borderRadius: 16,
                    a11yText: 'Kontrol Et',
                    tabIndex: 30,
                    isHidden: false
                }
            };
        },

        buildMultipleChoiceInitFunctionString: function () {
            return `function(canvas, state) {
    state = state || { completed: false, passed: false, attempts: 3 };
    const maxAtt = (PlayerCore.slides && PlayerCore.slides[PlayerCore.currentSlideIndex] && PlayerCore.slides[PlayerCore.currentSlideIndex].maxAttempts) || (PlayerCore.settings && PlayerCore.settings.maxAttempts) || 3;
    if (typeof state.attempts !== 'number' || state.attempts <= 0) state.attempts = maxAtt;

    const { data, safeArea, area, checkBtn, renderBox } = PlayerCore.initSlide(canvas);
    if (!area) return;

    const questions = Array.isArray(data.questions) ? data.questions : [];
    if (questions.length === 0) return;

    function isStudioEditActive() {
        const inPreview = Boolean(canvas.closest('#admin-preview-canvas'));
        if (!inPreview) return false;
        if (typeof AdminVisualEditor !== 'undefined' && !AdminVisualEditor.isEditMode) return false;
        if (window.ActivityStudioBuilder && window.ActivityStudioBuilder.studioPreviewMode === 'test') return false;
        return true;
    }

    let currentQIdx = isStudioEditActive()
        ? Math.max(0, Math.min(questions.length - 1, parseInt(data.activeQuestionIndex, 10) || 0))
        : 0;
    let selectedOptIdx = null;
    let optionDomEls = [];

    function populateDivContent(targetDiv, contentObj, emptyLabel) {
        targetDiv.innerHTML = '';
        const imgUrl = (contentObj && contentObj.imageUrl) ? String(contentObj.imageUrl).trim() : '';
        const arTxt = (contentObj && contentObj.arabicText) ? String(contentObj.arabicText).trim() : '';
        const trTxt = (contentObj && contentObj.text) ? String(contentObj.text).trim() : '';
        if (contentObj && contentObj.bgColor) targetDiv.style.backgroundColor = contentObj.bgColor;
        if (contentObj && contentObj.borderColor) targetDiv.style.borderColor = contentObj.borderColor;
        if (contentObj && contentObj.textColor) targetDiv.style.color = contentObj.textColor;

        const hasAny = Boolean(imgUrl || arTxt || trTxt);
        if (!hasAny) {
            targetDiv.classList.add('agy-empty-div-hint');
            if (emptyLabel) targetDiv.setAttribute('data-empty-label', emptyLabel);
            return;
        }
        targetDiv.classList.remove('agy-empty-div-hint');
        targetDiv.removeAttribute('data-empty-label');

        if (imgUrl) {
            const imgEl = document.createElement('img');
            imgEl.src = imgUrl;
            imgEl.alt = trTxt || arTxt || 'Görsel';
            imgEl.className = (arTxt || trTxt)
                ? 'max-h-[65%] max-w-[90%] object-contain rounded-lg pointer-events-none select-none mb-1'
                : 'w-full h-full object-contain rounded-lg pointer-events-none select-none';
            targetDiv.appendChild(imgEl);
        }
        if (arTxt) {
            const arDiv = document.createElement('div');
            arDiv.dir = 'rtl';
            arDiv.className = 'font-arabic leading-tight text-center pointer-events-none select-none px-2';
            arDiv.style.fontSize = ((contentObj && contentObj.arabicSize) || 30) + 'px';
            arDiv.textContent = arTxt;
            targetDiv.appendChild(arDiv);
        }
        if (trTxt) {
            const trDiv = document.createElement('div');
            trDiv.className = 'font-bold leading-snug text-center pointer-events-none select-none px-2 break-words';
            trDiv.style.fontSize = ((contentObj && contentObj.textSize) || 20) + 'px';
            trDiv.textContent = trTxt;
            targetDiv.appendChild(trDiv);
        }
    }

    function setOptionVisibleState(optEl, optData, stateKey) {
        if (!optEl) return;
        const validKey = ['normal', 'selected', 'correct', 'wrong'].includes(stateKey) ? stateKey : 'normal';
        optEl.setAttribute('data-current-state', validKey);
        optEl.setAttribute('aria-checked', validKey === 'selected' || validKey === 'correct' ? 'true' : 'false');
        optEl.querySelectorAll('.agy-drag-state-div').forEach(div => {
            if (div.getAttribute('data-state-key') === validKey) {
                div.classList.remove('hidden');
                div.style.display = 'flex';
            } else {
                div.classList.add('hidden');
                div.style.display = 'none';
            }
        });
    }

    function setCheckBtnActive(isActive) {
        const host = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
        const btns = [];
        if (checkBtn) btns.push(checkBtn);
        if (host && typeof host.querySelectorAll === 'function') {
            host.querySelectorAll('#slayt-check-btn').forEach(b => {
                if (!btns.includes(b)) btns.push(b);
            });
        }
        btns.forEach(btn => {
            if (isActive && !state.completed) {
                btn.disabled = false;
                btn.removeAttribute('disabled');
                btn.setAttribute('aria-disabled', 'false');
                btn.classList.remove('disabled:opacity-40', 'disabled:cursor-not-allowed', 'opacity-40');
                btn.classList.add('agy-check-ready');
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.style.cursor = 'pointer';
            } else {
                btn.disabled = true;
                btn.setAttribute('disabled', 'disabled');
                btn.setAttribute('aria-disabled', 'true');
                btn.classList.remove('agy-check-ready');
                btn.style.opacity = '0.4';
            }
        });
    }

    function updateCheckButtonState() {
        setCheckBtnActive(selectedOptIdx !== null && !state.completed);
    }

    function renderCurrentQuestion() {
        area.innerHTML = '';
        selectedOptIdx = null;
        optionDomEls = [];

        const qObj = questions[currentQIdx] || questions[0];
        if (!qObj) return;

        // Birden fazla soru varsa sağ üstte soru sayacı rozetini göster
        if (questions.length > 1) {
            const badge = document.createElement('div');
            badge.className = 'absolute top-1/2 left-1/2 pointer-events-none z-30 bg-violet-600 text-white text-sm font-extrabold px-4 py-1.5 rounded-full shadow-md';
            badge.style.transform = 'translate(calc(-50% + 735px), calc(-50% - 245px))';
            badge.textContent = 'Soru ' + (currentQIdx + 1) + ' / ' + questions.length;
            area.appendChild(badge);
        }

        const qDivData = qObj.questionDiv || {};
        const qEl = document.createElement('div');
        qEl.id = qDivData.id || ('q-stem-' + (currentQIdx + 1));
        qEl.className = 'border-2 shadow-sm flex flex-col items-center justify-center p-4 overflow-hidden relative';
        qEl.style.backgroundColor = qDivData.bgColor || '#fef3c7';
        qEl.style.borderColor = qDivData.borderColor || '#d97706';
        qEl.style.color = qDivData.textColor || '#92400e';
        populateDivContent(qEl, qDivData, (currentQIdx + 1) + '. Soru Divi (Metin / Görsel)');
        renderBox(qEl, { zIndex: 18, borderRadius: 20, ...qDivData }, 'questions.' + currentQIdx + '.questionDiv');
        area.appendChild(qEl);

        const opts = Array.isArray(qObj.options) ? qObj.options : [];
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

        opts.forEach((opt, oIdx) => {
            if (!opt.states) {
                opt.states = {
                    normal: { text: '', arabicText: '', imageUrl: '', bgColor: '#ffffff', borderColor: '#94a3b8', textColor: '#1e293b' },
                    selected: { text: '', arabicText: '', imageUrl: '', bgColor: '#dbeafe', borderColor: '#2563eb', textColor: '#1e3a8a' },
                    correct: { text: '', arabicText: '', imageUrl: '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                    wrong: { text: '', arabicText: '', imageUrl: '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
                };
            }
            const optEl = document.createElement('div');
            optEl.id = opt.id || ('q' + (currentQIdx + 1) + '-opt-' + (oIdx + 1));
            optEl.className = 'agy-interactive-card cursor-pointer overflow-hidden flex items-center justify-center shadow-md';  // benim düzeltmem
            optEl.setAttribute('role', 'radio');
            optEl.setAttribute('aria-checked', 'false');

            const stateLabels = {
                normal: (letters[oIdx] || (oIdx + 1)) + ' Seçeneği • 1. Normal Div',
                selected: (letters[oIdx] || (oIdx + 1)) + ' Seçeneği • 2. Seçili Div',
                correct: (letters[oIdx] || (oIdx + 1)) + ' Seçeneği • 3. Doğru Div',
                wrong: (letters[oIdx] || (oIdx + 1)) + ' Seçeneği • 4. Yanlış Div'
            };

            ['normal', 'selected', 'correct', 'wrong'].forEach(k => {
                const stDiv = document.createElement('div');
                stDiv.className = 'agy-drag-state-div w-full h-full flex flex-col items-center justify-center p-2 border-3 rounded-[inherit] box-border relative overflow-hidden';
                stDiv.setAttribute('data-state-key', k);
                stDiv.style.borderWidth = '3px';
                const stObj = opt.states[k] || {};
                if (stObj.textSize === undefined) stObj.textSize = opt.textSize || 20;
                if (stObj.arabicSize === undefined) stObj.arabicSize = opt.arabicSize || 30;
                populateDivContent(stDiv, stObj, stateLabels[k]);
                optEl.appendChild(stDiv);
            });

            const initState = isStudioEditActive() ? (opt.activeEditState || 'normal') : 'normal';
            setOptionVisibleState(optEl, opt, initState);
            renderBox(optEl, { zIndex: 25, borderRadius: 18, ...opt }, 'questions.' + currentQIdx + '.options.' + oIdx);

            const selectThisOption = () => {
                if (state.completed) return;
                selectedOptIdx = oIdx;
                opts.forEach((o, i) => {
                    setOptionVisibleState(optionDomEls[i], o, i === oIdx ? 'selected' : 'normal');
                });
                updateCheckButtonState();
            };

            optEl.addEventListener('click', () => {
                if (isStudioEditActive()) return;
                selectThisOption();
            });
            optEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectThisOption();
                }
            });

            area.appendChild(optEl);
            optionDomEls.push(optEl);
        });

        updateCheckButtonState();
    }

    function advanceOrFinishSlide(passedLast) {
        if (currentQIdx < questions.length - 1) {
            currentQIdx++;
            state.attempts = maxAtt;
            renderCurrentQuestion();
        } else {
            state.completed = true;
            state.passed = Boolean(passedLast);
            setCheckBtnActive(false);
        }
    }

    function evaluateAnswers() {
        if (selectedOptIdx === null || state.completed) return;
        const qObj = questions[currentQIdx] || questions[0];
        const opts = Array.isArray(qObj.options) ? qObj.options : [];
        const chosenOpt = opts[selectedOptIdx];
        const chosenEl = optionDomEls[selectedOptIdx];
        if (!chosenOpt || !chosenEl) return;

        const isLastQuestion = currentQIdx >= questions.length - 1;
        const inPreview = Boolean(canvas.closest('#admin-preview-canvas'));

        if (chosenOpt.isCorrect) {
            setOptionVisibleState(chosenEl, chosenOpt, 'correct');
            setCheckBtnActive(false);
            if (!isLastQuestion) {
                PlayerCore.showFeedback('correct', (currentQIdx + 1) + '. soruyu doğru cevapladınız! Sıradaki soruya geçiliyor...', () => {
                    advanceOrFinishSlide(true);
                });
            } else {
                if (inPreview) {
                    state.completed = true;
                    state.passed = true;
                    PlayerCore.showFeedback('correct', null, null);
                } else {
                    PlayerCore.submitAnswer(true);
                }
            }
            return;
        }

        // Yanlış seçim
        setOptionVisibleState(chosenEl, chosenOpt, 'wrong');
        state.attempts = Math.max(0, (state.attempts || 3) - 1);

        if (state.attempts > 0) {
            selectedOptIdx = null;
            setCheckBtnActive(false);
            PlayerCore.showFeedback('retry', 'Kalan deneme hakkınız: ' + state.attempts, () => {
                setOptionVisibleState(chosenEl, chosenOpt, 'normal');
            });
        } else {
            // Bu sorudaki haklar bitti -> doğru cevabı göster
            opts.forEach((o, i) => {
                setOptionVisibleState(optionDomEls[i], o, o.isCorrect ? 'correct' : (i === selectedOptIdx ? 'wrong' : 'normal'));
            });
            setCheckBtnActive(false);
            if (!isLastQuestion) {
                PlayerCore.showFeedback('incorrect', 'Doğru cevap gösterildi. Sıradaki soruya geçiliyor...', () => {
                    advanceOrFinishSlide(false);
                });
            } else {
                if (inPreview) {
                    state.completed = true;
                    state.passed = false;
                    PlayerCore.showFeedback('incorrect', null, null);
                } else {
                    state.attempts = 1;
                    PlayerCore.submitAnswer(false);
                }
            }
        }
    }

    function resetActivity() {
        state.completed = false;
        state.passed = false;
        state.attempts = maxAtt;
        currentQIdx = isStudioEditActive()
            ? Math.max(0, Math.min(questions.length - 1, parseInt(data.activeQuestionIndex, 10) || 0))
            : 0;
        if (checkBtn) {
            checkBtn.classList.remove('hidden');
            checkBtn.style.display = '';
        }
        renderCurrentQuestion();
    }

    if (checkBtn) {
        checkBtn.onclick = (e) => {
            if (e) e.stopPropagation();
            evaluateAnswers();
        };
    }

    renderCurrentQuestion();

    const ddApi = {
        activityType: 'multiple-choice',
        selectOptionByIndex: function(idx) {
            const qObj = questions[currentQIdx] || questions[0];
            const opts = Array.isArray(qObj.options) ? qObj.options : [];
            if (idx < 0 || idx >= opts.length) return;
            selectedOptIdx = idx;
            opts.forEach((o, i) => {
                setOptionVisibleState(optionDomEls[i], o, i === idx ? 'selected' : 'normal');
            });
            updateCheckButtonState();
        },
        updateCheckButtonState,
        evaluateAnswers,
        resetActivity,
        clearZoneHovers: function() {}
    };
    safeArea._ddApi = ddApi;
    const hostCanvas = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
    if (hostCanvas) hostCanvas._ddApi = ddApi;
}`;
        },

        generateAndLoadMultipleChoice: function () {
            if (typeof AdminCore === 'undefined') return;
            const cfg = this.multipleChoiceConfig;
            const optCount = Math.max(2, Math.min(6, parseInt(cfg.optionCount, 10) || 4));
            const qCount = Math.max(1, Math.min(20, parseInt(cfg.questionCount, 10) || 2));
            const slideId = AdminCore.ensureUniqueSlideId('etkinlik-coktan-secmeli');
            const slideData = this.buildMultipleChoiceSlideData(optCount, qCount, cfg.layout, cfg.instruction);
            const initFnStr = this.buildMultipleChoiceInitFunctionString();
            this.loadGeneratedSlideIntoStudio(slideId, cfg.title || 'Çoktan Seçmeli Etkinliği', slideData, initFnStr, 'questions.0.questionDiv');
        },

        // =========================================================================
        // 4. ETKİNLİK TİPİ: DOĞRU / YANLIŞ İKİLİ RADİO BUTON GRUBU (4 STATE DİV)
        // =========================================================================
        buildTrueFalseSlideData: function (count, instructionText) {
            const tfStatements = [];
            const tfTrueBtns = [];
            const tfFalseBtns = [];

            const startY = -205;
            const endY = 230;
            const stepY = count > 1 ? Math.min(82, Math.floor((endY - startY) / (count - 1))) : 0;
            const rowH = Math.max(50, Math.min(68, stepY > 0 ? stepY - 8 : 66));
            const firstY = Math.round((startY + endY) / 2 - (stepY * (count - 1)) / 2);

            const makeBtnStates = (defaultLabel) => ({
                normal: { text: defaultLabel, arabicText: '', imageUrl: '', bgColor: '#f1f5f9', borderColor: '#94a3b8', textColor: '#334155' },
                selected: { text: defaultLabel, arabicText: '', imageUrl: '', bgColor: '#dbeafe', borderColor: '#2563eb', textColor: '#1e3a8a' },
                correct: { text: defaultLabel, arabicText: '', imageUrl: '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                wrong: { text: defaultLabel, arabicText: '', imageUrl: '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
            });

            for (let i = 0; i < count; i++) {
                const y = firstY + i * stepY;
                const idx = i + 1;
                tfStatements.push({
                    id: `tf-stmt-${idx}`,
                    type: 'tfStatement',
                    correctValue: i % 2 === 0 ? 'true' : 'false',
                    text: '',
                    arabicText: '',
                    imageUrl: '',
                    offsetX: -165,
                    offsetY: y,
                    width: 1120,
                    height: rowH,
                    zIndex: 18,
                    borderRadius: 14,
                    bgColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    textColor: '#1e293b',
                    textSize: 19,
                    arabicSize: 28,
                    a11yText: `${idx}. Doğru-Yanlış İfadesi`,
                    tabIndex: idx * 3,
                    isHidden: false
                });

                tfTrueBtns.push({
                    id: `tf-true-${idx}`,
                    type: 'tfButton',
                    roleValue: 'true',
                    rowIndex: i,
                    activeEditState: 'normal',
                    offsetX: 505,
                    offsetY: y,
                    width: 155,
                    height: rowH,
                    zIndex: 25,
                    borderRadius: 14,
                    textSize: 18,
                    arabicSize: 26,
                    a11yText: `${idx}. İfade İçin Doğru Seçeneği`,
                    tabIndex: idx * 3 + 1,
                    isHidden: false,
                    states: makeBtnStates('Doğru')
                });

                tfFalseBtns.push({
                    id: `tf-false-${idx}`,
                    type: 'tfButton',
                    roleValue: 'false',
                    rowIndex: i,
                    activeEditState: 'normal',
                    offsetX: 680,
                    offsetY: y,
                    width: 155,
                    height: rowH,
                    zIndex: 25,
                    borderRadius: 14,
                    textSize: 18,
                    arabicSize: 26,
                    a11yText: `${idx}. İfade İçin Yanlış Seçeneği`,
                    tabIndex: idx * 3 + 2,
                    isHidden: false,
                    states: makeBtnStates('Yanlış')
                });
            }

            return {
                activityType: 'true-false',
                heading: {
                    text: instructionText || 'İfadeleri okuyunuz, her ifade için Doğru veya Yanlış seçeneğini işaretleyip Kontrol Et butonuna basınız.',
                    textSize: 24,
                    width: 1540,
                    height: 64,
                    offsetX: 0,
                    offsetY: -315,
                    zIndex: 20,
                    borderRadius: 16,
                    bgColor: '#fffbeb',
                    borderColor: '#fde68a',
                    textColor: '#92400e',
                    a11yText: instructionText || 'Doğru Yanlış Etkinliği Yönergesi',
                    tabIndex: 1,
                    isHidden: false
                },
                blocks: [
                    {
                        id: 'block-bg-1',
                        title: '',
                        text: '',
                        textSize: 16,
                        width: 1660,
                        height: 550,
                        offsetX: 0,
                        offsetY: 5,
                        zIndex: 1,
                        borderRadius: 24,
                        bgColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        textColor: '#475569',
                        a11yText: 'Etkinlik Çalışma Alanı',
                        tabIndex: 0,
                        isHidden: true
                    }
                ],
                tfStatements,
                tfTrueBtns,
                tfFalseBtns,
                checkButtonConf: {
                    id: 'checkButtonConf',
                    imageUrl: 'cekirdek/kontrolet.png',
                    width: 240,
                    height: 68,
                    offsetX: 0,
                    offsetY: 325,
                    zIndex: 35,
                    borderRadius: 16,
                    a11yText: 'Kontrol Et',
                    tabIndex: count * 3 + 5,
                    isHidden: false
                }
            };
        },

        buildTrueFalseInitFunctionString: function () {
            return `function(canvas, state) {
    state = state || { completed: false, passed: false, attempts: 3 };
    if (typeof state.attempts !== 'number' || state.attempts <= 0) state.attempts = 3;

    const { data, safeArea, area, checkBtn, renderBox } = PlayerCore.initSlide(canvas);
    if (!area) return;
    area.innerHTML = '';

    const statements = Array.isArray(data.tfStatements) ? data.tfStatements : [];
    const trueBtns = Array.isArray(data.tfTrueBtns) ? data.tfTrueBtns : [];
    const falseBtns = Array.isArray(data.tfFalseBtns) ? data.tfFalseBtns : [];
    const rowCount = statements.length;

    const userChoices = {};
    const lockedCorrectRows = {};
    const trueBtnDom = [];
    const falseBtnDom = [];

    function isStudioEditActive() {
        const inPreview = Boolean(canvas.closest('#admin-preview-canvas'));
        if (!inPreview) return false;
        if (typeof AdminVisualEditor !== 'undefined' && !AdminVisualEditor.isEditMode) return false;
        if (window.ActivityStudioBuilder && window.ActivityStudioBuilder.studioPreviewMode === 'test') return false;
        return true;
    }

    function populateDivContent(targetDiv, contentObj, emptyLabel) {
        targetDiv.innerHTML = '';
        const imgUrl = (contentObj && contentObj.imageUrl) ? String(contentObj.imageUrl).trim() : '';
        const arTxt = (contentObj && contentObj.arabicText) ? String(contentObj.arabicText).trim() : '';
        const trTxt = (contentObj && contentObj.text) ? String(contentObj.text).trim() : '';
        if (contentObj && contentObj.bgColor) targetDiv.style.backgroundColor = contentObj.bgColor;
        if (contentObj && contentObj.borderColor) targetDiv.style.borderColor = contentObj.borderColor;
        if (contentObj && contentObj.textColor) targetDiv.style.color = contentObj.textColor;

        const hasAny = Boolean(imgUrl || arTxt || trTxt);
        if (!hasAny) {
            targetDiv.classList.add('agy-empty-div-hint');
            if (emptyLabel) targetDiv.setAttribute('data-empty-label', emptyLabel);
            return;
        }
        targetDiv.classList.remove('agy-empty-div-hint');
        targetDiv.removeAttribute('data-empty-label');

        if (imgUrl) {
            const imgEl = document.createElement('img');
            imgEl.src = imgUrl;
            imgEl.alt = trTxt || arTxt || 'Görsel';
            imgEl.className = (arTxt || trTxt)
                ? 'max-h-[65%] max-w-[90%] object-contain rounded-lg pointer-events-none select-none mb-1'
                : 'w-full h-full object-contain rounded-lg pointer-events-none select-none';
            targetDiv.appendChild(imgEl);
        }
        if (arTxt) {
            const arDiv = document.createElement('div');
            arDiv.dir = 'rtl';
            arDiv.className = 'font-arabic leading-tight text-center pointer-events-none select-none px-2';
            arDiv.style.fontSize = ((contentObj && contentObj.arabicSize) || 26) + 'px';
            arDiv.textContent = arTxt;
            targetDiv.appendChild(arDiv);
        }
        if (trTxt) {
            const trDiv = document.createElement('div');
            trDiv.className = 'font-bold leading-snug text-center pointer-events-none select-none px-2 break-words';
            trDiv.style.fontSize = ((contentObj && contentObj.textSize) || 18) + 'px';
            trDiv.textContent = trTxt;
            targetDiv.appendChild(trDiv);
        }
    }

    function setBtnVisibleState(btnEl, stateKey) {
        if (!btnEl) return;
        const validKey = ['normal', 'selected', 'correct', 'wrong'].includes(stateKey) ? stateKey : 'normal';
        btnEl.setAttribute('data-current-state', validKey);
        btnEl.setAttribute('aria-checked', validKey === 'selected' || validKey === 'correct' ? 'true' : 'false');
        btnEl.querySelectorAll('.agy-drag-state-div').forEach(div => {
            if (div.getAttribute('data-state-key') === validKey) {
                div.classList.remove('hidden');
                div.style.display = 'flex';
            } else {
                div.classList.add('hidden');
                div.style.display = 'none';
            }
        });
    }

    function setCheckBtnActive(isActive) {
        const host = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
        const btns = [];
        if (checkBtn) btns.push(checkBtn);
        if (host && typeof host.querySelectorAll === 'function') {
            host.querySelectorAll('#slayt-check-btn').forEach(b => {
                if (!btns.includes(b)) btns.push(b);
            });
        }
        btns.forEach(btn => {
            if (isActive && !state.completed) {
                btn.disabled = false;
                btn.removeAttribute('disabled');
                btn.setAttribute('aria-disabled', 'false');
                btn.classList.remove('disabled:opacity-40', 'disabled:cursor-not-allowed', 'opacity-40');
                btn.classList.add('agy-check-ready');
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.style.cursor = 'pointer';
            } else {
                btn.disabled = true;
                btn.setAttribute('disabled', 'disabled');
                btn.setAttribute('aria-disabled', 'true');
                btn.classList.remove('agy-check-ready');
                btn.style.opacity = '0.4';
            }
        });
    }

    function updateCheckButtonState() {
        if (state.completed) {
            setCheckBtnActive(false);
            return;
        }
        const allAnswered = rowCount > 0 && statements.every((_, rIdx) => {
            return lockedCorrectRows[rIdx] || userChoices[rIdx] === 'true' || userChoices[rIdx] === 'false';
        });
        setCheckBtnActive(allAnswered);
    }

    function selectRowChoice(rIdx, val) {
        if (state.completed || lockedCorrectRows[rIdx]) return;
        userChoices[rIdx] = val;
        setBtnVisibleState(trueBtnDom[rIdx], val === 'true' ? 'selected' : 'normal');
        setBtnVisibleState(falseBtnDom[rIdx], val === 'false' ? 'selected' : 'normal');
        updateCheckButtonState();
    }

    function createRadioBtnDom(btnData, rIdx, roleVal, adminPath) {
        const defaultLabel = roleVal === 'true' ? 'Doğru' : 'Yanlış';
        if (!btnData.states) {
            btnData.states = {
                normal: { text: defaultLabel, arabicText: '', imageUrl: '', bgColor: '#f1f5f9', borderColor: '#94a3b8', textColor: '#334155' },
                selected: { text: defaultLabel, arabicText: '', imageUrl: '', bgColor: '#dbeafe', borderColor: '#2563eb', textColor: '#1e3a8a' },
                correct: { text: defaultLabel, arabicText: '', imageUrl: '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                wrong: { text: defaultLabel, arabicText: '', imageUrl: '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
            };
        }
        const btnEl = document.createElement('div');
        btnEl.id = btnData.id || ('tf-' + roleVal + '-' + (rIdx + 1));
        btnEl.className = 'agy-interactive-card cursor-pointer overflow-hidden flex items-center justify-center shadow-sm ';  // benim düzeltmem relative yi sildim
        btnEl.setAttribute('role', 'radio');
        btnEl.setAttribute('aria-checked', 'false');

        ['normal', 'selected', 'correct', 'wrong'].forEach(k => {
            const stDiv = document.createElement('div');
            stDiv.className = 'agy-drag-state-div w-full h-full flex flex-col items-center justify-center p-1.5 border-2 rounded-[inherit] box-border  overflow-hidden'; // benim düzeltmem relative yi sildim
            stDiv.setAttribute('data-state-key', k);
            const stObj = btnData.states[k] || {};
            if (stObj.textSize === undefined) stObj.textSize = btnData.textSize || 18;
            if (stObj.arabicSize === undefined) stObj.arabicSize = btnData.arabicSize || 26;
            populateDivContent(stDiv, stObj, defaultLabel + ' (' + k + ')');
            btnEl.appendChild(stDiv);
        });

        const initState = isStudioEditActive() ? (btnData.activeEditState || 'normal') : 'normal';
        setBtnVisibleState(btnEl, initState);
        renderBox(btnEl, { zIndex: 25, borderRadius: 14, ...btnData }, adminPath);

        btnEl.addEventListener('click', () => {
            if (isStudioEditActive()) return;
            selectRowChoice(rIdx, roleVal);
        });
        btnEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectRowChoice(rIdx, roleVal);
            }
        });
        area.appendChild(btnEl);
        return btnEl;
    }

    statements.forEach((stmt, rIdx) => {
        const sEl = document.createElement('div');
        sEl.id = stmt.id || ('tf-stmt-' + (rIdx + 1));
        sEl.className = 'border-2 shadow-2xs flex flex-col items-center justify-center px-4 py-1.5 overflow-hidden';
        sEl.style.backgroundColor = stmt.bgColor || '#ffffff';
        sEl.style.borderColor = stmt.borderColor || '#cbd5e1';
        sEl.style.color = stmt.textColor || '#1e293b';
        populateDivContent(sEl, stmt, (rIdx + 1) + '. Doğru / Yanlış İfade Divi');
        renderBox(sEl, { zIndex: 18, borderRadius: 14, ...stmt }, 'tfStatements.' + rIdx);
        area.appendChild(sEl);

        const tBtnData = trueBtns[rIdx] || { offsetX: 505, offsetY: stmt.offsetY || 0, width: 155, height: stmt.height || 60 };
        const fBtnData = falseBtns[rIdx] || { offsetX: 680, offsetY: stmt.offsetY || 0, width: 155, height: stmt.height || 60 };

        trueBtnDom.push(createRadioBtnDom(tBtnData, rIdx, 'true', 'tfTrueBtns.' + rIdx));
        falseBtnDom.push(createRadioBtnDom(fBtnData, rIdx, 'false', 'tfFalseBtns.' + rIdx));
    });

    function revealAllCorrectAnswers() {
        statements.forEach((stmt, rIdx) => {
            const expected = String(stmt.correctValue || 'true') === 'false' ? 'false' : 'true';
            lockedCorrectRows[rIdx] = true;
            userChoices[rIdx] = expected;
            setBtnVisibleState(trueBtnDom[rIdx], expected === 'true' ? 'correct' : 'normal');
            setBtnVisibleState(falseBtnDom[rIdx], expected === 'false' ? 'correct' : 'normal');
        });
        setCheckBtnActive(false);
    }

    function submitResultWithFeedback(isCorrect, onFinalExhausted) {
        const inPreview = Boolean(canvas.closest('#admin-preview-canvas'));
        if (inPreview) {
            if (!isCorrect) state.attempts = Math.max(0, (state.attempts || 3) - 1);
            if (isCorrect || state.attempts <= 0) {
                state.completed = true;
                state.passed = Boolean(isCorrect);
                PlayerCore.showFeedback(isCorrect ? 'correct' : 'incorrect', null, () => {
                    if (typeof onFinalExhausted === 'function') onFinalExhausted();
                });
            } else {
                PlayerCore.showFeedback('retry', 'Kalan deneme hakkınız: ' + state.attempts, null);
            }
        } else {
            PlayerCore.submitAnswer(isCorrect, onFinalExhausted);
        }
    }

    function evaluateAnswers() {
        if (!checkBtn || checkBtn.disabled || state.completed) return;
        let allCorrect = true;
        const wrongRowIndices = [];

        statements.forEach((stmt, rIdx) => {
            const expected = String(stmt.correctValue || 'true') === 'false' ? 'false' : 'true';
            const chosen = userChoices[rIdx];
            if (lockedCorrectRows[rIdx] || chosen === expected) {
                lockedCorrectRows[rIdx] = true;
                setBtnVisibleState(trueBtnDom[rIdx], expected === 'true' ? 'correct' : 'normal');
                setBtnVisibleState(falseBtnDom[rIdx], expected === 'false' ? 'correct' : 'normal');
            } else {
                allCorrect = false;
                wrongRowIndices.push(rIdx);
                setBtnVisibleState(trueBtnDom[rIdx], chosen === 'true' ? 'wrong' : 'normal');
                setBtnVisibleState(falseBtnDom[rIdx], chosen === 'false' ? 'wrong' : 'normal');
                delete userChoices[rIdx];
            }
        });

        if (allCorrect) {
            revealAllCorrectAnswers();
            submitResultWithFeedback(true);
            return;
        }

        updateCheckButtonState();
        submitResultWithFeedback(false, () => {
            revealAllCorrectAnswers();
        });
    }

    function resetActivity() {
        state.completed = false;
        state.passed = false;
        state.attempts = (PlayerCore.slides && PlayerCore.slides[PlayerCore.currentSlideIndex] && PlayerCore.slides[PlayerCore.currentSlideIndex].maxAttempts) || (PlayerCore.settings && PlayerCore.settings.maxAttempts) || 3;
        Object.keys(userChoices).forEach(k => delete userChoices[k]);
        Object.keys(lockedCorrectRows).forEach(k => delete lockedCorrectRows[k]);
        statements.forEach((_, rIdx) => {
            const tInit = isStudioEditActive() ? (trueBtns[rIdx]?.activeEditState || 'normal') : 'normal';
            const fInit = isStudioEditActive() ? (falseBtns[rIdx]?.activeEditState || 'normal') : 'normal';
            setBtnVisibleState(trueBtnDom[rIdx], tInit);
            setBtnVisibleState(falseBtnDom[rIdx], fInit);
        });
        if (checkBtn) {
            checkBtn.classList.remove('hidden');
            checkBtn.style.display = '';
        }
        setCheckBtnActive(false);
    }

    if (checkBtn) {
        checkBtn.onclick = (e) => {
            if (e) e.stopPropagation();
            evaluateAnswers();
        };
    }

    updateCheckButtonState();

    const ddApi = {
        activityType: 'true-false',
        selectRowChoice,
        updateCheckButtonState,
        evaluateAnswers,
        resetActivity,
        clearZoneHovers: function() {}
    };
    safeArea._ddApi = ddApi;
    const hostCanvas = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
    if (hostCanvas) hostCanvas._ddApi = ddApi;
}`;
        },

        generateAndLoadTrueFalse: function () {
            if (typeof AdminCore === 'undefined') return;
            const cfg = this.trueFalseConfig;
            const count = Math.max(1, Math.min(10, parseInt(cfg.count, 10) || 6));
            const slideId = AdminCore.ensureUniqueSlideId('etkinlik-dogru-yanlis');
            const slideData = this.buildTrueFalseSlideData(count, cfg.instruction);
            const initFnStr = this.buildTrueFalseInitFunctionString();
            this.loadGeneratedSlideIntoStudio(slideId, cfg.title || 'Doğru / Yanlış Etkinliği', slideData, initFnStr, 'tfStatements.0');
        },

        // =========================================================================
        // 5. ETKİNLİK TİPİ: ÇOKLU SEÇİM / CHECK BUTON GRUBU (4 STATE DİV)
        // =========================================================================
        buildMultiSelectSlideData: function (count, layout, instructionText) {
            const multiSelectItems = [];
            const maxPerRow = layout === 'cards' ? 3 : 2;
            const totalW = 1480;
            const gapX = 28;
            const itemW = Math.floor((totalW - (maxPerRow - 1) * gapX) / maxPerRow);
            const rows = Math.ceil(count / maxPerRow);
            const startY = -195;
            const endY = 215;
            const stepY = rows > 1 ? Math.min(130, Math.floor((endY - startY) / (rows - 1))) : 0;
            const itemH = Math.max(76, Math.min(118, stepY > 0 ? stepY - 14 : 115));
            const firstY = Math.round((startY + endY) / 2 - (stepY * (rows - 1)) / 2);

            for (let i = 0; i < count; i++) {
                const r = Math.floor(i / maxPerRow);
                const c = i % maxPerRow;
                const inRow = Math.min(maxPerRow, count - r * maxPerRow);
                const rowSpan = inRow * itemW + (inRow - 1) * gapX;
                const x = Math.round(-rowSpan / 2 + itemW / 2 + c * (itemW + gapX));
                const y = firstY + r * stepY;
                const idx = i + 1;

                multiSelectItems.push({
                    id: `ms-item-${idx}`,
                    type: 'multiSelectItem',
                    isCorrect: i % 2 === 0,
                    activeEditState: 'normal',
                    offsetX: x,
                    offsetY: y,
                    width: itemW,
                    height: itemH,
                    zIndex: 25,
                    borderRadius: 18,
                    borderWidth : 3,
                    golge : false,
                    buttonefekt : false,
                    shodow : '',
                    bgColor: 'transparent',
                    textSize: 20,
                    arabicSize: 30,
                    a11yText: `${idx}. Çoklu Seçim Kutusu`,
                    tabIndex: idx + 1,
                    isHidden: false,
                    states: {
                        normal: { text: '', arabicText: '', imageUrl: '', bgColor: 'transparent', borderColor: '#94a3b8', textColor: '#1e293b' },
                        selected: { text: '', arabicText: '', imageUrl: '', bgColor: 'transparent', borderColor: '#2563eb', textColor: '#1e3a8a' },
                        correct: { text: '', arabicText: '', imageUrl: '', bgColor: 'transparent', borderColor: '#059669', textColor: '#064e3b' },
                        wrong: { text: '', arabicText: '', imageUrl: '', bgColor: 'transparent', borderColor: '#dc2626', textColor: '#7f1d1d' }
                    }
                });
            }

            return {
                activityType: 'multi-select',
                heading: {
                    text: instructionText || 'Aşağıdakilerden doğru olanların tamamını işaretleyip Kontrol Et butonuna basınız.',
                    textSize: 25,
                    width: 1520,
                    height: 64,
                    offsetX: 0,
                    offsetY: -315,
                    zIndex: 20,
                    borderRadius: 16,
                    borderWidth : 3,
                    golge : true,
                    bgColor: 'transparent',
                    borderColor: '#99f6e4',
                    textColor: '#115e59',
                    a11yText: instructionText || 'Çoklu Seçim Etkinliği Yönergesi',
                    tabIndex: 1,
                    isHidden: false
                },
                blocks: [
                    {
                        id: 'block-bg-1',
                        title: '',
                        text: '',
                        textSize: 16,
                        width: 1660,
                        height: 550,
                        offsetX: 0,
                        offsetY: 5,
                        zIndex: 1,
                        borderRadius: 24,
                        borderWidth : 3,
                        bgColor: 'transparent',
                        borderColor: '#cbd5e1',
                        textColor: '#475569',
                        a11yText: 'Etkinlik Çalışma Alanı',
                        tabIndex: 0,
                        isHidden: true
                    }
                ],
                multiSelectItems,
                checkButtonConf: {
                    id: 'checkButtonConf',
                    imageUrl: 'cekirdek/kontrolet.png',
                    width: 240,
                    height: 68,
                    offsetX: 0,
                    offsetY: 325,
                    zIndex: 35,
                    borderRadius: 16,
                    borderWidth : 3,
                    golge : false,
                    a11yText: 'Kontrol Et',
                    tabIndex: count + 5,
                    isHidden: false
                }
            };
        },

        buildMultiSelectInitFunctionString: function () {
            return `function(canvas, state) {
    state = state || { completed: false, passed: false, attempts: 3 };
    if (typeof state.attempts !== 'number' || state.attempts <= 0) state.attempts = 3;

    const { data, safeArea, area, checkBtn, renderBox } = PlayerCore.initSlide(canvas);
    if (!area) return;
    area.innerHTML = '';

    const items = Array.isArray(data.multiSelectItems) ? data.multiSelectItems : [];
    const selectedSet = new Set();
    const lockedCorrectSet = new Set();
    const itemDomEls = [];

    function isStudioEditActive() {
        const inPreview = Boolean(canvas.closest('#admin-preview-canvas'));
        if (!inPreview) return false;
        if (typeof AdminVisualEditor !== 'undefined' && !AdminVisualEditor.isEditMode) return false;
        if (window.ActivityStudioBuilder && window.ActivityStudioBuilder.studioPreviewMode === 'test') return false;
        return true;
    }

    function populateDivContent(targetDiv, contentObj, emptyLabel) {
        targetDiv.innerHTML = '';
        const imgUrl = (contentObj && contentObj.imageUrl) ? String(contentObj.imageUrl).trim() : '';
        const arTxt = (contentObj && contentObj.arabicText) ? String(contentObj.arabicText).trim() : '';
        const trTxt = (contentObj && contentObj.text) ? String(contentObj.text).trim() : '';
        if (contentObj && contentObj.bgColor) targetDiv.style.backgroundColor = contentObj.bgColor;
        if (contentObj && contentObj.borderColor) targetDiv.style.borderColor = contentObj.borderColor;
        if (contentObj && contentObj.textColor) targetDiv.style.color = contentObj.textColor;

        const hasAny = Boolean(imgUrl || arTxt || trTxt);
        if (!hasAny) {
            targetDiv.classList.add('agy-empty-div-hint');
            if (emptyLabel) targetDiv.setAttribute('data-empty-label', emptyLabel);
            return;
        }
        targetDiv.classList.remove('agy-empty-div-hint');
        targetDiv.removeAttribute('data-empty-label');

        if (imgUrl) {
            const imgEl = document.createElement('img');
            imgEl.src = imgUrl;
            imgEl.alt = trTxt || arTxt || 'Görsel';
            imgEl.className = (arTxt || trTxt)
                ? 'max-h-[65%] max-w-[90%] object-contain rounded-lg pointer-events-none select-none mb-1'
                : 'w-full h-full object-contain rounded-lg pointer-events-none select-none';
            targetDiv.appendChild(imgEl);
        }
        if (arTxt) {
            const arDiv = document.createElement('div');
            arDiv.dir = 'rtl';
            arDiv.className = 'font-arabic leading-tight text-center pointer-events-none select-none px-2';
            arDiv.style.fontSize = ((contentObj && contentObj.arabicSize) || 30) + 'px';
            arDiv.textContent = arTxt;
            targetDiv.appendChild(arDiv);
        }
        if (trTxt) {
            const trDiv = document.createElement('div');
            trDiv.className = 'font-bold leading-snug text-center pointer-events-none select-none px-2 break-words';
            trDiv.style.fontSize = ((contentObj && contentObj.textSize) || 20) + 'px';
            trDiv.textContent = trTxt;
            targetDiv.appendChild(trDiv);
        }
    }

    function setItemVisibleState(itemEl, stateKey) {
        if (!itemEl) return;
        const validKey = ['normal', 'selected', 'correct', 'wrong'].includes(stateKey) ? stateKey : 'normal';
        itemEl.setAttribute('data-current-state', validKey);
        itemEl.setAttribute('aria-checked', validKey === 'selected' || validKey === 'correct' ? 'true' : 'false');
        itemEl.querySelectorAll('.agy-drag-state-div').forEach(div => {
            if (div.getAttribute('data-state-key') === validKey) {
                div.classList.remove('hidden');
                div.style.display = 'flex';
            } else {
                div.classList.add('hidden');
                div.style.display = 'none';
            }
        });
    }

    function setCheckBtnActive(isActive) {
        const host = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
        const btns = [];
        if (checkBtn) btns.push(checkBtn);
        if (host && typeof host.querySelectorAll === 'function') {
            host.querySelectorAll('#slayt-check-btn').forEach(b => {
                if (!btns.includes(b)) btns.push(b);
            });
        }
        btns.forEach(btn => {
            if (isActive && !state.completed) {
                btn.disabled = false;
                btn.removeAttribute('disabled');
                btn.setAttribute('aria-disabled', 'false');
                btn.classList.remove('disabled:opacity-40', 'disabled:cursor-not-allowed', 'opacity-40');
                btn.classList.add('agy-check-ready');
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.style.cursor = 'pointer';
            } else {
                btn.disabled = true;
                btn.setAttribute('disabled', 'disabled');
                btn.setAttribute('aria-disabled', 'true');
                btn.classList.remove('agy-check-ready');
                btn.style.opacity = '0.4';
            }
        });
    }

    function updateCheckButtonState() {
        const hasAnySelection = selectedSet.size > 0 || lockedCorrectSet.size > 0;
        setCheckBtnActive(hasAnySelection && !state.completed);
    }

    function toggleItemSelection(idx) {
        if (state.completed || lockedCorrectSet.has(idx)) return;
        if (selectedSet.has(idx)) {
            selectedSet.delete(idx);
            setItemVisibleState(itemDomEls[idx], 'normal');
        } else {
            selectedSet.add(idx);
            setItemVisibleState(itemDomEls[idx], 'selected');
        }
        updateCheckButtonState();
    }

    items.forEach((item, idx) => {
        if (!item.states) {
            item.states = {
                normal: { text: '', arabicText: '', imageUrl: '', bgColor: '', borderColor: '#94a3b8', textColor: '#1e293b' },
                selected: { text: '', arabicText: '', imageUrl: '', bgColor: '', borderColor: '#2563eb', textColor: '#1e3a8a' },
                correct: { text: '', arabicText: '', imageUrl: '', bgColor: '', borderColor: '#059669', textColor: '#064e3b' },
                wrong: { text: '', arabicText: '', imageUrl: '', bgColor: '', borderColor: '#dc2626', textColor: '#7f1d1d' }
            };
        }

        const itemEl = document.createElement('div');
        itemEl.id = item.id || ('ms-item-' + (idx + 1));

       itemEl.className = 'agy-interactive-card cursor-pointer overflow-hidden flex items-center justify-center transition-transform hover:scale-105'// + (item.golge ? ' shadow-md' : ''); // shadow-md  benim düzeltmem relative sildim
        itemEl.setAttribute('role', 'checkbox');
        itemEl.setAttribute('aria-checked', 'false');



        const stateLabels = {
            normal: (idx + 1) + '. Check Kutusu • 1. Normal Div',
            selected: (idx + 1) + '. Check Kutusu • 2. Seçili Div',
            correct: (idx + 1) + '. Check Kutusu • 3. Doğru Div',
            wrong: (idx + 1) + '. Check Kutusu • 4. Yanlış Div'
        };

        ['normal', 'selected', 'correct', 'wrong'].forEach(k => {
            const stDiv = document.createElement('div');
            stDiv.className = 'agy-drag-state-div w-full h-full flex flex-row items-center justify-start gap-2 p-2 border-3 rounded-[inherit] box-border overflow-hidden ' + (item.buttonefekt ?  'pl-4 transition-transform duration-200 hover:scale-105' : '');
           // stDiv.className = 'agy-drag-state-div w-full h-full flex items-center justify-start flex-row place-items-center p-2 border-3 rounded-[inherit] box-border  overflow-hidden'; // benim düzeltmem relative sildim
          //  stDiv.className = 'agy-drag-state-div relative w-full h-full  p-2 border-3 rounded-[inherit] box-border overflow-hidden [&>*]:absolute [&>*]:left-1/2 [&>*]:top-1/2 [&>*]:-translate-x-1/2 [&>*]:-translate-y-1/2';
            stDiv.setAttribute('data-state-key', k);




            //stDiv.style.borderWidth = '1px';
            const stObj = item.states[k] || {};
            stDiv.style.borderWidth = item.borderWidth +'px';
            if (stObj.textSize === undefined) stObj.textSize = item.textSize || 20;
            if (stObj.arabicSize === undefined) stObj.arabicSize = item.arabicSize || 30;
            populateDivContent(stDiv, stObj, stateLabels[k]);
            itemEl.appendChild(stDiv);
        });

        const initState = isStudioEditActive() ? (item.activeEditState || 'normal') : 'normal';
        setItemVisibleState(itemEl, initState);
        renderBox(itemEl, { zIndex: 25, borderRadius: 18, borderWidth: 3, ...item }, 'multiSelectItems.' + idx);

        itemEl.addEventListener('click', () => {
            if (isStudioEditActive()) return;
            toggleItemSelection(idx);
        });
        itemEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleItemSelection(idx);
            }
        });

        area.appendChild(itemEl);
        itemDomEls.push(itemEl);
    });

    function revealAllCorrectAnswers() {
        items.forEach((it, idx) => {
            if (it.isCorrect) {
                lockedCorrectSet.add(idx);
                selectedSet.add(idx);
                setItemVisibleState(itemDomEls[idx], 'correct');
            } else {
                selectedSet.delete(idx);
                setItemVisibleState(itemDomEls[idx], 'normal');
            }
        });
        setCheckBtnActive(false);
    }

    function submitResultWithFeedback(isCorrect, onFinalExhausted) {
        const inPreview = Boolean(canvas.closest('#admin-preview-canvas'));
        if (inPreview) {
            if (!isCorrect) state.attempts = Math.max(0, (state.attempts || 3) - 1);
            if (isCorrect || state.attempts <= 0) {
                state.completed = true;
                state.passed = Boolean(isCorrect);
                PlayerCore.showFeedback(isCorrect ? 'correct' : 'incorrect', null, () => {
                    if (typeof onFinalExhausted === 'function') onFinalExhausted();
                });
            } else {
                PlayerCore.showFeedback('retry', 'Kalan deneme hakkınız: ' + state.attempts, null);
            }
        } else {
            PlayerCore.submitAnswer(isCorrect, onFinalExhausted);
        }
    }

    function evaluateAnswers() {
        if (!checkBtn || checkBtn.disabled || state.completed) return;

        let allMatched = true;
        items.forEach((it, idx) => {
            const isChosen = selectedSet.has(idx) || lockedCorrectSet.has(idx);
            if (it.isCorrect && isChosen) {
                lockedCorrectSet.add(idx);
                selectedSet.add(idx);
                setItemVisibleState(itemDomEls[idx], 'correct');
            } else if (!it.isCorrect && isChosen) {
                allMatched = false;
                selectedSet.delete(idx);
                setItemVisibleState(itemDomEls[idx], 'wrong');
            } else if (it.isCorrect && !isChosen) {
                allMatched = false;
            }
        });

        if (allMatched) {
            revealAllCorrectAnswers();
            submitResultWithFeedback(true);
            return;
        }

        updateCheckButtonState();
        submitResultWithFeedback(false, () => {
            revealAllCorrectAnswers();
        });
    }

    function resetActivity() {
        state.completed = false;
        state.passed = false;
        state.attempts = (PlayerCore.slides && PlayerCore.slides[PlayerCore.currentSlideIndex] && PlayerCore.slides[PlayerCore.currentSlideIndex].maxAttempts) || (PlayerCore.settings && PlayerCore.settings.maxAttempts) || 3;
        selectedSet.clear();
        lockedCorrectSet.clear();
        items.forEach((it, idx) => {
            const initSt = isStudioEditActive() ? (it.activeEditState || 'normal') : 'normal';
            setItemVisibleState(itemDomEls[idx], initSt);
        });
        if (checkBtn) {
            checkBtn.classList.remove('hidden');
            checkBtn.style.display = '';
        }
        setCheckBtnActive(false);
    }

    if (checkBtn) {
        checkBtn.onclick = (e) => {
            if (e) e.stopPropagation();
            evaluateAnswers();
        };
    }

    updateCheckButtonState();

    const ddApi = {
        activityType: 'multi-select',
        toggleItemSelection,
        updateCheckButtonState,
        evaluateAnswers,
        resetActivity,
        clearZoneHovers: function() {}
    };
    safeArea._ddApi = ddApi;
    const hostCanvas = canvas.closest('#admin-preview-canvas, #slide-canvas') || canvas;
    if (hostCanvas) hostCanvas._ddApi = ddApi;
}`;
        },

        generateAndLoadMultiSelect: function () {
            if (typeof AdminCore === 'undefined') return;
            const cfg = this.multiSelectConfig;
            const count = Math.max(2, Math.min(12, parseInt(cfg.count, 10) || 6));
            const slideId = AdminCore.ensureUniqueSlideId('etkinlik-coklu-secim');
            const slideData = this.buildMultiSelectSlideData(count, cfg.layout, cfg.instruction);
            const initFnStr = this.buildMultiSelectInitFunctionString();
            this.loadGeneratedSlideIntoStudio(slideId, cfg.title || 'Çoklu Seçim Etkinliği', slideData, initFnStr, 'multiSelectItems.0');
        },

        loadGeneratedSlideIntoStudio: function (slideId, titleText, slideData, initFnStr, firstSelectPath) {
            const fullCode = `<template id="tpl-${slideId}">
    <div id="slayt-safe-area" class="relative w-[1750px] h-[750px] shrink-0 origin-center pointer-events-none select-none bg-transparent overflow-hidden font-gothic">
        <div id="blok-katmani" class="absolute inset-0 pointer-events-none"></div>
        <h2 id="slayt-baslik" class="pointer-events-auto font-bold text-slate-800 text-center flex items-center justify-center outline-none focus:ring-4 focus:ring-blue-300 rounded-xl px-4"></h2>
        <div id="etkilesim-alani" class="absolute inset-0 pointer-events-none"></div>
        <button id="slayt-check-btn" class="pointer-events-auto disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none focus:ring-4 focus:ring-blue-300 rounded-xl flex items-center justify-center bg-transparent" disabled></button>
    </div>
</template>
<script>
PlayerCore.registerSlide({
    id: ${JSON.stringify(slideId)},
    title: ${JSON.stringify(titleText)},
    maxAttempts: 3,
    startAudio: "",
    hideBanner: false,
    hideNav: false,
    requireAudioComplete: false,
    slideData: ${JSON.stringify(slideData, null, 8)}
}, ${initFnStr});
<\/script>`;

            this.studioPreviewMode = 'design';
            if (typeof AdminVisualEditor !== 'undefined') {
                AdminVisualEditor.isEditMode = true;
            }
            const codeInput = document.getElementById('admin-code-input');
            if (codeInput) {
                codeInput.value = fullCode;
                AdminCore.analyzeCode();
                setTimeout(() => {
                    const previewCanvas = document.getElementById('admin-preview-canvas');
                    const firstEl = (previewCanvas && firstSelectPath) ? previewCanvas.querySelector(`[data-admin-path="${firstSelectPath}"]`) : null;
                    if (firstEl && typeof AdminVisualEditor !== 'undefined') {
                        AdminVisualEditor.attach(firstEl, firstSelectPath);
                        AdminCore.openSelectedObjectInspector(firstSelectPath);
                    }
                    this.renderStudioPreviewModeBar();
                }, 150);
            }
        },

        isBuilderSlideData: function (sData) {
            if (!sData || typeof sData !== 'object') return false;
            return Boolean(
                (Array.isArray(sData.dragItems) && Array.isArray(sData.dropZones)) ||
                Array.isArray(sData.textInputs) ||
                Array.isArray(sData.questions) ||
                Array.isArray(sData.tfStatements) ||
                Array.isArray(sData.multiSelectItems)
            );
        },

        renderStudioPreviewModeBar: function () {
            const previewCanvas = document.getElementById('admin-preview-canvas');
            if (!previewCanvas || !AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            const sData = AdminCore.parsedData.slideData;
            if (!this.isBuilderSlideData(sData)) {
                const oldBar = document.getElementById('agy-dd-studio-bar');
                if (oldBar) oldBar.remove();
                if (typeof AdminVisualEditor !== 'undefined') AdminVisualEditor.isEditMode = true;
                return;
            }

            const stageContainer = previewCanvas.parentElement?.parentElement;
            if (!stageContainer) return;

            let bar = document.getElementById('agy-dd-studio-bar');
            if (!bar) {
                bar = document.createElement('div');
                bar.id = 'agy-dd-studio-bar';
                bar.className = 'absolute top-3 left-1/2 -translate-x-1/2 z-[65] flex flex-wrap items-center justify-center gap-1.5 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg border border-slate-700 text-white';
                stageContainer.appendChild(bar);
            }

            const isTest = this.studioPreviewMode === 'test';
            let mcQuestionTabsHtml = '';
            if (Array.isArray(sData.questions)) {
                const activeQ = Math.max(0, Math.min(sData.questions.length - 1, parseInt(sData.activeQuestionIndex, 10) || 0));
                mcQuestionTabsHtml = `
                    <div class="flex items-center gap-1 pl-2 border-l border-slate-700">
                        ${sData.questions.map((q, qIdx) => `
                            <button type="button" onclick="ActivityStudioBuilder.switchActiveMcQuestion(${qIdx})" class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition cursor-pointer ${activeQ === qIdx ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                                ${qIdx + 1}. Soru
                            </button>
                        `).join('')}
                        <button type="button" onclick="ActivityStudioBuilder.addNewMcQuestion()" class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer" title="Peş Peşe Yeni Soru Ekle">
                            + Soru Ekle
                        </button>
                    </div>
                `;
            }

            bar.innerHTML = `
                <button type="button" onclick="ActivityStudioBuilder.setStudioPreviewMode('design')" class="px-3 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1.5 ${!isTest ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}">
                    <i class="fa-solid fa-up-down-left-right"></i>
                    <span>Düzenleme Modu</span>
                </button>
                <button type="button" onclick="ActivityStudioBuilder.setStudioPreviewMode('test')" class="px-3 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1.5 ${isTest ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'}">
                    <i class="fa-solid fa-gamepad"></i>
                    <span>Salt Öğrenci Test Modu</span>
                </button>
                <button type="button" onclick="AdminCore.updatePreview()" class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-amber-300 transition cursor-pointer flex items-center gap-1" title="Etkinliği Sıfırla">
                    <i class="fa-solid fa-rotate-right"></i>
                    <span>Sıfırla</span>
                </button>
                ${mcQuestionTabsHtml}
            `;
        },

        setStudioPreviewMode: function (mode) {
            this.studioPreviewMode = mode === 'test' ? 'test' : 'design';
            if (typeof AdminVisualEditor !== 'undefined') {
                if (this.studioPreviewMode === 'test') {
                    AdminVisualEditor.isEditMode = false;
                    AdminVisualEditor.hide();
                } else {
                    AdminVisualEditor.isEditMode = true;
                }
            }
            if (typeof AdminCore !== 'undefined' && AdminCore.parsedData) {
                AdminCore.updatePreview();
            }
            this.renderStudioPreviewModeBar();
        },

        // Seçili nesnenin aktif div'ini (normal | correct | wrong) değiştirir
        switchDragItemEditState: function (itemIndex, stateKey) {
            if (!AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            const sData = AdminCore.parsedData.slideData;
            if (!Array.isArray(sData.dragItems) || !sData.dragItems[itemIndex]) return;

            const item = sData.dragItems[itemIndex];
            const validKey = (stateKey === 'correct' || stateKey === 'wrong') ? stateKey : 'normal';
            item.activeEditState = validKey;

            AdminCore.ensureLayerSyncInScript();
            AdminCore.updatePreview();
            AdminCore.openSelectedObjectInspector(`dragItems.${itemIndex}`);
        },

        copyNormalDivToOtherStates: function (itemIndex) {
            if (!AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            const sData = AdminCore.parsedData.slideData;
            if (!Array.isArray(sData.dragItems) || !sData.dragItems[itemIndex]) return;

            AdminCore.pushHistory();
            const item = sData.dragItems[itemIndex];
            if (!item.states || !item.states.normal) return;
            const norm = item.states.normal;

            ['correct', 'wrong'].forEach(k => {
                if (!item.states[k]) item.states[k] = {};
                item.states[k].text = norm.text || '';
                item.states[k].arabicText = norm.arabicText || '';
                item.states[k].imageUrl = norm.imageUrl || '';
                if (norm.imagePosition) item.states[k].imagePosition = norm.imagePosition;
                if (norm.textOffsetX !== undefined) item.states[k].textOffsetX = norm.textOffsetX;
                if (norm.textOffsetY !== undefined) item.states[k].textOffsetY = norm.textOffsetY;
                if (norm.textSize) item.states[k].textSize = norm.textSize;
                if (norm.arabicSize) item.states[k].arabicSize = norm.arabicSize;
            });

            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            AdminCore.updatePreview();
        },

        addNewDragDropPair: function () {
            if (!AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            const sData = AdminCore.parsedData.slideData;
            if (!Array.isArray(sData.dragItems)) sData.dragItems = [];
            if (!Array.isArray(sData.dropZones)) sData.dropZones = [];

            AdminCore.pushHistory();
            const nextIdx = sData.dragItems.length + 1;
            const newDragId = `drag-${nextIdx}`;
            const newZoneId = `zone-${nextIdx}`;

            sData.dragItems.push({
                id: newDragId,
                type: 'dragItem',
                targetZoneId: newZoneId,
                activeEditState: 'normal',
                offsetX: -200,
                offsetY: -80,
                homeX: -200,
                homeY: -80,
                width: 220,
                height: 100,
                zIndex: 25,
                borderRadius: 18,
                textSize: 20,
                arabicSize: 30,
                a11yText: `Sürüklenecek Nesne ${nextIdx}`,
                tabIndex: nextIdx + 1,
                isHidden: false,
                states: {
                    normal: { text: '', arabicText: '', imageUrl: '', bgColor: '#dbeafe', borderColor: '#2563eb', textColor: '#1e3a8a' },
                    correct: { text: '', arabicText: '', imageUrl: '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                    wrong: { text: '', arabicText: '', imageUrl: '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
                }
            });

            sData.dropZones.push({
                id: newZoneId,
                type: 'dropZone',
                text: '',
                arabicText: '',
                imageUrl: '',
                offsetX: 200,
                offsetY: 110,
                width: 232,
                height: 110,
                zIndex: 10,
                borderRadius: 18,
                bgColor: '#fef3c7',
                borderColor: '#d97706',
                textColor: '#92400e',
                textSize: 20,
                arabicSize: 30,
                a11yText: `Bırakma Alanı ${nextIdx}`,
                tabIndex: nextIdx * 2 + 1,
                isHidden: false
            });

            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            AdminCore.updatePreview();
        },

        renderTextWrapInspectorUI: function (textWrapPath, container) {
            if (!container || !textWrapPath) return;
            const stPath = textWrapPath.replace(/\.textWrap$/, '');
            const sData = AdminCore.parsedData?.slideData;
            if (!sData) return;
            const stObj = AdminCore.getDeepValue(sData, stPath);
            if (!stObj) return;

            const itemPath = stPath.replace(/\.states\.[^.]+$/, '');
            const stateMatch = stPath.match(/\.states\.([^.]+)$/);
            const stateKey = stateMatch ? stateMatch[1] : '';
            const stateNameMap = { normal: '1. Normal Div', selected: '2. Seçili Div', correct: 'Doğru Div', wrong: 'Yanlış Div' };
            const stateTitle = stateKey ? (stateNameMap[stateKey] || stateKey) : 'Div';

            const curPos = String(stObj.imagePosition || stObj.textPosition || 'top').toLowerCase();
            const curX = parseFloat(stObj.textOffsetX) || 0;
            const curY = parseFloat(stObj.textOffsetY) || 0;

            const posBtns = [
                { pos: 'top', label: 'Üst', icon: 'fa-arrow-up', desc: 'Görsel Üstte, Yazı Altta' },
                { pos: 'bottom', label: 'Alt', icon: 'fa-arrow-down', desc: 'Görsel Altta, Yazı Üstte' },
                { pos: 'left', label: 'Sol', icon: 'fa-arrow-left', desc: 'Görsel Solda, Yazı Sağda' },
                { pos: 'right', label: 'Sağ', icon: 'fa-arrow-right', desc: 'Görsel Sağda, Yazı Solda' },
                { pos: 'overlay', label: 'Üzerine', icon: 'fa-clone', desc: 'Yazı Görselin Üzerinde' }
            ];

            container.innerHTML = `
                <div class="col-span-full bg-gradient-to-br from-indigo-50 via-white to-blue-50/60 border-2 border-indigo-300 rounded-2xl p-4 shadow-sm space-y-4">
                    <!-- Üst Bar: Geri Dönüş ve Başlık -->
                    <div class="flex items-center justify-between border-b border-indigo-200/80 pb-3 gap-2">
                        <div class="flex items-center gap-2">
                            <span class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                <i class="fa-solid fa-font"></i>
                            </span>
                            <div>
                                <h3 class="text-xs font-black text-indigo-950 uppercase tracking-wide">Buton İçi Metin Ayarları</h3>
                                <p class="text-[10px] text-indigo-700 font-semibold">${stateTitle} Metni Seçili</p>
                            </div>
                        </div>
                        <button type="button" onclick="AdminCore.openSelectedObjectInspector('${itemPath}')" class="text-[11px] font-bold text-indigo-800 bg-white hover:bg-indigo-100 border border-indigo-300 px-3 py-1.5 rounded-xl cursor-pointer transition shadow-2xs flex items-center gap-1.5" title="Üst kutunun genel ayarlarına dön">
                            <i class="fa-solid fa-arrow-left text-[10px]"></i><span>Üst Buton Ayarları</span>
                        </button>
                    </div>

                    <!-- Görsel ve Metin Yerleşim Düzeni (5 Preset) -->
                    <div>
                        <label class="block text-[11px] font-extrabold text-slate-700 uppercase mb-1.5">
                            <i class="fa-solid fa-table-cells-large mr-1 text-indigo-600"></i>Görselin Konumu (Yazıya Göre):
                        </label>
                        <div class="grid grid-cols-5 gap-1.5">
                            ${posBtns.map(b => `
                                <button type="button" onclick="ActivityStudioBuilder.setImagePosition('${stPath}', '${b.pos}', '${textWrapPath}')" class="text-[11px] font-bold py-2 px-1 rounded-xl border-2 cursor-pointer transition flex flex-col items-center justify-center gap-1 ${curPos === b.pos ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 scale-102' : 'bg-white hover:bg-indigo-50 text-slate-700 border-indigo-200'}" title="${b.desc}">
                                    <i class="fa-solid ${b.icon} text-xs"></i>
                                    <span>${b.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Koordinatlar: X ve Y Kutuları + (0,0) Sıfırla -->
                    <div class="bg-white border-2 border-indigo-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-[11px] font-extrabold text-indigo-950 uppercase flex items-center gap-1.5">
                                <i class="fa-solid fa-arrows-up-down-left-right text-indigo-600"></i>Metin Koordinatları (px)
                            </span>
                            <button type="button" onclick="ActivityStudioBuilder.resetTextOffset('${stPath}', '${textWrapPath}')" class="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 px-2.5 py-1 rounded-lg cursor-pointer transition flex items-center gap-1" title="Metin koordinatlarını merkeze (0, 0) sıfırlar">
                                <i class="fa-solid fa-arrows-rotate text-[9px]"></i><span>(0,0) Sıfırla</span>
                            </button>
                        </div>

                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                                    <span>Metin X (Yatay)</span>
                                    <span class="font-mono font-bold text-indigo-700">${curX}px</span>
                                </label>
                                <input type="number" data-slidepath="${stPath}.textOffsetX" value="${curX}" step="1" oninput="ActivityStudioBuilder.setTextOffset('${stPath}', this.value, null)" class="w-full text-xs font-mono font-bold border-2 border-indigo-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none text-center">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                                    <span>Metin Y (Dikey)</span>
                                    <span class="font-mono font-bold text-indigo-700">${curY}px</span>
                                </label>
                                <input type="number" data-slidepath="${stPath}.textOffsetY" value="${curY}" step="1" oninput="ActivityStudioBuilder.setTextOffset('${stPath}', null, this.value)" class="w-full text-xs font-mono font-bold border-2 border-indigo-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-300 outline-none text-center">
                            </div>
                        </div>
                    </div>

                    <!-- Bilgilendirme Notu -->
                    <div class="bg-indigo-100/70 border border-indigo-200 rounded-xl px-3 py-2.5 text-[11px] text-indigo-900 font-semibold flex items-center gap-2">
                        <i class="fa-solid fa-hand-pointer text-indigo-600 text-sm shrink-0"></i>
                        <span>Sahnede bu metni fare ile tutarak buton içinde istediğiniz herhangi bir noktaya serbestçe sürükleyebilirsiniz.</span>
                    </div>
                </div>
            `;
        },

        setImagePosition: function (stPath, pos, textWrapPath) {
            if (!AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            AdminCore.pushHistory();
            AdminCore.setDeepValue(AdminCore.parsedData.slideData, `${stPath}.imagePosition`, pos);
            AdminCore.ensureLayerSyncInScript();
            AdminCore.updatePreview();
            if (textWrapPath) {
                AdminCore.openSelectedObjectInspector(textWrapPath);
            } else {
                const basePath = stPath.replace(/\.states\.[^.]+$/, '');
                AdminCore.openSelectedObjectInspector(basePath || stPath);
            }
        },

        setTextOffset: function (stPath, ox, oy) {
            if (!AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            const stObj = AdminCore.getDeepValue(AdminCore.parsedData.slideData, stPath);
            if (!stObj) return;
            if (ox !== null && ox !== undefined) stObj.textOffsetX = parseFloat(ox) || 0;
            if (oy !== null && oy !== undefined) stObj.textOffsetY = parseFloat(oy) || 0;
            AdminCore.ensureLayerSyncInScript();
            AdminCore.updatePreview();
        },

        resetTextOffset: function (stPath, textWrapPath) {
            if (!AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            AdminCore.pushHistory();
            const stObj = AdminCore.getDeepValue(AdminCore.parsedData.slideData, stPath);
            if (!stObj) return;
            stObj.textOffsetX = 0;
            stObj.textOffsetY = 0;
            AdminCore.ensureLayerSyncInScript();
            AdminCore.updatePreview();
            if (textWrapPath) {
                AdminCore.openSelectedObjectInspector(textWrapPath);
            } else {
                const basePath = stPath.replace(/\.states\.[^.]+$/, '');
                AdminCore.openSelectedObjectInspector(basePath || stPath);
            }
        },

        toggleColorTransparent: function (slidePath, inputId) {
            if (!AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            AdminCore.pushHistory();
            const currentVal = AdminCore.getDeepValue(AdminCore.parsedData.slideData, slidePath);
            const isCurrentlyTrans = (currentVal === 'transparent');
            const colorInp = document.getElementById(inputId);
            const fallbackHex = (colorInp && /^#[0-9a-fA-F]{6}$/i.test(colorInp.value)) ? colorInp.value : '#ffffff';
            const newVal = isCurrentlyTrans ? fallbackHex : 'transparent';
            AdminCore.setDeepValue(AdminCore.parsedData.slideData, slidePath, newVal);
            AdminCore.ensureLayerSyncInScript();
            AdminCore.updatePreview();
            const basePath = slidePath.replace(/\.states\.[^.]+.*$/, '');
            AdminCore.openSelectedObjectInspector(basePath || slidePath);
        },

        onColorPickerChange: function (slidePath, hexVal, btnId) {
            if (!AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            AdminCore.pushHistory();
            AdminCore.setDeepValue(AdminCore.parsedData.slideData, slidePath, hexVal);
            AdminCore.ensureLayerSyncInScript();
            AdminCore.updatePreview();
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.className = 'text-[9px] px-1.5 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 font-bold';
                btn.innerHTML = '<i class="fa-solid fa-border-none text-slate-400"></i><span>Şeffaf</span>';
            }
        },

        renderDragItemInspectorUI: function (itemIndex, container) {
            const sData = AdminCore.parsedData?.slideData;
            if (!sData || !Array.isArray(sData.dragItems) || !sData.dragItems[itemIndex]) return;

            const item = sData.dragItems[itemIndex];
            const dropZones = Array.isArray(sData.dropZones) ? sData.dropZones : [];
            if (!item.states) {
                item.states = {
                    normal: { text: item.text || '', arabicText: item.arabicText || '', imageUrl: item.imageUrl || '', bgColor: '#dbeafe', borderColor: '#2563eb', textColor: '#1e3a8a' },
                    correct: { text: item.text || '', arabicText: item.arabicText || '', imageUrl: item.imageUrl || '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                    wrong: { text: item.text || '', arabicText: item.arabicText || '', imageUrl: item.imageUrl || '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
                };
            }
            const activeKey = (item.activeEditState === 'correct' || item.activeEditState === 'wrong') ? item.activeEditState : 'normal';
            const stPath = `dragItems.${itemIndex}.states.${activeKey}`;
            const stObj = item.states[activeKey];
            const isBgTrans = (stObj.bgColor === 'transparent');
            const safeBgHex = /^#[0-9a-fA-F]{6}$/i.test(stObj.bgColor || '') ? stObj.bgColor : '#dbeafe';
            const fileInputId = `agy-dd-state-file-${itemIndex}-${activeKey}`;
            const urlInputId = `insp-dragItems_${itemIndex}_states_${activeKey}_imageUrl`;

            const stateTabs = [
                { key: 'normal', title: '1. Normal Div', badge: 'Mavi (Başlangıç)', activeCls: 'bg-blue-600 text-white border-blue-600 shadow', idleCls: 'bg-blue-50/70 text-blue-800 border-blue-200 hover:border-blue-400' },
                { key: 'correct', title: '2. Doğru Div', badge: 'Yeşil (Doğru)', activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow', idleCls: 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:border-emerald-400' },
                { key: 'wrong', title: '3. Yanlış Div', badge: 'Kırmızı (Yanlış)', activeCls: 'bg-red-600 text-white border-red-600 shadow', idleCls: 'bg-red-50/70 text-red-800 border-red-200 hover:border-red-400' }
            ];

            const wrapper = document.createElement('div');
            wrapper.className = 'col-span-full bg-gradient-to-br from-slate-50 to-indigo-50/40 border-2 border-indigo-200 rounded-2xl p-3.5 mb-2 space-y-3';
            wrapper.innerHTML = `
                <div class="flex items-center justify-between border-b border-indigo-200/70 pb-2">
                    <div class="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <i class="fa-solid fa-layer-group text-indigo-600"></i>
                        <span>${itemIndex + 1}. Sürüklenecek Nesne — 3 Div Düzenleyici</span>
                    </div>
                    <button type="button" onclick="ActivityStudioBuilder.addNewDragDropPair()" class="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1">
                        <i class="fa-solid fa-plus"></i><span>Yeni Nesne & Alan Ekle</span>
                    </button>
                </div>

                <!-- 3 Div Seçici Sekmeler -->
                <div>
                    <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5">Düzenlemek İstediğiniz Div'i Seçin (Sahnede Anında Gösterilir):</label>
                    <div class="grid grid-cols-3 gap-1.5">
                        ${stateTabs.map(t => {
                            const hasContent = Boolean(item.states[t.key]?.imageUrl || item.states[t.key]?.text || item.states[t.key]?.arabicText);
                            return `
                            <button type="button" onclick="ActivityStudioBuilder.switchDragItemEditState(${itemIndex}, '${t.key}')" class="p-2 rounded-xl border-2 text-left transition cursor-pointer ${activeKey === t.key ? t.activeCls : t.idleCls}">
                                <div class="flex items-center justify-between">
                                    <span class="text-[11px] font-extrabold">${t.title}</span>
                                    <span class="w-2.5 h-2.5 rounded-full ${hasContent ? 'bg-amber-400 ring-2 ring-white' : 'bg-slate-300'}" title="${hasContent ? 'İçerik Eklendi' : 'Boş Div'}"></span>
                                </div>
                                <div class="text-[9px] opacity-90 font-semibold mt-0.5">${t.badge}</div>
                            </button>`;
                        }).join('')}
                    </div>
                </div>

                <!-- Seçili Div İçin Görsel ve Metin Ekleme Alanı -->
                <div class="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-extrabold text-slate-800 uppercase">
                            <i class="fa-solid fa-pen-to-square mr-1 text-indigo-600"></i>${activeKey === 'normal' ? '1. Normal Div' : (activeKey === 'correct' ? '2. Doğru Div' : '3. Yanlış Div')} İçeriği
                        </span>
                        <button type="button" onclick="ActivityStudioBuilder.copyNormalDivToOtherStates(${itemIndex})" class="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition cursor-pointer" title="1. Normal Div içindeki metin ve görseli 2. Doğru ve 3. Yanlış divlerine kopyalar">
                            <i class="fa-regular fa-copy mr-1"></i>Normal'i Doğru/Yanlış'a Kopyala
                        </button>
                    </div>

                    <!-- Görsel Ekleme -->
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Div Görseli (İsteğe Bağlı)</label>
                        <div class="flex items-center gap-1.5">
                            <input type="text" id="${urlInputId}" data-slidepath="${stPath}.imageUrl" data-valtype="string" value="${(stObj.imageUrl || '').replace(/"/g, '&quot;')}" placeholder="Görsel URL veya Base64..." class="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                            <label class="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition shrink-0 flex items-center gap-1" title="Bilgisayardan Görsel Yükle">
                                <i class="fa-solid fa-upload"></i><span>Görsel Seç</span>
                                <input type="file" id="${fileInputId}" accept="image/*" class="hidden">
                            </label>
                            <button type="button" onclick="AdminCore.openScreenshotCropper('${urlInputId}')" class="bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition shrink-0 flex items-center gap-1" title="Ekran Alıntısından Kırp">
                                <i class="fa-solid fa-crop-simple"></i><span>Kırp</span>
                            </button>
                            ${stObj.imageUrl ? `
                            <button type="button" id="${urlInputId}-clear" class="bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold px-2 py-1.5 rounded-lg cursor-pointer transition shrink-0" title="Görseli Kaldır">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>` : ''}
                        </div>
                    </div>

                    <!-- Türkçe ve Arapça Metin Ekleme -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Div Metni (Türkçe)</label>
                            <input type="text" id="agy-dd-txt-${itemIndex}-${activeKey}" data-slidepath="${stPath}.text" data-valtype="string" value="${(stObj.text || '').replace(/"/g, '&quot;')}" placeholder="Metin yazın..." class="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Div Metni (Arapça)</label>
                            <input type="text" dir="rtl" id="agy-dd-artxt-${itemIndex}-${activeKey}" data-slidepath="${stPath}.arabicText" data-valtype="string" value="${(stObj.arabicText || '').replace(/"/g, '&quot;')}" placeholder="Arapça metin..." class="w-full text-sm font-arabic border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                        </div>
                    </div>

                    <div class="text-[9px] text-slate-500 italic bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                        <i class="fa-solid fa-hand-pointer text-indigo-500"></i>
                        <span>Metin yerleşimini ve koordinatlarını değiştirmek için sahnedeki metne doğrudan tıklayıp sürükleyebilirsiniz.</span>
                    </div>

                    <!-- Div Renkleri -->
                    <div class="grid grid-cols-3 gap-2 pt-1">
                        <div>
                            <div class="flex items-center justify-between mb-0.5">
                                <label class="block text-[9px] font-bold text-slate-400 uppercase">Arka Plan</label>
                                <button type="button" onclick="ActivityStudioBuilder.toggleColorTransparent('${stPath}.bgColor', 'agy-dd-bg-${itemIndex}-${activeKey}')" id="agy-btn-trans-${itemIndex}-${activeKey}" class="text-[9px] px-1.5 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${isBgTrans ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-2xs' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 font-bold'}" title="Arka plan rengini şeffaf yap veya rengi geri yükle">
                                    <i class="fa-solid ${isBgTrans ? 'fa-check text-amber-600' : 'fa-border-none text-slate-400'}"></i>
                                    <span>${isBgTrans ? 'Şeffaf (Aktif)' : 'Şeffaf'}</span>
                                </button>
                            </div>
                            <input type="color" id="agy-dd-bg-${itemIndex}-${activeKey}" data-slidepath="${stPath}.bgColor" data-valtype="string" value="${safeBgHex}" class="w-full h-7 rounded cursor-pointer border border-slate-200" onchange="ActivityStudioBuilder.onColorPickerChange('${stPath}.bgColor', this.value, 'agy-btn-trans-${itemIndex}-${activeKey}')">
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Kenarlık Rengi</label>
                            <input type="color" id="agy-dd-bd-${itemIndex}-${activeKey}" data-slidepath="${stPath}.borderColor" data-valtype="string" value="${stObj.borderColor || '#2563eb'}" class="w-full h-7 rounded cursor-pointer border border-slate-200">
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Yazı Rengi</label>
                            <input type="color" id="agy-dd-tc-${itemIndex}-${activeKey}" data-slidepath="${stPath}.textColor" data-valtype="string" value="${stObj.textColor || '#1e3a8a'}" class="w-full h-7 rounded cursor-pointer border border-slate-200">
                        </div>
                    </div>
                </div>

                <!-- Doğru Eşleşeceği Hedef Bırakma Alanı Seçimi -->
                <div class="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 rounded-xl px-3 py-2">
                    <label class="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1.5">
                        <i class="fa-solid fa-bullseye text-emerald-600"></i>
                        <span>Doğru Bırakma Alanı (Hedef Eşleşme):</span>
                    </label>
                    <select id="agy-dd-targetzone-${itemIndex}" data-slidepath="dragItems.${itemIndex}.targetZoneId" data-valtype="string" class="text-xs font-extrabold text-emerald-900 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 outline-none cursor-pointer">
                        ${dropZones.map((z, zIdx) => `
                            <option value="${z.id}" ${item.targetZoneId === z.id ? 'selected' : ''}>${zIdx + 1}. Bırakma Alanı (${z.id})${z.text ? ' - ' + z.text : ''}</option>
                        `).join('')}
                    </select>
                </div>
            `;

            container.prepend(wrapper);

            const fileInp = wrapper.querySelector(`#${fileInputId}`);
            const clearBtn = wrapper.querySelector(`#${urlInputId}-clear`);
            if (fileInp) {
                fileInp.addEventListener('change', () => AdminCore.handleFileSelect(fileInp, urlInputId));
            }
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    AdminCore.pushHistory();
                    AdminCore.setDeepValue(AdminCore.parsedData.slideData, `${stPath}.imageUrl`, '');
                    AdminCore.ensureLayerSyncInScript();
                    AdminCore.updatePreview();
                    AdminCore.openSelectedObjectInspector(`dragItems.${itemIndex}`);
                });
            }
        },

        renderDropZoneInspectorUI: function (zoneIndex, container) {
            const sData = AdminCore.parsedData?.slideData;
            if (!sData || !Array.isArray(sData.dropZones) || !sData.dropZones[zoneIndex]) return;

            const zone = sData.dropZones[zoneIndex];
            const matchingItems = (sData.dragItems || [])
                .map((it, idx) => ({ it, idx }))
                .filter(pair => pair.it.targetZoneId === zone.id);

            const infoBanner = document.createElement('div');
            infoBanner.className = 'col-span-full bg-amber-50 border-2 border-amber-200 rounded-xl p-3 mb-2 flex items-center justify-between gap-2';
            infoBanner.innerHTML = `
                <div class="text-xs font-bold text-amber-950">
                    <i class="fa-solid fa-inbox text-amber-600 mr-1.5"></i>
                    <span><b>${zoneIndex + 1}. Bırakma Alanı (${zone.id})</b> — Aşağıdaki alanlardan bu kutunun metnini, görselini, rengini ve boyutlarını düzenleyebilirsiniz.</span>
                    <div class="text-[10px] text-amber-800 mt-0.5">
                        Bu alana ait doğru nesne: <b>${matchingItems.length > 0 ? matchingItems.map(m => (m.idx + 1) + '. Nesne (' + m.it.id + ')').join(', ') : 'Henüz atanmadı'}</b>
                    </div>
                </div>
                <button type="button" onclick="ActivityStudioBuilder.addNewDragDropPair()" class="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-lg transition cursor-pointer shrink-0">
                    <i class="fa-solid fa-plus mr-1"></i>Yeni Ekle
                </button>
            `;
            container.prepend(infoBanner);
        },

        // =========================================================================
        // DİĞER 4 ETKİNLİK TİPİ İÇİN STÜDYO DENETÇİ (INSPECTOR) VE YARDIMCI METOTLAR
        // =========================================================================
        switchMultiStateEditState: function (basePath, stateKey) {
            if (!AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            const item = AdminCore.getDeepValue(AdminCore.parsedData.slideData, basePath);
            if (!item) return;
            item.activeEditState = stateKey;
            AdminCore.ensureLayerSyncInScript();
            AdminCore.updatePreview();
            AdminCore.openSelectedObjectInspector(basePath);
        },

        copyMultiStateNormalToOthers: function (basePath, stateKeys) {
            if (!AdminCore.parsedData || !AdminCore.parsedData.slideData) return;
            const item = AdminCore.getDeepValue(AdminCore.parsedData.slideData, basePath);
            if (!item || !item.states || !item.states.normal) return;
            AdminCore.pushHistory();
            const norm = item.states.normal;
            (stateKeys || ['selected', 'correct', 'wrong']).forEach(k => {
                if (k === 'normal') return;
                if (!item.states[k]) item.states[k] = {};
                item.states[k].text = norm.text || '';
                item.states[k].arabicText = norm.arabicText || '';
                item.states[k].imageUrl = norm.imageUrl || '';
                if (norm.imagePosition) item.states[k].imagePosition = norm.imagePosition;
                if (norm.textOffsetX !== undefined) item.states[k].textOffsetX = norm.textOffsetX;
                if (norm.textOffsetY !== undefined) item.states[k].textOffsetY = norm.textOffsetY;
            });
            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            AdminCore.updatePreview();
        },

        renderGenericMultiStateInspectorUI: function (basePath, item, titleText, isFourState, extraHeaderActionHtml, extraFooterHtml, container) {
            if (!item) return;
            const stateKeys = isFourState ? ['normal', 'selected', 'correct', 'wrong'] : ['normal', 'correct', 'wrong'];
            if (!item.states) item.states = {};
            const defaults = {
                normal: { bgColor: '#ffffff', borderColor: '#94a3b8', textColor: '#1e293b' },
                selected: { bgColor: '#dbeafe', borderColor: '#2563eb', textColor: '#1e3a8a' },
                correct: { bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                wrong: { bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
            };
            stateKeys.forEach(k => {
                if (!item.states[k]) {
                    item.states[k] = { text: '', arabicText: '', imageUrl: '', ...defaults[k] };
                }
            });

            const activeKey = stateKeys.includes(item.activeEditState) ? item.activeEditState : 'normal';
            const stPath = `${basePath}.states.${activeKey}`;
            const stObj = item.states[activeKey];
            const isGenBgTrans = (stObj.bgColor === 'transparent');
            const safeGenBgHex = /^#[0-9a-fA-F]{6}$/i.test(stObj.bgColor || '') ? stObj.bgColor : '#ffffff';
            const safeSlug = basePath.replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileInputId = `agy-ms-file-${safeSlug}-${activeKey}`;
            const urlInputId = `insp-${safeSlug}_states_${activeKey}_imageUrl`;
            const genBgInputId = `agy-ms-bg-${safeSlug}-${activeKey}`;
            const genBgTransBtnId = `agy-ms-trans-${safeSlug}-${activeKey}`;

            const allTabs = [
                { key: 'normal', title: '1. Normal Div', badge: 'Başlangıç', activeCls: 'bg-slate-700 text-white border-slate-700 shadow', idleCls: 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400' },
                { key: 'selected', title: '2. Seçili Div', badge: 'Mavi (Seçili)', activeCls: 'bg-blue-600 text-white border-blue-600 shadow', idleCls: 'bg-blue-50/70 text-blue-800 border-blue-200 hover:border-blue-400' },
                { key: 'correct', title: isFourState ? '3. Doğru Div' : '2. Doğru Div', badge: 'Yeşil (Doğru)', activeCls: 'bg-emerald-600 text-white border-emerald-600 shadow', idleCls: 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:border-emerald-400' },
                { key: 'wrong', title: isFourState ? '4. Yanlış Div' : '3. Yanlış Div', badge: 'Kırmızı (Yanlış)', activeCls: 'bg-red-600 text-white border-red-600 shadow', idleCls: 'bg-red-50/70 text-red-800 border-red-200 hover:border-red-400' }
            ].filter(t => stateKeys.includes(t.key));

            const wrapper = document.createElement('div');
            wrapper.className = 'col-span-full bg-gradient-to-br from-slate-50 to-indigo-50/40 border-2 border-indigo-200 rounded-2xl p-3.5 mb-2 space-y-3';
            wrapper.innerHTML = `
                <div class="flex items-center justify-between border-b border-indigo-200/70 pb-2 gap-2">
                    <div class="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                        <i class="fa-solid fa-layer-group text-indigo-600"></i>
                        <span>${titleText}</span>
                    </div>
                    ${extraHeaderActionHtml || ''}
                </div>

                <div>
                    <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5">Düzenlemek İstediğiniz Durum Div'ini Seçin (Sahnede Anında Gösterilir):</label>
                    <div class="grid ${isFourState ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-1.5">
                        ${allTabs.map(t => {
                            const hasContent = Boolean(item.states[t.key]?.imageUrl || item.states[t.key]?.text || item.states[t.key]?.arabicText);
                            return `
                            <button type="button" onclick="ActivityStudioBuilder.switchMultiStateEditState('${basePath}', '${t.key}')" class="p-2 rounded-xl border-2 text-left transition cursor-pointer ${activeKey === t.key ? t.activeCls : t.idleCls}">
                                <div class="flex items-center justify-between">
                                    <span class="text-[11px] font-extrabold">${t.title}</span>
                                    <span class="w-2.5 h-2.5 rounded-full ${hasContent ? 'bg-amber-400 ring-2 ring-white' : 'bg-slate-300'}"></span>
                                </div>
                                <div class="text-[9px] opacity-90 font-semibold mt-0.5">${t.badge}</div>
                            </button>`;
                        }).join('')}
                    </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-extrabold text-slate-800 uppercase">
                            <i class="fa-solid fa-pen-to-square mr-1 text-indigo-600"></i>Seçili Durum (${activeKey}) İçeriği
                        </span>
                        <button type="button" onclick="ActivityStudioBuilder.copyMultiStateNormalToOthers('${basePath}', ${JSON.stringify(stateKeys).replace(/"/g, "'")})" class="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition cursor-pointer">
                            <i class="fa-regular fa-copy mr-1"></i>1. Normal İçeriği Diğer Durumlara Kopyala
                        </button>
                    </div>

                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Div Görseli (İsteğe Bağlı)</label>
                        <div class="flex items-center gap-1.5">
                            <input type="text" id="${urlInputId}" data-slidepath="${stPath}.imageUrl" data-valtype="string" value="${(stObj.imageUrl || '').replace(/"/g, '&quot;')}" placeholder="Görsel URL veya Base64..." class="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                            <label class="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition shrink-0 flex items-center gap-1">
                                <i class="fa-solid fa-upload"></i><span>Görsel Seç</span>
                                <input type="file" id="${fileInputId}" accept="image/*" class="hidden">
                            </label>
                            <button type="button" onclick="AdminCore.openScreenshotCropper('${urlInputId}')" class="bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition shrink-0 flex items-center gap-1">
                                <i class="fa-solid fa-crop-simple"></i><span>Kırp</span>
                            </button>
                            ${stObj.imageUrl ? `
                            <button type="button" id="${urlInputId}-clear" class="bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold px-2 py-1.5 rounded-lg cursor-pointer transition shrink-0">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>` : ''}
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Div Metni (Türkçe)</label>
                            <input type="text" data-slidepath="${stPath}.text" data-valtype="string" value="${(stObj.text || '').replace(/"/g, '&quot;')}" placeholder="Metin yazın..." class="w-full text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Div Metni (Arapça)</label>
                            <input type="text" dir="rtl" data-slidepath="${stPath}.arabicText" data-valtype="string" value="${(stObj.arabicText || '').replace(/"/g, '&quot;')}" placeholder="Arapça metin..." class="w-full text-sm font-arabic border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-300">
                        </div>
                    </div>

                    <div class="text-[9px] text-slate-500 italic bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                        <i class="fa-solid fa-hand-pointer text-indigo-500"></i>
                        <span>Metin yerleşimini ve koordinatlarını değiştirmek için sahnedeki metne doğrudan tıklayıp sürükleyebilirsiniz.</span>
                    </div>

                    <div class="grid grid-cols-3 gap-2 pt-1">
                        <div>
                            <div class="flex items-center justify-between mb-0.5">
                                <label class="block text-[9px] font-bold text-slate-400 uppercase">Arka Plan</label>
                                <button type="button" onclick="ActivityStudioBuilder.toggleColorTransparent('${stPath}.bgColor', '${genBgInputId}')" id="${genBgTransBtnId}" class="text-[9px] px-1.5 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${isGenBgTrans ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-2xs' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 font-bold'}" title="Arka plan rengini şeffaf yap veya rengi geri yükle">
                                    <i class="fa-solid ${isGenBgTrans ? 'fa-check text-amber-600' : 'fa-border-none text-slate-400'}"></i>
                                    <span>${isGenBgTrans ? 'Şeffaf (Aktif)' : 'Şeffaf'}</span>
                                </button>
                            </div>
                            <input type="color" id="${genBgInputId}" data-slidepath="${stPath}.bgColor" data-valtype="string" value="${safeGenBgHex}" class="w-full h-7 rounded cursor-pointer border border-slate-200" onchange="ActivityStudioBuilder.onColorPickerChange('${stPath}.bgColor', this.value, '${genBgTransBtnId}')">
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Kenarlık Rengi</label>
                            <input type="color" data-slidepath="${stPath}.borderColor" data-valtype="string" value="${stObj.borderColor || '#2563eb'}" class="w-full h-7 rounded cursor-pointer border border-slate-200">
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Yazı Rengi</label>
                            <input type="color" data-slidepath="${stPath}.textColor" data-valtype="string" value="${stObj.textColor || '#1e3a8a'}" class="w-full h-7 rounded cursor-pointer border border-slate-200">
                        </div>
                    </div>
                </div>

                ${extraFooterHtml || ''}
            `;

            container.prepend(wrapper);

            const fileInp = wrapper.querySelector(`#${fileInputId}`);
            const clearBtn = wrapper.querySelector(`#${urlInputId}-clear`);
            if (fileInp) {
                fileInp.addEventListener('change', () => AdminCore.handleFileSelect(fileInp, urlInputId));
            }
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    AdminCore.pushHistory();
                    AdminCore.setDeepValue(AdminCore.parsedData.slideData, `${stPath}.imageUrl`, '');
                    AdminCore.ensureLayerSyncInScript();
                    AdminCore.updatePreview();
                    AdminCore.openSelectedObjectInspector(basePath);
                });
            }
        },

        // --- 2. TİP (METİN GİRİŞİ) STÜDYO DENETÇİSİ ---
        addNewTextInputPair: function () {
            const sData = AdminCore.parsedData?.slideData;
            if (!sData) return;
            if (!Array.isArray(sData.textPromptBoxes)) sData.textPromptBoxes = [];
            if (!Array.isArray(sData.textInputs)) sData.textInputs = [];
            AdminCore.pushHistory();
            const nextIdx = sData.textInputs.length + 1;
            const lastInp = sData.textInputs[sData.textInputs.length - 1];
            const mode = lastInp?.inputMode || 'text';
            sData.textPromptBoxes.push({
                id: `prompt-${nextIdx}`,
                type: 'textPrompt',
                text: '',
                arabicText: '',
                imageUrl: '',
                offsetX: -230,
                offsetY: 0,
                width: 580,
                height: 70,
                zIndex: 18,
                borderRadius: 16,
                bgColor: '#fef3c7',
                borderColor: '#d97706',
                textColor: '#92400e',
                textSize: 20,
                arabicSize: 30,
                a11yText: `${nextIdx}. Soru / İpucu Alanı`,
                tabIndex: nextIdx * 2,
                isHidden: false
            });
            sData.textInputs.push({
                id: `input-${nextIdx}`,
                type: 'textInput',
                inputMode: mode,
                correctAnswer: `Cevap ${nextIdx}`,
                placeholder: mode === 'digit' ? '#' : (mode === 'letter' ? 'Harf...' : 'Yazınız...'),
                activeEditState: 'normal',
                offsetX: 330,
                offsetY: 0,
                width: mode === 'digit' ? 140 : 360,
                height: 70,
                zIndex: 25,
                borderRadius: 16,
                textSize: 24,
                arabicSize: 32,
                a11yText: `${nextIdx}. Metin Giriş Kutusu`,
                tabIndex: nextIdx * 2 + 1,
                isHidden: false,
                states: {
                    normal: { text: '', arabicText: '', imageUrl: '', bgColor: '#ffffff', borderColor: '#2563eb', textColor: '#1e3a8a' },
                    correct: { text: '', arabicText: '', imageUrl: '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                    wrong: { text: '', arabicText: '', imageUrl: '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
                }
            });
            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            AdminCore.updatePreview();
        },

        renderTextInputInspectorUI: function (idx, container) {
            const sData = AdminCore.parsedData?.slideData;
            if (!sData || !Array.isArray(sData.textInputs) || !sData.textInputs[idx]) return;
            const item = sData.textInputs[idx];
            const basePath = `textInputs.${idx}`;
            const headerBtn = `
                <button type="button" onclick="ActivityStudioBuilder.addNewTextInputPair()" class="text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0">
                    <i class="fa-solid fa-plus mr-1"></i>Yeni Metin Girişi Ekle
                </button>`;
            const footerHtml = `
                <div class="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 space-y-2.5">
                    <div class="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                        <i class="fa-solid fa-key text-emerald-600"></i>
                        <span>Metin Girişi Doğru Cevap & Giriş Kısıtlaması Ayarları</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                            <label class="block text-[10px] font-extrabold text-emerald-900 uppercase mb-1">Doğru İfade / Cevap (Birden fazla kabul için | koyun)</label>
                            <input type="text" data-slidepath="${basePath}.correctAnswer" data-valtype="string" value="${String(item.correctAnswer ?? '').replace(/"/g, '&quot;')}" placeholder="Örn: Elma veya 5" class="w-full text-xs font-extrabold text-emerald-950 bg-white border-2 border-emerald-400 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-extrabold text-emerald-900 uppercase mb-1">Giriş Türü (1-Tek Rakam / 2-Harf / 3-Metin)</label>
                            <select data-slidepath="${basePath}.inputMode" data-valtype="string" class="w-full text-xs font-bold text-slate-800 bg-white border-2 border-emerald-300 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer">
                                <option value="digit" ${item.inputMode === 'digit' ? 'selected' : ''}>1 - Sadece Sayı (Tek Rakamlı 0-9)</option>
                                <option value="letter" ${item.inputMode === 'letter' ? 'selected' : ''}>2 - Sadece Harf</option>
                                <option value="text" ${(!item.inputMode || item.inputMode === 'text') ? 'selected' : ''}>3 - Serbest Metin / İfade</option>
                            </select>
                        </div>
                    </div>
                </div>`;
            this.renderGenericMultiStateInspectorUI(basePath, item, `${idx + 1}. Metin Giriş Kutusu — 3 Durum & Doğru Cevap`, false, headerBtn, footerHtml, container);
        },

        // --- 3. TİP (ÇOKTAN SEÇMELİ - PEŞ PEŞE SORULU) STÜDYO DENETÇİSİ ---
        switchActiveMcQuestion: function (qIdx) {
            const sData = AdminCore.parsedData?.slideData;
            if (!sData || !Array.isArray(sData.questions)) return;
            sData.activeQuestionIndex = Math.max(0, Math.min(sData.questions.length - 1, parseInt(qIdx, 10) || 0));
            AdminCore.ensureLayerSyncInScript();
            AdminCore.updatePreview();
            setTimeout(() => {
                const previewCanvas = document.getElementById('admin-preview-canvas');
                const path = `questions.${sData.activeQuestionIndex}.questionDiv`;
                const el = previewCanvas ? previewCanvas.querySelector(`[data-admin-path="${path}"]`) : null;
                if (el && typeof AdminVisualEditor !== 'undefined') {
                    AdminVisualEditor.attach(el, path);
                    AdminCore.openSelectedObjectInspector(path);
                }
            }, 60);
        },

        addNewMcQuestion: function () {
            const sData = AdminCore.parsedData?.slideData;
            if (!sData) return;
            if (!Array.isArray(sData.questions)) sData.questions = [];
            AdminCore.pushHistory();
            const nextQNum = sData.questions.length + 1;
            const prevQ = sData.questions[sData.questions.length - 1];
            const optCount = prevQ?.options?.length || sData.mcOptionCount || 4;
            const layout = sData.mcLayout || 'grid';
            const newQ = this.createSingleMcQuestionObj(nextQNum, optCount, layout);
            // Önceki sorudaki kutu konumlarını ve boyutlarını koru
            if (prevQ && prevQ.questionDiv) {
                newQ.questionDiv.offsetX = prevQ.questionDiv.offsetX;
                newQ.questionDiv.offsetY = prevQ.questionDiv.offsetY;
                newQ.questionDiv.width = prevQ.questionDiv.width;
                newQ.questionDiv.height = prevQ.questionDiv.height;
            }
            if (prevQ && Array.isArray(prevQ.options)) {
                newQ.options.forEach((opt, i) => {
                    if (prevQ.options[i]) {
                        opt.offsetX = prevQ.options[i].offsetX;
                        opt.offsetY = prevQ.options[i].offsetY;
                        opt.width = prevQ.options[i].width;
                        opt.height = prevQ.options[i].height;
                    }
                });
            }
            sData.questions.push(newQ);
            sData.activeQuestionIndex = sData.questions.length - 1;
            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            this.switchActiveMcQuestion(sData.activeQuestionIndex);
        },

        deleteMcQuestion: function (qIdx) {
            const sData = AdminCore.parsedData?.slideData;
            if (!sData || !Array.isArray(sData.questions) || sData.questions.length <= 1) {
                alert('En az 1 soru bulunmalıdır.');
                return;
            }
            AdminCore.pushHistory();
            sData.questions.splice(qIdx, 1);
            sData.activeQuestionIndex = Math.max(0, Math.min(sData.questions.length - 1, qIdx));
            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            this.switchActiveMcQuestion(sData.activeQuestionIndex);
        },

        setMcCorrectOption: function (qIdx, optIdx) {
            const sData = AdminCore.parsedData?.slideData;
            const qObj = sData?.questions?.[qIdx];
            if (!qObj || !Array.isArray(qObj.options)) return;
            AdminCore.pushHistory();
            qObj.options.forEach((o, i) => {
                o.isCorrect = (i === optIdx);
            });
            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            AdminCore.updatePreview();
            AdminCore.openSelectedObjectInspector(`questions.${qIdx}.options.${optIdx}`);
        },

        renderMcQuestionSwitcherBanner: function (qIdx) {
            const sData = AdminCore.parsedData?.slideData;
            const questions = sData?.questions || [];
            return `
                <div class="bg-violet-50 border-2 border-violet-200 rounded-xl p-2.5 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-extrabold text-violet-950"><i class="fa-solid fa-layer-group text-violet-600 mr-1"></i>Peş Peşe Sorular (${qIdx + 1} / ${questions.length}. Soru Düzenleniyor)</span>
                        <div class="flex items-center gap-1">
                            <button type="button" onclick="ActivityStudioBuilder.addNewMcQuestion()" class="text-[10px] font-extrabold bg-violet-600 hover:bg-violet-700 text-white px-2.5 py-1 rounded-lg transition cursor-pointer">
                                <i class="fa-solid fa-plus mr-1"></i>Peş Peşe Yeni Soru Ekle
                            </button>
                            ${questions.length > 1 ? `
                            <button type="button" onclick="ActivityStudioBuilder.deleteMcQuestion(${qIdx})" class="text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2 py-1 rounded-lg transition cursor-pointer" title="Bu Soruyu Sil">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>` : ''}
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1">
                        ${questions.map((_, i) => `
                            <button type="button" onclick="ActivityStudioBuilder.switchActiveMcQuestion(${i})" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${i === qIdx ? 'bg-violet-600 text-white shadow' : 'bg-white text-violet-800 border border-violet-200 hover:bg-violet-100'}">
                                ${i + 1}. Soru
                            </button>
                        `).join('')}
                    </div>
                </div>`;
        },

        renderMcQuestionStemInspectorUI: function (qIdx, container) {
            const banner = document.createElement('div');
            banner.className = 'col-span-full mb-2';
            banner.innerHTML = this.renderMcQuestionSwitcherBanner(qIdx);
            container.prepend(banner);
        },

        renderMcOptionInspectorUI: function (qIdx, optIdx, container) {
            const sData = AdminCore.parsedData?.slideData;
            const opt = sData?.questions?.[qIdx]?.options?.[optIdx];
            if (!opt) return;
            const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
            const basePath = `questions.${qIdx}.options.${optIdx}`;
            const footerHtml = `
                ${this.renderMcQuestionSwitcherBanner(qIdx)}
                <div class="flex items-center justify-between bg-emerald-50 border-2 border-emerald-300 rounded-xl px-3 py-2.5">
                    <div class="text-xs font-extrabold text-emerald-950 flex items-center gap-2">
                        <i class="fa-solid fa-circle-check text-emerald-600"></i>
                        <span>${qIdx + 1}. Sorunun Doğru Cevabı Bu Seçenek mi?</span>
                    </div>
                    <button type="button" onclick="ActivityStudioBuilder.setMcCorrectOption(${qIdx}, ${optIdx})" class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${opt.isCorrect ? 'bg-emerald-600 text-white shadow' : 'bg-white text-slate-700 border-2 border-slate-300 hover:border-emerald-500'}">
                        ${opt.isCorrect ? '✓ Evet, Doğru Seçenek Bu' : 'Doğru Seçenek Olarak İşaretle'}
                    </button>
                </div>`;
            this.renderGenericMultiStateInspectorUI(basePath, opt, `${qIdx + 1}. Soru • ${letters[optIdx] || (optIdx + 1)} Seçeneği (4 Durumlu Div)`, true, '', footerHtml, container);
        },

        // --- 4. TİP (DOĞRU / YANLIŞ İKİLİ RADİO GRUBU) STÜDYO DENETÇİSİ ---
        setTfRowCorrectValue: function (rIdx, val, reopenPath) {
            const sData = AdminCore.parsedData?.slideData;
            if (!sData || !Array.isArray(sData.tfStatements) || !sData.tfStatements[rIdx]) return;
            AdminCore.pushHistory();
            sData.tfStatements[rIdx].correctValue = val === 'false' ? 'false' : 'true';
            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            AdminCore.updatePreview();
            if (reopenPath) AdminCore.openSelectedObjectInspector(reopenPath);
        },

        copyTfButtonStyleToAllRows: function (arrayKey, sourceIdx) {
            const sData = AdminCore.parsedData?.slideData;
            const arr = sData?.[arrayKey];
            if (!Array.isArray(arr) || !arr[sourceIdx] || !arr[sourceIdx].states) return;
            AdminCore.pushHistory();
            const srcStates = JSON.parse(JSON.stringify(arr[sourceIdx].states));
            arr.forEach((btn, idx) => {
                if (idx === sourceIdx) return;
                btn.states = JSON.parse(JSON.stringify(srcStates));
                btn.width = arr[sourceIdx].width;
                btn.height = arr[sourceIdx].height;
                btn.borderRadius = arr[sourceIdx].borderRadius;
            });
            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            AdminCore.updatePreview();
        },

        renderTfStatementInspectorUI: function (rIdx, container) {
            const sData = AdminCore.parsedData?.slideData;
            const stmt = sData?.tfStatements?.[rIdx];
            if (!stmt) return;
            const isTrue = String(stmt.correctValue || 'true') !== 'false';
            const box = document.createElement('div');
            box.className = 'col-span-full bg-amber-50 border-2 border-amber-200 rounded-xl p-3 mb-2 flex items-center justify-between gap-2';
            box.innerHTML = `
                <div class="text-xs font-extrabold text-amber-950">
                    <i class="fa-solid fa-scale-balanced text-amber-600 mr-1.5"></i>
                    <span>${rIdx + 1}. İfadenin Doğru Cevabı Nedir?</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="ActivityStudioBuilder.setTfRowCorrectValue(${rIdx}, 'true', 'tfStatements.${rIdx}')" class="px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${isTrue ? 'bg-emerald-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-300'}">
                        ✓ Doğru (D)
                    </button>
                    <button type="button" onclick="ActivityStudioBuilder.setTfRowCorrectValue(${rIdx}, 'false', 'tfStatements.${rIdx}')" class="px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${!isTrue ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-600 border border-slate-300'}">
                        ✕ Yanlış (Y)
                    </button>
                </div>`;
            container.prepend(box);
        },

        renderTfButtonInspectorUI: function (arrayKey, rIdx, container) {
            const sData = AdminCore.parsedData?.slideData;
            const btn = sData?.[arrayKey]?.[rIdx];
            const stmt = sData?.tfStatements?.[rIdx];
            if (!btn) return;
            const isTrueBtn = arrayKey === 'tfTrueBtns';
            const basePath = `${arrayKey}.${rIdx}`;
            const curCorrect = String(stmt?.correctValue || 'true') !== 'false' ? 'true' : 'false';
            const headerBtn = `
                <button type="button" onclick="ActivityStudioBuilder.copyTfButtonStyleToAllRows('${arrayKey}', ${rIdx})" class="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg transition cursor-pointer" title="Bu butondaki 4 durumun görsel/metin/renk tasarımını diğer tüm satırlardaki ${isTrueBtn ? 'Doğru' : 'Yanlış'} butonlarına kopyalar">
                    <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Tüm Satırlara Uygula
                </button>`;
            const footerHtml = `
                <div class="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <span class="text-xs font-extrabold text-amber-950">${rIdx + 1}. Satırın Doğru Cevabı:</span>
                    <div class="flex items-center gap-1.5">
                        <button type="button" onclick="ActivityStudioBuilder.setTfRowCorrectValue(${rIdx}, 'true', '${basePath}')" class="px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${curCorrect === 'true' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}">Doğru</button>
                        <button type="button" onclick="ActivityStudioBuilder.setTfRowCorrectValue(${rIdx}, 'false', '${basePath}')" class="px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${curCorrect === 'false' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}">Yanlış</button>
                    </div>
                </div>`;
            this.renderGenericMultiStateInspectorUI(basePath, btn, `${rIdx + 1}. Satır • ${isTrueBtn ? 'Doğru' : 'Yanlış'} Radio Butonu (4 State Div)`, true, headerBtn, footerHtml, container);
        },

        // --- 5. TİP (ÇOKLU SEÇİM / CHECK GRUBU) STÜDYO DENETÇİSİ ---
        addNewMultiSelectItem: function () {
            const sData = AdminCore.parsedData?.slideData;
            if (!sData) return;
            if (!Array.isArray(sData.multiSelectItems)) sData.multiSelectItems = [];
            AdminCore.pushHistory();
            const nextIdx = sData.multiSelectItems.length + 1;
            sData.multiSelectItems.push({
                id: `ms-item-${nextIdx}`,
                type: 'multiSelectItem',
                isCorrect: true,
                activeEditState: 'normal',
                offsetX: 0,
                offsetY: 0,
                width: 440,
                height: 100,
                zIndex: 25,
                borderRadius: 18,
                textSize: 20,
                arabicSize: 30,
                a11yText: `${nextIdx}. Çoklu Seçim Kutusu`,
                tabIndex: nextIdx + 1,
                isHidden: false,
                states: {
                    normal: { text: '', arabicText: '', imageUrl: '', bgColor: '#ffffff', borderColor: '#94a3b8', textColor: '#1e293b' },
                    selected: { text: '', arabicText: '', imageUrl: '', bgColor: '#dbeafe', borderColor: '#2563eb', textColor: '#1e3a8a' },
                    correct: { text: '', arabicText: '', imageUrl: '', bgColor: '#bbf7d0', borderColor: '#059669', textColor: '#064e3b' },
                    wrong: { text: '', arabicText: '', imageUrl: '', bgColor: '#fecaca', borderColor: '#dc2626', textColor: '#7f1d1d' }
                }
            });
            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            AdminCore.updatePreview();
        },

        toggleMultiSelectItemCorrect: function (idx) {
            const sData = AdminCore.parsedData?.slideData;
            const item = sData?.multiSelectItems?.[idx];
            if (!item) return;
            AdminCore.pushHistory();
            item.isCorrect = !item.isCorrect;
            AdminCore.ensureLayerSyncInScript();
            AdminCore.refreshAllSlideDataForms();
            AdminCore.updatePreview();
            AdminCore.openSelectedObjectInspector(`multiSelectItems.${idx}`);
        },

        renderMultiSelectInspectorUI: function (idx, container) {
            const sData = AdminCore.parsedData?.slideData;
            const item = sData?.multiSelectItems?.[idx];
            if (!item) return;
            const basePath = `multiSelectItems.${idx}`;
            const headerBtn = `
                <button type="button" onclick="ActivityStudioBuilder.addNewMultiSelectItem()" class="text-[10px] font-bold bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0">
                    <i class="fa-solid fa-plus mr-1"></i>Yeni Check Kutusu Ekle
                </button>`;
            const footerHtml = `
                <div class="flex items-center justify-between bg-emerald-50 border-2 border-emerald-300 rounded-xl px-3 py-2.5">
                    <div class="text-xs font-extrabold text-emerald-950 flex items-center gap-2">
                        <i class="fa-solid fa-square-check text-emerald-600"></i>
                        <span>Bu Kutu Doğru Cevaplardan Biri mi?</span>
                    </div>
                    <button type="button" onclick="ActivityStudioBuilder.toggleMultiSelectItemCorrect(${idx})" class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${item.isCorrect ? 'bg-emerald-600 text-white shadow' : 'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100'}">
                        ${item.isCorrect ? '✓ DOĞRU SEÇENEK (Seçilmeli)' : '✕ YANLIŞ SEÇENEK (Çeldirici)'}
                    </button>
                </div>`;
            this.renderGenericMultiStateInspectorUI(basePath, item, `${idx + 1}. Çoklu Seçim (Check) Kutusu — 4 Durumlu Div`, true, headerBtn, footerHtml, container);
        },

        // Canlı önizleme veya öğrenci sahnesinde tüm yerleşik etkinliklerin (3 ve 4 state div'lerin) DOM yapısını slideData ile senkronize eder
        syncDragAndDropDOM: function (canvas, slideData) {
            if (!canvas || !slideData) return;
            if (!this.isBuilderSlideData(slideData)) return;

            const renderInnerContent = (targetDiv, contentObj, emptyLabel, statePath) => {
                targetDiv.querySelectorAll('img[data-agy-card-img="1"]').forEach(el => el.remove());

                const imgUrl = (contentObj && contentObj.imageUrl) ? String(contentObj.imageUrl).trim() : '';
                const arTxt = (contentObj && contentObj.arabicText) ? String(contentObj.arabicText).trim() : '';
                const trTxt = (contentObj && contentObj.text) ? String(contentObj.text).trim() : '';
                const imgPos = String((contentObj && (contentObj.imagePosition || contentObj.textPosition)) || 'top').toLowerCase();

                if (contentObj && contentObj.bgColor) targetDiv.style.backgroundColor = contentObj.bgColor;
                if (contentObj && contentObj.borderColor) targetDiv.style.borderColor = contentObj.borderColor;
                if (contentObj && contentObj.textColor) targetDiv.style.color = contentObj.textColor;

                const hasAnyContent = Boolean(imgUrl || arTxt || trTxt);
                targetDiv.innerHTML = '';
                if (!hasAnyContent) {
                    targetDiv.classList.add('agy-empty-div-hint');
                    if (emptyLabel) targetDiv.setAttribute('data-empty-label', emptyLabel);
                    return;
                }
                targetDiv.classList.remove('agy-empty-div-hint');
                targetDiv.removeAttribute('data-empty-label');

                // Konumlandırma sınıflarını sıfırla
                targetDiv.classList.remove('flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse');

                // imagePosition: left | right | top | bottom | overlay
                if (imgPos === 'left') {
                    targetDiv.classList.add('flex', 'flex-row', 'items-center', 'justify-center', 'gap-2');
                } else if (imgPos === 'right') {
                    targetDiv.classList.add('flex', 'flex-row-reverse', 'items-center', 'justify-center', 'gap-2');
                } else if (imgPos === 'bottom') {
                    targetDiv.classList.add('flex', 'flex-col-reverse', 'items-center', 'justify-center');
                } else if (imgPos === 'overlay') {
                    targetDiv.classList.add('relative', 'flex', 'items-center', 'justify-center');
                } else { // top (varsayılan)
                    targetDiv.classList.add('flex', 'flex-col', 'items-center', 'justify-center');
                }

                if (imgUrl) {
                    const imgEl = document.createElement('img');
                    imgEl.src = imgUrl;
                    imgEl.alt = trTxt || arTxt || 'Görsel';
                    imgEl.setAttribute('data-agy-card-img', '1');
                    if (imgPos === 'overlay') {
                        imgEl.className = 'absolute inset-0 w-full h-full object-contain rounded-lg pointer-events-none select-none opacity-85 z-[1]';
                    } else if (imgPos === 'left' || imgPos === 'right') {
                        imgEl.className = (arTxt || trTxt)
                            ? 'max-h-[85%] max-w-[48%] object-contain rounded-lg pointer-events-none select-none shrink-0'
                            : 'w-full h-full object-contain rounded-lg pointer-events-none select-none';
                    } else if (imgPos === 'bottom') {
                        imgEl.className = (arTxt || trTxt)
                            ? 'max-h-[60%] max-w-[90%] object-contain rounded-lg pointer-events-none select-none mt-1 shrink-0'
                            : 'w-full h-full object-contain rounded-lg pointer-events-none select-none';
                    } else { // top
                        imgEl.className = (arTxt || trTxt)
                            ? 'max-h-[60%] max-w-[90%] object-contain rounded-lg pointer-events-none select-none mb-1 shrink-0'
                            : 'w-full h-full object-contain rounded-lg pointer-events-none select-none';
                    }
                    targetDiv.appendChild(imgEl);
                }

                if (arTxt || trTxt) {
                    const textWrap = document.createElement('div');
                    textWrap.className = 'agy-state-text-wrap flex flex-col items-center justify-center select-none cursor-move';
                    if (imgPos === 'overlay') {
                        textWrap.classList.add('relative', 'z-[2]');
                    }
                    const tox = parseFloat(contentObj?.textOffsetX || 0);
                    const toy = parseFloat(contentObj?.textOffsetY || 0);
                    textWrap.style.transform = `translate(${tox}px, ${toy}px)`;
                    textWrap.style.position = 'relative';
                    textWrap.style.zIndex = '10';
                    textWrap.style.pointerEvents = 'auto';

                    if (statePath) {
                        textWrap.setAttribute('data-admin-path', `${statePath}.textWrap`);
                        textWrap.setAttribute('data-is-state-text', '1');
                        textWrap.setAttribute('data-parent-state-path', statePath);
                    }

                    if (arTxt) {
                        const arDiv = document.createElement('div');
                        arDiv.dir = 'rtl';
                        arDiv.className = 'font-arabic leading-tight text-center select-none px-2 cursor-move pointer-events-auto';
                        arDiv.style.fontSize = ((contentObj && contentObj.arabicSize) || 30) + 'px';
                        arDiv.textContent = arTxt;
                        textWrap.appendChild(arDiv);
                    }
                    if (trTxt) {
                        const trDiv = document.createElement('div');
                        trDiv.className = 'font-bold leading-snug text-center select-none px-2 break-words cursor-move pointer-events-auto';
                        trDiv.style.fontSize = ((contentObj && contentObj.textSize) || 20) + 'px';
                        trDiv.textContent = trTxt;
                        textWrap.appendChild(trDiv);
                    }
                    targetDiv.appendChild(textWrap);
                }
            };

            if (Array.isArray(slideData.dropZones)) {
                slideData.dropZones.forEach((zone, zIdx) => {
                    const zEl = canvas.querySelector(`[data-admin-path="dropZones.${zIdx}"]`);
                    if (!zEl || !zone) return;
                    renderInnerContent(zEl, zone, `${zIdx + 1}. Bırakma Alanı (Boş Div)`, `dropZones.${zIdx}`);
                });
            }

            if (Array.isArray(slideData.dragItems)) {
                const inStudioDesign = Boolean(canvas.id === 'admin-preview-canvas' && this.studioPreviewMode !== 'test');
                slideData.dragItems.forEach((item, dIdx) => {
                    const itemEl = canvas.querySelector(`[data-admin-path="dragItems.${dIdx}"]`);
                    if (!itemEl || !item || !item.states) return;

                    const activeKey = (item.activeEditState === 'correct' || item.activeEditState === 'wrong') ? item.activeEditState : 'normal';

                    // Üst kapsayıcıya syncAndHealSlideDOM tarafından yanlışlıkla img veya span eklendiyse kaldır
                    Array.from(itemEl.children).forEach(ch => {
                        if (!ch.classList.contains('agy-drag-state-div')) ch.remove();
                    });

                    // Eğer nesne bir bırakma alanına yerleştirilmişse konumunu o bırakma alanında koru
                    const placedZoneId = itemEl.getAttribute('data-placed-zone');
                    if (placedZoneId && Array.isArray(slideData.dropZones)) {
                        const zObj = slideData.dropZones.find(z => z.id === placedZoneId);
                        if (zObj) {
                            itemEl.setAttribute('data-cur-x', zObj.offsetX || 0);
                            itemEl.setAttribute('data-cur-y', zObj.offsetY || 0);
                            itemEl.style.transform = `translate(calc(-50% + ${zObj.offsetX || 0}px), calc(-50% + ${zObj.offsetY || 0}px)) scale(var(--agy-btn-scale, 1))`;
                        }
                    }

                    const stateLabels = {
                        normal: `${dIdx + 1}. Nesne • 1. Normal Div`,
                        correct: `${dIdx + 1}. Nesne • 2. Doğru Div`,
                        wrong: `${dIdx + 1}. Nesne • 3. Yanlış Div`
                    };

                    const currentStateAttr = itemEl.getAttribute('data-current-state');
                    const activeVisKey = (currentStateAttr === 'correct' || currentStateAttr === 'wrong')
                        ? currentStateAttr
                        : (inStudioDesign ? activeKey : (currentStateAttr || 'normal'));

                    ['normal', 'correct', 'wrong'].forEach(k => {
                        const stDiv = itemEl.querySelector(`.agy-drag-state-div[data-state-key="${k}"]`);
                        const stObj = item.states[k] || {};
                        if (!stDiv) return;
                        if (stObj.textSize === undefined) stObj.textSize = item.textSize || 20;
                        if (stObj.arabicSize === undefined) stObj.arabicSize = item.arabicSize || 30;
                        renderInnerContent(stDiv, stObj, stateLabels[k], `dragItems.${dIdx}.states.${k}`);
                        if (k === activeVisKey) {
                            stDiv.classList.remove('hidden');
                            stDiv.style.display = 'flex';
                        } else {
                            stDiv.classList.add('hidden');
                            stDiv.style.display = 'none';
                        }
                    });
                });
            }

            const inStudioDesign = Boolean(canvas.id === 'admin-preview-canvas' && this.studioPreviewMode !== 'test');

            // 2. Tip: Metin Girişi (textPromptBoxes & textInputs)
            if (Array.isArray(slideData.textPromptBoxes)) {
                slideData.textPromptBoxes.forEach((pr, idx) => {
                    const pEl = canvas.querySelector(`[data-admin-path="textPromptBoxes.${idx}"]`);
                    if (pEl && pr) renderInnerContent(pEl, pr, `${idx + 1}. Soru / İfade Divi`, `textPromptBoxes.${idx}`);
                });
            }
            if (Array.isArray(slideData.textInputs)) {
                slideData.textInputs.forEach((item, idx) => {
                    const cardEl = canvas.querySelector(`[data-admin-path="textInputs.${idx}"]`);
                    if (!cardEl || !item || !item.states) return;
                    Array.from(cardEl.children).forEach(ch => {
                        if (!ch.classList.contains('agy-drag-state-div') && !ch.classList.contains('agy-text-input-field')) ch.remove();
                    });
                    const curAttr = cardEl.getAttribute('data-current-state');
                    const activeKey = (curAttr === 'correct' || curAttr === 'wrong')
                        ? curAttr
                        : (inStudioDesign ? (item.activeEditState || 'normal') : (curAttr || 'normal'));
                    const stActive = item.states[activeKey] || item.states.normal || {};
                    if (stActive.bgColor) cardEl.style.backgroundColor = stActive.bgColor;
                    if (stActive.borderColor) cardEl.style.borderColor = stActive.borderColor;
                    if (stActive.textColor) cardEl.style.color = stActive.textColor;

                    ['normal', 'correct', 'wrong'].forEach(k => {
                        const stDiv = cardEl.querySelector(`.agy-drag-state-div[data-state-key="${k}"]`);
                        if (!stDiv) return;
                        const stObj = item.states[k] || {};
                        renderInnerContent(stDiv, stObj, '', `textInputs.${idx}.states.${k}`);
                        if (k === activeKey) {
                            stDiv.classList.remove('hidden');
                            stDiv.style.display = 'flex';
                        } else {
                            stDiv.classList.add('hidden');
                            stDiv.style.display = 'none';
                        }
                    });
                    const inp = cardEl.querySelector('.agy-text-input-field');
                    if (inp) {
                        inp.style.fontSize = ((item.textSize || 24)) + 'px';
                        if (item.inputMode === 'digit') {
                            inp.maxLength = 1;
                            inp.inputMode = 'numeric';
                        } else {
                            inp.removeAttribute('maxlength');
                            inp.inputMode = 'text';
                        }
                    }
                });
            }

            // 3. Tip: Çoktan Seçmeli (questions)
            if (Array.isArray(slideData.questions)) {
                const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                slideData.questions.forEach((qObj, qIdx) => {
                    if (!qObj) return;
                    const qEl = canvas.querySelector(`[data-admin-path="questions.${qIdx}.questionDiv"]`);
                    if (qEl && qObj.questionDiv) {
                        renderInnerContent(qEl, qObj.questionDiv, `${qIdx + 1}. Soru Divi (Metin / Görsel)`, `questions.${qIdx}.questionDiv`);
                    }
                    if (Array.isArray(qObj.options)) {
                        qObj.options.forEach((opt, oIdx) => {
                            const optEl = canvas.querySelector(`[data-admin-path="questions.${qIdx}.options.${oIdx}"]`);
                            if (!optEl || !opt || !opt.states) return;
                            Array.from(optEl.children).forEach(ch => {
                                if (!ch.classList.contains('agy-drag-state-div')) ch.remove();
                            });
                            const curAttr = optEl.getAttribute('data-current-state');
                            const activeKey = inStudioDesign ? (opt.activeEditState || 'normal') : (curAttr || 'normal');
                            ['normal', 'selected', 'correct', 'wrong'].forEach(k => {
                                const stDiv = optEl.querySelector(`.agy-drag-state-div[data-state-key="${k}"]`);
                                if (!stDiv) return;
                                const stObj = opt.states[k] || {};
                                if (stObj.textSize === undefined) stObj.textSize = opt.textSize || 20;
                                if (stObj.arabicSize === undefined) stObj.arabicSize = opt.arabicSize || 30;
                                renderInnerContent(stDiv, stObj, `${letters[oIdx] || (oIdx + 1)} Seçeneği • ${k}`, `questions.${qIdx}.options.${oIdx}.states.${k}`);
                                if (k === activeKey) {
                                    stDiv.classList.remove('hidden');
                                    stDiv.style.display = 'flex';
                                } else {
                                    stDiv.classList.add('hidden');
                                    stDiv.style.display = 'none';
                                }
                            });
                        });
                    }
                });
            }

            // 4. Tip: Doğru / Yanlış İkili Radio Buton Grubu
            if (Array.isArray(slideData.tfStatements)) {
                slideData.tfStatements.forEach((stmt, rIdx) => {
                    const sEl = canvas.querySelector(`[data-admin-path="tfStatements.${rIdx}"]`);
                    if (sEl && stmt) renderInnerContent(sEl, stmt, `${rIdx + 1}. Doğru / Yanlış İfade Divi`, `tfStatements.${rIdx}`);
                });
                ['tfTrueBtns', 'tfFalseBtns'].forEach(arrKey => {
                    const arr = slideData[arrKey];
                    if (!Array.isArray(arr)) return;
                    const defLbl = arrKey === 'tfTrueBtns' ? 'Doğru' : 'Yanlış';
                    arr.forEach((btn, rIdx) => {
                        const btnEl = canvas.querySelector(`[data-admin-path="${arrKey}.${rIdx}"]`);
                        if (!btnEl || !btn || !btn.states) return;
                        Array.from(btnEl.children).forEach(ch => {
                            if (!ch.classList.contains('agy-drag-state-div')) ch.remove();
                        });
                        const curAttr = btnEl.getAttribute('data-current-state');
                        const activeKey = inStudioDesign ? (btn.activeEditState || 'normal') : (curAttr || 'normal');
                        ['normal', 'selected', 'correct', 'wrong'].forEach(k => {
                            const stDiv = btnEl.querySelector(`.agy-drag-state-div[data-state-key="${k}"]`);
                            if (!stDiv) return;
                            const stObj = btn.states[k] || {};
                            if (stObj.textSize === undefined) stObj.textSize = btn.textSize || 18;
                            if (stObj.arabicSize === undefined) stObj.arabicSize = btn.arabicSize || 26;
                            renderInnerContent(stDiv, stObj, `${defLbl} (${k})`, `${arrKey}.${rIdx}.states.${k}`);
                            if (k === activeKey) {
                                stDiv.classList.remove('hidden');
                                stDiv.style.display = 'flex';
                            } else {
                                stDiv.classList.add('hidden');
                                stDiv.style.display = 'none';
                            }
                        });
                    });
                });
            }

            // 5. Tip: Çoklu Seçim (multiSelectItems)
            if (Array.isArray(slideData.multiSelectItems)) {
                slideData.multiSelectItems.forEach((item, idx) => {
                    const itemEl = canvas.querySelector(`[data-admin-path="multiSelectItems.${idx}"]`);
                    if (!itemEl || !item || !item.states) return;
                    Array.from(itemEl.children).forEach(ch => {
                        if (!ch.classList.contains('agy-drag-state-div')) ch.remove();
                    });
                    const curAttr = itemEl.getAttribute('data-current-state');
                    const activeKey = inStudioDesign ? (item.activeEditState || 'normal') : (curAttr || 'normal');
                    ['normal', 'selected', 'correct', 'wrong'].forEach(k => {
                        const stDiv = itemEl.querySelector(`.agy-drag-state-div[data-state-key="${k}"]`);
                        if (!stDiv) return;
                        const stObj = item.states[k] || {};
                        if (stObj.textSize === undefined) stObj.textSize = item.textSize || 20;
                        if (stObj.arabicSize === undefined) stObj.arabicSize = item.arabicSize || 30;
                        renderInnerContent(stDiv, stObj, `${idx + 1}. Check Kutusu • ${k}`, `multiSelectItems.${idx}.states.${k}`);
                        if (k === activeKey) {
                            stDiv.classList.remove('hidden');
                            stDiv.style.display = 'flex';
                        } else {
                            stDiv.classList.add('hidden');
                            stDiv.style.display = 'none';
                        }
                    });
                });
            }

            if (canvas._ddApi && typeof canvas._ddApi.updateCheckButtonState === 'function') {
                canvas._ddApi.updateCheckButtonState();
            }
        },

        // =========================================================================
        // STORYLINE WEBOBJECT (TEK SLAYT + TÜM GÖRSELLER + DÖNÜTLER) .ZIP DIŞA AKTARICI
        // =========================================================================
        webObjectExtraFiles: [],

        injectWebObjectExportUI: function () {
            // 1) "Dışa Aktar" açılır menüsüne "Storyline WebObject (.zip)" seçeneğini ekle
            const dropdownMenu = document.getElementById('admin-export-dropdown-menu');
            if (dropdownMenu && !document.getElementById('admin-webobject-btn')) {
                dropdownMenu.classList.remove('w-72');
                dropdownMenu.classList.add('w-80');

                const divider = document.createElement('div');
                divider.className = 'h-px bg-slate-100 mx-3';

                const woBtn = document.createElement('button');
                woBtn.id = 'admin-webobject-btn';
                woBtn.type = 'button';
                woBtn.className = 'w-full px-4 py-3 text-left hover:bg-violet-50 flex items-start gap-3 transition cursor-pointer group';
                woBtn.onclick = () => {
                    if (typeof AdminCore !== 'undefined' && typeof AdminCore.closeExportDropdown === 'function') {
                        AdminCore.closeExportDropdown();
                    }
                    this.openWebObjectModal();
                };
                woBtn.innerHTML = `
                    <div class="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white flex items-center justify-center shrink-0 mt-0.5 transition">
                        <i class="fa-solid fa-cube text-sm"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="text-xs font-black text-slate-800 group-hover:text-violet-700">Storyline WebObject — Tek Slayt (.zip)</div>
                        <div class="text-[11px] text-slate-500 leading-snug mt-0.5">Banner, İleri/Geri ve Alt Bar olmadan; dönütleri ve tüm görselleriyle tek slaytlık WebObject paketi</div>
                    </div>
                `;
                dropdownMenu.appendChild(divider);
                dropdownMenu.appendChild(woBtn);
            }

            // 2) Storyline WebObject Modalını DOM'a ekle
            if (!document.getElementById('webobject-export-modal')) {
                const modal = document.createElement('div');
                modal.id = 'webobject-export-modal';
                modal.className = 'hidden fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-[95] flex items-center justify-center p-4 fade-in font-sans';
                modal.innerHTML = `
                    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
                        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white shrink-0">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 rounded-xl bg-violet-500/25 border border-violet-400/40 text-violet-300 flex items-center justify-center text-lg shadow-inner">
                                    <i class="fa-solid fa-cube"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-base leading-tight">Storyline WebObject (Tek Slayt .zip) Oluşturucu</h3>
                                    <p class="text-[11px] text-violet-200">Articulate Storyline içine doğrudan WebObject olarak gömülebilir bağımsız tek slayt paketi</p>
                                </div>
                            </div>
                            <button type="button" onclick="ActivityStudioBuilder.closeWebObjectModal()" class="text-slate-400 hover:text-white transition cursor-pointer w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center"><i class="fa-solid fa-times"></i></button>
                        </div>

                        <div class="p-6 overflow-y-auto studio-scroll space-y-5 text-sm">
                            <!-- Özellik Rozetleri -->
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div class="bg-violet-50 border border-violet-200 rounded-xl p-2.5 text-center">
                                    <div class="text-[10px] font-bold text-violet-500 uppercase">Giriş Dosyası</div>
                                    <div class="text-xs font-black text-violet-900 mt-0.5"><i class="fa-solid fa-file-code mr-1"></i>index.html</div>
                                </div>
                                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                                    <div class="text-[10px] font-bold text-emerald-600 uppercase">Dönüt Sistemi</div>
                                    <div class="text-xs font-black text-emerald-900 mt-0.5"><i class="fa-solid fa-comment-dots mr-1"></i>Dahil & Aktif</div>
                                </div>
                                <div class="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
                                    <div class="text-[10px] font-bold text-rose-500 uppercase">Üst Banner & Menü</div>
                                    <div class="text-xs font-black text-rose-900 mt-0.5"><i class="fa-solid fa-eye-slash mr-1"></i>Kaldırıldı</div>
                                </div>
                                <div class="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                                    <div class="text-[10px] font-bold text-amber-600 uppercase">Alt Bar & İleri/Geri</div>
                                    <div class="text-xs font-black text-amber-900 mt-0.5"><i class="fa-solid fa-ban mr-1"></i>Kaldırıldı</div>
                                </div>
                            </div>

                            <!-- 1. Çıkartılacak Slayt Seçimi ve Dosya Adı -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div class="sm:col-span-2">
                                    <label class="block text-xs font-extrabold text-slate-700 uppercase mb-1.5">
                                        <i class="fa-solid fa-layer-group text-violet-600 mr-1"></i>Dışa Aktarılacak Tek Slaytı Seçin
                                    </label>
                                    <select id="wo-slide-select" onchange="ActivityStudioBuilder.onWebObjectSlideChange()" class="w-full p-2.5 bg-white border-2 border-violet-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"></select>
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="block text-xs font-bold text-slate-600 uppercase mb-1">İndirilecek .ZIP Dosya Adı</label>
                                    <input type="text" id="wo-zip-filename" placeholder="ornek_etkinlik_webobject" class="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700">
                                </div>
                            </div>

                            <!-- 2. Slaytta Kullanılan Tüm Görseller ve Medyalar -->
                            <div class="bg-violet-50/60 border border-violet-200 rounded-xl p-4 space-y-3">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h4 class="text-xs font-extrabold text-violet-950 uppercase flex items-center">
                                            <i class="fa-solid fa-images text-violet-600 mr-2"></i>Slayt İçindeki Görseller & Medya Dosyaları (ZIP İçine Konulur)
                                        </h4>
                                        <p class="text-[11px] text-violet-800 mt-0.5">Slayta eklediğiniz tüm görseller (Base64 kırpmalar dahil) otomatik olarak <code>gorseller/</code> ve <code>cekirdek/</code> klasörlerine gerçek görsel dosyası olarak çıkarılır ve <code>index.html</code> içine bağlanır.</p>
                                    </div>
                                    <div class="flex items-center gap-2 shrink-0">
                                        <label class="bg-white hover:bg-violet-100 text-violet-700 border border-violet-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs flex items-center">
                                            <i class="fa-solid fa-file-circle-plus mr-1.5"></i>Dosya Ekle
                                            <input type="file" multiple accept="image/*,audio/*,video/*" class="hidden" onchange="ActivityStudioBuilder.handleWebObjectExtraFiles(this.files, false)">
                                        </label>
                                        <label class="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs flex items-center" title="cekirdek veya medya klasörünü seçerek harici dosyaları tek tıkla ekleyin">
                                            <i class="fa-solid fa-folder-plus mr-1.5"></i>Klasör Seç
                                            <input type="file" webkitdirectory directory multiple class="hidden" onchange="ActivityStudioBuilder.handleWebObjectExtraFiles(this.files, true)">
                                        </label>
                                    </div>
                                </div>

                                <div id="wo-detected-assets-box" class="bg-white border border-violet-100 rounded-lg p-3 max-h-44 overflow-y-auto studio-scroll text-xs space-y-1.5"></div>
                            </div>

                            <div id="wo-export-status" class="hidden rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center">
                                <i class="fa-solid fa-circle-check text-emerald-600 mr-2 text-base"></i>
                                <span id="wo-export-status-text">WebObject paketi hazırlandı!</span>
                            </div>
                        </div>

                        <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                            <span class="text-[11px] text-slate-500"><i class="fa-solid fa-circle-info mr-1 text-violet-500"></i>Storyline'da <b>Insert &gt; Web Object</b> diyerek ZIP'ten çıkan klasörü seçebilirsiniz.</span>
                            <div class="flex items-center space-x-2.5">
                                <button type="button" onclick="ActivityStudioBuilder.closeWebObjectModal()" class="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition">İptal</button>
                                <button type="button" id="wo-build-download-btn" onclick="ActivityStudioBuilder.exportWebObjectZip()" class="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md cursor-pointer flex items-center">
                                    <i class="fa-solid fa-download mr-2"></i>WebObject (.zip) Oluştur ve İndir
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
        },

        getAvailableSlidesForWebObject: function () {
            const list = [];
            const step2Open = Boolean(document.getElementById('admin-step-2') && !document.getElementById('admin-step-2').classList.contains('hidden'));

            // 1) Eğer şu an Yönetim Panelinde düzenlenmekte olan canlı bir slayt varsa en başa ekle
            if (typeof AdminCore !== 'undefined' && AdminCore.parsedData && step2Open) {
                const built = AdminCore.buildCodeFromForm();
                if (built && built.finalCode) {
                    const sId = built.targetId || AdminCore.parsedData.settings?.id || 'etkinlik-1';
                    const sTitle = AdminCore.parsedData.settings?.title || 'Düzenlenen Etkinlik';
                    list.push({
                        key: 'live_editor',
                        id: sId,
                        title: `✨ [Açık Düzenlenen Slayt] ${sTitle} (${sId})`,
                        cleanTitle: sTitle,
                        code: built.finalCode,
                        isStatic: Boolean(AdminCore.editingStaticId)
                    });
                }
            }

            // 2) Kayıtlı dinamik etkinlikleri (DB) ekle
            if (typeof AdminCore !== 'undefined' && typeof AdminCore.getDb === 'function') {
                const db = AdminCore.getDb();
                db.forEach((codeStr, idx) => {
                    if (!codeStr || typeof codeStr !== 'string') return;
                    const idMatch = (codeStr.match(/id:\s*['"`](.*?)['"`]/) || [])[1] || `etkinlik-${idx + 1}`;
                    const titleMatch = (codeStr.match(/title:\s*['"`](.*?)['"`]/) || [])[1] || `Etkinlik ${idx + 1}`;
                    list.push({
                        key: `db_${idx}`,
                        id: idMatch,
                        title: `${idx + 1}. Etkinlik: ${titleMatch} (${idMatch})`,
                        cleanTitle: titleMatch,
                        code: codeStr,
                        isStatic: false
                    });
                });
            }

            // 3) Eğer hiç dinamik etkinlik yoksa veya kullanıcı statik slaytları da seçmek isterse
            ['welcome', 'bitis'].forEach(stId => {
                const tpl = document.getElementById(`tpl-${stId}`);
                const scr = document.getElementById(`scr-${stId}`);
                if (tpl && scr) {
                    const stTitle = stId === 'welcome' ? 'Hoş Geldiniz (Giriş)' : 'Kapanış (Bitiş)';
                    list.push({
                        key: `static_${stId}`,
                        id: stId,
                        title: `[Sabit Slayt] ${stTitle}`,
                        cleanTitle: stTitle,
                        code: `<template id="tpl-${stId}">\n${tpl.innerHTML}\n</template>\n<script>\n${scr.textContent}\n</script>`,
                        isStatic: true
                    });
                }
            });

            return list;
        },

        openWebObjectModal: function () {
            this.injectWebObjectExportUI();
            const modal = document.getElementById('webobject-export-modal');
            const selectEl = document.getElementById('wo-slide-select');
            const statusEl = document.getElementById('wo-export-status');
            if (statusEl) statusEl.classList.add('hidden');

            const slides = this.getAvailableSlidesForWebObject();
            this._woAvailableSlides = slides;

            if (selectEl) {
                selectEl.innerHTML = slides.map((s, i) => `<option value="${i}">${s.title}</option>`).join('');
                // Varsayılan olarak açık düzenlenen slaytı veya aktif slaytı seç
                let defaultIdx = 0;
                if (slides.length > 0 && slides[0].key !== 'live_editor' && typeof PlayerCore !== 'undefined') {
                    const activeSlide = PlayerCore.slides?.[PlayerCore.currentSlideIndex];
                    if (activeSlide) {
                        const foundIdx = slides.findIndex(x => x.id === activeSlide.id && !x.isStatic);
                        if (foundIdx !== -1) defaultIdx = foundIdx;
                    }
                }
                selectEl.value = String(defaultIdx);
            }

            this.onWebObjectSlideChange();
            if (modal) modal.classList.remove('hidden');
        },

        closeWebObjectModal: function () {
            const modal = document.getElementById('webobject-export-modal');
            if (modal) modal.classList.add('hidden');
        },

        onWebObjectSlideChange: function () {
            const selectEl = document.getElementById('wo-slide-select');
            const zipInput = document.getElementById('wo-zip-filename');
            const slides = this._woAvailableSlides || this.getAvailableSlidesForWebObject();
            const idx = parseInt(selectEl?.value || '0', 10) || 0;
            const chosen = slides[idx] || slides[0];
            if (chosen && zipInput) {
                const slug = String(chosen.id || chosen.cleanTitle || 'etkinlik')
                    .toLowerCase()
                    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
                    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
                    .replace(/[^a-z0-9_-]+/g, '_')
                    .replace(/^_+|_+$/g, '') || 'etkinlik';
                zipInput.value = `${slug}_webobject`;
            }
            this.renderWebObjectDetectedAssets();
        },

        // Seçili tek slayttaki gömülü (Base64 data:image) ve yerel dosya yollarını analiz eder
        analyzeSelectedSlideAssets: function (slideEntry) {
            const embeddedDataImages = [];
            const localPaths = new Set();

            const addLocal = (val) => {
                if (!val || typeof val !== 'string') return;
                const trimmed = val.trim().replace(/\\/g, '/').replace(/^\.\//, '');
                if (!trimmed) return;
                if (/^(data:|https?:|blob:|#|javascript:)/i.test(trimmed)) return;
                // Banner ve İleri/Geri butonları WebObject'te olmayacağı için onların görsellerini hariç tut
                if (/(^|\/)(banner|ileri|geri)\.(png|jpg|jpeg|svg|webp)$/i.test(trimmed)) return;
                if (/\.(png|jpg|jpeg|gif|webp|svg|mp3|wav|ogg|m4a|mp4|webm)$/i.test(trimmed)) {
                    localPaths.add(trimmed);
                }
            };

            // Kontrol Et butonu ve Dönüt (Doğru/Yanlış/Tekrar) görsel ve seslerini dahil et
            if (typeof PlayerCore !== 'undefined') {
                addLocal(PlayerCore.settings?.checkButtonAsset || 'cekirdek/kontrolet.png');
                Object.values(PlayerCore.feedbacks || {}).forEach(fb => {
                    if (fb) {
                        addLocal(fb.logo);
                        addLocal(fb.audioUrl);
                    }
                });
            }

            const codeStr = (slideEntry && slideEntry.code) ? slideEntry.code : '';

            // 1) Kod içindeki yerel dosya referanslarını bul
            const pathMatches = codeStr.match(/['"`]([^'"`\n]+\.(?:png|jpg|jpeg|gif|webp|svg|mp3|wav|ogg|m4a|mp4|webm))['"`]/gi) || [];
            pathMatches.forEach(m => addLocal(m.slice(1, -1)));

            // 2) Kod içindeki tüm data:image/...;base64,... görsellerini bul
            const dataUrlRegex = /data:image\/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)/g;
            const seenDataUrls = new Map();
            let match;
            while ((match = dataUrlRegex.exec(codeStr)) !== null) {
                const fullDataUrl = match[0];
                if (seenDataUrls.has(fullDataUrl)) continue;
                let subtype = match[1].toLowerCase();
                let ext = 'png';
                if (subtype.includes('jpeg') || subtype.includes('jpg')) ext = 'jpg';
                else if (subtype.includes('webp')) ext = 'webp';
                else if (subtype.includes('gif')) ext = 'gif';
                else if (subtype.includes('svg')) ext = 'svg';

                const indexNum = seenDataUrls.size + 1;
                const fileName = `gorseller/gorsel_${indexNum}.${ext}`;
                const b64Part = match[2];
                const approxSize = Math.round((b64Part.length * 3) / 4);
                const info = { dataUrl: fullDataUrl, base64: b64Part, filePath: fileName, size: approxSize };
                seenDataUrls.set(fullDataUrl, info);
                embeddedDataImages.push(info);
            }

            return {
                embeddedDataImages,
                localPaths: Array.from(localPaths)
            };
        },

        handleWebObjectExtraFiles: function (fileList, isFolder) {
            if (!fileList || fileList.length === 0) return;
            const slides = this._woAvailableSlides || this.getAvailableSlidesForWebObject();
            const idx = parseInt(document.getElementById('wo-slide-select')?.value || '0', 10) || 0;
            const analysis = this.analyzeSelectedSlideAssets(slides[idx]);
            const referenced = analysis.localPaths;

            let pending = fileList.length;
            Array.from(fileList).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const uint8 = new Uint8Array(e.target.result);
                    let relPath = (isFolder && file.webkitRelativePath) ? file.webkitRelativePath.replace(/\\/g, '/') : file.name;
                    const matchedRef = referenced.find(ref =>
                        ref.toLowerCase() === relPath.toLowerCase() ||
                        ref.toLowerCase().endsWith('/' + file.name.toLowerCase()) ||
                        relPath.toLowerCase().endsWith('/' + ref.toLowerCase())
                    );
                    if (matchedRef) {
                        relPath = matchedRef;
                    } else if (isFolder && relPath.includes('/')) {
                        const parts = relPath.split('/');
                        if (parts.length > 1 && !['cekirdek', 'gorseller', 'medya', 'assets', 'ses', 'video', 'img'].includes(parts[0].toLowerCase())) {
                            relPath = parts.slice(1).join('/');
                        }
                    }

                    const existingIdx = this.webObjectExtraFiles.findIndex(f => f.path.toLowerCase() === relPath.toLowerCase());
                    if (existingIdx !== -1) {
                        this.webObjectExtraFiles[existingIdx] = { path: relPath, uint8, size: file.size };
                    } else {
                        this.webObjectExtraFiles.push({ path: relPath, uint8, size: file.size });
                    }
                    pending--;
                    if (pending <= 0) this.renderWebObjectDetectedAssets();
                };
                reader.readAsArrayBuffer(file);
            });
        },

        removeWebObjectExtraFile: function (pathStr) {
            this.webObjectExtraFiles = this.webObjectExtraFiles.filter(f => f.path !== pathStr);
            this.renderWebObjectDetectedAssets();
        },

        renderWebObjectDetectedAssets: function () {
            const box = document.getElementById('wo-detected-assets-box');
            if (!box) return;
            const slides = this._woAvailableSlides || this.getAvailableSlidesForWebObject();
            const idx = parseInt(document.getElementById('wo-slide-select')?.value || '0', 10) || 0;
            const chosen = slides[idx];
            if (!chosen) {
                box.innerHTML = `<div class="text-slate-400 text-center py-2">Dışa aktarılacak bir slayt bulunamadı.</div>`;
                return;
            }

            const { embeddedDataImages, localPaths } = this.analyzeSelectedSlideAssets(chosen);
            const combinedExtras = [
                ...(typeof AdminCore !== 'undefined' && Array.isArray(AdminCore.scormExtraFiles) ? AdminCore.scormExtraFiles : []),
                ...this.webObjectExtraFiles
            ];

            let html = '';

            // 1) Gömülü Base64 Görseller (Otomatik gorseller/gorsel_X.png olarak ZIP'e çıkartılır)
            embeddedDataImages.forEach(imgInfo => {
                const kb = Math.max(1, Math.round(imgInfo.size / 1024));
                html += `
                    <div class="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                        <div class="flex items-center gap-2 truncate">
                            <i class="fa-solid fa-image text-emerald-600"></i>
                            <span class="font-mono text-[11px] font-bold text-emerald-900 truncate">${imgInfo.filePath}</span>
                            <span class="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 rounded">${kb} KB · Otomatik Çıkartıldı</span>
                        </div>
                        <span class="text-[10px] font-bold text-emerald-700 shrink-0"><i class="fa-solid fa-check mr-1"></i>ZIP'e Dahil</span>
                    </div>
                `;
            });

            // 2) Yerel dosya yolları ve eklenen dosyalar
            const allLocalSet = new Set([...localPaths, ...this.webObjectExtraFiles.map(f => f.path)]);
            Array.from(allLocalSet).forEach(p => {
                const matched = combinedExtras.find(f => f.path.toLowerCase() === p.toLowerCase());
                if (matched) {
                    const kb = Math.max(1, Math.round(matched.size / 1024));
                    html += `
                        <div class="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                            <div class="flex items-center gap-2 truncate">
                                <i class="fa-solid fa-circle-check text-emerald-600"></i>
                                <span class="font-mono text-[11px] font-bold text-emerald-900 truncate">${matched.path}</span>
                                <span class="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 rounded">${kb} KB · Hazır</span>
                            </div>
                            <button type="button" onclick="ActivityStudioBuilder.removeWebObjectExtraFile('${matched.path.replace(/'/g, "\\'")}')" class="text-slate-400 hover:text-red-500 ml-2 cursor-pointer" title="Paketten Çıkar"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    `;
                } else {
                    const isCoreAsset = /^cekirdek\/.+\.(png|jpg|jpeg|svg)$/i.test(p);
                    html += `
                        <div class="flex items-center justify-between bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg">
                            <div class="flex items-center gap-2 truncate">
                                <i class="fa-regular fa-file-image text-violet-500"></i>
                                <span class="font-mono text-[11px] text-slate-700 truncate">${p}</span>
                            </div>
                            <span class="text-[10px] ${isCoreAsset ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'} border px-1.5 py-0.5 rounded font-semibold shrink-0">
                                ${isCoreAsset ? 'Otomatik Paketlenir' : 'Otomatik Aranacak / Klasörden Seçilebilir'}
                            </span>
                        </div>
                    `;
                }
            });

            if (!html) {
                html = `<div class="text-slate-400 text-center py-2">Bu slaytta harici görsel bulunamadı.</div>`;
            }
            box.innerHTML = html;
        },

        base64ToUint8Array: function (base64Str) {
            const bin = atob(base64Str);
            const len = bin.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = bin.charCodeAt(i);
            }
            return bytes;
        },

        // Eğer yerel cekirdek/*.png dosyası file:// kısıtlaması yüzünden fetch edilemezse ve klasörden seçilmediyse,
        // ZIP içinde kırık görsel kalmaması için yüksek kaliteli gerçek PNG ikonu üretir
        generateFallbackCorePngBytes: async function (relPath) {
            const lower = relPath.toLowerCase();
            const isCheck = lower.includes('kontrolet');
            const canvas = document.createElement('canvas');
            canvas.width = isCheck ? 420 : 240;
            canvas.height = isCheck ? 136 : 240;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            const drawRoundedRect = (x, y, w, h, r) => {
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.closePath();
            };

            if (isCheck) {
                const grad = ctx.createLinearGradient(0, 0, 420, 136);
                grad.addColorStop(0, '#2563eb');
                grad.addColorStop(1, '#1d4ed8');
                drawRoundedRect(6, 6, 408, 124, 28);
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#93c5fd';
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 42px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✓ Kontrol Et', 210, 68);
            } else {
                const isCorrect = lower.includes('dogru') || lower.includes('doğru');
                const isWrong = lower.includes('yanlis') || lower.includes('yanlış') || lower.includes('hatali') || lower.includes('hatalı');
                const bgColor = isCorrect ? '#10b981' : (isWrong ? '#ef4444' : '#f59e0b');
                const sym = isCorrect ? '✓' : (isWrong ? '✕' : '↻');

                ctx.beginPath();
                ctx.arc(120, 120, 106, 0, Math.PI * 2);
                ctx.fillStyle = bgColor;
                ctx.fill();
                ctx.lineWidth = 8;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 110px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(sym, 120, 126);
            }

            const dataUrl = canvas.toDataURL('image/png');
            const b64 = dataUrl.split(',')[1] || '';
            return b64 ? this.base64ToUint8Array(b64) : null;
        },

        // Dışa aktarılan (Öğrenci Sürümü / SCORM / Storyline WebObject) HTML dosyalarının içine gömülecek bağımsız Sürükle-Bırak çalışma zamanı
        buildStandaloneDragDropRuntimeScript: function (isWebObjectMode, customSettings, customFeedbacks) {
            return `
    (function() {
        if (typeof PlayerCore === 'undefined') return;
        if (typeof PlayerCore.playSound !== 'function') {
            PlayerCore.playSound = function() {};
        }
        ${customSettings ? `try { Object.assign(PlayerCore.settings, ${JSON.stringify(customSettings)}); } catch(e) {}` : ''}
        ${customFeedbacks ? `try { Object.assign(PlayerCore.feedbacks, ${JSON.stringify(customFeedbacks)}); } catch(e) {}` : ''}

        ${isWebObjectMode ? `
        window._agyWebObjectMode = true;
        // Storyline WebObject içinde çalışırken üst pencerenin (Storyline) kendi SCORM bağlantısını bozmamak
        // ve her zaman doğrudan bu tek slaytı (index 0) açmak için SCORM konum okumasını devre dışı bırak
        if (PlayerCore.scorm) {
            PlayerCore.scorm.init = function() {};
            PlayerCore.scorm.getSavedState = function() { return null; };
            PlayerCore.scorm.syncProgress = function() {};
            PlayerCore.scorm.terminate = function() {};
        }
        ` : ''}

        function syncExportedDragDropDOM(canvas, slideData) {
            if (!canvas || !slideData) return;

            const renderInner = (targetDiv, contentObj) => {
                targetDiv.querySelectorAll('img[data-agy-card-img="1"]').forEach(el => el.remove());
                const imgUrl = (contentObj && contentObj.imageUrl) ? String(contentObj.imageUrl).trim() : '';
                const arTxt = (contentObj && contentObj.arabicText) ? String(contentObj.arabicText).trim() : '';
                const trTxt = (contentObj && contentObj.text) ? String(contentObj.text).trim() : '';
                if (contentObj && contentObj.bgColor) targetDiv.style.backgroundColor = contentObj.bgColor;
                if (contentObj && contentObj.borderColor) targetDiv.style.borderColor = contentObj.borderColor;
                if (contentObj && contentObj.textColor) targetDiv.style.color = contentObj.textColor;

                targetDiv.innerHTML = '';
                targetDiv.classList.remove('agy-empty-div-hint');
                targetDiv.removeAttribute('data-empty-label');

                if (imgUrl) {
                    const imgEl = document.createElement('img');
                    imgEl.src = imgUrl;
                    imgEl.alt = trTxt || arTxt || '';
                    imgEl.className = (arTxt || trTxt)
                        ? 'max-h-[65%] max-w-[90%] object-contain rounded-lg pointer-events-none select-none mb-1'
                        : 'w-full h-full object-contain rounded-lg pointer-events-none select-none';
                    targetDiv.appendChild(imgEl);
                }
                if (arTxt) {
                    const arDiv = document.createElement('div');
                    arDiv.dir = 'rtl';
                    arDiv.className = 'font-arabic leading-tight text-center pointer-events-none select-none px-2';
                    arDiv.style.fontSize = ((contentObj && contentObj.arabicSize) || 30) + 'px';
                    arDiv.textContent = arTxt;
                    targetDiv.appendChild(arDiv);
                }
                if (trTxt) {
                    const trDiv = document.createElement('div');
                    trDiv.className = 'font-bold leading-snug text-center pointer-events-none select-none px-2 break-words';
                    trDiv.style.fontSize = ((contentObj && contentObj.textSize) || 20) + 'px';
                    trDiv.textContent = trTxt;
                    targetDiv.appendChild(trDiv);
                }
            };

            const syncMultiStateArray = (arr, pathPrefix, stateKeys, keepInputField) => {
                if (!Array.isArray(arr)) return;
                arr.forEach((item, idx) => {
                    const itemEl = canvas.querySelector('[data-admin-path="' + pathPrefix + '.' + idx + '"]');
                    if (!itemEl || !item || !item.states) return;
                    Array.from(itemEl.children).forEach(ch => {
                        if (!ch.classList.contains('agy-drag-state-div') && !(keepInputField && ch.classList.contains('agy-text-input-field'))) ch.remove();
                    });
                    const activeVisKey = itemEl.getAttribute('data-current-state') || 'normal';
                    stateKeys.forEach(k => {
                        const stDiv = itemEl.querySelector('.agy-drag-state-div[data-state-key="' + k + '"]');
                        const stObj = item.states[k] || {};
                        if (!stDiv) return;
                        if (stObj.textSize === undefined) stObj.textSize = item.textSize || 20;
                        if (stObj.arabicSize === undefined) stObj.arabicSize = item.arabicSize || 30;
                        renderInner(stDiv, stObj);
                        if (k === activeVisKey) {
                            stDiv.classList.remove('hidden');
                            stDiv.style.display = 'flex';
                        } else {
                            stDiv.classList.add('hidden');
                            stDiv.style.display = 'none';
                        }
                    });
                });
            };

            if (Array.isArray(slideData.dropZones)) {
                slideData.dropZones.forEach((zone, zIdx) => {
                    const zEl = canvas.querySelector('[data-admin-path="dropZones.' + zIdx + '"]');
                    if (zEl && zone) renderInner(zEl, zone);
                });
            }

            if (Array.isArray(slideData.dragItems)) {
                slideData.dragItems.forEach((item, dIdx) => {
                    const itemEl = canvas.querySelector('[data-admin-path="dragItems.' + dIdx + '"]');
                    if (!itemEl || !item) return;
                    const placedZoneId = itemEl.getAttribute('data-placed-zone');
                    if (placedZoneId && Array.isArray(slideData.dropZones)) {
                        const zObj = slideData.dropZones.find(z => z.id === placedZoneId);
                        if (zObj) {
                            itemEl.setAttribute('data-cur-x', zObj.offsetX || 0);
                            itemEl.setAttribute('data-cur-y', zObj.offsetY || 0);
                            itemEl.style.transform = 'translate(calc(-50% + ' + (zObj.offsetX || 0) + 'px), calc(-50% + ' + (zObj.offsetY || 0) + 'px)) scale(var(--agy-btn-scale, 1))';
                        }
                    }
                });
                syncMultiStateArray(slideData.dragItems, 'dragItems', ['normal', 'correct', 'wrong'], false);
            }

            if (Array.isArray(slideData.textPromptBoxes)) {
                slideData.textPromptBoxes.forEach((pr, idx) => {
                    const pEl = canvas.querySelector('[data-admin-path="textPromptBoxes.' + idx + '"]');
                    if (pEl && pr) renderInner(pEl, pr);
                });
            }
            if (Array.isArray(slideData.textInputs)) {
                syncMultiStateArray(slideData.textInputs, 'textInputs', ['normal', 'correct', 'wrong'], true);
            }

            if (Array.isArray(slideData.questions)) {
                slideData.questions.forEach((qObj, qIdx) => {
                    if (!qObj) return;
                    const qEl = canvas.querySelector('[data-admin-path="questions.' + qIdx + '.questionDiv"]');
                    if (qEl && qObj.questionDiv) renderInner(qEl, qObj.questionDiv);
                    if (Array.isArray(qObj.options)) {
                        syncMultiStateArray(qObj.options, 'questions.' + qIdx + '.options', ['normal', 'selected', 'correct', 'wrong'], false);
                    }
                });
            }

            if (Array.isArray(slideData.tfStatements)) {
                slideData.tfStatements.forEach((stmt, idx) => {
                    const sEl = canvas.querySelector('[data-admin-path="tfStatements.' + idx + '"]');
                    if (sEl && stmt) renderInner(sEl, stmt);
                });
                syncMultiStateArray(slideData.tfTrueBtns, 'tfTrueBtns', ['normal', 'selected', 'correct', 'wrong'], false);
                syncMultiStateArray(slideData.tfFalseBtns, 'tfFalseBtns', ['normal', 'selected', 'correct', 'wrong'], false);
            }

            if (Array.isArray(slideData.multiSelectItems)) {
                syncMultiStateArray(slideData.multiSelectItems, 'multiSelectItems', ['normal', 'selected', 'correct', 'wrong'], false);
            }

            if (canvas._ddApi && typeof canvas._ddApi.updateCheckButtonState === 'function') {
                canvas._ddApi.updateCheckButtonState();
            }
        }

        const origSync = PlayerCore.syncAndHealSlideDOM.bind(PlayerCore);
        PlayerCore.syncAndHealSlideDOM = function(canvas, slideData, onAdoptCallback) {
            origSync(canvas, slideData, onAdoptCallback);
            syncExportedDragDropDOM(canvas, slideData);
        };

        const origReveal = PlayerCore.autoRevealCorrectAnswers.bind(PlayerCore);
        PlayerCore.autoRevealCorrectAnswers = function(container, slideData) {
            origReveal(container, slideData);
            if (!container || !slideData) return;
            if (Array.isArray(slideData.dragItems) && Array.isArray(slideData.dropZones)) {
                slideData.dragItems.forEach((item, idx) => {
                    const itemEl = container.querySelector('[data-admin-path="dragItems.' + idx + '"]');
                    const targetZone = slideData.dropZones.find(z => z.id === item.targetZoneId) || slideData.dropZones[idx];
                    if (itemEl && targetZone) {
                        itemEl.classList.add('bg-emerald-50', 'border-emerald-500');
                        itemEl.style.transform = 'translate(calc(-50% + ' + (targetZone.offsetX || 0) + 'px), calc(-50% + ' + (targetZone.offsetY || 0) + 'px)) scale(var(--agy-btn-scale, 1))';
                        itemEl.querySelectorAll('.agy-drag-state-div').forEach(d => {
                            if (d.getAttribute('data-state-key') === 'correct') {
                                d.classList.remove('hidden');
                                d.style.display = 'flex';
                            } else {
                                d.classList.add('hidden');
                                d.style.display = 'none';
                            }
                        });
                    }
                });
            }
        };

        ${isWebObjectMode ? `
        // Storyline WebObject tamamlanma bildirimi (postMessage + GetPlayer)
        const origSubmit = PlayerCore.submitAnswer.bind(PlayerCore);
        PlayerCore.submitAnswer = function(isCorrect, callback) {
            origSubmit(isCorrect, callback);
            try {
                const curSlide = PlayerCore.slides[PlayerCore.currentSlideIndex];
                if (curSlide && curSlide.state && curSlide.state.completed) {
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage({
                            type: 'STORYLINE_WEBOBJECT_COMPLETED',
                            slideId: curSlide.id,
                            passed: Boolean(curSlide.state.passed),
                            completed: true
                        }, '*');
                        if (typeof window.parent.GetPlayer === 'function') {
                            const slPlayer = window.parent.GetPlayer();
                            if (slPlayer && typeof slPlayer.SetVar === 'function') {
                                try { slPlayer.SetVar('WebObjectCompleted', true); } catch(e) {}
                                try { slPlayer.SetVar('WebObjectPassed', Boolean(curSlide.state.passed)); } catch(e) {}
                            }
                        }
                    }
                }
            } catch (e) {}
        };
        ` : ''}

        window.addEventListener('DOMContentLoaded', () => {
            const restartBtn = document.getElementById('restart-btn');
            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    const fbModal = document.getElementById('feedback-modal');
                    if (fbModal) fbModal.classList.add('hidden');
                    const curSlide = PlayerCore.slides[PlayerCore.currentSlideIndex];
                    if (curSlide) {
                        curSlide.state = {
                            completed: false,
                            passed: false,
                            attempts: curSlide.maxAttempts !== undefined ? curSlide.maxAttempts : (PlayerCore.settings?.maxAttempts || 3)
                        };
                        if (curSlide.slideData && Array.isArray(curSlide.slideData.dragItems)) {
                            curSlide.slideData.dragItems.forEach(it => {
                                if (typeof it.homeX === 'number') it.offsetX = it.homeX;
                                if (typeof it.homeY === 'number') it.offsetY = it.homeY;
                            });
                        }
                    }
                    setTimeout(() => {
                        const sCanvas = document.getElementById('slide-canvas');
                        if (sCanvas && sCanvas._ddApi && typeof sCanvas._ddApi.resetActivity === 'function') {
                            sCanvas._ddApi.resetActivity();
                        }
                    }, 20);
                }, true);
            }
        });
    })();`;
        },

        // Seçilen tek slayt için Banner, İleri/Geri butonları ve Alt Bar olmayan; dönütleri tam, görselleri klasöre çıkartılmış HTML ve ZIP girdilerini üretir
        buildSingleSlideWebObjectHtmlAndAssets: async function (slideEntry) {
            if (typeof AdminVisualEditor !== 'undefined') AdminVisualEditor.hide();
            if (typeof PlayerCore !== 'undefined') PlayerCore.applyGlobalSettingsToDOM();

            // 1) Eğer seçilen slayt Sürükle-Bırak ise en güncel motoru kullandığından emin ol
            let slideCode = this.replaceDragDropInitInCode(slideEntry.code);

            // 2) Slayt kodundaki hideBanner ve hideNav ayarlarını zorunlu olarak true yap
            slideCode = slideCode
                .replace(/hideBanner\s*:\s*(true|false)/g, 'hideBanner: true')
                .replace(/hideNav\s*:\s*(true|false)/g, 'hideNav: true');

            // 3) Gömülü Base64 görselleri (data:image/...) yakala, gerçek görsel dosyasına çevir ve kod içindeki referanslarını gorseller/gorsel_X.png yap
            const { embeddedDataImages, localPaths } = this.analyzeSelectedSlideAssets({ ...slideEntry, code: slideCode });
            const extractedImageFiles = new Map(); // filePath -> Uint8Array

            embeddedDataImages.forEach(imgInfo => {
                try {
                    const bytes = this.base64ToUint8Array(imgInfo.base64);
                    extractedImageFiles.set(imgInfo.filePath, bytes);
                    slideCode = slideCode.split(imgInfo.dataUrl).join(imgInfo.filePath);
                } catch (e) {}
            });

            // 4) Ana dokümanı klonla ve sadece bu tek slaytı bırak
            const docClone = document.documentElement.cloneNode(true);
            ['#slide-canvas', '#menu-list', '#dynamic-activities'].forEach(sel => {
                const el = docClone.querySelector(sel);
                if (el) el.innerHTML = '';
            });

            // Tüm mevcut slayt şablonlarını ve statik slayt scriptlerini kaldır (sadece seçilen tek slayt kalacak)
            ['template[id^="tpl-"]', '#scr-welcome', '#scr-bitis', '.placeholder-tpl', '.placeholder-scr'].forEach(sel => {
                docClone.querySelectorAll(sel).forEach(el => el.remove());
            });

            // Yönetim paneli, modallar ve harici stüdyo scriptlerini kaldır
            [
                '#admin-panel-btn', '#admin-modal', '#admin-core-script', '#activity-builder-script',
                '#activity-db', '#system-prompt-modal', '#api-settings-modal', '#add-element-modal',
                '#screenshot-cropper-modal', '#course-settings-modal', '#scorm-export-modal',
                '#webobject-export-modal', '#a11y-modal', '#qa-inspector-modal',
                '#admin-visual-editor-overlay', '#admin-snap-guide-x', '#admin-snap-guide-y'
            ].forEach(sel => {
                docClone.querySelectorAll(sel).forEach(el => el.remove());
            });

            // Dönüt ve ses kilidi pencerelerinin başlangıçta gizli olduğundan emin ol
            ['#feedback-modal', '#audio-lock-banner'].forEach(sel => {
                const el = docClone.querySelector(sel);
                if (el) el.classList.add('hidden');
            });

            // ÖNEMLİ: #sidebar, main > header, #banner-wrapper, #nav-buttons-container ve footer DOM düğümlerini
            // DOM'dan silme (.remove() yapma) ki PlayerCore.bindEvents() ve PlayerCore.renderMenu() hata vermesin;
            // bunun yerine hem inline hem !important CSS ile tamamen gizle!
            ['#sidebar', 'main > header', '#banner-wrapper', '#nav-buttons-container', 'footer'].forEach(sel => {
                const el = docClone.querySelector(sel);
                if (el) el.style.display = 'none';
            });

            // WebObject özel görünüm CSS'ini <head> içine ekle (Banner, İleri/Geri, Üst Bar, Yan Menü ve Alt Bar tamamen gizli)
            const headEl = docClone.querySelector('head');
            if (headEl) {
                const woStyle = document.createElement('style');
                woStyle.id = 'agy-webobject-mode-style';
                woStyle.textContent = `
                    #sidebar,
                    main > header,
                    #banner-wrapper,
                    #nav-buttons-container,
                    footer {
                        display: none !important;
                    }
                    #slide-canvas {
                        padding: 0 !important;
                    }
                `;
                headEl.appendChild(woStyle);
            }

            // PlayerCore.settings ve PlayerCore.feedbacks (Dönütler) yapılandırmasını senkronize et
            let clonedSettings = null;
            let clonedFeedbacks = null;
            const coreScr = docClone.querySelector('#player-core-script');
            if (typeof PlayerCore !== 'undefined') {
                clonedSettings = JSON.parse(JSON.stringify(PlayerCore.settings || {}));
                clonedFeedbacks = JSON.parse(JSON.stringify(PlayerCore.feedbacks || {}));

                // Eğer ayarlarda veya dönüt logolarında data:image/ varsa onları da dosyaya çıkart
                const extractSettingDataUrl = (val, prefix) => {
                    if (!val || typeof val !== 'string' || !val.startsWith('data:image/')) return val;
                    const m = val.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)$/);
                    if (!m) return val;
                    let ext = m[1].toLowerCase().includes('jp') ? 'jpg' : 'png';
                    const fPath = `gorseller/${prefix}.${ext}`;
                    try {
                        extractedImageFiles.set(fPath, this.base64ToUint8Array(m[2]));
                        return fPath;
                    } catch (e) {
                        return val;
                    }
                };

                clonedSettings.checkButtonAsset = extractSettingDataUrl(clonedSettings.checkButtonAsset, 'kontrolet_custom');
                Object.keys(clonedFeedbacks).forEach(k => {
                    if (clonedFeedbacks[k] && clonedFeedbacks[k].logo) {
                        clonedFeedbacks[k].logo = extractSettingDataUrl(clonedFeedbacks[k].logo, `donut_${k}`);
                    }
                });

                if (coreScr) {
                    coreScr.textContent = coreScr.textContent
                        .replace(/settings:\s*\{[\s\S]*?\},/, `settings: ${JSON.stringify(clonedSettings, null, 16)},`)
                        .replace(/feedbacks:\s*\{[\s\S]*?\r?\n            \},/, `feedbacks: ${JSON.stringify(clonedFeedbacks, null, 16)},`);
                }
            }

            // Seçilen tek slaytın <template> ve <script> kodunu #dynamic-activities içine yerleştir
            const dynAct = docClone.querySelector('#dynamic-activities');
            if (dynAct) {
                const temp = document.createElement('div');
                temp.innerHTML = slideCode;
                temp.querySelectorAll('template').forEach(tpl => dynAct.appendChild(tpl));
                temp.querySelectorAll('script').forEach(scr => {
                    const n = document.createElement('script');
                    n.textContent = scr.textContent;
                    dynAct.appendChild(n);
                });

                // Bağımsız Sürükle-Bırak ve Storyline WebObject çalışma zamanı scriptini ekle
                const runtimeScr = document.createElement('script');
                runtimeScr.id = 'agy-dd-runtime-script';
                runtimeScr.textContent = this.buildStandaloneDragDropRuntimeScript(true, clonedSettings, clonedFeedbacks);
                dynAct.appendChild(runtimeScr);
            }

            const bootScript = docClone.querySelector('#boot-script');
            if (bootScript) {
                bootScript.textContent = "\n        window.onload = function() {\n            PlayerCore.currentSlideIndex = 0;\n            PlayerCore.start();\n        };\n    ";
            }

            const finalHtml = "<!DOCTYPE html>\n<html lang=\"tr\">\n" + docClone.innerHTML + "\n</html>";

            // 5) Yerel görsel/medya dosyalarını (cekirdek/kontrolet.png, cekirdek/dogru.png, yanlış.png, yenidendene1.png vb.) topla
            const bundledFiles = new Map();
            extractedImageFiles.forEach((bytes, fPath) => bundledFiles.set(fPath, bytes));

            const combinedExtras = [
                ...(typeof AdminCore !== 'undefined' && Array.isArray(AdminCore.scormExtraFiles) ? AdminCore.scormExtraFiles : []),
                ...this.webObjectExtraFiles
            ];
            combinedExtras.forEach(f => {
                const norm = f.path.replace(/\\/g, '/');
                if (localPaths.some(lp => lp.toLowerCase() === norm.toLowerCase()) || this.webObjectExtraFiles.includes(f)) {
                    bundledFiles.set(norm, f.uint8);
                }
            });

            for (const refPath of localPaths) {
                const norm = refPath.replace(/\\/g, '/');
                const already = Array.from(bundledFiles.keys()).some(k => k.toLowerCase() === norm.toLowerCase());
                if (already) continue;

                let fetchedBytes = null;
                try {
                    const resp = await fetch(norm);
                    if (resp.ok) {
                        const buf = await resp.arrayBuffer();
                        fetchedBytes = new Uint8Array(buf);
                    }
                } catch (e) {}

                // Eğer tarayıcı file:// kısıtlaması nedeniyle cekirdek/*.png dosyasını fetch edemediyse yüksek çözünürlüklü PNG üret
                if (!fetchedBytes && /^cekirdek\/.+\.(png|jpg|jpeg)$/i.test(norm)) {
                    try {
                        fetchedBytes = await this.generateFallbackCorePngBytes(norm);
                    } catch (e) {}
                }

                if (fetchedBytes) {
                    bundledFiles.set(norm, fetchedBytes);
                }
            }

            return {
                htmlContent: finalHtml,
                bundledFiles
            };
        },

        exportWebObjectZip: async function () {
            const btn = document.getElementById('wo-build-download-btn');
            const statusBox = document.getElementById('wo-export-status');
            const statusTxt = document.getElementById('wo-export-status-text');

            try {
                const slides = this._woAvailableSlides || this.getAvailableSlidesForWebObject();
                const idx = parseInt(document.getElementById('wo-slide-select')?.value || '0', 10) || 0;
                const chosen = slides[idx];
                if (!chosen) {
                    alert('Lütfen dışa aktarılacak bir slayt seçin.');
                    return;
                }

                if (btn) btn.disabled = true;
                if (statusBox && statusTxt) {
                    statusTxt.textContent = 'Tek slaytlık WebObject (index.html, dönütler ve tüm görseller) paketleniyor...';
                    statusBox.classList.remove('hidden');
                }

                const rawZipName = document.getElementById('wo-zip-filename')?.value.trim() || `${chosen.id || 'slayt'}_webobject`;

                const { htmlContent, bundledFiles } = await this.buildSingleSlideWebObjectHtmlAndAssets(chosen);
                const encoder = new TextEncoder();

                const zipEntries = [
                    { name: 'index.html', data: encoder.encode(htmlContent) }
                ];
                bundledFiles.forEach((uint8Data, filePath) => {
                    zipEntries.push({ name: filePath, data: uint8Data });
                });

                const zipBlob = AdminCore.createZipBlob(zipEntries);
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                const cleanZipName = rawZipName.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'storyline_webobject';
                a.download = `${cleanZipName}.zip`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 3000);

                if (statusBox && statusTxt) {
                    statusTxt.textContent = `Storyline WebObject paketi (index.html + ${bundledFiles.size} görsel/medya dosyası) başarıyla indirildi!`;
                }
            } catch (err) {
                alert('WebObject Paketi Oluşturma Hatası: ' + err.message);
            } finally {
                if (btn) btn.disabled = false;
            }
        },

        hookIntoSystem: function () {
            if (typeof AdminCore !== 'undefined') {
                // 1) autoSynthesizeInitFunction içinde yerleşik 5 etkinlik tipinden biri varsa ilgili motoru döndür
                const origSynthesize = AdminCore.autoSynthesizeInitFunction.bind(AdminCore);
                AdminCore.autoSynthesizeInitFunction = function (slideData) {
                    const sd = slideData || {};
                    if (Array.isArray(sd.dragItems) && Array.isArray(sd.dropZones)) {
                        return ActivityStudioBuilder.buildDragDropInitFunctionString();
                    }
                    if (Array.isArray(sd.textInputs)) {
                        return ActivityStudioBuilder.buildTextInputInitFunctionString();
                    }
                    if (Array.isArray(sd.questions)) {
                        return ActivityStudioBuilder.buildMultipleChoiceInitFunctionString();
                    }
                    if (Array.isArray(sd.tfStatements)) {
                        return ActivityStudioBuilder.buildTrueFalseInitFunctionString();
                    }
                    if (Array.isArray(sd.multiSelectItems)) {
                        return ActivityStudioBuilder.buildMultiSelectInitFunctionString();
                    }
                    return origSynthesize(slideData);
                };

                // 1.b) normalizeRawActivityCode çağrıldığında daha önce kaydedilmiş dragItems+dropZones etkinliklerinin init fonksiyonunu en güncel sürüme yükselt
                if (typeof AdminCore.normalizeRawActivityCode === 'function') {
                    const origNormalize = AdminCore.normalizeRawActivityCode.bind(AdminCore);
                    AdminCore.normalizeRawActivityCode = function (rawText, repairLog) {
                        const res = origNormalize(rawText, repairLog);
                        if (res && res.includes('dragItems') && res.includes('dropZones')) {
                            return ActivityStudioBuilder.replaceDragDropInitInCode(res);
                        }
                        return res;
                    };
                }

                // 2) Inspector açıldığında yerleşik 5 etkinlik tipine ait nesneler seçiliyse özel düzenleyiciyi ekle
                const origInspector = AdminCore.openSelectedObjectInspector.bind(AdminCore);
                AdminCore.openSelectedObjectInspector = function (pathStr) {
                    if (pathStr && pathStr.endsWith('.textWrap')) {
                        const fieldsContainer = document.getElementById('inspector-fields-container');
                        const emptyState = document.getElementById('inspector-empty-state');
                        const pathBadge = document.getElementById('inspector-selected-path-badge');
                        const closeBtn = document.getElementById('inspector-close-btn');
                        if (emptyState) emptyState.classList.add('hidden');
                        if (closeBtn) closeBtn.classList.remove('hidden');
                        if (pathBadge) {
                            pathBadge.textContent = `Seçili Metin: ${pathStr}`;
                            pathBadge.classList.remove('text-slate-400');
                            pathBadge.classList.add('text-indigo-600');
                        }
                        if (fieldsContainer) {
                            fieldsContainer.classList.remove('hidden');
                            ActivityStudioBuilder.renderTextWrapInspectorUI(pathStr, fieldsContainer);
                        }
                        return;
                    }
                    origInspector(pathStr);
                    const fieldsContainer = document.getElementById('inspector-fields-container');
                    if (!fieldsContainer || !pathStr) return;

                    const dragMatch = pathStr.match(/^dragItems\.(\d+)/);
                    if (dragMatch) {
                        ActivityStudioBuilder.renderDragItemInspectorUI(parseInt(dragMatch[1], 10), fieldsContainer);
                        return;
                    }

                    const zoneMatch = pathStr.match(/^dropZones\.(\d+)/);
                    if (zoneMatch) {
                        ActivityStudioBuilder.renderDropZoneInspectorUI(parseInt(zoneMatch[1], 10), fieldsContainer);
                        return;
                    }

                    const tiMatch = pathStr.match(/^textInputs\.(\d+)/);
                    if (tiMatch) {
                        ActivityStudioBuilder.renderTextInputInspectorUI(parseInt(tiMatch[1], 10), fieldsContainer);
                        return;
                    }

                    const mcStemMatch = pathStr.match(/^questions\.(\d+)\.questionDiv/);
                    if (mcStemMatch) {
                        ActivityStudioBuilder.renderMcQuestionStemInspectorUI(parseInt(mcStemMatch[1], 10), fieldsContainer);
                        return;
                    }

                    const mcOptMatch = pathStr.match(/^questions\.(\d+)\.options\.(\d+)/);
                    if (mcOptMatch) {
                        ActivityStudioBuilder.renderMcOptionInspectorUI(parseInt(mcOptMatch[1], 10), parseInt(mcOptMatch[2], 10), fieldsContainer);
                        return;
                    }

                    const tfStmtMatch = pathStr.match(/^tfStatements\.(\d+)/);
                    if (tfStmtMatch) {
                        ActivityStudioBuilder.renderTfStatementInspectorUI(parseInt(tfStmtMatch[1], 10), fieldsContainer);
                        return;
                    }

                    const tfBtnMatch = pathStr.match(/^(tfTrueBtns|tfFalseBtns)\.(\d+)/);
                    if (tfBtnMatch) {
                        ActivityStudioBuilder.renderTfButtonInspectorUI(tfBtnMatch[1], parseInt(tfBtnMatch[2], 10), fieldsContainer);
                        return;
                    }

                    const msMatch = pathStr.match(/^multiSelectItems\.(\d+)/);
                    if (msMatch) {
                        ActivityStudioBuilder.renderMultiSelectInspectorUI(parseInt(msMatch[1], 10), fieldsContainer);
                        return;
                    }
                };

                // 3) updatePreview çalıştığında Sürükle-Bırak Tasarım/Test modu çubuğunu güncelle
                const origUpdatePreview = AdminCore.updatePreview.bind(AdminCore);
                AdminCore.updatePreview = function () {
                    origUpdatePreview();
                    ActivityStudioBuilder.renderStudioPreviewModeBar();
                };

                // 3.b) buildCleanedHtmlDoc (Öğrenci Sürümü ve SCORM dışa aktarma) çağrıldığında
                //      #activity-builder-script kaldırılsa bile Yenile (#restart-btn) ve Sürükle-Bırak
                //      yardımcılarının bağımsız çalışması için mini çalışma zamanı scriptini göm
                if (typeof AdminCore.buildCleanedHtmlDoc === 'function') {
                    const origBuildCleaned = AdminCore.buildCleanedHtmlDoc.bind(AdminCore);
                    AdminCore.buildCleanedHtmlDoc = function (...args) {
                        const htmlStr = origBuildCleaned(...args);
                        const isPublishMode = args[0];
                        if (isPublishMode && typeof htmlStr === 'string' && !htmlStr.includes('agy-dd-runtime-script')) {
                            const rtTag = `<script id="agy-dd-runtime-script">${ActivityStudioBuilder.buildStandaloneDragDropRuntimeScript(false)}<\/script>`;
                            if (htmlStr.includes('</body>')) {
                                return htmlStr.replace('</body>', `${rtTag}\n</body>`);
                            }
                            return htmlStr + rtTag;
                        }
                        return htmlStr;
                    };
                }
            }

            // 4) AdminVisualEditor Köprüsü: Stüdyo Canlı Önizleme (#admin-preview-canvas) içinde
            //    kullanıcı nesneleri bırakma alanlarına sürüklediğinde hem yerleşimi algıla hem de
            //    "Kontrol Et" butonunu aktif et ve tıklanabilir yap!
            if (typeof AdminVisualEditor !== 'undefined' && !AdminVisualEditor._agyDragDropBridged) {
                AdminVisualEditor._agyDragDropBridged = true;

                const origStartDrag = AdminVisualEditor.startDrag.bind(AdminVisualEditor);
                AdminVisualEditor.startDrag = function (e) {
                    this._ddStartClientX = e.clientX;
                    this._ddStartClientY = e.clientY;
                    this._ddMoved = false;

                    const previewCanvas = document.getElementById('admin-preview-canvas');
                    const ddApi = previewCanvas ? previewCanvas._ddApi : null;
                    const sData = AdminCore.parsedData?.slideData;

                    let curVisualX = null;
                    let curVisualY = null;

                    if (ddApi && sData && this.activePath) {
                        const m = this.activePath.match(/^dragItems\.(\d+)$/);
                        if (m) {
                            const idx = parseInt(m[1], 10);
                            const item = sData.dragItems?.[idx];
                            if (item) {
                                const isAlreadyPlaced = Boolean(ddApi.placedZoneByItem[item.id]);
                                if (!isAlreadyPlaced) {
                                    this._ddPreHomeX = (typeof item.offsetX === 'number') ? item.offsetX : 0;
                                    this._ddPreHomeY = (typeof item.offsetY === 'number') ? item.offsetY : 0;
                                    item.homeX = this._ddPreHomeX;
                                    item.homeY = this._ddPreHomeY;
                                    ddApi.homeCoordsByItem[item.id] = { x: this._ddPreHomeX, y: this._ddPreHomeY };
                                } else {
                                    const savedHome = ddApi.homeCoordsByItem[item.id] || { x: item.homeX ?? item.offsetX ?? 0, y: item.homeY ?? item.offsetY ?? -105 };
                                    this._ddPreHomeX = savedHome.x;
                                    this._ddPreHomeY = savedHome.y;
                                    if (this.activeTarget) {
                                        const cx = parseFloat(this.activeTarget.getAttribute('data-cur-x'));
                                        const cy = parseFloat(this.activeTarget.getAttribute('data-cur-y'));
                                        if (!isNaN(cx)) curVisualX = cx;
                                        if (!isNaN(cy)) curVisualY = cy;
                                    }
                                }
                            }
                        }
                    }

                    origStartDrag(e);

                    if (curVisualX !== null) this.initialOffsetX = curVisualX;
                    if (curVisualY !== null) this.initialOffsetY = curVisualY;
                };

                const origOnMouseMove = AdminVisualEditor.onMouseMove.bind(AdminVisualEditor);
                AdminVisualEditor.onMouseMove = function (e) {
                    if (this.isDragging || this.isResizing) {
                        const dist = Math.hypot((e.clientX || 0) - (this._ddStartClientX || 0), (e.clientY || 0) - (this._ddStartClientY || 0));
                        if (dist > 5) this._ddMoved = true;
                    }
                    origOnMouseMove(e);

                    if (this.isDragging && this.activePath && /^dragItems\.(\d+)$/.test(this.activePath)) {
                        const previewCanvas = document.getElementById('admin-preview-canvas');
                        const ddApi = previewCanvas ? previewCanvas._ddApi : null;
                        const sData = AdminCore.parsedData?.slideData;
                        const idx = parseInt(this.activePath.split('.')[1], 10);
                        const item = sData?.dragItems?.[idx];
                        if (this.activeTarget && item) {
                            this.activeTarget.setAttribute('data-cur-x', item.offsetX || 0);
                            this.activeTarget.setAttribute('data-cur-y', item.offsetY || 0);
                        }
                        if (ddApi && this.activeTarget) {
                            ddApi.highlightZoneForElement(this.activeTarget);
                        }
                    }
                };

                const origOnMouseUp = AdminVisualEditor.onMouseUp.bind(AdminVisualEditor);
                AdminVisualEditor.onMouseUp = function (e) {
                    const wasDragging = this.isDragging;
                    const wasResizing = this.isResizing;
                    const activePath = this.activePath;
                    const activeTarget = this.activeTarget;
                    const moved = Boolean(this._ddMoved);

                    origOnMouseUp(e);

                    const previewCanvas = document.getElementById('admin-preview-canvas');
                    const ddApi = previewCanvas ? previewCanvas._ddApi : null;
                    const sData = AdminCore.parsedData?.slideData;
                    if (!ddApi || !sData) return;

                    ddApi.clearZoneHovers();

                    // A) Kullanıcı Stüdyo Önizlemede aktif olan "Kontrol Et" butonuna tıkladıysa çalıştır!
                    if (activePath === 'checkButtonConf' && !moved && !wasResizing) {
                        const checkBtn = previewCanvas.querySelector('#slayt-check-btn');
                        if (checkBtn && !checkBtn.disabled) {
                            this.hide();
                            ddApi.evaluateAnswers();
                            return;
                        }
                    }

                    // B) Kullanıcı bir dragItem kutusunu sürükleyip bıraktıysa:
                    if (wasDragging && !wasResizing && moved && activePath) {
                        const m = activePath.match(/^dragItems\.(\d+)$/);
                        if (m && activeTarget) {
                            const idx = parseInt(m[1], 10);
                            const item = sData.dragItems?.[idx];
                            if (!item) return;

                            const hitZone = ddApi.findZoneForElement(activeTarget, item.offsetX, item.offsetY);
                            if (hitZone) {
                                // Bırakma alanının içine bırakıldı -> Başlangıç (home) koordinatını koru ve zone'a yerleştir!
                                const homeX = (typeof this._ddPreHomeX === 'number') ? this._ddPreHomeX : (item.homeX ?? item.offsetX ?? 0);
                                const homeY = (typeof this._ddPreHomeY === 'number') ? this._ddPreHomeY : (item.homeY ?? item.offsetY ?? -105);
                                item.homeX = homeX;
                                item.homeY = homeY;
                                ddApi.homeCoordsByItem[item.id] = { x: homeX, y: homeY };

                                this.updateFieldAndData(`dragItems.${idx}.offsetX`, homeX);
                                this.updateFieldAndData(`dragItems.${idx}.offsetY`, homeY);

                                ddApi.placeItemIntoZone(item.id, hitZone.id);
                                AdminCore.ensureLayerSyncInScript();
                                this.updatePosition();
                            } else {
                                // Boş alana bırakıldı -> Yeni başlangıç (home) konumu olarak kaydet ve yerleşimi kaldır
                                const newX = item.offsetX || 0;
                                const newY = item.offsetY || 0;
                                ddApi.unplaceItemOnly(item.id, newX, newY);
                                AdminCore.ensureLayerSyncInScript();
                                this.updatePosition();
                            }
                        }
                    }
                };
            }

            if (typeof PlayerCore !== 'undefined') {
                // 5) syncAndHealSlideDOM sonrasında dragItems (3 div) ve dropZones içeriklerini senkronize et
                const origSync = PlayerCore.syncAndHealSlideDOM.bind(PlayerCore);
                PlayerCore.syncAndHealSlideDOM = function (canvas, slideData, onAdoptCallback) {
                    origSync(canvas, slideData, onAdoptCallback);
                    ActivityStudioBuilder.syncDragAndDropDOM(canvas, slideData);
                };

                // 6) 4'lü Denetçi Kurulu ve Otomatik Cevap Gösterici (autoRevealCorrectAnswers) için dragItems/dropZones desteği
                const origReveal = PlayerCore.autoRevealCorrectAnswers.bind(PlayerCore);
                PlayerCore.autoRevealCorrectAnswers = function (container, slideData) {
                    origReveal(container, slideData);
                    if (!container || !slideData) return;
                    if (Array.isArray(slideData.dragItems) && Array.isArray(slideData.dropZones)) {
                        slideData.dragItems.forEach((item, idx) => {
                            const itemEl = container.querySelector(`[data-admin-path="dragItems.${idx}"]`);
                            const targetZone = slideData.dropZones.find(z => z.id === item.targetZoneId) || slideData.dropZones[idx];
                            if (itemEl && targetZone) {
                                itemEl.classList.add('bg-emerald-50', 'border-emerald-500');
                                itemEl.style.transform = `translate(calc(-50% + ${targetZone.offsetX || 0}px), calc(-50% + ${targetZone.offsetY || 0}px)) scale(var(--agy-btn-scale, 1))`;
                                const stateDivs = itemEl.querySelectorAll('.agy-drag-state-div');
                                stateDivs.forEach(d => {
                                    if (d.getAttribute('data-state-key') === 'correct') {
                                        d.classList.remove('hidden');
                                        d.style.display = 'flex';
                                    } else {
                                        d.classList.add('hidden');
                                        d.style.display = 'none';
                                    }
                                });
                            }
                        });
                    }
                };
            }

            // 7) Herhangi bir sürükleme/bırakma (pointerup) sonrasında hem Öğrenci Sahnesi hem Canlı Önizleme için Kontrol Et buton durumunu garanti altına al
            if (!window._agyGlobalDdPointerCheckBound) {
                window._agyGlobalDdPointerCheckBound = true;
                window.addEventListener('pointerup', () => {
                    setTimeout(() => {
                        ['slide-canvas', 'admin-preview-canvas'].forEach(cId => {
                            const cEl = document.getElementById(cId);
                            if (cEl && cEl._ddApi && typeof cEl._ddApi.updateCheckButtonState === 'function') {
                                cEl._ddApi.updateCheckButtonState();
                            }
                        });
                    }, 25);
                });

                // 8) Sistemdeki "Yenile" (#restart-btn) ve Stüdyo "Yenile" (#admin-refresh-preview-btn) butonlarına basıldığında etkinliği tamamen sıfırlayıp baştan başlat
                const restartBtn = document.getElementById('restart-btn');
                if (restartBtn) {
                    restartBtn.addEventListener('click', () => {
                        const fbModal = document.getElementById('feedback-modal');
                        if (fbModal) fbModal.classList.add('hidden');
                        if (typeof PlayerCore !== 'undefined' && Array.isArray(PlayerCore.slides)) {
                            const curSlide = PlayerCore.slides[PlayerCore.currentSlideIndex];
                            if (curSlide) {
                                curSlide.state = {
                                    completed: false,
                                    passed: false,
                                    attempts: curSlide.maxAttempts !== undefined ? curSlide.maxAttempts : (PlayerCore.settings?.maxAttempts || 3)
                                };
                                if (curSlide.slideData && Array.isArray(curSlide.slideData.dragItems)) {
                                    curSlide.slideData.dragItems.forEach(it => {
                                        if (typeof it.homeX === 'number') it.offsetX = it.homeX;
                                        if (typeof it.homeY === 'number') it.offsetY = it.homeY;
                                    });
                                }
                            }
                        }
                        setTimeout(() => {
                            const sCanvas = document.getElementById('slide-canvas');
                            if (sCanvas && sCanvas._ddApi && typeof sCanvas._ddApi.resetActivity === 'function') {
                                sCanvas._ddApi.resetActivity();
                            }
                        }, 20);
                    }, true);
                }

                const adminRefreshBtn = document.getElementById('admin-refresh-preview-btn');
                if (adminRefreshBtn) {
                    adminRefreshBtn.addEventListener('click', () => {
                        const fbModal = document.getElementById('feedback-modal');
                        if (fbModal) fbModal.classList.add('hidden');
                        if (typeof AdminCore !== 'undefined' && AdminCore.parsedData?.slideData?.dragItems) {
                            AdminCore.parsedData.slideData.dragItems.forEach(it => {
                                if (typeof it.homeX === 'number') it.offsetX = it.homeX;
                                if (typeof it.homeY === 'number') it.offsetY = it.homeY;
                            });
                        }
                        if (typeof AdminCore !== 'undefined' && typeof AdminCore.updatePreview === 'function') {
                            AdminCore.updatePreview();
                        }
                    }, true);
                }
            }
        }
    };

    window.ActivityStudioBuilder = ActivityStudioBuilder;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ActivityStudioBuilder.init());
    } else {
        setTimeout(() => ActivityStudioBuilder.init(), 0);
    }
})();

