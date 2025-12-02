import { Injectable } from '@angular/core';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// Correção crítica da fonte
(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  generateContract(rental: any) {
    const docDefinition: any = {
      content: [
        { text: 'CONTRATO DE LOCAÇÃO', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },
        
        // Dados Dinâmicos do Cliente e Locador [cite: 155-163]
        { 
          text: [
            { text: 'LOCADOR: ', bold: true },
            'CARRETINHA E CIA SYSTEMS LTDA.\n',
            { text: 'LOCATÁRIO: ', bold: true },
            `${rental.customer.name.toUpperCase()} (Doc: ${rental.customer.document})\n`,
            { text: 'ENDEREÇO: ', bold: true },
            `${rental.customer.address || 'Não informado'}\n`
          ],
          margin: [0, 0, 0, 15]
        },

        // Objeto e Prazos [cite: 170-173]
        { text: 'DO OBJETO E PRAZO', style: 'subheader' },
        {
          ul: [
            `Carretinha: ${rental.trailer.plate} - ${rental.trailer.model}`,
            `Retirada: ${new Date(rental.startDate).toLocaleDateString('pt-BR')}`,
            `Devolução Prevista: ${new Date(rental.expectedEndDate).toLocaleDateString('pt-BR')}`,
            { text: `VALOR TOTAL: R$ ${rental.totalValue.toFixed(2)}`, bold: true }
          ],
          margin: [0, 5, 0, 15]
        },

        // Cláusulas
        { text: 'CLÁUSULAS GERAIS', style: 'subheader' },
        { 
          text: '1. O LOCATÁRIO responsabiliza-se por quaisquer danos ou multas durante o período.\n2. Atrasos serão cobrados conforme tabela vigente.',
          fontSize: 10, margin: [0, 5, 0, 30]
        },

        // Assinaturas
        { text: `Data: ${new Date().toLocaleDateString('pt-BR')}`, alignment: 'right', margin: [0, 0, 0, 40] },
        {
          columns: [
            { stack: [{ text: '__________________________', alignment: 'center' }, { text: 'Carretinha e Cia', alignment: 'center', fontSize: 9 }] },
            { stack: [{ text: '__________________________', alignment: 'center' }, { text: 'Locatário', alignment: 'center', fontSize: 9 }] }
          ]
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 12, bold: true, marginTop: 10 }
      }
    };

    pdfMake.createPdf(docDefinition).open();
  }
}