// server/api/admin/sync-legal.post.ts
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export default defineEventHandler(async (event) => {
  // 1. Recupero database e corpo della richiesta
  const db = await getDb()
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database non disponibile' });

  const body = await readBody(event);
  const { type, version } = body; // es: type: 'terms', version: '1.0'

  if (!type || !version) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo documento e versione sono obbligatori' });
  }

  // 2. Costruzione dei percorsi secondo la nuova struttura
  // File atteso: public/legal/{type}/v{version_con_underscore}.pdf
  const fileName = `${type}_v${version.replace(/\./g, '_')}.pdf`;
  const relativePath = `/legal/${type}/${fileName}`;
  const absolutePath = path.join(process.cwd(), 'public', relativePath);

  try {
    // 3. Lettura del file fisico dal pacchetto di deploy
    const fileBuffer = await fs.readFile(absolutePath);

    // 4. Calcolo automatico dell'Hash SHA-256 (Impronta digitale)
    const hashSum = createHash('sha256');
    hashSum.update(fileBuffer);
    const calculatedHash = hashSum.digest('hex');

    // 2. Estrazione Testo con PDF.js
    const data = new Uint8Array(fileBuffer);
    const loadingTask = pdfjs.getDocument({ 
      data,
      useSystemFonts: true,
      disableFontFace: true 
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';

    // Cicliamo su tutte le pagine
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      /*const textContent = await page.getTextContent();
      
      // Estraiamo le stringhe di testo
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      */
      // Invece di join(' '), usiamo una logica che preserva i ritorni a capo
      const textContent = await page.getTextContent();

      let pageText = '';

      for (const item of textContent.items as any[]) {
        // 1. Verifichiamo che l'item contenga effettivamente del testo
        const hasText = typeof item.str === 'string';
        
        if (hasText) {
          pageText += item.str;
        }

        // 2. Gestiamo il ritorno a capo (hasEOL è presente anche su oggetti non testuali)
        if (item.hasEOL) {
          pageText += '\n';
        } else if (hasText && !item.str.endsWith(' ')) {
          // Aggiungiamo lo spazio solo se l'item attuale è testo e non finisce già con uno spazio
          pageText += ' ';
        }
      }

      // 3. Pulizia finale per evitare i "finti" a capo a metà frase
      // Unisce le righe che non terminano con punteggiatura forte (., !, ?, :)
      //const cleanedPageText = pageText
      //  .replace(/([^\.\!\?\:\d])\n([a-z0-9])/gi, '$1 $2') // Incolla righe spezzate
      //  .replace(/[ ]+/g, ' '); // Rimuove spazi doppi

      const cleanedPageText = pageText
        .split('\n')
        .map((line, index, array) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return '';

          // IDENTIFICAZIONE TITOLO:
          // Una riga è un titolo se: inizia con un numero (1.), inizia con "Art.", 
          // o è molto corta e non finisce con punteggiatura.
          const isTitle = /^\d+\./.test(trimmedLine) || 
                          /^Art\./i.test(trimmedLine) || 
                          (trimmedLine.length < 50 && !/[.\!\?\:]/.test(trimmedLine));

          const nextLine = array[index + 1]?.trim() || '';
          
          // Se la riga attuale NON è un titolo e NON finisce con punteggiatura forte, 
          // e la riga successiva esiste, allora uniamo con uno spazio (senza \n)
          if (!isTitle && trimmedLine.length > 0 && !/[.\!\?\:]/.test(trimmedLine) && nextLine.length > 0) {
            return trimmedLine + ' ';
          }

          // In tutti gli altri casi (titoli o fine paragrafo), manteniamo il ritorno a capo
          return trimmedLine + '\n';
        })
        .join('')
        .replace(/[ ]+/g, ' ');


      fullText += cleanedPageText + '\n';
    }

    // 3. Formattazione HTML minimale
    /*
    const formattedHtml = fullText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => `<p class="mb-3">${line}</p>`)
      .join('');
    */
    const formattedHtml = fullText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Applichiamo la stessa logica per il rendering visuale
        const isTitle = /^\d+\./.test(line) || /^Art\./i.test(line) || (line.length < 50 && !/[.\!\?\:]/.test(line));
        
        if (isTitle) {
          // Forza il titolo su una nuova riga con stile grassetto
          return `<h3 class="font-bold text-chess-dark mt-6 mb-2 block w-full">${line}</h3>`;
        }

        return `<p class="mb-3 text-gray-700 leading-relaxed">${line}</p>`;
      })
      .join('');

    // 5. Operazione Atomica sul DB
    // Disattiviamo tutte le versioni precedenti dello stesso tipo
    await db.collection('legal_documents').updateMany(
      { type },
      { $set: { is_active: false } }
    );

    // Inseriamo il nuovo record con i metadati aggiornati
    const newDoc = {
      type,
      version,
      hash: calculatedHash,
      file_url: relativePath,
      content_html: formattedHtml,
      is_active: true,
      updated_at: new Date()
    };

    await db.collection('legal_documents').insertOne(newDoc);

    return { 
      success: true, 
      type, 
      version, 
      hash: calculatedHash
    };

  } catch (error: any) {
    // Se il file non esiste (es: non è stato incluso nel deploy)
    if (error.code === 'ENOENT') {
      throw createError({ 
        statusCode: 404, 
        statusMessage: `File non trovato: ${relativePath}. Assicurati di averlo inserito nel commit.` 
      });
    }
    console.log(error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Errore interno durante la sincronizzazione' 
    });
  }
});