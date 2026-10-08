import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'compactPercent'
})
export class CompactPercentPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';

    // Espera-se que `value` seja um decimal: 0.12184998686983232 -> 12,18%
    // NÃO multiplique por 100 quando usar style: 'percent'.
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'percent',            // deixa o Intl adicionar o símbolo %
      minimumFractionDigits: 0,    // mostra sem casa quando não necessário (ex: 12%)
      maximumFractionDigits: 2     // garante até 2 casas decimais (ex: 12,18%)
      // NÃO usar `notation: 'compact'` aqui
    });

    return formatter.format(value);
  }
}
