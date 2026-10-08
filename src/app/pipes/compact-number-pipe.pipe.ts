import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'compactNumber'
})
export class CompactNumberPipe implements PipeTransform {
 transform(
    value: number,
    locale: string = 'pt-BR',
    currency: string = 'BRL',
    compact: boolean = false
  ): string {
    if (value === null || value === undefined) return '-';

    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };

    if (compact) {
      options.notation = 'compact';
    }

    return new Intl.NumberFormat(locale, options).format(value);
  }
}
