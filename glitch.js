// Utility
function mod(n, m) {
    return ((n % m) + m) % m;
}

// Random integer like Python randint
function randint(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

function getDisplacementParams() {
    return {
        rMod: parseInt(document.getElementById('rMod').value),
        gMod: parseInt(document.getElementById('gMod').value),
        bMod: parseInt(document.getElementById('bMod').value),
        wOffset: parseInt(document.getElementById('wOffset').value),
        hOffset: parseInt(document.getElementById('hOffset').value),
        iOffset: parseInt(document.getElementById('iOffset').value),
        rMult: parseFloat(document.getElementById('rMult').value),
        gMult: parseFloat(document.getElementById('gMult').value),
        bMult: parseFloat(document.getElementById('bMult').value),
        wMult: parseFloat(document.getElementById('wMult').value),
        hMult: parseFloat(document.getElementById('hMult').value),
        iMult: parseFloat(document.getElementById('iMult').value),
        rRand: parseInt(document.getElementById('rRand').value),
        gRand: parseInt(document.getElementById('gRand').value),
        bRand: parseInt(document.getElementById('bRand').value),
        rCycle: parseInt(document.getElementById('rCycle').value),
        hCycle: parseInt(document.getElementById('hCycle').value)
    };
}

function displacementFunc(r, g, b, w, h, i, params) {
    const {
        rMod, gMod, bMod,
        wOffset, hOffset, iOffset,
        rMult, gMult, bMult,
        wMult, hMult, iMult,
        rRand, gRand, bRand,
        rCycle, hCycle
    } = params;

    const newR = mod(
        r + (((w * wMult + wOffset + i * iMult + iOffset) % rCycle) * rMult) + randint(0, rRand), rMod
    );

    const newG = mod(
        g + (((h * hMult + hOffset - i * iMult - iOffset) * gMult) + randint(0, gRand)), gMod
    );

    const newB = mod(
        b + ((((h % hCycle) * hMult + hOffset) - (w * wMult + wOffset)) * bMult + randint(0, bRand)), bMod
    );

    return [newR, newG, newB];
}

// Random palette like Python
function generatePalette(size) {
    const palette = [];
    for (let i = 0; i < size; i++) {
        palette.push(randint(0, 255), randint(0, 255), randint(0, 255));
    }
    return palette;
}

// Glitch image
function glitchImage(img, i, variantCount, paletteSize) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const params = getDisplacementParams();

    for (let w = 0; w < canvas.width; w++) {
        for (let h = 0; h < canvas.height; h++) {
            const idx = (h * canvas.width + w) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            const [nr, ng, nb] = displacementFunc(r, g, b, w, h, i, params);
            data[idx] = nr;
            data[idx + 1] = ng;
            data[idx + 2] = nb;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Palette reduction
    const palette = generatePalette(paletteSize);
    const newImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newData = newImageData.data;

    for (let p = 0; p < newData.length; p += 4) {
        const r = newData[p], g = newData[p + 1], b = newData[p + 2];
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

// Slider label updates
['variantCount','paletteSize','rMod','gMod','bMod','wOffset','hOffset','iOffset','rMult','gMult','bMult','wMult','hMult','iMult','rRand','gRand','bRand','rCycle','hCycle'].forEach(id=>{
    const slider = document.getElementById(id);
    const label = document.getElementById(id+'Value');
    slider.addEventListener('input', ()=>{ label.textContent = slider.value; });
});
// Generate button
document.getElementById('generateBtn').addEventListener('click', async ()=>{
    const fileInput = document.getElementById('imageInput');
    const results = document.getElementById('results');
    results.innerHTML='';
    if(fileInput.files.length===0) return alert("Upload an image!");

    const img = new Image();
    img.src = URL.createObjectURL(fileInput.files[0]);
    img.onload = async ()=>{
        const variantCount = parseInt(document.getElementById('variantCount').value);
        const paletteSize = parseInt(document.getElementById('paletteSize').value);
        const progressOverlay = document.getElementById('progressOverlay');
        progressOverlay.style.display='block';

        for(let i=1;i<=variantCount;i++){
            progressOverlay.textContent=`Generating: ${i} / ${variantCount}`;
            await new Promise(resolve=>setTimeout(resolve,10));
            const canvas = glitchImage(img,i,variantCount,paletteSize);
            const card = document.createElement('div');
            card.className='glitch-card';
            card.appendChild(canvas);
            const btn = document.createElement('button');
            btn.className='download-btn';
            btn.textContent='Download';
            btn.addEventListener('click',()=>{
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
