import { jsPDF } from 'jspdf';

/**
 * Generates and downloads the official Rebeldia FM Kit de Mídia (Media Kit & Brand Manifesto) in PDF format.
 */
export function downloadKitDeMidiaPDF() {
  if (typeof window === 'undefined') return;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const pageHeight = doc.internal.pageSize.getHeight(); // 297
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    // --- PAGE 1 ---
    // Header Banner
    doc.setFillColor(15, 17, 23); // Dark slate/obsidian
    doc.rect(0, 0, pageWidth, 44, 'F');

    // Accent line
    doc.setFillColor(245, 158, 11); // Amber #f59e0b
    doc.rect(0, 44, pageWidth, 2.5, 'F');

    // Header Title
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('REBELDIA FM', margin, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text('KIT DE MÍDIA & MANIFESTO OFICIAL', margin, 28);

    doc.setTextColor(161, 161, 170);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.text('"Rádio Livre • O Som que Incomoda o Sistema"', margin, 36);

    // Metadata Right aligned
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(212, 212, 216);
    doc.text('Versão Oficial 2026', pageWidth - margin, 20, { align: 'right' });
    doc.text('Transmissão Digital 24h', pageWidth - margin, 26, { align: 'right' });
    doc.text('Canoas - RS • Brasil', pageWidth - margin, 32, { align: 'right' });

    let y = 56;

    // Section 1: Sobre a Emissora
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. SOBRE A REBELDIA FM', margin, y);
    y += 2;
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + 45, y);
    y += 6;

    doc.setTextColor(40, 40, 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const sobreText =
      'A Rebeldia FM nasceu com o propósito de defender a liberdade de expressão e valorizar a música como uma das mais importantes formas de arte e manifestação humana. A música traduz sentimentos, ideias, sonhos e experiências. Por isso, a rádio foi criada por DJs e profissionais das áreas de jornalismo e comunicação com uma missão clara: apresentar a música em sua melhor forma, incentivar o público a ouvir rádio novamente e oferecer uma programação com identidade, sem a lógica do "jabá".';
    const splitSobre = doc.splitTextToSize(sobreText, contentWidth);
    doc.text(splitSobre, margin, y);
    y += splitSobre.length * 4.6 + 6;

    // Section 2: Pilares da Emissora
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2. OS 4 PILARES DA MARCA', margin, y);
    y += 2;
    doc.line(margin, y, margin + 48, y);
    y += 6;

    const pilares = [
      {
        titulo: 'Liberdade Artística (Sem Jabá):',
        desc: 'A grade é definida puramente pela qualidade musical e afinidade dos locutores, rejeitando playlists compradas ou pasteurizadas por algoritmos.',
      },
      {
        titulo: 'Cena Independente & Rock Autoral:',
        desc: 'Palco prioritário e democrático para bandas independentes, novos lançamentos e movimentos de contracultura.',
      },
      {
        titulo: 'Comunidade & Interatividade Real:',
        desc: 'Conexão direta com a audiência através de Pedidos de Música ao Vivo, Mural de Recados e Hotsites dedicados aos programas e locutores.',
      },
      {
        titulo: 'Alta Fidelidade Sonora & Tecnologia DSP:',
        desc: 'Transmissão em alta resolução (128 kbps Stereo AAC/MP3), equalizador gráfico digital de 5 bandas integrado no navegador e compatibilidade PWA Android.',
      },
    ];

    pilares.forEach((p) => {
      doc.setFillColor(248, 248, 250);
      doc.setDrawColor(228, 228, 231);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

      doc.setTextColor(180, 83, 9); // Amber dark
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`• ${p.titulo}`, margin + 3.5, y + 5);

      doc.setTextColor(60, 60, 65);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const splitP = doc.splitTextToSize(p.desc, contentWidth - 7);
      doc.text(splitP, margin + 5, y + 9.5);

      y += 16.5;
    });

    y += 3;

    // Section 3: Especificações Técnicas de Transmissão
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('3. DADOS TÉCNICOS & PLATAFORMAS', margin, y);
    y += 2;
    doc.line(margin, y, margin + 55, y);
    y += 6;

    const specs = [
      ['Formato de Áudio', '128 kbps AAC/MP3 Stereo de Baixa Latência'],
      ['Processamento Web Audio', 'Equalizador Gráfico de 5 Bandas + Analisador de Espectro VU'],
      ['Plataformas Suportadas', 'Web Desktop, Mobile PWA (Android / iOS), Navegadores Modernos'],
      ['Disponibilidade', 'Transmissão Contínua 24 Horas por Dia, 7 Dias por Semana'],
    ];

    specs.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 35);
      doc.text(`${label}:`, margin + 2, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 85);
      doc.text(val, margin + 52, y);
      y += 5.2;
    });

    // Page 1 Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 145);
    doc.text('Rebeldia FM • Kit de Mídia Oficial', margin, pageHeight - 10);
    doc.text('Página 1 de 2', pageWidth - margin, pageHeight - 10, { align: 'right' });

    // --- PAGE 2 ---
    doc.addPage();

    // Top subtle bar
    doc.setFillColor(15, 17, 23);
    doc.rect(0, 0, pageWidth, 16, 'F');
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 16, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('REBELDIA FM • GUIA DE IDENTIDADE, AUDIÊNCIA & CONTATOS', margin, 11);

    y = 28;

    // Section 4: Identidade Visual & Paleta de Cores
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('4. GUIA DE IDENTIDADE VISUAL & CORES', margin, y);
    y += 2;
    doc.line(margin, y, margin + 65, y);
    y += 6;

    const colors = [
      { name: 'Âmbar Dourado Rock', hex: '#F59E0B', rgb: [245, 158, 11], desc: 'Cor primária: botões, destaques e identidade' },
      { name: 'Vermelho Rock', hex: '#EF4444', rgb: [239, 68, 68], desc: 'Cor secundária: alerta, transmissões e badge NO AR' },
      { name: 'Laranja Solar', hex: '#F97316', rgb: [249, 115, 22], desc: 'Acentos de interação, gradientes e vibração' },
      { name: 'Obsidian Profundo', hex: '#09090B', rgb: [9, 9, 11], desc: 'Fundo escuro oficial e estrutura da interface' },
      { name: 'Cinza Estúdio', hex: '#121216', rgb: [18, 18, 22], desc: 'Cards, superfícies de programa e modais' },
      { name: 'Branco Titânio', hex: '#F4F4F5', rgb: [244, 244, 245], desc: 'Tipografia de alto contraste e legibilidade' },
    ];

    colors.forEach((c) => {
      // Color chip
      doc.setFillColor(c.rgb[0], c.rgb[1], c.rgb[2]);
      doc.rect(margin + 2, y - 3.5, 7, 7, 'F');
      doc.setDrawColor(200, 200, 205);
      doc.rect(margin + 2, y - 3.5, 7, 7, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 35);
      doc.text(c.name, margin + 12, y + 1.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 105);
      doc.text(c.hex, margin + 60, y + 1.2);
      doc.text(`—  ${c.desc}`, margin + 82, y + 1.2);

      y += 8.2;
    });

    y += 6;

    // Section 5: Oportunidades de Apoio & Parcerias Culturais
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('5. APOIO CULTURAL & PARCERIAS', margin, y);
    y += 2;
    doc.line(margin, y, margin + 55, y);
    y += 6;

    doc.setTextColor(40, 40, 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const apoioText =
      'Apoiadores culturais da Rebeldia FM conectam suas marcas a um público qualificado, apaixonado por música, fiel e engajado com a cultura autoral e o rock n\' roll. Oferecemos menções em programas ao vivo, inserção em banners rotativos no site e aplicativo, hotsites de programas patrocinados e ativações especiais.';
    const splitApoio = doc.splitTextToSize(apoioText, contentWidth);
    doc.text(splitApoio, margin, y);
    y += splitApoio.length * 4.6 + 6;

    // Section 6: Contatos Oficiais
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('6. CANAIS & CONTATOS OFICIAIS', margin, y);
    y += 2;
    doc.line(margin, y, margin + 50, y);
    y += 6;

    // Contact Box
    doc.setFillColor(248, 248, 250);
    doc.setDrawColor(228, 228, 231);
    doc.roundedRect(margin, y, contentWidth, 42, 3, 3, 'FD');

    const contatos = [
      ['Nome Fantasia:', 'REBELDIA FM (Rádio Livre Independente)'],
      ['Slogan Oficial:', 'Rádio Livre • O Som que Incomoda o Sistema'],
      ['E-mails Oficiais:', 'radio@rebeldiafm.com.br / rebeldiaFM@gmail.com'],
      ['WhatsApp Ouvintes & Contato:', '+55 (48) 99198-4678'],
      ['Localização do Estúdio:', 'Canoas - RS, Brasil • Transmissão Global Web'],
      ['Website Oficial:', 'https://rebeldiafm.com.br'],
    ];

    let cy = y + 6;
    contatos.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(180, 83, 9);
      doc.text(label, margin + 5, cy);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 45);
      doc.text(val, margin + 48, cy);
      cy += 5.8;
    });

    // Page 2 Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 145);
    doc.text('Rebeldia FM • Todos os direitos reservados • Documento Oficial', margin, pageHeight - 10);
    doc.text('Página 2 de 2', pageWidth - margin, pageHeight - 10, { align: 'right' });

    // Download the PDF with clean filename
    doc.save('KIT_DE_MIDIA_REBELDIA_FM.pdf');
  } catch (error) {
    console.error('Error generating Kit de Mídia PDF:', error);
    // Fallback: download via window print or server
    window.location.href = '/api/manifesto/download';
  }
}

// Backward-compatible alias
export const downloadBrandManifestoFile = downloadKitDeMidiaPDF;
