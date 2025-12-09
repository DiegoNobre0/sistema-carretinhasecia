import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

@Injectable({
  providedIn: 'root'
})
export class PdfCompressService {

  constructor() {
    // Configura o "Worker" do PDF.js usando CDN para evitar erros de configuração no Angular
    // Isso é necessário para ler o PDF linha a linha
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  async compressPdf(file: File): Promise<File> {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Carrega o documento
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const totalPages = pdf.numPages;

        // Cria novo PDF A4
        const newPdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = newPdf.internal.pageSize.getWidth();
        const pdfHeight = newPdf.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          
          // Renderiza a página (Escala 1.5 mantém boa leitura mas baixo peso)
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ 
            canvasContext: context!, 
            viewport: viewport 
          }).promise;

          // Converte para JPG com 50% de qualidade (Aqui acontece a mágica da compressão)
          const imgData = canvas.toDataURL('image/jpeg', 0.5); 

          if (i > 1) newPdf.addPage();
          newPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }

        // Gera o arquivo final reduzido
        const compressedBlob = newPdf.output('blob');
        
        const compressedFile = new File([compressedBlob], file.name, {
          type: 'application/pdf',
          lastModified: Date.now()
        });

        resolve(compressedFile);

      } catch (error) {
        console.error('Erro ao comprimir PDF:', error);
        // Se der erro, devolve o arquivo original para não travar o usuário
        resolve(file); 
      }
    });
  }
}