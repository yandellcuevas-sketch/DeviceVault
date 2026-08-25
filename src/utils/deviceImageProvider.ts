/**
 * DeviceImageProvider - Busqueda automatica de imagen por modelo de dispositivo.
 *
 * PRIVACIDAD: Solo envia Brand + Model + Color al buscador.
 * NUNCA envia IMEI, Serial, EID, datos de compra ni informacion personal.
 *
 * Fuentes autorizadas:
 * 1. Wikimedia Commons API (CORS habilitado, imagenes libres)
 * 2. DuckDuckGo Instant Answer API (CORS habilitado, sin API key)
 */

export interface DeviceImageResult {
  imageUrl: string;
  sourceUrl: string;
  sourceDomain: string;
  modelMatched: string;
  confidence: number;       // 0.0 - 1.0
  variantMatched: boolean;
  thumbnailUrl?: string;
}

export interface DeviceImageSearchParams {
  brand: string;
  model: string;
  color?: string;
}

// MIME types de imagen permitidos para almacenamiento
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// Tamano maximo de imagen remota a descargar (5 MB)
const MAX_REMOTE_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Calcula un score de confianza entre 0 y 1 basado en
 * que tan bien el titulo del resultado coincide con la busqueda.
 */
export function calculateConfidence(
  title: string,
  params: DeviceImageSearchParams
): { confidence: number; variantMatched: boolean } {
  const titleLower = title.toLowerCase();
  const brandLower = params.brand.toLowerCase();
  const modelLower = params.model.toLowerCase();
  const colorLower = (params.color || '').toLowerCase();

  let score = 0;

  // Marca exacta (0.30)
  if (titleLower.includes(brandLower)) score += 0.30;

  // Modelo exacto — dividir en tokens para mayor precision
  const modelTokens = modelLower.split(/\s+/).filter((t) => t.length > 1);
  const matchedTokens = modelTokens.filter((token) => titleLower.includes(token));
  const modelScore = modelTokens.length > 0 ? (matchedTokens.length / modelTokens.length) * 0.50 : 0;
  score += modelScore;

  // Variante/color (0.15)
  let variantMatched = false;
  if (colorLower && titleLower.includes(colorLower)) {
    score += 0.15;
    variantMatched = true;
  }

  // Bonus: fuente de calidad (wikimedia) (0.05)
  // Se aplica externamente al agregar resultados

  return { confidence: Math.min(score, 1.0), variantMatched };
}

/**
 * Busca imagenes en Wikimedia Commons para el dispositivo dado.
 * Solo envia la consulta de texto: "Brand Model Color"
 */
