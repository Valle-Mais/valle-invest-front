import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'abbreviateNumber'
})
export class AbbreviateNumberPipe implements PipeTransform {

   transform(value: number | null | undefined): string {
    // Retorna um traço se o valor for nulo ou indefinido
    if (value === null || value === undefined) {
      return '-';
    }

    // Garante que a lógica funcione para números negativos também
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    let formattedValue: string;

    if (absValue >= 1000000) {
      formattedValue = `R$ ${(absValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      formattedValue = `R$ ${(absValue / 1000).toFixed(0)}k`;
    } else {
      formattedValue = `R$ ${absValue.toFixed(0)}`;
    }

    return isNegative ? `-${formattedValue}` : formattedValue;
  }
}
