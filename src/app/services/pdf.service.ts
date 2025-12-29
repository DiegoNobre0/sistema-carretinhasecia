import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// Correção crítica da fonte
(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

const STORES = {
  CAMACARI: {
    city: 'Camaçari',
    state: 'BA',
    address: 'AV. Vinte e Oito de Setembro, nº 1246, Triângulo, Camaçari-BA, CEP 42803-886'
  },
  LAURO: {
    city: 'Lauro de Freitas',
    state: 'BA',
    address: 'Rua Rio das Graças, 226, Loteamento Recreio de Ipitanga, Centro, Lauro de Freitas-BA'
  }
};

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  // --- FORMATADORES ---

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  // Formata Data e Hora (ex: 29/12/2025 às 14:30)
  private formatDateTime(dateStr: string | Date): string {
    if (!dateStr) return '___/___/____';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
  }

  // Formata apenas Data (ex: 29/12/2025)
  private formatDate(dateStr: string | Date): string {
    if (!dateStr) return '___/___/____';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  // --- NOVO: CONSTRUTOR DE ENDEREÇO DO CLIENTE ---
  private formatCustomerAddress(c: any): string {
    debugger
    if (!c) return 'Endereço não informado';
    
    // Monta o endereço juntando as partes que existem
    const parts = [
      c.street,
      c.number ? `nº ${c.number}` : null,
      c.district ? `- ${c.district}` : null,
      c.city ? `- ${c.city}` : null,
      c.zipCode ? `(CEP ${c.zipCode})` : null
    ];

    // Filtra campos vazios e une com vírgula
    const fullAddress = parts.filter(p => p).join(' ');
    
    return fullAddress || 'Endereço não informado';
  }

  private getStoreInfo(cityToCheck: string = 'Camaçari') {
    if (cityToCheck && cityToCheck.toLowerCase().includes('lauro')) {
      return STORES.LAURO;
    }
    return STORES.CAMACARI;
  }

  // ==================================================================================
  // 1. CONTRATO DE LOCAÇÃO (MODELO CORRIGIDO)
  // ==================================================================================
  generateContract(rental: any) {
    const cliente = rental.customer || {};
    const carro = rental.trailer || {};
    
    // Calcula dias
    const start = new Date(rental.startDate);
    const end = new Date(rental.expectedEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const currentStore = this.getStoreInfo(); 

    const docDefinition: any = {
      content: [
        // TÍTULO
        { text: 'INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO DE VEÍCULOS', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },

        // PREÂMBULO (Endereço do cliente corrigido aqui)
        {
          text: [
            'Pelo presente Instrumento Particular de Contrato de Locação de Veículo e na melhor forma de direito, de um lado, a empresa ',
            { text: 'C&C COMERCIO E LOCADORA LTDA', bold: true },
            ', CNPJ 34.607.144/0001-22 com sede na ',
            { text: currentStore.address, bold: true }, // Endereço da Loja
            ', neste ato representado por Yara Ellen S. Dias, brasileira, empresária, portador do CPF 863.695.495-92, residente e domiciliado nesta capital, de ora em diante denominado LOCADOR, e de outro ',
            { text: cliente.name?.toUpperCase() || '__________________', bold: true },
            ', portador do documento nº ',
            { text: cliente.document || '__________________', bold: true },
            ', residente e domiciliado a ',
            { text: this.formatCustomerAddress(cliente), bold: true }, // <--- AQUI ESTAVA O ERRO, AGORA CORRIGIDO
            ', doravante denominado(a) LOCATÁRIO(A), tem entre si, certo e ajustado o presente, o qual se regera pelas CLÁUSULAS e condições que a seguir se aduzem com inteira submissão as disposições legais e regulamentares atinentes a espécie.'
          ],
          style: 'justifyText',
          margin: [0, 0, 0, 15]
        },

        // CLÁUSULA PRIMEIRA - DO OBJETO
        { text: 'CLÁUSULA PRIMEIRA - DO OBJETO', style: 'sectionHeader' },
        {
          text: [
            'Constitui objeto do presente Contrato o aluguel de: 1) ',
            { text: `Reboque/Carretinha Modelo ${carro.model || ''}, Placa (${carro.plate || ''}), Tamanho ${carro.size || ''}`, bold: true },
            '; de propriedade, posse, uso ou gozo do Locador, pelo Locatário por prazo determinado, para uso exclusivo em território nacional, observado os termos e limites de utilização ora fixados e demais disposições aplicáveis.\n\n',
            'O Veículo locado não poderá ser objeto de uso inadequado, assim considerado, sem prejuízo de outras formas mais que poderão assim ser reconhecidos: i) Transporte de pessoas e cargas mediante remuneração; ii) Transporte de bens além da capacidade informada pelo fabricante; iii) Transporte de explosivos, combustíveis e/ou materiais químicos; iv) utilizar o veículo como guincho; v) Utilizar em corridas, testes, competições; vi) Uso indevido por pessoas não habilitadas. Trafegar com instrumentos de advertência, como luzes de sinalização, ocasionarão danos ao veículo, os quais serão identificados por meio de laudo técnico.'
          ],
          style: 'justifyText',
          margin: [0, 5, 0, 10]
        },

        // CLÁUSULA SEGUNDA - PRAZO (Texto exato do seu modelo)
        { text: 'CLÁUSULA SEGUNDA - PRAZO', style: 'sectionHeader' },
        {
          text: '2.1 O período mínimo considerado para a devolução do veículo é de 1 (uma) diária com período de 24 horas.\n' +
                '2.2 O Cliente terá o prazo de tolerância de 12 (doze) horas para retirar o veículo.\n' +
                '2.3 Haverá tolerância de 1 (uma) hora para a devolução do veículo.\n' +
                '2.4 Caso o veículo seja devolvido após a data e horário previsto, serão cobradas horas extras no valor de 1/3 da diária até o limite de 3 horas.\n' +
                '2.5 A prorrogação do aluguel dependerá de comunicação prévia de no mínimo 24 horas.\n' +
                '2.6 O prazo de aluguel está previsto neste CONTRATO. Caso o cliente opte por permanecer, deverá assinar novo contrato.\n' +
                '2.8 O Cliente responsabiliza-se pelas despesas de retirada do veículo.\n' +
                '2.9 O Locador entregará o veículo em perfeitas condições, devendo o Locatário devolver nas mesmas condições.',
          style: 'justifyText',
          margin: [0, 5, 0, 10]
        },

        // CLÁUSULA TERCEIRA – DO VALOR
        { text: 'CLÁUSULA TERCEIRA – DO VALOR DO ALUGUEL', style: 'sectionHeader' },
        {
          text: [
            '3.1 O valor da diária será de ',
            { text: this.formatCurrency(rental.dailyRate || 0), bold: true },
            ', sendo o valor total do aluguel condicionado a assinatura e condições do presente Contrato, compreendendo o somatório dos valores compostos na tarifa vigente.\n',
            '3.2 O Locador poderá exigir do Cliente o pagamento de caução, que será restituído após a devolução do veículo.'
          ],
          style: 'justifyText',
          margin: [0, 5, 0, 10]
        },

        // CLÁUSULA QUARTA
        { text: 'CLÁUSULA QUARTA - DAS OBRIGAÇÕES DO LOCATÁRIO', style: 'sectionHeader' },
        {
          text: '4.1 Permitir ao LOCADOR o livre acesso para fiscalização.\n' +
                '4.2 O LOCATÁRIO obriga-se a colocar motoristas habilitados.\n' +
                '4.3 Arcar com o pagamento de todas as multas e penalidades de trânsito.\n' +
                '4.4 Providenciar Boletim de Ocorrência Policial em casos de acidentes ou roubo.\n' +
                '4.6 Arcar com as despesas de pintura, conserto de pneus e câmara de ar.\n' +
                '4.7 Executar a manutenção preventiva e corretiva de acordo com o fabricante.\n' +
                '4.8 Fornecer estacionamento adequado ao veículo.',
          style: 'justifyText',
          margin: [0, 5, 0, 10]
        },

        // CLÁUSULA QUINTA
        { text: 'CLÁUSULA QUINTA - DO ACOMPANHAMENTO E FISCALIZAÇÃO', style: 'sectionHeader' },
        {
          text: '5.1 O LOCATÁRIO tem direito de vistoriar o veículo no recebimento.\n' +
                '5.2 O LOCADOR poderá acompanhar e fiscalizar a utilização do veículo.\n' +
                '5.2.1 O LOCATÁRIO arcará com todos os danos causados por uso em condições anormais.',
          style: 'justifyText',
          margin: [0, 5, 0, 10]
        },

        // CLÁUSULA SEXTA - PRAZO E VIGÊNCIA (Aqui entram as DATAS E HORAS)
        { text: 'CLÁUSULA SEXTA - DO PRAZO DE LOCAÇÃO E VIGÊNCIA', style: 'sectionHeader' },
        {
          text: [
            '6.1 O presente Contrato vigerá por um período de ',
            { text: `(${totalDias}) diárias`, bold: true },
            ', com início em ',
            { text: this.formatDateTime(rental.startDate), bold: true }, // DATA E HORA INICIO
            ' e término em ',
            { text: this.formatDateTime(rental.expectedEndDate), bold: true }, // DATA E HORA FIM
            ', podendo ser prorrogado por acordo entre as partes.'
          ],
          style: 'justifyText',
          margin: [0, 5, 0, 10]
        },

        // CLÁUSULA SÉTIMA
        { text: 'CLÁUSULA SÉTIMA - DO FATURAMENTO E PAGAMENTO', style: 'sectionHeader' },
        { text: '7.1 A Fatura será emitida na data de abertura. 7.2 Atrasos terão multa de 10% e juros de 5% ao mês.', style: 'justifyText', margin: [0, 5, 0, 5] },

        // CLÁUSULA OITAVA
        { text: 'CLÁUSULA OITAVA - DA CONFIDENCIALIDADE', style: 'sectionHeader' },
        { text: '8.1 Dados e informações serão tratados como estritamente confidenciais.', style: 'justifyText', margin: [0, 5, 0, 5] },

        // CLÁUSULA NONA
        { text: 'CLÁUSULA NONA - DA RESCISÃO', style: 'sectionHeader' },
        { text: '9.1 O contrato poderá ser rescindido mediante notificação de 48h. 9.2 O descumprimento de cláusulas gera rescisão.', style: 'justifyText', margin: [0, 5, 0, 10] },

        // CLÁUSULA DÉCIMA - VALOR TOTAL
        { text: 'CLÁUSULA DÉCIMA - DO VALOR CONTRATUAL', style: 'sectionHeader' },
        {
          text: [
            '10.1 Dá-se ao presente Contrato para os efeitos legais, o valor estimado de ',
            { text: this.formatCurrency(rental.totalValue || 0), bold: true },
            ' conforme período de locação observado no item 6.1 do presente contrato.'
          ],
          style: 'justifyText',
          margin: [0, 5, 0, 10]
        },

        // CLÁUSULA DÉCIMA PRIMEIRA
        { text: 'CLÁUSULA DÉCIMA PRIMEIRA - DO FORO', style: 'sectionHeader' },
        {
          text: '11.1 - Fica eleito o Foro da Comarca de Camaçari como o único competente para a solução de questões oriundas do presente Contrato.',
          style: 'justifyText',
          margin: [0, 5, 0, 20]
        },

        // DATA E ASSINATURAS
        {
          text: `${currentStore.city} - BA, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          alignment: 'right',
          margin: [0, 0, 0, 40]
        },

        {
          columns: [
            {
              stack: [
                { text: '_____________________________________', alignment: 'center' },
                { text: 'C&C COMERCIO E LOCADORA\n(LOCADOR)', alignment: 'center', bold: true, fontSize: 10 }
              ]
            },
            {
              stack: [
                { text: '_____________________________________', alignment: 'center' },
                { text: `${cliente.name?.toUpperCase() || 'CLIENTE'}\n(LOCATÁRIO)`, alignment: 'center', bold: true, fontSize: 10 }
              ]
            }
          ],
          margin: [0, 0, 0, 40]
        },

        // TESTEMUNHAS
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: '______________________________________', margin: [0, 0, 0, 5] },
                { text: 'TESTEMUNHA 1:', bold: true, fontSize: 10 },
                { text: 'NOME:', fontSize: 10 },
                { text: 'CPF:', fontSize: 10 }
              ]
            },
            {
              width: '50%',
              stack: [
                { text: '______________________________________', margin: [0, 0, 0, 5] },
                { text: 'TESTEMUNHA 2:', bold: true, fontSize: 10 },
                { text: 'NOME:', fontSize: 10 },
                { text: 'CPF:', fontSize: 10 }
              ]
            }
          ]
        }
      ],
      styles: {
        header: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
        sectionHeader: { fontSize: 11, bold: true, marginTop: 10, marginBottom: 2 },
        justifyText: { fontSize: 10, alignment: 'justify', lineHeight: 1.2 }
      },
      defaultStyle: {
        fontSize: 10
      }
    };

    pdfMake.createPdf(docDefinition).open();
  }

  // ==================================================================================
  // 2. NOTA PROMISSÓRIA (Com endereço corrigido)
  // ==================================================================================
  generatePromissoryNote(data: any) {
    const currentStore = this.getStoreInfo();

    const docDefinition: any = {
      content: [
        { text: 'NOTA PROMISSÓRIA', style: 'header', alignment: 'center', margin: [0, 0, 0, 40] },
        
        { text: `Nº: ${Math.floor(Math.random() * 1000)}`, alignment: 'right', margin: [0, 0, 0, 20] },
        { text: `Vencimento: ${this.formatDate(data.expectedEndDate)}`, alignment: 'right', margin: [0, 0, 0, 40] },
  
        { text: `VALOR: ${this.formatCurrency(data.totalValue)}`, style: 'valueTitle', alignment: 'center', margin: [0, 0, 0, 30] },
  
        { 
          text: [
            'Aos ',
            { text: this.formatDate(data.expectedEndDate), bold: true },
            ', pagarei(emos) por esta via única de NOTA PROMISSÓRIA a ',
            { text: 'C&C COMERCIO E LOCADORA LTDA', bold: true },
            ' ou à sua ordem, na praça de ',
            { text: `${currentStore.city} - ${currentStore.state}`, bold: true },
            ', a quantia de ',
            { text: this.formatCurrency(data.totalValue), bold: true },
            ' em moeda corrente deste país.'
          ],
          lineHeight: 1.5,
          margin: [0, 0, 0, 30]
        },
  
        { 
          text: [
            'Emitente: ', { text: data.customer.name.toUpperCase(), bold: true }, '\n',
            'CPF/CNPJ: ', data.customer.document, '\n',
            'Endereço: ', this.formatCustomerAddress(data.customer) // <--- ENDEREÇO CORRIGIDO
          ],
          margin: [0, 0, 0, 50]
        },
  
        { text: '_______________________________________________', alignment: 'center' },
        { text: 'Assinatura do Emitente', alignment: 'center', fontSize: 10 }
      ],
      styles: {
        header: { fontSize: 22, bold: true },
        valueTitle: { fontSize: 18, bold: true, background: '#eee', padding: 10 }
      }
    };
  
    pdfMake.createPdf(docDefinition).open();
  }

  // ==================================================================================
  // 3. TERMO DE DEVOLUÇÃO (Com endereço corrigido)
  // ==================================================================================
  generateReturnTerm(rental: any, returnData: any) {
    const trailer = rental.trailer;
    const customer = rental.customer;
    const currentStore = this.getStoreInfo();

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = 170;
    let cursorY = 20;
    const lineHeight = 6;

    const addText = (text: string, isBold: boolean = false, fontSize: number = 11) => {
      doc.setFont('times', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      const splitText = doc.splitTextToSize(text, pageWidth);
      doc.text(splitText, margin, cursorY);
      cursorY += (splitText.length * lineHeight) + 2;
    };

    doc.setFontSize(14);
    doc.setFont('times', 'bold');
    doc.text('TERMO DE DEVOLUÇÃO E ENCERRAMENTO', 105, cursorY, { align: 'center' });
    cursorY += 15;

    const startDateStr = this.formatDate(rental.startDate);
    const header = `Termo referente ao contrato de locação iniciado em ${startDateStr}, na unidade de ${currentStore.city}, firmado entre C&C COMERCIO E LOCADORA LTDA e ${customer.name.toUpperCase()}.`;
    addText(header);
    cursorY += 5;

    // DATAS E HORAS
    const retirada = this.formatDateTime(rental.startDate);
    const devDateObj = new Date(returnData.returnDate);
    const devTimeObj = new Date(returnData.returnTime);
    devDateObj.setHours(devTimeObj.getHours(), devTimeObj.getMinutes());
    const devolucaoReal = this.formatDateTime(devDateObj);

    addText(`Data/Hora Retirada: ${retirada}`);
    addText(`Data/Hora Devolução: ${devolucaoReal}`);
    cursorY += 5;

    addText('Veículo Devolvido:');
    doc.setFont('times', 'normal');
    const specs = [
      `Modelo: ${trailer.model} | Placa: ${trailer.plate}`,
      `Cor: ${trailer.color || 'Preta'}`,
    ];
    specs.forEach(s => {
        doc.text(`• ${s}`, margin + 5, cursorY);
        cursorY += 6;
    });
    cursorY += 5;

    const lateFee = returnData.lateFee || 0;
    const damageCost = returnData.damageCost || 0;
    const cleaningFee = returnData.cleaningFee || 0;
    const totalExtra = lateFee + damageCost + cleaningFee;

    if (totalExtra === 0) {
      addText('A devolução ocorreu dentro dos conformes, sem avarias ou atrasos geradores de multa. Nada mais sendo devido entre as partes.');
    } else {
      addText('Foram constatados os seguintes custos adicionais:');
      if (lateFee > 0) doc.text(`- Multa por Atraso: ${this.formatCurrency(lateFee)}`, margin + 5, cursorY+=6);
      if (cleaningFee > 0) doc.text(`- Taxa de Limpeza: ${this.formatCurrency(cleaningFee)}`, margin + 5, cursorY+=6);
      if (returnData.hasDamage) {
         doc.text(`- Avaria (${returnData.damageDescription}): ${this.formatCurrency(damageCost)}`, margin + 5, cursorY+=6);
      }
      cursorY += 8;
      addText(`TOTAL A PAGAR: ${this.formatCurrency(totalExtra)}`, true);
    }
    cursorY += 10;

    const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`${currentStore.city} - BA, ${today}.`, margin, cursorY);
    
    cursorY += 25;
    doc.line(margin, cursorY, margin + 60, cursorY); 
    doc.line(margin + 80, cursorY, margin + 140, cursorY); 

    cursorY += 5;
    doc.setFontSize(9);
    doc.text('LOCADOR', margin, cursorY);
    doc.text('LOCATÁRIO', margin + 80, cursorY);

    doc.save(`Termo_Devolucao_${customer.name.split(' ')[0]}.pdf`);
  }
}