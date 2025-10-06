// Active menu points scroll eseten
const scrollSpy = new bootstrap.ScrollSpy(document.body, {
    target: '#mainNav',
    offset: 80
});


$(document).ready(function() {
    var lastScrollTop = 0;
    $(window).scroll(function() {
        var st = $(this).scrollTop();
        if (st > lastScrollTop){
            // Scroll down
            $('.navbar').css('top', '-60px');
            $('.navbar').css('background', 'var(--green-0)');
            $('.navbar').css('opacity', '1');
        } else if (st === 0){
            // Again on the top
            $('.navbar').css('top', '0');
            $('.navbar').css('background', 'var(--green-0)');
            $('.navbar').css('opacity', '1');
        } else {
            // Scroll up
            $('.navbar').css('top', '0');
            $('.navbar').css('background', 'var(--green-0)');
            //$('.navbar').css('opacity', '0.75');
            $('.navbar').css('opacity', '1');
        }
        lastScrollTop = st;
    });
});

var animation = lottie.loadAnimation({
        container: document.getElementById('backgroundAnimation'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: '/static/assets/lotti/Animation.json' // Replace with your actual path
    });
    animation.setSpeed(0.20);



// Slideover Panel
const overlay = document.getElementById('overlay');
const panel   = document.getElementById('panel');
const content = document.getElementById('panelContent');
const closeBtn = document.getElementById('closeBtn');

// ---- közös segédek
function openPanel(pushKey, push=true){
overlay.hidden=false; panel.hidden=false;
requestAnimationFrame(()=>{ overlay.classList.add('open'); panel.classList.add('open'); });
document.body.style.overflow='hidden';
if(push && pushKey){ pushHistory(pushKey.key, pushKey.value); }
closeBtn.focus();
}
function closePanel(pop=true){
overlay.classList.remove('open'); panel.classList.remove('open'); document.body.style.overflow='';
setTimeout(()=>{ overlay.hidden=true; panel.hidden=true; content.innerHTML=''; }, 200);
if(pop){ clearPanelParamsFromURL(); }
}
async function loadAndRender(url){
try{
    const res = await fetch(url, {headers:{'X-Requested-With':'fetch'}});
    if(!res.ok) throw new Error();
    content.innerHTML = await res.text();
}catch(e){ content.innerHTML = '<p>Failed to load content.</p>'; }
}
function setHeaderTitle(title){ document.getElementById('panel-title').textContent = title || 'Info'; }

// ---- History / deeplink
function pushHistory(key, value){
const url = new URL(location.href);
// csak egy panel-paraméter maradjon
for (const [k] of url.searchParams) { if (k===key) continue; url.searchParams.delete(k); }
url.searchParams.set(key, value);
history.pushState({key,value}, '', url);
}
function clearPanelParamsFromURL(){
const url = new URL(location.href);
for (const [k] of url.searchParams) url.searchParams.delete(k);
history.pushState({}, '', url);
}

// ---- Kattintás: bármely [data-panel-url] vagy a régi [data-open]
document.addEventListener('click', async (e)=>{
const el = e.target.closest('[data-panel-url], [data-open]');
if (!el) return;

e.preventDefault();
// forrás adatainak kiolvasása
const url   = el.dataset.panelUrl || (el.dataset.open ? `/project/${encodeURIComponent(el.dataset.open)}/fragment` : null);
const title = el.dataset.panelTitle || el.dataset.title || el.textContent.trim();
const key   = el.dataset.panelQuery || (el.dataset.open ? 'project' : 'panel');
const value = el.dataset.panelValue || el.dataset.open || 'panel';

if(!url) return;

setHeaderTitle(title);
content.innerHTML = '<p>Loading…</p>';
openPanel({key, value}, /*push=*/true);
loadAndRender(url);
});

// ---- Popstate: ha van ismert param, töltsük vissza
window.addEventListener('popstate', ()=>{
const params = new URL(location.href).searchParams;
if (params.size === 0) { if(!panel.hidden) closePanel(/*pop=*/false); return; }
// első paramot használjuk (pl. ?panel=about vagy ?project=slug)
const [key, value] = [...params.entries()][0];
const trigger = document.querySelector(`[data-panel-query="${key}"][data-panel-value="${value}"], [data-open="${value}"]`);
const url   = trigger?.dataset?.panelUrl || (trigger?.dataset?.open ? `/project/${encodeURIComponent(value)}/fragment` : null);
const title = trigger?.dataset?.panelTitle || trigger?.dataset?.title || value;

if(url){
    setHeaderTitle(title);
    content.innerHTML = '<p>Loading…</p>';
    openPanel({key, value}, /*push=*/false);
    loadAndRender(url);
}
});

// ---- Deep-link első betöltéskor
(function(){
const params = new URL(location.href).searchParams;
if(params.size===0) return;
const [key, value] = [...params.entries()][0];
const trigger = document.querySelector(`[data-panel-query="${key}"][data-panel-value="${value}"], [data-open="${value}"]`);
const url   = trigger?.dataset?.panelUrl || (trigger?.dataset?.open ? `/project/${encodeURIComponent(value)}/fragment` : null);
const title = trigger?.dataset?.panelTitle || trigger?.dataset?.title || value;
if(url){
    setHeaderTitle(title);
    content.innerHTML = '<p>Loading…</p>';
    openPanel({key, value}, /*push=*/false);
    loadAndRender(url);
}
})();

// ---- Bezárás
closeBtn.addEventListener('click', ()=> closePanel());
overlay.addEventListener('click', ()=> closePanel());
window.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !panel.hidden) closePanel(); });


