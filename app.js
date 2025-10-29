// Halloween Costume Flex & Scare Generator
// Main application logic

let uploadedImage = null;
let selectedFilter = null;
let geminiAPI = null;
let faceDetection = null;
let detectedFaces = [];

// Jumpscare images (we'll create these dynamically)
const jumpscareFrames = [
    { type: 'skull', duration: 100 },
    { type: 'scream', duration: 100 },
    { type: 'monster', duration: 200 }
];

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    await initializeFaceDetection();
    setupUploadArea();
    setupFilterButtons();
    setupAPIHandling();
    setupGenerateButton();
    setupResultButtons();
});

// Initialize face detection
async function initializeFaceDetection() {
    try {
        faceDetection = new FaceDetection({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/${file}`;
            }
        });
        
        faceDetection.setOptions({
            model: 'short',
            minDetectionConfidence: 0.5,
        });
        
        faceDetection.onResults(onFaceDetectionResults);
        
        console.log('Face detection initialized successfully');
    } catch (error) {
        console.error('Face detection initialization failed:', error);
    }
}

function onFaceDetectionResults(results) {
    detectedFaces = results.detections || [];
}

// Upload handling
function setupUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });
}

function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        uploadedImage = new Image();
        uploadedImage.onload = async () => {
            // Detect faces in the uploaded image
            await detectFacesInImage();
            document.getElementById('controls').style.display = 'block';
            applyFilter();
        };
        uploadedImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function detectFacesInImage() {
    if (!faceDetection || !uploadedImage) return;
    
    try {
        // Create a temporary canvas to process the image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = uploadedImage.width;
        tempCanvas.height = uploadedImage.height;
        tempCtx.drawImage(uploadedImage, 0, 0);
        
        // Send image to face detection
        await faceDetection.send({ image: tempCanvas });
        console.log(`Detected ${detectedFaces.length} face(s)`);
    } catch (error) {
        console.error('Face detection failed:', error);
        detectedFaces = []; // Fallback to no face detection
    }
}

// Filter handling
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedFilter = button.dataset.filter;
            applyFilter();
        });
    });
}

function applyFilter() {
    if (!uploadedImage) return;
    
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const previewSection = document.getElementById('previewSection');
    
    previewSection.style.display = 'block';
    
    // Set canvas size to match image aspect ratio
    const maxSize = 600;
    let width = uploadedImage.width;
    let height = uploadedImage.height;
    
    if (width > height) {
        if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
        }
    } else {
        if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
        }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw the image
    ctx.drawImage(uploadedImage, 0, 0, width, height);
    
    // Apply selected filter
    if (selectedFilter) {
        applyHalloweenFilter(ctx, selectedFilter, width, height);
    }
}

function applyHalloweenFilter(ctx, filter, width, height) {
    // Get image data for manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    switch(filter) {
        case 'vampire':
            // Red tint with increased contrast
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.3);     // Red
                data[i + 1] = data[i + 1] * 0.6;            // Green
                data[i + 2] = data[i + 2] * 0.6;            // Blue
            }
            ctx.putImageData(imageData, 0, 0);
            
            // Add vampire fangs
            drawVampireFangs(ctx, width, height);
            break;
            
        case 'zombie':
            // Green tint with decay effect
            for (let i = 0; i < data.length; i += 4) {
                data[i] = data[i] * 0.7;                    // Red
                data[i + 1] = Math.min(255, data[i + 1] * 1.2); // Green
                data[i + 2] = data[i + 2] * 0.6;            // Blue
                
                // Add noise for decay effect
                if (Math.random() > 0.95) {
                    data[i] = data[i + 1] = data[i + 2] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            
            // Add zombie wounds
            drawZombieWounds(ctx, width, height);
            break;
            
        case 'ghost':
            // High brightness and transparency effect
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = Math.min(255, avg + 80);
                data[i + 1] = Math.min(255, avg + 90);
                data[i + 2] = Math.min(255, avg + 100);
                data[i + 3] = 200; // Slight transparency
            }
            ctx.putImageData(imageData, 0, 0);
            
            // Add ghostly aura
            addGhostlyAura(ctx, width, height);
            break;
            
        case 'pumpkin':
            // Orange tint
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.5);     // Red
                data[i + 1] = Math.min(255, data[i + 1] * 0.9); // Green
                data[i + 2] = data[i + 2] * 0.4;            // Blue
            }
            ctx.putImageData(imageData, 0, 0);
            
            // Add pumpkin overlay
            drawPumpkinOverlay(ctx, width, height);
            break;
            
        case 'witch':
            // Purple tint with mystical effect
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.1);     // Red
                data[i + 1] = data[i + 1] * 0.6;            // Green
                data[i + 2] = Math.min(255, data[i + 2] * 1.3); // Blue
            }
            ctx.putImageData(imageData, 0, 0);
            
            // Add witch hat and stars
            drawWitchEffects(ctx, width, height);
            break;
            
        case 'demon':
            // Intense red with hellfire effect
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.8);     // Red
                data[i + 1] = data[i + 1] * 0.3;            // Green
                data[i + 2] = data[i + 2] * 0.2;            // Blue
                
                // Add fire-like noise
                if (Math.random() > 0.92) {
                    data[i] = 255;
                    data[i + 1] = Math.random() * 100;
                    data[i + 2] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            
            drawDemonEffects(ctx, width, height);
            break;
            
        case 'skeleton':
            // High contrast black and white with bone structure
            for (let i = 0; i < data.length; i += 4) {
                const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const enhanced = gray > 128 ? 255 : 0;
                data[i] = enhanced;
                data[i + 1] = enhanced;
                data[i + 2] = enhanced;
            }
            ctx.putImageData(imageData, 0, 0);
            
            drawSkeletonEffects(ctx, width, height);
            break;
            
        case 'possessed':
            // Distorted with dark veins
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 0.8);     // Red
                data[i + 1] = Math.min(255, data[i + 1] * 0.5); // Green
                data[i + 2] = Math.min(255, data[i + 2] * 0.3); // Blue
                
                // Add dark veins
                if (Math.random() > 0.98) {
                    data[i] = data[i + 1] = data[i + 2] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
            
            drawPossessedEffects(ctx, width, height);
            break;
    }
    
    // Add creepy border
    addCreepyBorder(ctx, width, height);
}

// Filter effect helpers with face detection
function drawVampireFangs(ctx, width, height) {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'darkred';
    ctx.lineWidth = 2;
    
    if (detectedFaces.length > 0) {
        // Use detected face positions for accurate fang placement
        detectedFaces.forEach(face => {
            const bbox = face.boundingBox;
            const faceX = bbox.xCenter * width;
            const faceY = bbox.yCenter * height;
            const faceWidth = bbox.width * width;
            const faceHeight = bbox.height * height;
            
            // Position fangs based on detected mouth area
            const mouthY = faceY + faceHeight * 0.15;
            
            // Left fang
            ctx.beginPath();
            ctx.moveTo(faceX - faceWidth * 0.15, mouthY);
            ctx.lineTo(faceX - faceWidth * 0.1, mouthY + faceHeight * 0.25);
            ctx.lineTo(faceX - faceWidth * 0.05, mouthY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Right fang
            ctx.beginPath();
            ctx.moveTo(faceX + faceWidth * 0.05, mouthY);
            ctx.lineTo(faceX + faceWidth * 0.1, mouthY + faceHeight * 0.25);
            ctx.lineTo(faceX + faceWidth * 0.15, mouthY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Add blood drips
            ctx.fillStyle = 'darkred';
            ctx.beginPath();
            ctx.arc(faceX - faceWidth * 0.1, mouthY + faceHeight * 0.35, 3, 0, Math.PI * 2);
            ctx.arc(faceX + faceWidth * 0.1, mouthY + faceHeight * 0.35, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    } else {
        // Fallback to original positioning
        // Left fang
        ctx.beginPath();
        ctx.moveTo(width * 0.35, height * 0.4);
        ctx.lineTo(width * 0.37, height * 0.5);
        ctx.lineTo(width * 0.39, height * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Right fang
        ctx.beginPath();
        ctx.moveTo(width * 0.61, height * 0.4);
        ctx.lineTo(width * 0.63, height * 0.5);
        ctx.lineTo(width * 0.65, height * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

function drawZombieWounds(ctx, width, height) {
    ctx.fillStyle = 'rgba(139, 0, 0, 0.6)';
    
    // Random wounds
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 20 + 10;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function addGhostlyAura(ctx, width, height) {
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    gradient.addColorStop(0, 'rgba(200, 200, 255, 0)');
    gradient.addColorStop(1, 'rgba(200, 200, 255, 0.5)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function drawPumpkinOverlay(ctx, width, height) {
    ctx.strokeStyle = 'rgba(255, 140, 0, 0.8)';
    ctx.lineWidth = 3;
    
    // Draw pumpkin lines
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(width * (i / 4), 0);
        ctx.quadraticCurveTo(width * (i / 4), height / 2, width * (i / 4), height);
        ctx.stroke();
    }
}

function drawWitchEffects(ctx, width, height) {
    // Draw stars
    ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        drawStar(ctx, x, y, 5, 10, 5);
    }
}

function drawDemonEffects(ctx, width, height) {
    if (detectedFaces.length > 0) {
        detectedFaces.forEach(face => {
            const bbox = face.boundingBox;
            const faceX = bbox.xCenter * width;
            const faceY = bbox.yCenter * height;
            const faceWidth = bbox.width * width;
            const faceHeight = bbox.height * height;
            
            // Demon horns
            ctx.fillStyle = 'black';
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            
            // Left horn
            ctx.beginPath();
            ctx.moveTo(faceX - faceWidth * 0.2, faceY - faceHeight * 0.4);
            ctx.lineTo(faceX - faceWidth * 0.15, faceY - faceHeight * 0.6);
            ctx.lineTo(faceX - faceWidth * 0.1, faceY - faceHeight * 0.35);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Right horn
            ctx.beginPath();
            ctx.moveTo(faceX + faceWidth * 0.1, faceY - faceHeight * 0.35);
            ctx.lineTo(faceX + faceWidth * 0.15, faceY - faceHeight * 0.6);
            ctx.lineTo(faceX + faceWidth * 0.2, faceY - faceHeight * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Glowing red eyes
            ctx.fillStyle = 'red';
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(faceX - faceWidth * 0.1, faceY - faceHeight * 0.1, 8, 0, Math.PI * 2);
            ctx.arc(faceX + faceWidth * 0.1, faceY - faceHeight * 0.1, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }
    
    // Hellfire background effect
    ctx.globalCompositeOperation = 'overlay';
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, 'rgba(255, 69, 0, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
}

function drawSkeletonEffects(ctx, width, height) {
    if (detectedFaces.length > 0) {
        detectedFaces.forEach(face => {
            const bbox = face.boundingBox;
            const faceX = bbox.xCenter * width;
            const faceY = bbox.yCenter * height;
            const faceWidth = bbox.width * width;
            const faceHeight = bbox.height * height;
            
            // Skull features
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.fillStyle = 'black';
            
            // Eye sockets (larger and darker)
            ctx.beginPath();
            ctx.arc(faceX - faceWidth * 0.12, faceY - faceHeight * 0.1, faceWidth * 0.08, 0, Math.PI * 2);
            ctx.arc(faceX + faceWidth * 0.12, faceY - faceHeight * 0.1, faceWidth * 0.08, 0, Math.PI * 2);
            ctx.fill();
            
            // Nasal cavity
            ctx.beginPath();
            ctx.moveTo(faceX, faceY);
            ctx.lineTo(faceX - faceWidth * 0.03, faceY + faceHeight * 0.15);
            ctx.lineTo(faceX + faceWidth * 0.03, faceY + faceHeight * 0.15);
            ctx.closePath();
            ctx.fill();
            
            // Jaw line with teeth
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(faceX - faceWidth * 0.2, faceY + faceHeight * 0.25);
            ctx.lineTo(faceX + faceWidth * 0.2, faceY + faceHeight * 0.25);
            ctx.stroke();
            
            // Individual teeth
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            for (let i = -3; i <= 3; i++) {
                const toothX = faceX + i * (faceWidth * 0.06);
                const toothY = faceY + faceHeight * 0.25;
                ctx.fillRect(toothX - 3, toothY, 6, 15);
                ctx.strokeRect(toothX - 3, toothY, 6, 15);
            }
        });
    }
    
    // Bone texture overlay
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillStyle = 'rgba(220, 220, 220, 0.1)';
        ctx.fillRect(x, y, Math.random() * 50 + 20, 3);
    }
    ctx.globalCompositeOperation = 'source-over';
}

function drawPossessedEffects(ctx, width, height) {
    if (detectedFaces.length > 0) {
        detectedFaces.forEach(face => {
            const bbox = face.boundingBox;
            const faceX = bbox.xCenter * width;
            const faceY = bbox.yCenter * height;
            const faceWidth = bbox.width * width;
            const faceHeight = bbox.height * height;
            
            // Black veins around eyes
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const eyeX = faceX + (i < 4 ? -faceWidth * 0.1 : faceWidth * 0.1);
                const eyeY = faceY - faceHeight * 0.1;
                
                ctx.beginPath();
                ctx.moveTo(eyeX, eyeY);
                ctx.lineTo(
                    eyeX + Math.cos(angle) * faceWidth * 0.15,
                    eyeY + Math.sin(angle) * faceHeight * 0.1
                );
                ctx.stroke();
            }
            
            // Blackened eye sockets
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(faceX - faceWidth * 0.1, faceY - faceHeight * 0.1, faceWidth * 0.06, 0, Math.PI * 2);
            ctx.arc(faceX + faceWidth * 0.1, faceY - faceHeight * 0.1, faceWidth * 0.06, 0, Math.PI * 2);
            ctx.fill();
            
            // Cracked mouth
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(faceX - faceWidth * 0.1, faceY + faceHeight * 0.2);
            ctx.quadraticCurveTo(faceX, faceY + faceHeight * 0.25, faceX + faceWidth * 0.1, faceY + faceHeight * 0.2);
            ctx.stroke();
        });
    }
    
    // Dark energy swirls
    ctx.strokeStyle = 'rgba(25, 25, 112, 0.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
        const centerX = Math.random() * width;
        const centerY = Math.random() * height;
        const radius = Math.random() * 80 + 40;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function addCreepyBorder(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(139, 0, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0.8)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, width - 10, height - 10);
}

// Gemini API handling
function setupAPIHandling() {
    const testBtn = document.getElementById('testApi');
    
    testBtn.addEventListener('click', async () => {
        const apiKey = document.getElementById('apiKey').value;
        if (!apiKey) {
            alert('Please enter your Gemini API key!');
            return;
        }
        
        try {
            // Note: This is a simplified test. In production, you'd want proper error handling
            const { GoogleGenerativeAI } = window;
            geminiAPI = new GoogleGenerativeAI(apiKey);
            alert('API key validated! Ready to roast your costume! 🔥');
        } catch (error) {
            alert('Invalid API key. Please check and try again.');
            console.error(error);
        }
    });
}

async function generateAIRoast() {
    if (!geminiAPI || !uploadedImage) return null;
    
    try {
        const model = geminiAPI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `You are a sassy Halloween party judge. Give a funny, witty, and slightly roasting comment about someone's Halloween costume in 2-3 sentences. Be creative and humorous but keep it light-hearted and fun. Include Halloween puns and emojis. The person is wearing a ${selectedFilter || 'spooky'} themed costume.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('AI roast generation failed:', error);
        return "Your costume is so scary, even the AI is too frightened to comment! 👻 (But seriously, you look spook-tacular!)";
    }
}

// GIF generation
function setupGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    
    generateBtn.addEventListener('click', async () => {
        if (!uploadedImage) {
            alert('Please upload an image first!');
            return;
        }
        
        const loading = document.getElementById('loading');
        loading.style.display = 'flex';
        
        // Generate AI roast if API is available
        const aiResponse = await generateAIRoast();
        if (aiResponse) {
            document.getElementById('aiResponse').innerHTML = `<h3>AI Judge Says:</h3><p>${aiResponse}</p>`;
        }
        
        // Generate the GIF with jumpscare
        await generateScaryGIF();
        
        loading.style.display = 'none';
    });
}

async function generateScaryGIF() {
    const canvas = document.getElementById('canvas');
    const jumpscareCanvas = document.getElementById('jumpscareCanvas');
    const jumpCtx = jumpscareCanvas.getContext('2d');
    
    // Set jumpscare canvas size to match main canvas
    jumpscareCanvas.width = canvas.width;
    jumpscareCanvas.height = canvas.height;
    
    // Create GIF with optimized settings
    const gif = new GIF({
        workers: 4, // Use more workers for faster processing
        quality: 15, // Slightly lower quality for faster generation
        width: canvas.width,
        height: canvas.height,
        workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js',
        dither: false, // Disable dithering for faster processing
        transparent: null
    });
    
    // Add the costume image for 2 seconds (reduce frames for faster generation)
    for (let i = 0; i < 10; i++) {
        gif.addFrame(canvas, { copy: true, delay: 200 }); // Use longer delay, fewer frames
    }
    
    // Create and add jumpscare frames
    createJumpscareFrame(jumpCtx, canvas.width, canvas.height);
    
    // Add jumpscare frames with shorter delay for impact
    for (let i = 0; i < 5; i++) {
        gif.addFrame(jumpscareCanvas, { copy: true, delay: 50 });
    }
    
    // Add multiple bloody transition frames for more intense effect
    for (let i = 0; i < 3; i++) {
        createBloodyTransition(jumpCtx, canvas.width, canvas.height, i);
        gif.addFrame(jumpscareCanvas, { copy: true, delay: 100 });
    }
    
    // Add a final creepy message frame
    createFinalFrame(jumpCtx, canvas.width, canvas.height);
    gif.addFrame(jumpscareCanvas, { copy: true, delay: 1000 });
    
    gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        showResult(url);
    });
    
    gif.on('progress', (progress) => {
        // Update loading text with progress
        const loadingText = document.querySelector('.loading p');
        if (loadingText) {
            loadingText.textContent = `Summoning the spirits... ${Math.round(progress * 100)}% 👻`;
        }
    });
    
    gif.render();
}