export async function searchWikimediaCommons(
  params: DeviceImageSearchParams
): Promise<DeviceImageResult[]> {
  const query = [params.brand, params.model, params.color]
    .filter(Boolean)
    .join(' ');

  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('srsearch', query);
  url.searchParams.set('srnamespace', '6'); // Namespace 6 = File
  url.searchParams.set('srlimit', '8');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*'); // Required for CORS

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) throw new Error(`Wikimedia Commons error: ${response.status}`);

  const data = await response.json();
  const searchResults: Array<{ title: string; snippet: string }> = data?.query?.search || [];

  if (searchResults.length === 0) return [];

  // Para cada resultado, obtener la URL real de la imagen
  const titles = searchResults.map((r) => r.title).join('|');
  const imageInfoUrl = new URL('https://commons.wikimedia.org/w/api.php');
  imageInfoUrl.searchParams.set('action', 'query');
  imageInfoUrl.searchParams.set('titles', titles);
  imageInfoUrl.searchParams.set('prop', 'imageinfo');
  imageInfoUrl.searchParams.set('iiprop', 'url|mime|size');
  imageInfoUrl.searchParams.set('iiurlwidth', '800');
  imageInfoUrl.searchParams.set('format', 'json');
  imageInfoUrl.searchParams.set('origin', '*');

  const infoResponse = await fetch(imageInfoUrl.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!infoResponse.ok) throw new Error(`Wikimedia imageinfo error: ${infoResponse.status}`);

  const infoData = await infoResponse.json();
  const pages = infoData?.query?.pages || {};

  const results: DeviceImageResult[] = [];

  for (const page of Object.values(pages) as Array<Record<string, unknown>>) {
    const imageInfoArr = (page.imageinfo as Array<Record<string, unknown>> | undefined) || [];
    const info = imageInfoArr[0];
    if (!info) continue;

    const mime = info.mime as string | undefined;
    const imageUrl = (info.thumburl || info.url) as string | undefined;
    const sourceUrl = (page.title as string | undefined) || '';

    // Solo aceptar imagenes PNG, JPEG, WebP
    if (!mime || !ALLOWED_MIME_TYPES.includes(mime)) continue;
    if (!imageUrl) continue;

    const title = (page.title as string) || '';
    const { confidence, variantMatched } = calculateConfidence(title, params);

    // Bonus por fuente de calidad (wikimedia)
    const finalConfidence = Math.min(confidence + 0.05, 1.0);

    results.push({
      imageUrl,
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(sourceUrl)}`,
      sourceDomain: 'commons.wikimedia.org',
      modelMatched: title,
      confidence: finalConfidence,
      variantMatched,
      thumbnailUrl: info.thumburl as string | undefined,
    });
  }

  // Ordenar por confianza descendente
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Busca imagenes usando la API de DuckDuckGo Instant Answer.
 * No requiere API key. CORS habilitado.
 */
export async function searchDuckDuckGo(
  params: DeviceImageSearchParams
): Promise<DeviceImageResult[]> {
  const query = [params.brand, params.model, params.color, 'product image']
    .filter(Boolean)
    .join(' ');

  const url = new URL('https://api.duckduckgo.com/');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('no_html', '1');
  url.searchParams.set('skip_disambig', '1');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) throw new Error(`DuckDuckGo error: ${response.status}`);

  const data = await response.json();
  const results: DeviceImageResult[] = [];

  // AbstractImage: imagen principal del resultado
  if (data.Image && typeof data.Image === 'string' && data.Image.length > 0) {
    const { confidence, variantMatched } = calculateConfidence(
      (data.AbstractText || data.Heading || ''),
      params
    );
    if (confidence > 0.3) {
      results.push({
        imageUrl: data.Image,
        sourceUrl: data.AbstractURL || '',
        sourceDomain: data.AbstractSource || 'duckduckgo.com',
        modelMatched: data.Heading || query,
        confidence,
        variantMatched,
      });
    }
  }

  // RelatedTopics con imagenes
  const topics: Array<Record<string, unknown>> = data.RelatedTopics || [];
  for (const topic of topics) {
    if (topic.Icon && (topic.Icon as Record<string, unknown>).URL) {
      const iconUrl = (topic.Icon as Record<string, unknown>).URL as string;
      if (!iconUrl || iconUrl.length === 0) continue;
      const text = (topic.Text as string) || '';
      const { confidence, variantMatched } = calculateConfidence(text, params);
      if (confidence > 0.3) {
        results.push({
          imageUrl: iconUrl,
          sourceUrl: (topic.FirstURL as string) || '',
          sourceDomain: 'duckduckgo.com',
          modelMatched: text.slice(0, 100),
          confidence,
          variantMatched,
        });
      }
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Punto de entrada principal para buscar imagen de dispositivo.
 * Combina resultados de multiples fuentes y los ordena por confianza.
 * PRIVACIDAD: Solo envia brand+model+color. Nunca datos personales.
 */
export async function searchDeviceImage(
  params: DeviceImageSearchParams
): Promise<DeviceImageResult[]> {
  if (!params.brand.trim() || !params.model.trim()) {
    throw new Error('Se requiere al menos la marca y el modelo para buscar.');
  }

  const allResults: DeviceImageResult[] = [];

  // Fuente 1: Wikimedia Commons (alta calidad, PNG/WebP libres)
  try {
    const wikimediaResults = await searchWikimediaCommons(params);
    allResults.push(...wikimediaResults);
  } catch (_err) {
    // Continuar con siguiente fuente si falla
  }

  // Fuente 2: DuckDuckGo Instant Answer (fallback)
  if (allResults.length === 0) {
    try {
      const ddgResults = await searchDuckDuckGo(params);
      allResults.push(...ddgResults);
    } catch (_err) {
      // Ignorar errores del fallback
    }
  }

  return allResults.sort((a, b) => b.confidence - a.confidence).slice(0, 12);
}

/**
 * Descarga una imagen remota, valida su MIME real con magic bytes,
 * y la convierte a Data URL para almacenamiento offline en IndexedDB.
 *
 * SEGURIDAD: Valida magic bytes reales del archivo, no solo el Content-Type.
 */
export async function fetchAndValidateRemoteImage(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`No se pudo descargar la imagen: HTTP ${response.status}`);
  }

  // Verificar Content-Length antes de descargar todo
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_REMOTE_IMAGE_SIZE) {
    throw new Error('La imagen es demasiado grande para almacenar (max 5 MB).');
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_REMOTE_IMAGE_SIZE) {
    throw new Error('La imagen descargada excede el tamano maximo permitido (5 MB).');
  }

  // Validar magic bytes reales
  const bytes = new Uint8Array(arrayBuffer);
  const detectedMime = detectMimeFromMagicBytes(bytes);

  if (!detectedMime) {
    throw new Error('El archivo descargado no es una imagen valida (PNG, JPEG, o WebP).');
  }

  // Convertir a Blob y luego a Data URL
  const blob = new Blob([arrayBuffer], { type: detectedMime });
  return blobToDataUrl(blob);
}

/**
 * Detecta el tipo MIME real de un archivo usando sus primeros bytes (magic bytes).
 * Retorna el MIME type si es imagen valida, o null si no es reconocido.
 */
export function detectMimeFromMagicBytes(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 &&
    bytes[2] === 0x4E && bytes[3] === 0x47 &&
    bytes[4] === 0x0D && bytes[5] === 0x0A &&
    bytes[6] === 0x1A && bytes[7] === 0x0A
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 &&
    bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 &&
    bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  // GIF: GIF87a or GIF89a
  if (
    bytes[0] === 0x47 && bytes[1] === 0x49 &&
    bytes[2] === 0x46 && bytes[3] === 0x38
  ) {
    return 'image/gif';
  }

  return null;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error al convertir imagen a Data URL.'));
    reader.readAsDataURL(blob);
  });
}