import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

// Correção crítica da fonte
(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

@Injectable({
  providedIn: 'root'
})
export class PdfService {

// Função auxiliar para formatar dinheiro (R$)
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  // Função auxiliar para formatar data (dd/mm/aaaa)
  private formatDate(dateStr: string | Date): string {
    if (!dateStr) return '___/___/____';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  generateContract(rental: any) {
    // Dados para preencher o contrato
    const cliente = rental.customer || {};
    const carro = rental.trailer || {};
    const totalDias = Math.ceil((new Date(rental.expectedEndDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;

    const docDefinition: any = {
      content: [
        // TÍTULO
        { text: 'INSTRUMENTO PARTICULAR DE CONTRATO DE LOCAÇÃO DE VEÍCULOS', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },

        // PREÂMBULO (QUALIFICAÇÃO DAS PARTES)
        {
          text: [
            'Pelo presente Instrumento Particular de Contrato de Locação de Veículo e na melhor forma de direito, de um lado, a empresa ',
            { text: 'C&C COMERCIO E LOCADORA LTDA', bold: true },
            ', CNPJ 34.607.144/0001-22 com sede na AV. Vinte e Oito de Setembro, nº 1246, Triângulo, Camaçari-BA, CEP 42803-886, neste ato representado por Yara Ellen S. Dias, brasileira, empresária, portador do CPF 863.695.495-92, residente e domiciliado nesta capital, de ora em diante denominado LOCADOR, e de outro ',
            { text: cliente.name?.toUpperCase() || '__________________', bold: true },
            ', portador do documento nº ',
            { text: cliente.document || '__________________', bold: true },
            ', residente e domiciliado a ',
            { text: cliente.address || 'Endereço não informado', bold: true },
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

        // CLÁUSULA SEGUNDA - PRAZO
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

        // CLÁUSULA QUARTA - OBRIGAÇÕES
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

        // CLÁUSULA QUINTA - FISCALIZAÇÃO
        { text: 'CLÁUSULA QUINTA - DO ACOMPANHAMENTO E FISCALIZAÇÃO', style: 'sectionHeader' },
        {
          text: '5.1 O LOCATÁRIO tem direito de vistoriar o veículo no recebimento.\n' +
                '5.2 O LOCADOR poderá acompanhar e fiscalizar a utilização do veículo.\n' +
                '5.2.1 O LOCATÁRIO arcará com todos os danos causados por uso em condições anormais.',
          style: 'justifyText',
          margin: [0, 5, 0, 10]
        },

        // CLÁUSULA SEXTA - PRAZO E VIGÊNCIA (DATAS REAIS)
        { text: 'CLÁUSULA SEXTA - DO PRAZO DE LOCAÇÃO E VIGÊNCIA', style: 'sectionHeader' },
        {
          text: [
            '6.1 O presente Contrato vigerá por um período de ',
            { text: `(${totalDias}) diárias`, bold: true },
            ', com início em ',
            { text: this.formatDate(rental.startDate), bold: true },
            ' e término em ',
            { text: this.formatDate(rental.expectedEndDate), bold: true },
            ', podendo ser prorrogado por acordo entre as partes.'
          ],
          style: 'justifyText',
          margin: [0, 5, 0, 10]
        },

        // CLÁUSULA SÉTIMA A NONA (Padrão)
        { text: 'CLÁUSULA SÉTIMA - DO FATURAMENTO E PAGAMENTO', style: 'sectionHeader' },
        { text: '7.1 A Fatura será emitida na data de abertura. 7.2 Atrasos terão multa de 10% e juros de 5% ao mês.', style: 'justifyText', margin: [0, 5, 0, 5] },

        { text: 'CLÁUSULA OITAVA - DA CONFIDENCIALIDADE', style: 'sectionHeader' },
        { text: '8.1 Dados e informações serão tratados como estritamente confidenciais.', style: 'justifyText', margin: [0, 5, 0, 5] },

        { text: 'CLÁUSULA NONA - DA RESCISÃO', style: 'sectionHeader' },
        { text: '9.1 O contrato poderá ser rescindido mediante notificação de 48h. 9.2 O descumprimento de cláusulas gera rescisão.', style: 'justifyText', margin: [0, 5, 0, 10] },

        // CLÁUSULA DÉCIMA - VALOR CONTRATUAL (VALOR REAL)
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

        // CLÁUSULA DÉCIMA PRIMEIRA - FORO
        { text: 'CLÁUSULA DÉCIMA PRIMEIRA - DO FORO', style: 'sectionHeader' },
        {
          text: '11.1 - Fica eleito o Foro da Comarca de Camaçari como o único competente para a solução de questões oriundas do presente Contrato.',
          style: 'justifyText',
          margin: [0, 5, 0, 20]
        },

        // FECHAMENTO
        {
          text: `Camaçari - BA, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          alignment: 'right',
          margin: [0, 0, 0, 40]
        },

        // ASSINATURAS
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
      // ESTILOS GERAIS
      styles: {
        header: { fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
        sectionHeader: { fontSize: 11, bold: true, marginTop: 10, marginBottom: 2 },
        justifyText: { fontSize: 10, alignment: 'justify', lineHeight: 1.2 }
      },
      defaultStyle: {
        fontSize: 10
      }
    };

    // Gera e abre o PDF
    pdfMake.createPdf(docDefinition).open();
  }


  generatePromissoryNote(data: any) {
  const docDefinition: any = {
    content: [
      { text: 'NOTA PROMISSÓRIA', style: 'header', alignment: 'center', margin: [0, 0, 0, 40] },
      
      { text: `Nº: ${Math.floor(Math.random() * 1000)}`, alignment: 'right', margin: [0, 0, 0, 20] },
      { text: `Vencimento: ${new Date(data.expectedEndDate).toLocaleDateString('pt-BR')}`, alignment: 'right', margin: [0, 0, 0, 40] },

      { text: `VALOR: R$ ${data.totalValue.toFixed(2)}`, style: 'valueTitle', alignment: 'center', margin: [0, 0, 0, 30] },

      { 
        text: [
          'Aos ',
          { text: new Date(data.expectedEndDate).toLocaleDateString('pt-BR'), bold: true },
          ', pagarei(emos) por esta via única de NOTA PROMISSÓRIA a ',
          { text: 'CARRETINHA E CIA SYSTEMS', bold: true },
          ' ou à sua ordem, a quantia de ',
          { text: `R$ ${data.totalValue.toFixed(2)}`, bold: true },
          ' em moeda corrente deste país.'
        ],
        lineHeight: 1.5,
        margin: [0, 0, 0, 30]
      },

      { 
        text: [
          'Emitente: ', { text: data.customer.name.toUpperCase(), bold: true }, '\n',
          'CPF/CNPJ: ', data.customer.document, '\n',
          'Endereço: ', data.customer.address || 'Não informado'
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




generateReturnTerm(rental: any, returnData: any) {
    const trailer = rental.trailer;
    const customer = rental.customer;

    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = 170; // Largura útil para texto (A4 - margens)
    let cursorY = 20;
    const lineHeight = 6;

    // --- FUNÇÃO AUXILIAR PARA QUEBRAR TEXTO ---
    const addText = (text: string, isBold: boolean = false, fontSize: number = 11) => {
      doc.setFont('times', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      
      const splitText = doc.splitTextToSize(text, pageWidth);
      doc.text(splitText, margin, cursorY);
      
      // Atualiza a posição Y para a próxima linha
      cursorY += (splitText.length * lineHeight) + 2;
    };

    // 1. TÍTULO
    doc.setFontSize(14);
    doc.setFont('times', 'bold');
    doc.text('TERMO DE DEVOLUÇÃO', 105, cursorY, { align: 'center' });
    cursorY += 15;

    // 2. CABEÇALHO
    const startDateStr = new Date(rental.startDate).toLocaleDateString('pt-BR');
    const header = `Pelo presente instrumento, fica comprovada a devolução do objeto de locação descrito no contrato firmado em ${startDateStr}, entre YARA ELLEN SILVA DIAS ME (locadora), inscrita no CNPJ nº 34.607.144/0001-22, e ${customer.name.toUpperCase()} (locatário), inscrito no CPF/CNPJ nº ${customer.document}.`;
    addText(header);
    cursorY += 5;

    // 3. OBJETO (Especificações da Carretinha)
    addText('O objeto da locação é um reboque com as seguintes especificações:');
    doc.setFont('times', 'normal');
    
    // Lista de detalhes técnicos
    const specs = [
      `Modelo: ${trailer.model}`,
      `Placa: ${trailer.plate}`,
      `Cor: ${trailer.color || 'Preta'}`,
      `Ano Fab/Mod: ${trailer.manufacturingYear || ''}/${trailer.modelYear || ''}`,
      `Capacidade: ${trailer.capacity || 'N/A'}`,
      `Eixos: ${trailer.axles || 1}`
    ];

    specs.forEach(spec => {
      doc.text(`• ${spec}`, margin + 5, cursorY);
      cursorY += 6;
    });
    cursorY += 5;

    // 4. DATA DA DEVOLUÇÃO REAL
    const devDate = new Date(returnData.returnDate).toLocaleDateString('pt-BR');
    const devTime = new Date(returnData.returnTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    addText(`A locadora declara ter recebido o objeto no dia ${devDate}, às ${devTime}.`);
    cursorY += 5;

    // 5. CLÁUSULA PRIMEIRA (Lógica Financeira)
    const lateFee = returnData.lateFee || 0;
    const damageCost = returnData.damageCost || 0;
    const cleaningFee = returnData.cleaningFee || 0;
    const totalExtra = lateFee + damageCost + cleaningFee;

    if (totalExtra === 0) {
      // CENÁRIO A: Devolução Perfeita
      addText('CLÁUSULA PRIMEIRA: O locatário declara estar ciente e em conformidade com os termos estabelecidos no contrato, tendo realizado a devolução do objeto locado dentro do prazo estipulado, sem gerar custos adicionais.');
    } else {
      // CENÁRIO B: Com Custos Extras
      addText('CLÁUSULA PRIMEIRA: Em conformidade com as cláusulas contratuais, foram constatados custos adicionais na devolução:');
      
      if (lateFee > 0) doc.text(`- Multa por atraso: R$ ${lateFee.toFixed(2)}`, margin + 5, cursorY+=6);
      if (cleaningFee > 0) doc.text(`- Taxa de limpeza: R$ ${cleaningFee.toFixed(2)}`, margin + 5, cursorY+=6);
      if (returnData.hasDamage) {
        const desc = returnData.damageDescription ? `(${returnData.damageDescription})` : '';
        doc.text(`- Avarias ${desc}: R$ ${damageCost.toFixed(2)}`, margin + 5, cursorY+=6);
      }
      cursorY += 8;

      const totalStr = totalExtra.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      addText(`Total de prejuízos devidos: R$ ${totalStr}. O pagamento deverá ser efetuado imediatamente. Caso não seja realizado, incidirão juros e multa conforme contrato.`, true);
    }
    cursorY += 5;

    // 6. CLÁUSULA SEGUNDA (Responsabilidade)
    addText('CLÁUSULA SEGUNDA: O locatário assume total responsabilidade por quaisquer danos emergentes, lucros cessantes, danos reflexos ou danos causados a terceiros decorrentes do uso do objeto locado durante o período de vigência do contrato, bem como multas de trânsito ocultas.');
    cursorY += 15;

    // 7. ASSINATURAS
    const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Camaçari, Bahia. ${today}.`, margin, cursorY);
    
    cursorY += 25;
    
    // Linhas de Assinatura
    doc.line(margin, cursorY, margin + 60, cursorY); // Locador
    doc.line(margin + 80, cursorY, margin + 140, cursorY); // Locatário

    cursorY += 5;
    doc.setFontSize(9);
    doc.text('LOCADOR (Yara Ellen Silva Dias)', margin, cursorY);
    doc.text('LOCATÁRIO', margin + 80, cursorY);

    // Salva o arquivo
    doc.save(`Termo_Devolucao_${customer.name.split(' ')[0]}.pdf`);
  }

}