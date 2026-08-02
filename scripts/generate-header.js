/**
 * Script Oficial de Geração do Cabeçalho da Auto Elétrica Sérgio Car
 * 
 * Processa a imagem original da marca, remove o fundo não transparente,
 * aplica os contatos atualizados (WhatsApp 48 99172-7541 e CEP 88131-400)
 * e exporta para `public/sergiocar-header.png` com transparência PNG limpa.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '..', 'imagens', 'WhatsApp Image 2026-08-01 at 23.25.20.jpeg');
const outputPath = path.join(__dirname, '..', 'public', 'sergiocar-header.png');

async function generateHeader() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Imagem original não encontrada em: ${inputPath}`);
    return;
  }

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // 1. Remover fundo cinza/off-white escaneado (>200)
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const isYellow = (r > 180 && g > 180 && b < 140);
    const isLightGreyBackground = (r > 200 && g > 200 && b > 200);

    if (isLightGreyBackground && !isYellow) {
      const brightness = (r + g + b) / 3;
      if (brightness > 230) {
        data[i + 3] = 0;
      } else {
        const alpha = Math.max(0, Math.min(255, Math.round((230 - brightness) * 10)));
        data[i + 3] = alpha;
      }
    }
  }

  const bgBuffer = await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();

  // SVG para substituir o número de telefone e endereço/CEP atualizados
  const svgOverlay = `
    <svg width="${width}" height="${height}">
      <style>
        .phone { font-family: 'Arial Black', 'Impact', sans-serif; font-size: 82px; font-weight: 900; fill: #000000; letter-spacing: -1px; }
        .address { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 42px; font-weight: normal; fill: #000000; letter-spacing: 0px; }
      </style>

      <!-- Limpar área do telefone antigo -->
      <rect x="660" y="315" width="900" height="150" fill="#ffffff" />

      <g transform="translate(680, 340)">
        <!-- Ícone do WhatsApp -->
        <g transform="translate(0, 10) scale(3.5)">
          <path fill="#25D366" d="M12.031 2c-5.514 0-9.999 4.486-9.999 10.002 0 1.761.459 3.477 1.332 4.992l-1.364 4.985 5.111-1.34c1.464.799 3.111 1.22 4.92 1.22 5.514 0 10-4.486 10-10.002 0-5.516-4.486-10.002-10-10.002zm5.824 14.159c-.244.688-1.206 1.309-1.97 1.472-.524.111-1.207.202-3.504-.748-2.937-1.216-4.832-4.2-4.978-4.396-.145-.195-1.192-1.587-1.192-3.027 0-1.44.755-2.148 1.025-2.438.27-.291.591-.364.787-.364.195 0 .391.002.562.01.18.009.421-.068.659.504.244.585.83 2.028.903 2.176.073.147.122.319.024.515-.098.195-.147.318-.293.489-.147.172-.309.384-.44.515-.147.147-.301.307-.129.602.172.294.767 1.266 1.645 2.05 1.129 1.006 2.081 1.318 2.375 1.464.294.147.466.123.638-.073.172-.196.735-.857.931-1.151.196-.294.392-.245.662-.147.27.098 1.716.809 2.01.956.294.147.489.221.562.343.073.123.073.712-.171 1.401z"/>
        </g>
        
        <!-- Texto Telefone com WhatsApp -->
        <text x="110" y="78" class="phone">(48) 99172-7541</text>
      </g>

      <!-- Limpar área do CEP/Endereço antigo e desenhar o novo CEP 88131-400 -->
      <rect x="0" y="475" width="${width}" height="110" fill="#ffffff" />
      <text x="${width / 2}" y="542" text-anchor="middle" class="address">Rua Jacob Weingartner, 4198 - Centro - 88131-400 - Palhoça/SC</text>
    </svg>
  `;

  const compositedBuffer = await sharp(bgBuffer)
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .png()
    .toBuffer();

  const finalRaw = await sharp(compositedBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < finalRaw.data.length; i += 4) {
    const r = finalRaw.data[i];
    const g = finalRaw.data[i + 1];
    const b = finalRaw.data[i + 2];
    const isYellow = (r > 180 && g > 180 && b < 140);
    const isGreen = (g > 150 && r < 100);
    const isWhiteOrLight = (r > 220 && g > 220 && b > 220);

    if (isWhiteOrLight && !isYellow && !isGreen) {
      finalRaw.data[i + 3] = 0;
    }
  }

  const cleanedFinal = await sharp(finalRaw.data, { raw: { width: finalRaw.info.width, height: finalRaw.info.height, channels: 4 } })
    .png()
    .toBuffer();

  const targetWidth = 1250;
  const targetHeight = Math.round(height * (targetWidth / width) * 0.82);

  await sharp(cleanedFinal)
    .resize(targetWidth, targetHeight, { fit: 'fill', kernel: 'lanczos3' })
    .png()
    .toFile(outputPath);

  console.log(`[SUCESSO] Cabeçalho gerado com sucesso em: ${outputPath}`);
}

generateHeader().catch(console.error);
