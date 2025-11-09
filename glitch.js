// Utility function
function mod(n, m) {
    return ((n % m) + m) % m;
}

// Mimic Python's random.randint(a,b)
function randint(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

// Generate random palette (like Python generate_palette)
function generatePalette(size, floor = 0, ceiling = 255) {
    const palette = [];
    for (let i = 0; i < size; i++) {
        const r = randint(floor, ceiling);
        const g = randint(floor, ceiling);
        const b = randint(floor, ceiling);
        palette.push(r, g, b);
    }
    return palette;
}

function displacementFunc(r, g, b, w, h, i, rMod, gMod, bMod) {
    const newR = (r + ((w + 1 + i) % 14)) % rMod;
    const newG = (g + h - i) % gMod;
    const newB = (b + (h % 55) - w) % bMod;
    return [newR, newG, newB];
}


// Apply glitch effect
function glitchImage(img, i, rMod, gMod, bMod, paletteSize) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply displacement
    for (let w = 0; w < canvas.width; w++) {
        for (let h = 0; h < canvas.height; h++) {
            const idx = (h * canvas.width + w) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            const [nr, ng, nb] = displacementFunc(r, g, b, w, h, i, rMod, gMod, bMod);
            data[idx] = nr;
            data[idx + 1] = ng;
            data[idx + 2] = nb;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Apply Python-style palette reduction
    const palette = generatePalette(paletteSize);
    const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newData = newImageData.data;

    for (let p = 0; p < newData.length; p += 4) {
        // Map each pixel to the nearest palette color
        let r = newData[p], g = newData[p + 1], b = newData[p + 2];
        let minDist = Infinity, nearest = 0;
        for (let j = 0; j < palette.length; j += 3) {
            const dr = r - palette[j];
            const dg = g - palette[j + 1];
            const db = b - palette[j + 2];
            const dist = dr * dr + dg * dg + db * db;
            if (dist < minDist) {
                minDist = dist;
                nearest = j;
            }
        }
        newData[p] = palette[nearest];
        newData[p + 1] = palette[nearest + 1];
        newData[p + 2] = palette[nearest + 2];
    }

    ctx.putImageData(newImageData, 0, 0);

    return canvas;
}

// ...existing utility functions and displacementFunc, quantizeImage, glitchImage...

const variantSlider = document.getElementById('variantCount');
const variantValue = document.getElementById('variantCountValue');
variantSlider.addEventListener('input', ()=>{ variantValue.textContent=variantSlider.value; });

const paletteSlider = document.getElementById('paletteSize');
const paletteValue = document.getElementById('paletteSizeValue');
paletteSlider.addEventListener('input', ()=>{ paletteValue.textContent=paletteSlider.value; });

const rSlider = document.getElementById('rMod');
const rValue = document.getElementById('rModValue');
rSlider.addEventListener('input', ()=>{ rValue.textContent=rSlider.value; });

const gSlider = document.getElementById('gMod');
const gValue = document.getElementById('gModValue');
gSlider.addEventListener('input', ()=>{ gValue.textContent=gSlider.value; });

const bSlider = document.getElementById('bMod');
const bValue = document.getElementById('bModValue');
bSlider.addEventListener('input', ()=>{ bValue.textContent=bSlider.value; });

const progressOverlay = document.getElementById('progressOverlay');

document.getElementById('generateBtn').addEventListener('click', async ()=>{
    const fileInput = document.getElementById('imageInput');
    const results = document.getElementById('results');
    results.innerHTML='';

    if(fileInput.files.length===0) return alert("Please upload an image!");

    const img = new Image();
    img.src = URL.createObjectURL(fileInput.files[0]);
    img.onload = async ()=>{
        const variantCount = parseInt(variantSlider.value);
        const paletteSize = parseInt(paletteSlider.value);
        const rMod = parseInt(rSlider.value);
        const gMod = parseInt(gSlider.value);
        const bMod = parseInt(bSlider.value);

        progressOverlay.style.display = 'block';

        for(let i=1; i<=variantCount; i++){
            progressOverlay.textContent = `Generating: ${i} / ${variantCount}`;

            // Use setTimeout to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 10));

            const canvas = glitchImage(img, i*8, rMod, gMod, bMod, paletteSize);

            const card = document.createElement('div');
            card.className='glitch-card';
            card.appendChild(canvas);

            const btn = document.createElement('button');
            btn.className='download-btn';
            btn.textContent='Download';
            btn.addEventListener('click', ()=>{
                const link=document.createElement('a');
                link.href=canvas.toDataURL();
                link.download=`glitch-${i}.png`;
                link.click();
            });

            card.appendChild(btn);
            results.appendChild(card);
        }

        progressOverlay.style.display='none';
    }
});
