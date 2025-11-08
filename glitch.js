// Utility function
function mod(n, m) {
    return ((n % m) + m) % m;
}

// Glitch displacement function with dynamic modulo values
function displacementFunc(r, g, b, w, h, i, rMod, gMod, bMod) {
    const newR = mod(r + ((w + 1 + i) % 14), rMod);
    const newG = mod(g + h - i, gMod);
    const newB = mod(b + (h % 55) - w, bMod);
    return [newR, newG, newB];
}

// Palette reduction
function quantizeImage(imageData, paletteSize = 6) {
    const pixels = [];
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        pixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    const clusters = [];
    for (let i = 0; i < paletteSize; i++) {
        clusters.push(pixels[Math.floor(Math.random() * pixels.length)]);
    }

    const maxIter = 10;
    for (let iter = 0; iter < maxIter; iter++) {
        const newClusters = clusters.map(c => [0,0,0,0]);
        pixels.forEach(p => {
            let minDist = Infinity, idx = 0;
            clusters.forEach((c,j) => {
                const d = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2;
                if(d < minDist){ minDist=d; idx=j;}
            });
            newClusters[idx][0]+=p[0]; newClusters[idx][1]+=p[1]; newClusters[idx][2]+=p[2]; newClusters[idx][3]+=1;
        });
        clusters.forEach((c,i)=>{
            if(newClusters[i][3]>0){
                c[0]=Math.floor(newClusters[i][0]/newClusters[i][3]);
                c[1]=Math.floor(newClusters[i][1]/newClusters[i][3]);
                c[2]=Math.floor(newClusters[i][2]/newClusters[i][3]);
            }
        });
    }

    // Map pixels to nearest cluster
    for (let i = 0; i < pixels.length; i++) {
        let minDist = Infinity, idx=0;
        clusters.forEach((c,j)=>{
            const d=(pixels[i][0]-c[0])**2+(pixels[i][1]-c[1])**2+(pixels[i][2]-c[2])**2;
            if(d<minDist){minDist=d; idx=j;}
        });
        data[i*4]=clusters[idx][0];
        data[i*4+1]=clusters[idx][1];
        data[i*4+2]=clusters[idx][2];
    }

    return imageData;
}

// Apply glitch effect
function glitchImage(img, i, rMod, gMod, bMod, paletteSize) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const data = imageData.data;

    for(let w=0; w<canvas.width; w++){
        for(let h=0; h<canvas.height; h++){
            const idx=(h*canvas.width+w)*4;
            const r=data[idx], g=data[idx+1], b=data[idx+2];
            const [nr, ng, nb]=displacementFunc(r,g,b,w,h,i,rMod,gMod,bMod);
            data[idx]=nr; data[idx+1]=ng; data[idx+2]=nb;
        }
    }

    ctx.putImageData(imageData, 0,0);

    const reduced = quantizeImage(ctx.getImageData(0,0,canvas.width,canvas.height), paletteSize);
    ctx.putImageData(reduced,0,0);

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
