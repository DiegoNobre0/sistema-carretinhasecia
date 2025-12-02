import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageCompressService {

  // Configurações padrão
  private MAX_WIDTH = 1000; // Máximo de 1000px de largura
  private MAX_HEIGHT = 1000;
  private QUALITY = 0.7; // 70% de qualidade (bom equilíbrio)

  constructor() { }

  compressFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.readAsDataURL(file);
      
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Lógica para manter a proporção (Aspect Ratio)
          if (width > height) {
            if (width > this.MAX_WIDTH) {
              height *= this.MAX_WIDTH / width;
              width = this.MAX_WIDTH;
            }
          } else {
            if (height > this.MAX_HEIGHT) {
              width *= this.MAX_HEIGHT / height;
              height = this.MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Converte para JPEG com qualidade reduzida
            const dataUrl = canvas.toDataURL('image/jpeg', this.QUALITY);
            resolve(dataUrl);
          } else {
            reject('Erro ao criar contexto do canvas');
          }
        };

        img.onerror = (error) => reject(error);
      };

      reader.onerror = (error) => reject(error);
    });
  }
}