function createJumpscareFrame(ctx, width, height) {
    // Create multiple bloody frames for more intense effect
    createBloodySplatterBackground(ctx, width, height);
    
    // Draw scary face
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Scary face
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 5;
    
    // Head
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(width, height) * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Eyes (hollow)
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(centerX - width * 0.1, centerY - height * 0.05, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + width * 0.1, centerY - height * 0.05, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Scary mouth
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(centerX - width * 0.15, centerY + height * 0.05);
    ctx.quadraticCurveTo(centerX, centerY + height * 0.2, centerX + width * 0.15, centerY + height * 0.05);
    ctx.stroke();
    
    // Teeth
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
        const toothX = centerX + i * 20;
        const toothY = centerY + height * 0.08;
        ctx.beginPath();
        ctx.moveTo(toothX - 5, toothY);
        ctx.lineTo(toothX, toothY + 15);
        ctx.lineTo(toothX + 5, toothY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    // Scream text
    ctx.fillStyle = 'red';
    ctx.font = `bold ${Math.min(width, height) * 0.15}px Creepster`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('BOO!', centerX, height * 0.9);
    
    // Add noise effect
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() > 0.95) {
            const noise = Math.random() * 100;
            data[i] = Math.min(255, data[i] + noise);
            data[i + 1] = 0;
            data[i + 2] = 0;
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function createBloodySplatterBackground(ctx, width, height) {
    // Clear with black
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    
    // Create intense blood splatter patterns
    const bloodColors = ['#8B0000', '#A52A2A', '#DC143C', '#B22222', '#800000'];
    
    // Large blood splatters
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 80 + 30;
        const color = bloodColors[Math.floor(Math.random() * bloodColors.length)];
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add splatter details
        for (let j = 0; j < 8; j++) {
            const splatterX = x + (Math.random() - 0.5) * size * 2;
            const splatterY = y + (Math.random() - 0.5) * size * 2;
            const splatterSize = Math.random() * 20 + 5;
            
            ctx.beginPath();
            ctx.arc(splatterX, splatterY, splatterSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Blood drips
    ctx.fillStyle = '#8B0000';
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * width;
        const startY = Math.random() * height * 0.3;
        const endY = height;
        const dripWidth = Math.random() * 8 + 4;
        
        ctx.fillRect(x, startY, dripWidth, endY - startY);
        
        // Blood drop at bottom
        ctx.beginPath();
        ctx.arc(x + dripWidth/2, endY, dripWidth, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createBloodyTransition(ctx, width, height, frame) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    
    // Animated blood explosion effect
    const intensity = (frame + 1) * 0.3;
    const bloodParticles = 50 + frame * 20;
    
    for (let i = 0; i < bloodParticles; i++) {
        const angle = (i / bloodParticles) * Math.PI * 2;
        const distance = Math.random() * width * intensity;
        const x = width/2 + Math.cos(angle) * distance;
        const y = height/2 + Math.sin(angle) * distance;
        const size = Math.random() * 15 + 5;
        
        ctx.fillStyle = `rgba(139, 0, 0, ${1 - distance/(width * intensity)})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Central blood burst
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * intensity);
    gradient.addColorStop(0, 'rgba(220, 20, 60, 0.9)');
    gradient.addColorStop(0.5, 'rgba(139, 0, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Flash effect
    if (frame === 1) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, 0, width, height);
    }
}

function createFinalFrame(ctx, width, height) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    
    // Creepy message
    ctx.fillStyle = 'red';
    ctx.font = `${Math.min(width, height) * 0.08}px Creepster`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const messages = [
        "GOTCHA! 😈",
        "Sweet Dreams... 👻",
        "See you in your nightmares! 💀",
        "Happy Halloween! 🎃"
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    ctx.fillText(message, width / 2, height / 2);
    
    // Add creepy eyes in corners
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(20, 20, 10, 0, Math.PI * 2);
    ctx.arc(width - 20, 20, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(20, 20, 5, 0, Math.PI * 2);
    ctx.arc(width - 20, 20, 5, 0, Math.PI * 2);
    ctx.fill();
}

// Result handling
function showResult(gifUrl) {
    const resultSection = document.getElementById('resultSection');
    const resultGif = document.getElementById('resultGif');
    
    resultSection.style.display = 'block';
    resultGif.src = gifUrl;
    
    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

function setupResultButtons() {
    const downloadBtn = document.getElementById('downloadBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    
    downloadBtn.addEventListener('click', () => {
        const resultGif = document.getElementById('resultGif');
        const link = document.createElement('a');
        link.download = 'halloween-flex-scare.gif';
        link.href = resultGif.src;
        link.click();
    });
    
    copyLinkBtn.addEventListener('click', () => {
        // In a real app, you'd upload to a service and get a shareable link
        const dummyLink = 'https://your-halloween-app.com/share/' + Math.random().toString(36).substr(2, 9);
        navigator.clipboard.writeText(dummyLink).then(() => {
            alert('Link copied! (Note: This is a demo link)');
        });
    });
    
    tryAgainBtn.addEventListener('click', () => {
        location.reload();
    });
}

// Halloween easter egg: random spooky sounds on hover
document.addEventListener('DOMContentLoaded', () => {
    const spookySounds = ['👻', '🎃', '💀', '🦇', '🕷️', '⚰️', '🧟', '🧛'];
    
    document.body.addEventListener('mousemove', (e) => {
        if (Math.random() > 0.995) {
            const emoji = document.createElement('div');
            emoji.textContent = spookySounds[Math.floor(Math.random() * spookySounds.length)];
            emoji.style.position = 'fixed';
            emoji.style.left = e.clientX + 'px';
            emoji.style.top = e.clientY + 'px';
            emoji.style.fontSize = '30px';
            emoji.style.pointerEvents = 'none';
            emoji.style.animation = 'float 2s ease-out forwards';
            emoji.style.zIndex = '9999';
            
            document.body.appendChild(emoji);
            
            setTimeout(() => emoji.remove(), 2000);
        }
    });
});

// Add floating animation for emojis
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        to {
            transform: translateY(-100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);