// CKEditor 5
document.addEventListener('DOMContentLoaded', () => {
    const el = document.querySelector('#description');
    if (!el) return console.error('Nem találom a #description elemet');

    // + Heading plugin, ha kell a "Heading" legördülő
    const {
        ClassicEditor,
        Essentials,
        Paragraph, Heading,
        FontSize,
        Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
        HorizontalLine, Link, ImageUpload, Table, TableToolbar, BlockQuote,
        List, Indent,
        Alignment,
        CodeBlock,
        Code, 
        ImageInline, ImageBlock, AutoImage, ImageInsertViaUrl,  SimpleUploadAdapter, Image, ImageToolbar, ImageStyle, ImageResize } = CKEDITOR;

    ClassicEditor.create(el, {
    // CDN/Cloud esetén IDE a saját Cloud license kulcsod (ne 'GPL')
    licenseKey: 'GPL',
    plugins: [ 
        Essentials,
        Paragraph, Heading,
        FontSize,
        Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
        HorizontalLine, Link, ImageUpload, Table, TableToolbar, BlockQuote,
        List, Indent,
        Alignment,
        CodeBlock,
        Code, 
        ImageInline, ImageBlock, AutoImage, ImageInsertViaUrl,  SimpleUploadAdapter, Image, ImageToolbar, ImageStyle, ImageResize ],
    toolbar: [
        'undo', 'redo','|',
        'heading', '|',
        'selectAll','|',
        'fontSize', '|',
        'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|',
        'horizontalLine', 'link', 'insertImage', 'insertTable', 'blockQuote', '|',
        'bulletedList', 'numberedList', 'indent', 'outdent', '|',
        'alignment', '|',
        'codeBlock', '|',
        'code', '|',
        'accessibilityHelp',
        
    ],
    heading: {
        options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
        { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' }
        ]
    },
    simpleUpload: {
        uploadUrl: '/upload',
        headers: { 'X-CSRFToken': '{{ FLASK_FORM_SECRET_KEY }}' } // ha használod
    },

    image: {
        // fogantyúk automatikusak az ImageResize-től
        toolbar: [
        "imageStyle:inline", "imageStyle:alignLeft", "imageStyle:alignRight", "imageStyle:alignCenter", "imageStyle:alignBlockLeft", "imageStyle:alignBlockRight", '|',
        'toggleImageCaption', 'imageTextAlternative', '|',
        'resizeImage' // legördülő gomb a fix %-okhoz
        ],
        resizeUnit: '%',
        resizeOptions: [
        { name: 'resizeImage:original', value: null, label: 'Original' },
        { name: 'resizeImage:5', value: '5', label: '5%' },
        { name: 'resizeImage:10', value: '10', label: '10%' },
        { name: 'resizeImage:15', value: '15', label: '15%' },
        { name: 'resizeImage:20', value: '20', label: '20%' },
        { name: 'resizeImage:25', value: '25', label: '25%' },
        { name: 'resizeImage:30', value: '30', label: '30%' },
        { name: 'resizeImage:35', value: '35', label: '35%' },
        { name: 'resizeImage:40', value: '40', label: '40%' },
        { name: 'resizeImage:45', value: '45', label: '45%' },
        { name: 'resizeImage:50', value: '50', label: '50%' },
        { name: 'resizeImage:55', value: '55', label: '55%' },
        { name: 'resizeImage:60', value: '60', label: '60%' },
        ]
    }

    
    })
    .then(editor => {
    window.editor = editor; // opcionális: később elérd konzolból
    console.table(Array.from(editor.ui.componentFactory.names())); // mit tudsz kirakni a toolbarra?

    // Ha AJAX-szal küldöd a formot, szinkronizáld a textarea-t:
    const form = el.closest('form');
    if (form) form.addEventListener('submit', () => editor.updateSourceElement());
    })
    .catch(err => console.error('Editor init hiba:', err));
});
