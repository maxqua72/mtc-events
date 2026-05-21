// server/api/admin/sync-legal.post.ts
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export default defineEventHandler(async (event) => {

  console.log('============= [SYNC LEGAL START] =============');
  console.log(`[DEBUG] process.cwd(): ${process.cwd()}`);
  console.log(`[DEBUG] __dirname (se disponibile): ${typeof __dirname !== 'undefined' ? __dirname : 'N/A'}`);

  // 1. Recupero database e corpo della richiesta
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' });

  const body = await readBody(event);
  const { type, version } = body; // es: type: 'terms', version: '1.0'

  console.log(`[DEBUG] Parametri ricevuti -> type: "${type}", version: "${version}"`);

  if (!type || !version) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo documento e versione sono obbligatori' });
  }

  // 2. Costruzione dei percorsi secondo la nuova struttura affiancata
  const versionSlug = version.replace(/\./g, '_');
  const pdfFileName = `${type}_v${versionSlug}.pdf`;
  const htmlFileName = `${type}_v${versionSlug}.html`;

  const relativePdfPath = `/legal/${type}/${pdfFileName}`;

  // 🛡️ STRATEGIA DINAMICA PER I PERCORSI (Risolve il bug di .output)
  const pathInRoot = path.join(process.cwd(), 'public', relativePdfPath);
  const pathInOutput = path.join(process.cwd(), '.output', 'public', 'legal', type, pdfFileName);

  //const absolutePdfPath = path.join(process.cwd(), 'public', relativePdfPath);
  //const absoluteHtmlPath = path.join(process.cwd(), 'public', 'legal', type, htmlFileName);

  let absolutePdfPath = '';
  let absoluteHtmlPath = '';

  // Controlliamo se esiste il file in .output/public (Produzione)
  const existsInOutput = await fs.access(pathInOutput).then(() => true).catch(() => false);

  if (existsInOutput) {
    console.log(`[DEBUG] Ambiente di Produzione rilevato. Uso i file dentro .output/public`);
    absolutePdfPath = pathInOutput;
    absoluteHtmlPath = path.join(process.cwd(), '.output', 'public', 'legal', type, htmlFileName);
  } else {
    console.log(`[DEBUG] Ambiente Locale/Sviluppo rilevato. Uso i file dentro public/`);
    absolutePdfPath = pathInRoot;
    absoluteHtmlPath = path.join(process.cwd(), 'public', 'legal', type, htmlFileName);
  }

  // 🔍 LOG PERCORSI CALCOLATI: Vedrai l'esatta stringa che Node.js passa al sistema operativo
  console.log(`[DEBUG] Percorso assoluto PDF atteso:  ${absolutePdfPath}`);
  console.log(`[DEBUG] Percorso assoluto HTML atteso: ${absoluteHtmlPath}`);

  try {
    // 3. Lettura del file PDF fisico e calcolo automatico dell'Hash SHA-256
    console.log(`[SYNC LEGAL] Sincronizzazione documento legale: ${type} v${version}`);
    const pdfBuffer = await fs.readFile(absolutePdfPath);
    const hashSum = createHash('sha256');
    hashSum.update(pdfBuffer);
    const calculatedHash = hashSum.digest('hex');

    console.log(`[SYNC LEGAL] Hash calcolato: ${calculatedHash} per il file ${pdfFileName}`);

    // 4. Lettura del file HTML pre-compilato (Sostituisce tutto il blocco PDF.js)
    let contentHtml = '';
    try {
      contentHtml = await fs.readFile(absoluteHtmlPath, 'utf-8');
    } catch (htmlError: any) {
      if (htmlError.code === 'ENOENT') {
        throw createError({
          statusCode: 404,
          statusMessage: `File HTML non trovato: /legal/${type}/${htmlFileName}. Assicurati di averlo inserito accanto al PDF.`
        });
      }
      throw htmlError;
    }

    // 5. Operazione Atomica sul DB
    // Disattiviamo tutte le versioni precedenti dello stesso tipo
    await db.collection('legal_documents').updateMany(
      { type },
      { $set: { is_active: false } }
    );

    console.log(`[SYNC LEGAL] Versioni precedenti di ${type} disattivate.`);

    // Inseriamo il nuovo record prendendo il codice HTML puro dal file fisco
    const newDoc = {
      type,
      version,
      hash: calculatedHash,
      file_url: relativePdfPath,
      content_html: contentHtml, // Contiene il codice HTML esatto che hai scritto nel file
      is_active: true,
      updated_at: new Date()
    };

    await db.collection('legal_documents').insertOne(newDoc);

    console.log(`[SYNC LEGAL] Nuovo documento ${type} v${version} inserito con successo.`);

    return { 
      success: true, 
      type, 
      version, 
      hash: calculatedHash
    };

  } catch (error: any) {
    // Se il file PDF originale non esiste
    if (error.code === 'ENOENT') {
      throw createError({ 
        statusCode: 404, 
        statusMessage: `File PDF non trovato: ${relativePdfPath}. Assicurati di averlo inserito nel commit.` 
      });
    }
    
    // Se è un errore di Nuxt già creato, lo rilanciamo direttamente
    if (error.statusCode) throw error;

    console.error('[SYNC LEGAL ERROR]', error);
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Errore interno durante la sincronizzazione dei documenti' 
    });
  }
});